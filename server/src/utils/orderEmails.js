import { db } from "../config/db.js";
import {
  safeSend,
  renderEmail,
  heading,
  paragraph,
  button,
  panel,
  divider,
  itemsTable,
  totalsTable,
  addressBlock,
  formatINR,
  escapeHtml,
  EMAIL_THEME,
} from "./emailTemplates.js";

const { CLIENT_APP_URL, MUTED } = EMAIL_THEME;

// The recipient is resolved through orders.userId rather than req.user:
// updateOrder's req.user is the admin, and verifyRazorpayPayment never
// validates its body's appOrderId against the caller.
const loadOrderForEmail = async (orderId) => {
  const [[order]] = await db.query(
    `SELECT o.id, o.orderCode, o.totalPrice, o.discountedPrice, o.status,
            o.shippingPartner, o.trackingNumber, o.trackingUrl,
            o.shippingAddressLine1, o.shippingAddressLine2,
            o.shippingCity, o.shippingState, o.shippingPostalCode,
            u.name AS customerName, u.email AS customerEmail
     FROM orders o
     JOIN users u ON u.id = o.userId
     WHERE o.id = ?
     LIMIT 1`,
    [orderId]
  );

  if (!order) return null;

  const [items] = await db.query(
    `SELECT oi.quantity, oi.price, p.name
     FROM order_items oi
     JOIN products p ON p.id = oi.productId
     WHERE oi.orderId = ?`,
    [orderId]
  );

  return { ...order, items };
};

const greetingName = (name) => (name && name.trim() ? name.trim() : "there");


const itemLinesText = (items) =>
  items
    .map((i) => `- ${i.name} x ${i.quantity} — ${formatINR(Number(i.price) * Number(i.quantity))}`)
    .join("\n");

const orderTotals = (order) => {
  const subtotal = Number(order.totalPrice || 0);
  const paid = Number(order.discountedPrice ?? order.totalPrice ?? 0);
  return { subtotal, paid, discount: Math.max(0, subtotal - paid) };
};

const orderCodeOf = (order) => order.orderCode || `#${order.id}`;

export const sendOrderConfirmedEmail = async (orderId) => {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return;

    const name = greetingName(order.customerName);
    const code = orderCodeOf(order);
    const totals = orderTotals(order);
    const trackUrl = `${CLIENT_APP_URL}/track-order?code=${order.orderCode || ""}`;

    const text = [
      `Hi ${name},`,
      ``,
      `Thanks for your order! We've received it and it's now being prepared.`,
      ``,
      `Order: ${code}`,
      itemLinesText(order.items),
      ``,
      `Subtotal: ${formatINR(totals.subtotal)}`,
      totals.discount > 0 ? `Discount: -${formatINR(totals.discount)}` : null,
      `Paid: ${formatINR(totals.paid)}`,
      ``,
      `Track your order: ${trackUrl}`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    const html = renderEmail({
      preheader: `Order ${code} is confirmed — ${formatINR(totals.paid)} paid`,
      title: `Order ${code} confirmed`,
      bodyHtml: [
        heading("Thanks for your order!"),
        paragraph(`Hi ${escapeHtml(name)}, we've received your order and it's being prepared now.`),
        panel(
          `<strong style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Order number</strong><br /><span style="font-size:18px;font-weight:bold;">${escapeHtml(code)}</span>`
        ),
        itemsTable(order.items),
        totalsTable(totals),
        addressBlock("Delivering to", order),
        button("Track your order", trackUrl),
        divider(),
        paragraph(
          `We'll email you again the moment it ships.`,
          MUTED
        ),
      ].join("\n"),
    });

    await safeSend(order.customerEmail, `Order ${code} confirmed`, text, html);
  } catch (err) {
    console.error("Order confirmed email error:", err.message);
  }
};

export const sendOrderShippedEmail = async (orderId, tracking = {}) => {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return;

    // the caller passes post-update values; the pre-update row would miss a
    // tracking number set in the very same request
    const partner = tracking.shippingPartner || order.shippingPartner;
    const number = tracking.trackingNumber || order.trackingNumber;
    const url = tracking.trackingUrl || order.trackingUrl;

    const name = greetingName(order.customerName);
    const code = orderCodeOf(order);
    const trackUrl = `${CLIENT_APP_URL}/track-order?code=${order.orderCode || ""}`;

    const text = [
      `Hi ${name},`,
      ``,
      `Good news — your order ${code} is on its way.`,
      ``,
      partner ? `Courier: ${partner}` : null,
      number ? `Tracking number: ${number}` : null,
      url ? `Track with the courier: ${url}` : null,
      ``,
      `What's in the box:`,
      itemLinesText(order.items),
      ``,
      `See your order: ${trackUrl}`,
    ]
      .filter((l) => l !== null)
      .join("\n");

    const trackingRows = [
      partner ? `<strong style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Courier</strong><br />${escapeHtml(partner)}` : "",
      number ? `<br /><br /><strong style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Tracking number</strong><br /><span style="font-size:16px;font-weight:bold;">${escapeHtml(number)}</span>` : "",
    ].join("");

    const html = renderEmail({
      preheader: `Order ${code} has shipped${partner ? ` with ${partner}` : ""}`,
      title: `Order ${code} has shipped`,
      bodyHtml: [
        heading("Your order is on its way"),
        paragraph(`Hi ${escapeHtml(name)}, order <strong>${escapeHtml(code)}</strong> has left our warehouse.`),
        trackingRows ? panel(trackingRows) : "",
        button("Track with the courier", url) || button("See your order", trackUrl),
        divider(),
        paragraph(`<strong>What's in the box</strong>`),
        itemsTable(order.items),
        addressBlock("Shipping to", order),
        url ? paragraph(`<a href="${trackUrl}" style="color:${MUTED};">See it on your orders page</a>`, MUTED) : "",
      ].join("\n"),
    });

    await safeSend(order.customerEmail, `Order ${code} has shipped`, text, html);
  } catch (err) {
    console.error("Order shipped email error:", err.message);
  }
};

export const sendOrderDeliveredEmail = async (orderId) => {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return;

    const name = greetingName(order.customerName);
    const code = orderCodeOf(order);
    // there is no per-order anchor on the orders page, so this is the target
    const ordersUrl = `${CLIENT_APP_URL}/orders`;

    const text = [
      `Hi ${name},`,
      ``,
      `Your order ${code} has been delivered — we hope you love it.`,
      ``,
      `What you received:`,
      itemLinesText(order.items),
      ``,
      `If you have a minute, a quick rating really helps other customers:`,
      ordersUrl,
    ].join("\n");

    const html = renderEmail({
      preheader: `Order ${code} delivered — tell us what you think`,
      title: `How was your order ${code}?`,
      bodyHtml: [
        heading("Delivered — we hope you love it"),
        paragraph(`Hi ${escapeHtml(name)}, your order <strong>${escapeHtml(code)}</strong> has arrived.`),
        itemsTable(order.items),
        divider(),
        paragraph(`<strong>How did we do?</strong>`),
        paragraph(
          `A quick star rating takes about ten seconds and genuinely helps other customers choose.`
        ),
        button("Rate your purchase", ordersUrl),
      ].join("\n"),
    });

    await safeSend(order.customerEmail, `How was your order ${code}?`, text, html);
  } catch (err) {
    console.error("Order delivered email error:", err.message);
  }
};

export const sendOrderCancelledEmail = async (orderId) => {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return;

    const [[payment]] = await db.query(
      "SELECT status, refundAmount FROM payments WHERE orderId = ? LIMIT 1",
      [orderId]
    );

    const name = greetingName(order.customerName);
    const code = orderCodeOf(order);
    const refunded = payment?.status === "refunded" ? Number(payment.refundAmount || 0) / 100 : 0;

    const refundText = refunded
      ? `A refund of ${formatINR(refunded)} is on its way to your original payment method. It usually shows up within 5–7 business days, depending on your bank.`
      : `No payment was taken for this order, so there is nothing to refund.`;

    const text = [
      `Hi ${name},`,
      ``,
      `Your order ${code} has been cancelled.`,
      ``,
      refundText,
      ``,
      `Changed your mind? You can always order again: ${CLIENT_APP_URL}`,
    ].join("\n");

    const html = renderEmail({
      preheader: refunded
        ? `Order ${code} cancelled — ${formatINR(refunded)} refund on its way`
        : `Order ${code} cancelled`,
      title: `Order ${code} cancelled`,
      bodyHtml: [
        heading("Your order has been cancelled"),
        paragraph(`Hi ${escapeHtml(name)}, order <strong>${escapeHtml(code)}</strong> is cancelled.`),
        refunded
          ? panel(
              `<strong style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Refund</strong><br /><span style="font-size:18px;font-weight:bold;">${formatINR(refunded)}</span><br /><span style="color:${MUTED};">Back on your original payment method within 5–7 business days</span>`
            )
          : paragraph(refundText, MUTED),
        itemsTable(order.items),
        divider(),
        paragraph("Changed your mind? Everything's still here."),
        button("Shop NoshBOB", CLIENT_APP_URL),
      ].join("\n"),
    });

    await safeSend(order.customerEmail, `Order ${code} cancelled`, text, html);
  } catch (err) {
    console.error("Order cancelled email error:", err.message);
  }
};

/**
 * The nudge for a checkout that was started and never paid. Links back to the
 * shop rather than the dead Razorpay order: that order is finished, but the
 * cart behind it is untouched (it is only cleared on successful payment).
 */
export const sendAbandonedCheckoutEmail = async (orderId) => {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return;

    // order_items is only written once a payment succeeds, so what they were
    // about to buy lives in the snapshot taken at checkout
    const [[row]] = await db.query(
      "SELECT itemsSnapshot FROM orders WHERE id = ? LIMIT 1",
      [orderId]
    );

    let items = [];
    try {
      const parsed = JSON.parse(row?.itemsSnapshot || "null");
      if (Array.isArray(parsed)) items = parsed;
    } catch {
      items = [];
    }

    if (!items.length) return;   // nothing to remind them about

    const name = greetingName(order.customerName);
    const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);

    const text = [
      `Hi ${name},`,
      ``,
      `You left these behind:`,
      itemLinesText(items),
      ``,
      `Total: ${formatINR(total)}`,
      ``,
      `Your basket is still saved — pick up where you left off: ${CLIENT_APP_URL}`,
    ].join("\n");

    const html = renderEmail({
      preheader: `Your basket is still saved — ${formatINR(total)}`,
      title: "You left something behind",
      bodyHtml: [
        heading("Still thinking it over?"),
        paragraph(`Hi ${escapeHtml(name)}, you started checking out and didn't finish. Your basket is still here.`),
        itemsTable(items),
        paragraph(`<strong>Total: ${formatINR(total)}</strong>`),
        button("Finish your order", CLIENT_APP_URL),
        divider(),
        paragraph(
          "If you changed your mind that's absolutely fine — no payment was taken.",
          MUTED
        ),
      ].join("\n"),
    });

    await safeSend(order.customerEmail, "You left something in your basket", text, html);
  } catch (err) {
    console.error("Abandoned checkout email error:", err.message);
  }
};

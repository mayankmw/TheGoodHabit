import sendEmail from "./sendEmail.js";
import { db } from "../config/db.js";

// The API's own origin (UPLOADS_APP_URL) points at the server, so emailed
// links need the storefront origin instead.
const CLIENT_APP_URL = (process.env.CLIENT_APP_URL || "http://localhost:8080")
  .replace(/\/+$/, "");

/**
 * sendEmail throws on any SMTP fault. An order email must never take down the
 * request that triggered it — the payment is already captured and the status
 * change already written, so a mail failure is logged and swallowed.
 */
const safeSend = async (to, subject, text, html) => {
  if (!to || !String(to).trim()) {
    console.error(`Order email skipped — no recipient (${subject})`);
    return;
  }

  try {
    await sendEmail(to, subject, text, html);
  } catch (err) {
    console.error(`Order email failed (${subject}):`, err.message);
  }
};

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

// line totals come from order_items.price (an INT) so the email agrees with
// what the Orders page shows
const itemLinesHtml = (items) =>
  items
    .map(
      (i) =>
        `<li>${i.name} × ${i.quantity} — ₹${Number(i.price) * Number(i.quantity)}</li>`
    )
    .join("");

const itemLinesText = (items) =>
  items
    .map((i) => `- ${i.name} x ${i.quantity} — INR ${Number(i.price) * Number(i.quantity)}`)
    .join("\n");

const shell = (body) =>
  `<div style="font-family: Arial, sans-serif; line-height:1.6;">${body}
        <br />
        <p>Best regards,</p>
        <p><strong>NoshBOB Team</strong></p>
      </div>`;

// orders.totalPrice is the subtotal and orders.discountedPrice is what was
// actually charged — the column names read backwards
const totalsHtml = (order) => {
  const subtotal = Number(order.totalPrice || 0);
  const paid = Number(order.discountedPrice ?? order.totalPrice ?? 0);
  const discount = Math.max(0, subtotal - paid);

  return `
        <p>
          <strong>Subtotal:</strong> ₹${subtotal}<br />
          ${discount > 0 ? `<strong>Discount:</strong> −₹${discount}<br />` : ""}
          <strong>Paid:</strong> ₹${paid}
        </p>`;
};

export const sendOrderConfirmedEmail = async (orderId) => {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return;

    const name = greetingName(order.customerName);
    const code = order.orderCode || `#${order.id}`;
    const trackUrl = `${CLIENT_APP_URL}/track-order?code=${order.orderCode || ""}`;

    const text = [
      `Hi ${name},`,
      ``,
      `Thanks for your order! We've received it and it's now being prepared.`,
      ``,
      `Order: ${code}`,
      itemLinesText(order.items),
      ``,
      `Paid: INR ${Number(order.discountedPrice ?? order.totalPrice ?? 0)}`,
      ``,
      `Track your order: ${trackUrl}`,
    ].join("\n");

    const html = shell(`
        <p>Hi ${name},</p>
        <p>Thanks for your order! We've received it and it's now being prepared.</p>
        <p><strong>Order:</strong> ${code}</p>
        <ul>${itemLinesHtml(order.items)}</ul>
        ${totalsHtml(order)}
        <p><a href="${trackUrl}">Track your order</a></p>`);

    await safeSend(order.customerEmail, `Order ${code} confirmed`, text, html);
  } catch (err) {
    console.error("Order confirmed email error:", err.message);
  }
};

export const sendOrderShippedEmail = async (orderId, tracking = {}) => {
  try {
    const order = await loadOrderForEmail(orderId);
    if (!order) return;

    // the caller passes the post-update values; the pre-update row would miss
    // a tracking number set in the very same request
    const partner = tracking.shippingPartner || order.shippingPartner;
    const number = tracking.trackingNumber || order.trackingNumber;
    const url = tracking.trackingUrl || order.trackingUrl;

    const name = greetingName(order.customerName);
    const code = order.orderCode || `#${order.id}`;
    const trackUrl = `${CLIENT_APP_URL}/track-order?code=${order.orderCode || ""}`;

    const text = [
      `Hi ${name},`,
      ``,
      `Good news — your order ${code} is on its way.`,
      ``,
      partner ? `Courier: ${partner}` : "",
      number ? `Tracking number: ${number}` : "",
      url ? `Track with the courier: ${url}` : "",
      ``,
      `See your order: ${trackUrl}`,
    ]
      .filter(Boolean)
      .join("\n");

    const html = shell(`
        <p>Hi ${name},</p>
        <p>Good news — your order <strong>${code}</strong> is on its way.</p>
        ${partner ? `<p><strong>Courier:</strong> ${partner}</p>` : ""}
        ${number ? `<p><strong>Tracking number:</strong> ${number}</p>` : ""}
        ${url ? `<p><a href="${url}">Track with the courier</a></p>` : ""}
        <p><a href="${trackUrl}">See your order</a></p>`);

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
    const code = order.orderCode || `#${order.id}`;
    // there is no per-order anchor on the orders page, so this is the target
    const ordersUrl = `${CLIENT_APP_URL}/orders`;

    const text = [
      `Hi ${name},`,
      ``,
      `Your order ${code} has been delivered — we hope you love it.`,
      ``,
      `If you have a minute, a quick rating really helps other customers:`,
      ordersUrl,
    ].join("\n");

    const html = shell(`
        <p>Hi ${name},</p>
        <p>Your order <strong>${code}</strong> has been delivered — we hope you love it.</p>
        <ul>${itemLinesHtml(order.items)}</ul>
        <p>If you have a minute, a quick rating really helps other customers.</p>
        <p><a href="${ordersUrl}">Rate your purchase</a></p>`);

    await safeSend(order.customerEmail, `How was your order ${code}?`, text, html);
  } catch (err) {
    console.error("Order delivered email error:", err.message);
  }
};

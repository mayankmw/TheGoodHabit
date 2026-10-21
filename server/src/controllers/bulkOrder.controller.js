import { db } from "../config/db.js";
import {
  safeSend,
  renderInternalEmail,
  escapeHtml,
  EMAIL_THEME,
} from "../utils/emailTemplates.js";

const MIN_BULK_QUANTITY = 10;
const MAX_BULK_QUANTITY = 100000;
const MAX_BULK_ITEMS = 100;

// limits mirror the bulk_orders columns and the client form
const NAME_MAX = 150;
const EMAIL_MAX = 150;
const ADDRESS_MIN = 10;
const ADDRESS_MAX = 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

const getCustomerValidationError = ({ name, email, phone, address }) => {
  if (!name || !email || !phone || !address) return "All customer details are required";
  if (name.length < 2 || name.length > NAME_MAX) return "Enter a valid name";
  if (email.length > EMAIL_MAX || !EMAIL_REGEX.test(email)) return "Enter a valid email address";
  if (!PHONE_REGEX.test(phone)) return "Enter a valid 10-digit mobile number";
  if (address.length < ADDRESS_MIN || address.length > ADDRESS_MAX)
    return "Enter a valid address";
  return null;
};

const normalizeItems = (items) => {
  const grouped = new Map();

  items.forEach((item) => {
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity);

    if (!Number.isInteger(productId) || !Number.isFinite(quantity)) return;

    grouped.set(productId, (grouped.get(productId) || 0) + quantity);
  });

  return Array.from(grouped.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
};

export const submitBulkOrder = async (req, res) => {
  const { items } = req.body;
  const name = String(req.body.name ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  // accept "+91 98765-43210" style input and keep the 10-digit national number
  const phone = String(req.body.phone ?? "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  const address = String(req.body.address ?? "").trim();

  const customerError = getCustomerValidationError({ name, email, phone, address });

  if (customerError) {
    return res.status(400).json({
      success: false,
      message: customerError,
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Select at least one product for bulk order",
    });
  }

  if (items.length > MAX_BULK_ITEMS) {
    return res.status(400).json({
      success: false,
      message: "Too many products in a single bulk order",
    });
  }

  const normalizedItems = normalizeItems(items);

  if (!normalizedItems.length) {
    return res.status(400).json({
      success: false,
      message: "Bulk order items are invalid",
    });
  }

  const invalidItem = normalizedItems.find(
    (item) =>
      !Number.isInteger(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < MIN_BULK_QUANTITY ||
      item.quantity > MAX_BULK_QUANTITY
  );

  if (invalidItem) {
    return res.status(400).json({
      success: false,
      message: `Each selected product must have a quantity between ${MIN_BULK_QUANTITY} and ${MAX_BULK_QUANTITY}`,
    });
  }

  let connection;
  let transactionStarted = false;

  try {
    const productIds = normalizedItems.map((item) => item.productId);
    const placeholders = productIds.map(() => "?").join(", ");

    const [productRows] = await db.query(
      `SELECT id, name FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    if (productRows.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected products are invalid",
      });
    }

    const productMap = new Map(productRows.map((product) => [Number(product.id), product]));

    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [bulkOrderResult] = await connection.query(
      `
      INSERT INTO bulk_orders (name, email, phone, address)
      VALUES (?, ?, ?, ?)
      `,
      [name, email, phone, address]
    );

    const bulkOrderId = bulkOrderResult.insertId;

    for (const item of normalizedItems) {
      await connection.query(
        `
        INSERT INTO bulk_order_items (bulkOrderId, productId, quantity)
        VALUES (?, ?, ?)
        `,
        [bulkOrderId, item.productId, item.quantity]
      );
    }

    const ownerEmail = process.env.EMAIL_USER;
    const selectedProductLines = normalizedItems
      .map((item) => {
        const product = productMap.get(item.productId);
        return `<li><strong>${product?.name || `Product #${item.productId}`}</strong>: ${item.quantity}</li>`;
      })
      .join("");

    const plainTextItems = normalizedItems
      .map((item) => {
        const product = productMap.get(item.productId);
        return `- ${product?.name || `Product #${item.productId}`}: ${item.quantity}`;
      })
      .join("\n");

    const subject = `New Bulk Order Inquiry from ${name}`;
    const text = [
      "New Bulk Order Inquiry",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Address: ${address}`,
      "",
      "Selected Products:",
      plainTextItems,
    ].join("\n");

    const itemRows = normalizedItems
      .map((item) => {
        const product = productMap.get(item.productId);
        return `<tr>
          <td style="padding:8px 0;border-bottom:1px solid ${EMAIL_THEME.BORDER};font-family:${EMAIL_THEME.FONT};font-size:14px;color:${EMAIL_THEME.TEXT};">${escapeHtml(product?.name || `Product #${item.productId}`)}</td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid ${EMAIL_THEME.BORDER};font-family:${EMAIL_THEME.FONT};font-size:14px;font-weight:bold;color:${EMAIL_THEME.TEXT};">${item.quantity}</td>
        </tr>`;
      })
      .join("");

    const totalUnits = normalizedItems.reduce((sum, i) => sum + Number(i.quantity || 0), 0);

    const html = renderInternalEmail({
      title: "New bulk order enquiry",
      preheader: `${totalUnits} units across ${normalizedItems.length} product${normalizedItems.length === 1 ? "" : "s"}`,
      rows: [
        ["Name", escapeHtml(name)],
        ["Email", `<a href="mailto:${escapeHtml(email)}" style="color:${EMAIL_THEME.BRAND};">${escapeHtml(email)}</a>`],
        ["Phone", escapeHtml(phone)],
        ["Address", escapeHtml(address).replace(/\n/g, "<br />")],
      ],
      // a real table rather than a <ul>: quantities line up and stay readable
      // on mobile Gmail
      bodyHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:0 0 6px;font-family:${EMAIL_THEME.FONT};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:${EMAIL_THEME.MUTED};">Product</td>
          <td align="right" style="padding:0 0 6px;font-family:${EMAIL_THEME.FONT};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:${EMAIL_THEME.MUTED};">Qty</td>
        </tr>
        ${itemRows}
        <tr>
          <td style="padding:10px 0 0;font-family:${EMAIL_THEME.FONT};font-size:14px;font-weight:bold;color:${EMAIL_THEME.TEXT};">Total units</td>
          <td align="right" style="padding:10px 0 0;font-family:${EMAIL_THEME.FONT};font-size:14px;font-weight:bold;color:${EMAIL_THEME.TEXT};">${totalUnits}</td>
        </tr>
      </table>`,
    });

    // deliberately NOT sent here — see after the commit below

    await connection.commit();

    // Sent only once the enquiry is durably committed. Awaiting sendEmail
    // inside the transaction meant an SMTP blip rolled back an order the
    // customer had successfully submitted.
    await safeSend(ownerEmail, subject, text, html);

    return res.json({
      success: true,
      message: "Bulk order inquiry submitted successfully",
    });
  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
    }

    console.error("Bulk order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit bulk order inquiry",
    });
  } finally {
    if (connection) connection.release();
  }
};

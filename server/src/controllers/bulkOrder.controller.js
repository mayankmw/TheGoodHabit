import { db } from "../config/db.js";
import sendEmail from "../utils/sendEmail.js";

const MIN_BULK_QUANTITY = 10;

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
  const { name, email, phone, address, items } = req.body;

  if (!name || !email || !phone || !address) {
    return res.status(400).json({
      success: false,
      message: "All customer details are required",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Select at least one product for bulk order",
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
      item.quantity < MIN_BULK_QUANTITY
  );

  if (invalidItem) {
    return res.status(400).json({
      success: false,
      message: `Each selected product must have a quantity of at least ${MIN_BULK_QUANTITY}`,
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
      [name.trim(), email.trim(), phone.trim(), address.trim()]
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

    const subject = `New Bulk Order Inquiry from ${name.trim()}`;
    const text = [
      "New Bulk Order Inquiry",
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      `Phone: ${phone.trim()}`,
      `Address: ${address.trim()}`,
      "",
      "Selected Products:",
      plainTextItems,
    ].join("\n");

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>New Bulk Order Inquiry</h2>
        <p><strong>Name:</strong> ${name.trim()}</p>
        <p><strong>Email:</strong> ${email.trim()}</p>
        <p><strong>Phone:</strong> ${phone.trim()}</p>
        <p><strong>Address:</strong><br />${address.trim().replace(/\n/g, "<br />")}</p>
        <h3>Selected Products</h3>
        <ul>${selectedProductLines}</ul>
      </div>
    `;

    await sendEmail(ownerEmail, subject, text, html);

    await connection.commit();

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

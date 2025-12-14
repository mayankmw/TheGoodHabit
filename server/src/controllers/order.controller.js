import Razorpay from "razorpay";
import crypto from "crypto";
import { db } from "../config/db.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper: calculate cart total
async function getCartTotal(cartId) {
  const [items] = await db.query(
    `SELECT ci.quantity, p.discountedPrice AS price
     FROM cart_items ci
     JOIN products p ON p.id = ci.productId
     WHERE ci.cartId = ?`,
    [cartId]
  );

  return items.reduce((sum, it) => sum + it.price * it.quantity, 0);
}

export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's cart
    const [cartRows] = await db.query("SELECT id FROM cart WHERE userId = ?", [userId]);
    if (cartRows.length === 0)
      return res.status(400).json({ success: false, message: "Cart empty" });

    const cartId = cartRows[0].id;

    // Compute total
    const totalPrice = await getCartTotal(cartId);
    const amountPaise = totalPrice * 100;

    if (totalPrice <= 0)
      return res.status(400).json({ success: false, message: "Cart total is 0" });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`,
    });

    // 1️⃣ Create local order record (your orders table)
    const [orderResult] = await db.query(
      `INSERT INTO orders (userId, totalPrice, status, paymentStatus, razorpayOrderId)
       VALUES (?, ?, 'pending', 'pending', ?)`,
      [userId, totalPrice, razorpayOrder.id]
    );

    const appOrderId = orderResult.insertId;

    // 2️⃣ Insert payment record (payments table)
    await db.query(
      `INSERT INTO payments 
        (orderId, razorpayOrderId, amount, status, currency) 
       VALUES (?, ?, ?, 'created', 'INR')`,
      [appOrderId, razorpayOrder.id, amountPaise]
    );

    return res.json({
      success: true,
      razorpayKey: process.env.RAZORPAY_KEY_ID,
      orderId: razorpayOrder.id,
      appOrderId,
      amount: amountPaise,
      currency: "INR"
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      appOrderId 
    } = req.body;

    // 1️⃣ Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Update payment record as failed
      await db.query(
        `UPDATE payments SET status = 'failed'
         WHERE razorpayOrderId = ?`,
        [razorpay_order_id]
      );

      return res.status(400).json({ success: false, message: "Invalid Signature" });
    }

    // 2️⃣ Update orders table
    await db.query(
      `UPDATE orders
       SET paymentStatus = 'paid',
           status = 'confirmed',
           razorpayPaymentId = ?,
           razorpaySignature = ?
       WHERE id = ?`,
      [razorpay_payment_id, razorpay_signature, appOrderId]
    );

    // 3️⃣ Update payments table
    await db.query(
      `UPDATE payments
       SET razorpayPaymentId = ?, 
           razorpaySignature = ?, 
           status = 'paid'
       WHERE razorpayOrderId = ?`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    // 4️⃣ Move cart items → order_items
    const [cartItems] = await db.query(
      `SELECT ci.quantity, p.id AS productId, p.discountedPrice AS price
       FROM cart_items ci
       JOIN products p ON p.id = ci.productId
       JOIN cart c ON c.id = ci.cartId
       WHERE c.userId = ?`,
      [req.user.id]
    );

    for (const item of cartItems) {
      await db.query(
        `INSERT INTO order_items (orderId, productId, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [appOrderId, item.productId, item.quantity, item.price]
      );
    }

    // 5️⃣ Clear cart
    const [[cartRow]] = await db.query(
      "SELECT id FROM cart WHERE userId = ? LIMIT 1",
      [req.user.id]
    );

    if (cartRow) {
      await db.query("DELETE FROM cart_items WHERE cartId = ?", [cartRow.id]);
    }

    return res.json({ success: true, message: "Payment Verified" });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

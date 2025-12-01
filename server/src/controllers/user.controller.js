import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import sendEmail from "../utils/sendEmail.js";

export const sendOtp = async (req, res) => {
  const { email } = req.body;

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await db.query(
    "INSERT INTO otps (email, code, expiresAt) VALUES (?, ?, ?)",
    [email, code, expiresAt]
  );

  await sendEmail(email, "Your Login OTP", `Your OTP: ${code}`);

  return res.json({ success: true, message: "OTP sent to your email." });
};

export const verifyOtp = async (req, res) => {
  const { email, code } = req.body;

  const [otpRows] = await db.query(
    "SELECT * FROM otps WHERE email = ? AND code = ? ORDER BY id DESC LIMIT 1",
    [email, code]
  );

  const otpData = otpRows[0];

  if (!otpData) {
    return res.json({ success: false, message: "Invalid OTP" });
  }

  if (new Date(otpData.expiresAt) < new Date()) {
    return res.json({ success: false, message: "OTP expired" });
  }

  // Check if user exists
  const [userRows] = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  let user = userRows[0];

  // Auto-create user
  if (!user) {
    const [result] = await db.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, ""]
    );

    user = {
      id: result.insertId,
      email,
      password: "",
      name: null,
    };
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

  return res.json({
    success: true,
    message: "Login success",
    token,
    user,
  });
};

export const me = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. USER
    const [users] = await db.query(
      "SELECT id, email, name FROM users WHERE id = ?",
      [userId]
    );
    const user = users[0];

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. ADDRESSES
    const [addresses] = await db.query(
      `SELECT 
         id, 
         addressLine1, 
         addressLine2, 
         city, 
         state, 
         postalCode, 
         country 
       FROM addresses 
       WHERE userId = ?`,
      [userId]
    );

    // 3. ORDERS
    const [orders] = await db.query(
      `SELECT 
         id, 
         totalPrice,
         status,
         paymentStatus,
         paymentMethod,
         razorpayOrderId,
         razorpayPaymentId,
         createdAt
       FROM orders 
       WHERE userId = ?
       ORDER BY createdAt DESC`,
      [userId]
    );

    // 4. Attach order items to each order
    for (let order of orders) {
      const [items] = await db.query(
        `SELECT 
           oi.quantity, 
           oi.price, 
           p.name,
           p.image,
           p.id AS productId
         FROM order_items oi
         JOIN products p ON oi.productId = p.id
         WHERE oi.orderId = ?`,
        [order.id]
      );

      order.items = items;
    }

    return res.json({
      success: true,
      user,
      addresses,
      orders
    });

  } catch (err) {
    console.error("ME API ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};


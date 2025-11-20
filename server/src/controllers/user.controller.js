import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import sendEmail from "../utils/sendEmail.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      success: true,
      message: "Welcome Back",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

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

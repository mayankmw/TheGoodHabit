import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import {
  safeSend,
  renderEmail,
  heading,
  paragraph,
  codeBlock,
  EMAIL_THEME,
} from "../utils/emailTemplates.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const buildUserPayload = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
  };

  if (user.role === "admin") {
    payload.isAdmin = true;
  }

  return payload;
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Missing Google credential",
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google account has no email",
      });
    }

    // Check user
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    let user = rows[0];

    // Auto-create user
    if (!user) {
      const [result] = await db.query(
        "INSERT INTO users (email, name, password, phone) VALUES (?, ?, ?, ?)",
        [email, name || null, "", null]
      );

      user = {
        id: result.insertId,
        email,
        name,
      };
    }

    // Issue your JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user,
      message: "Google login successful",
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({
      success: false,
      message: "Google login failed",
    });
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

  const html = renderEmail({
    preheader: `${code} is your NoshBOB login code`,
    title: "Your NoshBOB login code",
    bodyHtml: [
      heading("Your login code"),
      paragraph("Enter this code to sign in. It expires in 5 minutes."),
      codeBlock(code),
      paragraph(
        "If you didn't request this, you can safely ignore this email — nobody can sign in without the code.",
        EMAIL_THEME.MUTED
      ),
    ].join("\n"),
  });

  // never block sign-in on a mail fault: the OTP row is already written
  await safeSend(
    email,
    "Your NoshBOB login code",
    `Your NoshBOB login code is ${code}. It expires in 5 minutes.`,
    html
  );

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
      "INSERT INTO users (email, password, phone) VALUES (?, ?, ?)",
      [email, "", null]
    );

    user = {
      id: result.insertId,
      email,
      password: "",
      name: null,
    };
  }
  
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

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

    const [users] = await db.query(
      "SELECT id, email, phone, name, role FROM users WHERE id = ?",
      [userId]
    );

    const user = users[0];

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      user: buildUserPayload(user)
    });

  } catch (err) {
    console.error("ME API ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const name = String(req.body?.name || "").trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    await db.query("UPDATE users SET name = ? WHERE id = ?", [name, userId]);

    const [users] = await db.query(
      "SELECT id, email, phone, name, role FROM users WHERE id = ?",
      [userId]
    );

    const user = users[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: buildUserPayload(user),
    });
  } catch (err) {
    console.error("UPDATE PROFILE API ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


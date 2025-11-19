import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Otp } from "../models/Otp.js";
import sendEmail from "../utils/sendEmail.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });

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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const sendOtp = async (req, res) => {
  const { email } = req.body;

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.create({
    email,
    code,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  await sendEmail(email, "Your Login OTP", `Your OTP: ${code}`);

  return res.json({ success: true, message: "OTP sent to your email." });
};

export const verifyOtp = async (req, res) => {
  const { email, code } = req.body;

  const otpData = await Otp.findOne({ where: { email, code } });

  if (!otpData) return res.json({ success: false, message: "Invalid OTP" });

  if (otpData.expiresAt < new Date()) {
    return res.json({ success: false, message: "OTP expired" });
  }

  let user = await User.findOne({ where: { email } });

  // Auto-create user if not exists
  if (!user) {
    user = await User.create({ email, password: "" });
  }

  // create token (JWT)
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

  return res.json({
    success: true,
    message: "Login success",
    token,
    user
  });
};



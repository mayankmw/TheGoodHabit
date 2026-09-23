import express from "express";
import {
  googleLogin,
  sendOtp,
  verifyOtp,
  me,
  updateProfile,
} from "../controllers/user.controller.js";
import { auth } from "../middlewares/authMiddleware.js";
import { rateLimit, clientIp } from "../middlewares/rateLimit.js";

const router = express.Router();

const emailOf = (req) => String(req.body?.email || "").trim().toLowerCase();

// Sending is capped per address and per IP at once: per address alone lets an
// attacker walk a list of victims, per IP alone lets a botnet through.
const otpSendLimit = rateLimit({
  limit: 5,
  windowMs: 15 * 60 * 1000,
  keys: (req) => [`otp:send:email:${emailOf(req)}`, `otp:send:ip:${clientIp(req)}`],
  message: "Too many code requests — please wait a few minutes before trying again",
});

// A six-digit code is a million guesses; unthrottled that is minutes of work.
// Capped per address so one account cannot be ground down, and per IP so one
// attacker cannot sweep many accounts at once.
const otpVerifyLimit = rateLimit({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  keys: (req) => [`otp:verify:email:${emailOf(req)}`, `otp:verify:ip:${clientIp(req)}`],
  message: "Too many attempts — please request a new code in a few minutes",
});

router.post("/google-login", googleLogin);

router.post("/send-otp", otpSendLimit, sendOtp);

router.post("/verify-otp", otpVerifyLimit, verifyOtp);

router.post("/me", auth, me);
router.post("/update-profile", auth, updateProfile);

export default router;

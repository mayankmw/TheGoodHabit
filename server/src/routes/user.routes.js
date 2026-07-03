import express from "express";
import {
  googleLogin,
  sendOtp,
  verifyOtp,
  me,
  updateProfile,
} from "../controllers/user.controller.js";
import { auth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/google-login", googleLogin);

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtp);

router.post("/me", auth, me);
router.post("/update-profile", auth, updateProfile);

export default router;

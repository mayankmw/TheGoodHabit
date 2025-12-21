import express from "express";
import { googleLogin, sendOtp, verifyOtp, me } from "../controllers/user.controller.js";
import { auth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/google-login", googleLogin);

router.post("/send-otp", sendOtp);

router.post("/verify-otp", verifyOtp);

router.post("/me", auth, me);

export default router;

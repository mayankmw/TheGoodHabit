import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getOrders,
  trackOrderByCode,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/create", auth, createRazorpayOrder);
router.post("/verify", auth, verifyRazorpayPayment);
router.post("/track", auth, trackOrderByCode);
router.post("", auth, getOrders);

export default router;

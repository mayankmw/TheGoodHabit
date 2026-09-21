import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getOrders,
  trackOrderByCode,
  cancelOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/create", auth, createRazorpayOrder);
router.post("/verify", auth, verifyRazorpayPayment);
router.post("/track", auth, trackOrderByCode);
router.post("/cancel", auth, cancelOrder);
router.post("", auth, getOrders);

export default router;

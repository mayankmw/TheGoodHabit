import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/order.controller.js";

const router = express.Router();

router.post("/create", auth, createRazorpayOrder);
router.post("/verify", auth, verifyRazorpayPayment);

export default router;

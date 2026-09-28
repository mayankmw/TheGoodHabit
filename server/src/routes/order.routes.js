import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import { handleMulterImageUpload, uploadImage } from "../middlewares/imageUpload.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getOrders,
  trackOrderByCode,
  cancelOrder,
  getReturnableItems,
  requestReturn,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/create", auth, createRazorpayOrder);
router.post("/verify", auth, verifyRazorpayPayment);
router.post("/track", auth, trackOrderByCode);
router.post("/cancel", auth, cancelOrder);

router.post("/returnable", auth, getReturnableItems);
router.post(
  "/return",
  auth,
  handleMulterImageUpload(uploadImage("uploads/returns").array("photos", 4)),
  requestReturn
);
router.post("", auth, getOrders);

export default router;

import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCartCoupon
} from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/", auth, getCart);
router.post("/add", auth, addToCart);
router.post("/update", auth, updateCartItem);
router.post("/remove", auth, removeCartItem);
router.post("/clear", auth, clearCart);
router.post("/apply-coupon", auth, applyCoupon);
router.post("/remove-coupon", auth, removeCartCoupon);

export default router;

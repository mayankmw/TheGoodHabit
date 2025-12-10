import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/", auth, getCart);
router.post("/add", auth, addToCart);
router.post("/update", auth, updateCartItem);
router.post("/remove", auth, removeCartItem);
router.post("/clear", auth, clearCart);

export default router;

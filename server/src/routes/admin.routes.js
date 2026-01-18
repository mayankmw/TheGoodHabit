import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import { uploadImage } from "../middlewares/imageUpload.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import {
  getStats,
  getRevenueTrend,
  getOrdersTrend,
  createProduct,
  updateProduct,
  getProducts,
  getProductById,
  fetchOrders,
  fetchOrderById,
  updateOrder,
  getAllAssets,
  updateAsset,
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  toggleCouponStatus
} from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/stats", auth, isAdmin, getStats);
router.post("/trends/revenue", auth, isAdmin, getRevenueTrend);
router.post("/trends/orders", auth, isAdmin, getOrdersTrend);

router.get("/products", getProducts);
router.post("/product", getProductById);

router.post("/product/create", auth, isAdmin, uploadImage("uploads/products").single("image"), createProduct);
router.post("/product/update", auth, isAdmin, uploadImage("uploads/products").single("image"), updateProduct);

router.post("/orders", auth, isAdmin, fetchOrders);
router.post("/order", auth, isAdmin, fetchOrderById);
router.post("/order/update", auth, isAdmin, updateOrder);

router.post("/assets", auth, isAdmin, getAllAssets);

router.post(
  "/assets/update",
  auth,
  isAdmin,
  uploadImage("uploads/assets").single("image"),
  updateAsset
);

router.post("/coupons", auth, isAdmin, getAllCoupons);
router.post("/coupon", auth, isAdmin, getCouponById);
router.post("/coupon/create", auth, isAdmin, createCoupon);
router.post("/coupon/update", auth, isAdmin, updateCoupon);
router.post("/coupon/toggle", auth, isAdmin, toggleCouponStatus);


export default router;

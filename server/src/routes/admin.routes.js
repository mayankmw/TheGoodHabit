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
  toggleCouponStatus,
  getAllSliders,
  createSlider,
  updateSlider,
  reorderSliders,
  toggleSlider,
  deleteSlider,
  getStory,
  updateStory,
  getAllSocials,
  updateSocial,
  toggleSocial,
  getAllContacts,
  markContactRead,
  replyToContact,
  getNewsletterSubscribers,
  getNewsletters,
  sendNewsletter,
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

router.post("/sliders", auth, isAdmin, getAllSliders);
router.post("/slider/create", auth, isAdmin, createSlider);
router.post("/slider/update", auth, isAdmin, updateSlider);
router.post("/slider/reorder", auth, isAdmin, reorderSliders);
router.post("/slider/toggle", auth, isAdmin, toggleSlider);
router.post("/slider/delete", auth, isAdmin, deleteSlider);

router.post("/story", auth, isAdmin, getStory);
router.post(
  "/story/update",
  auth,
  isAdmin,
  uploadImage("uploads/story").single("image"),
  updateStory
);

router.post("/socials", auth, isAdmin, getAllSocials);
router.post("/social/update", auth, isAdmin, updateSocial);
router.post("/social/toggle", auth, isAdmin, toggleSocial);

router.post("/contacts", auth, isAdmin, getAllContacts);
router.post("/contact/read", auth, isAdmin, markContactRead);
router.post("/contact/reply", auth, isAdmin, replyToContact);

router.post("/newsletter/subscribers", auth, isAdmin, getNewsletterSubscribers);

router.post("/newsletters", auth, isAdmin, getNewsletters);

router.post("/newsletter/send", auth, isAdmin, sendNewsletter);

export default router;

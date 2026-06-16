import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import { handleMulterImageUpload, uploadImage } from "../middlewares/imageUpload.js";
import { uploadNewsletterAttachments } from "../middlewares/newsletterUpload.js";
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
  getAllReels,
  createReel,
  updateReel,
  reorderReels,
  toggleReel,
  deleteReel
} from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/stats", auth, isAdmin, getStats);
router.post("/trends/revenue", auth, isAdmin, getRevenueTrend);
router.post("/trends/orders", auth, isAdmin, getOrdersTrend);

router.get("/products", getProducts);
router.post("/product", getProductById);

router.post(
  "/product/create",
  auth,
  isAdmin,
  handleMulterImageUpload(
    uploadImage("uploads/products").fields([
      { name: "image", maxCount: 1 },
      { name: "images", maxCount: 10 },
    ])
  ),
  createProduct
);
router.post(
  "/product/update",
  auth,
  isAdmin,
  handleMulterImageUpload(
    uploadImage("uploads/products").fields([
      { name: "image", maxCount: 1 },
      { name: "images", maxCount: 10 },
    ])
  ),
  updateProduct
);

router.post("/orders", auth, isAdmin, fetchOrders);
router.post("/order", auth, isAdmin, fetchOrderById);
router.post("/order/update", auth, isAdmin, updateOrder);

router.post("/assets", auth, isAdmin, getAllAssets);

router.post(
  "/assets/update",
  auth,
  isAdmin,
  handleMulterImageUpload(
    uploadImage("uploads/assets").single("image")
  ),
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
  handleMulterImageUpload(
    uploadImage("uploads/story").single("image")
  ),
  updateStory
);

router.post("/socials", auth, isAdmin, getAllSocials);
router.post("/social/update", auth, isAdmin, updateSocial);
router.post("/social/toggle", auth, isAdmin, toggleSocial);

router.post("/contacts", auth, isAdmin, getAllContacts);
router.post("/contact/read", auth, isAdmin, markContactRead);
router.post("/contact/reply", auth, isAdmin, replyToContact);

router.post("/newsletter/subscribers", auth, isAdmin, getNewsletterSubscribers);
router.post("/newsletters/subscribers", auth, isAdmin, getNewsletterSubscribers);

router.post("/newsletters", auth, isAdmin, getNewsletters);

router.post(
  "/newsletter/send",
  auth,
  isAdmin,
  uploadNewsletterAttachments.array("attachments", 5),
  sendNewsletter
);

/* ================= REELS ================= */

router.post("/reels", auth, isAdmin, getAllReels);

router.post(
  "/reel/create",
  auth,
  isAdmin,
  handleMulterImageUpload(
    uploadImage("uploads/reels").fields([
      { name: "short_video", maxCount: 1 },
      { name: "main_video", maxCount: 1 },
    ])
  ),
  createReel
);

router.post(
  "/reel/update",
  auth,
  isAdmin,
  handleMulterImageUpload(
    uploadImage("uploads/reels").fields([
      { name: "short_video", maxCount: 1 },
      { name: "main_video", maxCount: 1 },
    ])
  ),
  updateReel
);
router.post("/reel/reorder", auth, isAdmin, reorderReels);

router.post("/reel/toggle", auth, isAdmin, toggleReel);

router.post("/reel/delete", auth, isAdmin, deleteReel);


export default router;

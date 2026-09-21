import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import {
  submitOrderReview,
  dismissOrderReviewPrompt,
  getProductReviews,
} from "../controllers/review.controller.js";

const router = express.Router();

// no auth: the product page these feed is public. Auth is applied per route
// in this codebase, so omitting it here is the whole mechanism.
router.post("/product", getProductReviews);

router.post("/submit", auth, submitOrderReview);
router.post("/dismiss", auth, dismissOrderReviewPrompt);

export default router;

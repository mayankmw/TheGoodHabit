import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import {
  submitOrderReview,
  dismissOrderReviewPrompt,
} from "../controllers/review.controller.js";

const router = express.Router();

router.post("/submit", auth, submitOrderReview);
router.post("/dismiss", auth, dismissOrderReviewPrompt);

export default router;

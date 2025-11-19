import express from "express";
import {
  fetchProducts,
  fetchSingleProduct
} from "../controllers/product.controller.js";

const router = express.Router();

router.post("/", fetchProducts);

router.post("/details", fetchSingleProduct);

export default router;

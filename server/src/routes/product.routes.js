import express from "express";
import {
  fetchProducts,
  fetchSingleProduct,
  fetchFrequentlyBoughtTogether
} from "../controllers/product.controller.js";

const router = express.Router();

router.post("/", fetchProducts);

router.post("/details", fetchSingleProduct);
router.post("/frequently-bought", fetchFrequentlyBoughtTogether);

export default router;

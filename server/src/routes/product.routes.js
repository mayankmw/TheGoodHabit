import express from "express";
import {
  fetchProducts,
  fetchSingleProduct
} from "../controllers/product.controller.js";
import { db } from "../config/db.js";

const router = express.Router();

router.post("/", fetchProducts);

router.post("/details", fetchSingleProduct);

router.get("/test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products ORDER BY createdAt DESC");

    return res.json({
      success: true,
      count: rows.length,
      products: rows,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Test fetch failed",
      error: err.message,
    });
  }
});

export default router;

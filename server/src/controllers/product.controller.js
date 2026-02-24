import { db } from "../config/db.js";

const PRODUCT_IMAGE_URL = process.env.PRODUCT_IMAGE_URL || "";
const UPLOADS_APP_URL = process.env.UPLOADS_APP_URL || "";

export const fetchProducts = async (req, res) => {
  try {
    const { search, recommended } = req.body;

    // ⭐ RECOMMENDED (TOP 4 RATED)
    if (recommended) {
      const [rows] = await db.query(
        "SELECT * FROM products ORDER BY rating DESC LIMIT 4"
      );

      const formatted = rows.map(p => ({
        ...p,
        image: p.image
          ? `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}${p.image}`
          : null
      }));

      return res.json({
        success: true,
        products: formatted,
      });
    }

    let sql = "SELECT * FROM products";
    let params = [];

    // 🔍 SEARCH
    if (search && search.trim().length > 0) {
      sql += " WHERE name LIKE ?";
      params.push(`%${search}%`);
    }

    sql += " ORDER BY createdAt DESC";

    const [products] = await db.query(sql, params);

    const formatted = products.map(p => ({
      ...p,
      image: p.image
        ? `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}${p.image}`
        : null
    }));

    return res.json({
      success: true,
      count: formatted.length,
      products: formatted,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

export const fetchSingleProduct = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM products WHERE id = ? LIMIT 1",
      [id]
    );

    const product = rows[0];

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.image = product.image
      ? `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}${product.image}`
      : null;

    return res.json({
      success: true,
      product,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: err.message,
    });
  }
};

export const fetchFrequentlyBoughtTogether = async (req, res) => {
  const { id, limit = 3 } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  const parsedLimit = Math.min(Math.max(Number(limit) || 3, 1), 6);

  try {
    const [coBoughtRows] = await db.query(
      `
      SELECT
        p.*,
        COUNT(DISTINCT oi.orderId) AS togetherCount,
        COALESCE(SUM(oi.quantity), 0) AS togetherQty
      FROM order_items oiBase
      JOIN order_items oi
        ON oi.orderId = oiBase.orderId
       AND oi.productId <> oiBase.productId
      JOIN products p
        ON p.id = oi.productId
      WHERE oiBase.productId = ?
      GROUP BY p.id
      ORDER BY togetherCount DESC, togetherQty DESC, p.rating DESC
      LIMIT ?
      `,
      [id, parsedLimit]
    );

    let rows = coBoughtRows;

    if (!rows.length) {
      const [[baseProduct]] = await db.query(
        "SELECT id, category FROM products WHERE id = ? LIMIT 1",
        [id]
      );

      if (baseProduct?.category) {
        const [relatedRows] = await db.query(
          `
          SELECT *
          FROM products
          WHERE category = ? AND id <> ?
          ORDER BY rating DESC, reviews DESC, createdAt DESC
          LIMIT ?
          `,
          [baseProduct.category, id, parsedLimit]
        );
        rows = relatedRows;
      } else {
        const [recommendedRows] = await db.query(
          `
          SELECT *
          FROM products
          WHERE id <> ?
          ORDER BY rating DESC, reviews DESC, createdAt DESC
          LIMIT ?
          `,
          [id, parsedLimit]
        );
        rows = recommendedRows;
      }
    }

    const formatted = rows.map((p) => ({
      ...p,
      image: p.image
        ? `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}${p.image}`
        : null,
    }));

    return res.json({
      success: true,
      products: formatted,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch frequently bought together products",
      error: err.message,
    });
  }
};


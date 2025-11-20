import { db } from "../config/db.js";

export const fetchProducts = async (req, res) => {
  try {
    const { search, recommended } = req.body;

    // ⭐ RECOMMENDED (TOP 4 RATED)
    if (recommended) {
      const [rows] = await db.query(
        "SELECT * FROM products ORDER BY rating DESC LIMIT 4"
      );

      return res.json({
        success: true,
        products: rows,
      });
    }

    let sql = "SELECT * FROM products";
    let params = [];

    // 🔍 SEARCH
    if (search && search.trim().length > 0) {
      sql += " WHERE name LIKE ?";
      params.push(`%${search}%`);
    }

    // Order by latest created (DESC)
    sql += " ORDER BY createdAt DESC";

    const [products] = await db.query(sql, params);

    return res.json({
      success: true,
      count: products.length,
      products,
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


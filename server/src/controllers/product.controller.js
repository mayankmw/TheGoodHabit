import { Op } from "sequelize";
import { Product } from "../models/Product.js";

export const fetchProducts = async (req, res) => {
  try {
    const { search, recommended } = req.body;

    let query = {};

    // 🔍 SEARCH FEATURE
    if (search) {
      query.where = {
        name: { [Op.like]: `%${search}%` }
      };
    }

    // ⭐ RECOMMENDED PRODUCTS (Top 4 rated)
    if (recommended) {
      const products = await Product.findAll({
        order: [["rating", "DESC"]],
        limit: 4,
      });

      return res.json({
        success: true,
        products,
      });
    }

    // 🎯 DEFAULT – Fetch All Products
    const products = await Product.findAll({
      order: [["createdAt", "DESC"]],
      where: query.where || undefined,
    });

    return res.json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message
    });
  }
};

export const fetchSingleProduct = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required"
    });
  }

  try {
    const product = await Product.findOne({ where: { id } });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.json({
      success: true,
      product
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message
    });
  }
};

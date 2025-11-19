import { Product } from "../models/Product.js";

export const fetchProducts = async (req, res) => {
  try {
    // You can extract filters from req.body later
    // const { category, minPrice, maxPrice } = req.body;

    const products = await Product.findAll();

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

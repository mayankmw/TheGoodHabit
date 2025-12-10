import { db } from "../config/db.js";

// GET USER CART
export const getCart = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get cart for user
    const [cartRows] = await db.query("SELECT * FROM cart WHERE userId = ?", [userId]);

    let cartId;

    // If no cart exists → create one
    if (cartRows.length === 0) {
      const [result] = await db.query(
        "INSERT INTO cart (userId) VALUES (?)",
        [userId]
      );
      cartId = result.insertId;
    } else {
      cartId = cartRows[0].id;
    }

    // 2. Fetch cart items with product details
    const [items] = await db.query(
      `SELECT 
          ci.id AS cartItemId,
          ci.productId,
          ci.quantity,
          p.name,
          p.image,
          p.originalPrice,
          p.discountedPrice
       FROM cart_items ci
       JOIN products p ON p.id = ci.productId
       WHERE ci.cartId = ?`,
      [cartId]
    );

    return res.json({
      success: true,
      cartId,
      items,
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ADD TO CART
export const addToCart = async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  try {
    // ensure cart exists
    const [cartRows] = await db.query("SELECT * FROM cart WHERE userId = ?", [userId]);
    let cartId = cartRows.length ? cartRows[0].id : null;

    if (!cartId) {
      const [create] = await db.query("INSERT INTO cart (userId) VALUES (?)", [userId]);
      cartId = create.insertId;
    }

    // check item exists
    const [itemRows] = await db.query(
      "SELECT * FROM cart_items WHERE cartId = ? AND productId = ?",
      [cartId, productId]
    );

    if (itemRows.length > 0) {
      // update quantity
      await db.query(
        "UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?",
        [itemRows[0].id]
      );
    } else {
      // insert new item
      await db.query(
        "INSERT INTO cart_items (cartId, productId, quantity) VALUES (?, ?, 1)",
        [cartId, productId]
      );
    }

    return res.json({ success: true, message: "Added to cart" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// UPDATE QUANTITY
export const updateCartItem = async (req, res) => {
  const { cartItemId, quantity } = req.body;

  if (quantity < 1) {
    return res.json({ success: false, message: "Quantity must be at least 1" });
  }

  try {
    await db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [
      quantity,
      cartItemId,
    ]);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// REMOVE ITEM
export const removeCartItem = async (req, res) => {
  const { cartItemId } = req.body;

  try {
    await db.query("DELETE FROM cart_items WHERE id = ?", [cartItemId]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


// CLEAR CART
export const clearCart = async (req, res) => {
  const userId = req.user.id;

  try {
    await db.query(
      "DELETE ci FROM cart_items ci JOIN cart c ON ci.cartId = c.id WHERE c.userId = ?",
      [userId]
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

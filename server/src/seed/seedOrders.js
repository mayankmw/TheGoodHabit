// seed/seedOrders.js
import { db } from "../config/db.js";

export const seedOrders = async () => {
  try {
    // Check if orders already exist
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM orders WHERE userId = 1"
    );

    if (rows[0].count > 0) {
      console.log("Orders already seeded.");
      return;
    }

    // Get all products
    const [products] = await db.query("SELECT * FROM products");

    if (products.length === 0) {
      console.log("❌ No products found to seed orders.");
      return;
    }

    const pickRandom = () => products[Math.floor(Math.random() * products.length)];

    // Create two dummy orders
    for (let i = 0; i < 2; i++) {
      const p = pickRandom();
      const quantity = Math.floor(Math.random() * 3) + 1;
      const totalPrice = p.discountedPrice * quantity;

      const [orderResult] = await db.query(
        `INSERT INTO orders 
        (totalPrice, status, userId, addressId, paymentStatus, paymentMethod) 
        VALUES (?, 'delivered', 1, 1, 'paid', 'cod')`,
        [totalPrice]
      );

      const orderId = orderResult.insertId;

      await db.query(
        `INSERT INTO order_items 
        (orderId, productId, quantity, price) 
        VALUES (?, ?, ?, ?)`,
        [orderId, p.id, quantity, p.discountedPrice]
      );
    }

    console.log("✅ Dummy orders + items seeded!");
  } catch (err) {
    console.error("❌ Order seeding failed:", err);
  }
};

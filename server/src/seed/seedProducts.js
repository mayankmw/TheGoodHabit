import { db } from "../config/db.js";
import { products } from "./products.js";

export const seedProducts = async () => {
  try {
    const [rows] = await db.query("SELECT COUNT(*) AS count FROM products");
    if (rows[0].count > 0) {
      console.log("Products already exist.");
      return;
    }

    const insertQuery = `
      INSERT INTO products 
      (id, name, image, type, originalPrice, discountedPrice, rating, reviews, description, ingredients) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const p of products) {
      await db.query(insertQuery, [
        p.id,
        p.name,
        p.image,
        p.type,
        p.originalPrice,
        p.discountedPrice,
        p.rating,
        p.reviews,
        p.description,
        JSON.stringify(p.ingredients),
      ]);
    }

    console.log("✅ Products seeded successfully!");
  } catch (err) {
    console.error("❌ Product seed failed:", err);
  }
};

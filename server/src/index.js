import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { db } from "../src/config/db.js";

import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";

// Seeds
import { seedDefaultUser } from "./seed/seedUser.js";
import { seedProducts } from "./seed/seedProducts.js";
import { seedAddresses } from "./seed/seedAddresses.js";
import { seedOrders } from "./seed/seedOrders.js";

dotenv.config();

const app = express();
// CORS for all routes
app.use(cors());

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    // Test DB query
    const [dbTest] = await db.query("SELECT 1 + 1 AS result");

    // Fetch all products
    const [products] = await db.query(
      "SELECT * FROM products ORDER BY createdAt DESC"
    );

    res.json({
      status: "success",
      message: "API + DB + Products working 🔥",
      db: dbTest[0],
      totalProducts: products.length,
      products,
      time: new Date().toISOString(),
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Base API failed ❌",
      error: error.message,
    });
  }
});

// Routes
app.use("/user", userRoutes);
app.use("/products", productRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await connectDB();
  await seedDefaultUser();
  await seedProducts();
  await seedAddresses();     // create addresses for user 1
  await seedOrders(); 

  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

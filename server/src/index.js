import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { db } from "../src/config/db.js";
import path from "path";

import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import addressRoutes from "./routes/address.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import newsletterRoutes from "./routes/newsletter.routes.js";
import publicRoutes from "./routes/public.routes.js";

// Seeds
import { seedDefaultUser } from "./seed/seedUser.js";
import { seedDefaultAssets } from "./seed/seedDefaultAssets.js";

dotenv.config();

const app = express();
// CORS for all routes
app.use(cors());

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/contact", contactRoutes);
app.use("/address", addressRoutes);
app.use("/admin", adminRoutes);
app.use("/newsletter", newsletterRoutes);
app.use("/", publicRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await connectDB();
  await seedDefaultUser();
  await seedDefaultAssets();

  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

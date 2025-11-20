import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";

// Seeds
import { seedDefaultUser } from "./seed/seedUser.js";
import { seedProducts } from "./seed/seedProducts.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/user", userRoutes);
app.use("/products", productRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  await connectDB();
  await seedDefaultUser();
  await seedProducts();

  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

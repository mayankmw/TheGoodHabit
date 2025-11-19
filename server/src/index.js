import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, sequelize } from "./config/db.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import { seedDefaultUser } from "./seed/userSeed.js";
import { seedProducts } from "./seed/seedProducts.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/user", userRoutes);
app.use("/products", productRoutes);

const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, async () => {
  await connectDB();
  await sequelize.sync({ alter: true }); // create tables automatically
  await seedDefaultUser(); // insert static user one time
  await seedProducts();
  console.log(`Server running at http://localhost:${PORT}`);
});

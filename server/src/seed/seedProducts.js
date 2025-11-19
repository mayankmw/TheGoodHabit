// seed/seedProducts.js
import { Product } from "../models/Product.js";
import { products } from "./products.js";

export const seedProducts = async () => {
  const count = await Product.count();
  if (count > 0) {
    console.log("Products already exist.");
    return;
  }

  await Product.bulkCreate(products);
  console.log("Products seeded successfully!");
};

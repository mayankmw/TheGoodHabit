import bcrypt from "bcrypt";
import { db } from "../config/db.js";

export const seedDefaultUser = async () => {
  const email = "sanjaymalviya.cr7@gmail.com";
  const password = process.env.SEED_ADMIN_PASSWORD;

  try {
    const [exists] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (exists.length > 0) {
      console.log("Default user already exists.");
      return;
    }

    if (!password) {
      console.warn("⚠️ SEED_ADMIN_PASSWORD not set — skipping default user seed.");
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashed]
    );

    console.log("✅ Default user created!");
  } catch (err) {
    console.error("❌ User seed failed:", err);
  }
};

import bcrypt from "bcrypt";
import { db } from "../config/db.js";

export const seedDefaultUser = async () => {
  const email = "wadhwa.mayankreal9149@gmail.com";
  const password = "mayank@123";

  try {
    const [exists] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (exists.length > 0) {
      console.log("Default user already exists.");
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

// seed/seedAddresses.js
import { db } from "../config/db.js";

export const seedAddresses = async () => {
  try {
    // Check if user has addresses already
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM addresses WHERE userId = 1"
    );

    if (rows[0].count > 0) {
      console.log("Addresses already seeded.");
      return;
    }

    await db.query(
      `INSERT INTO addresses 
      (addressLine1, addressLine2, city, state, postalCode, country, userId)
      VALUES 
      (?, ?, ?, ?, ?, ?, ?)`,
      [
        "123 MG Road",
        "Near City Mall",
        "Bangalore",
        "Karnataka",
        "560001",
        "India",
        1,
      ]
    );

    await db.query(
      `INSERT INTO addresses 
      (addressLine1, addressLine2, city, state, postalCode, country, userId)
      VALUES 
      (?, ?, ?, ?, ?, ?, ?)`,
      [
        "55 South Extension",
        null,
        "New Delhi",
        "Delhi",
        "110003",
        "India",
        1,
      ]
    );

    console.log("✅ Addresses seeded successfully!");
  } catch (err) {
    console.error("❌ Address seeding failed:", err);
  }
};

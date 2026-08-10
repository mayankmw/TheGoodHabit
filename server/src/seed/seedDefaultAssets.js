// seeders/seedDefaultAssets.js
import { db } from "../config/db.js";

export const seedDefaultAssets = async () => {
  try {
    const defaults = [
      {
        type: "logo",
        position: 0,
        image: null,
      },
      {
        type: "banner",
        position: 1,
        image: null,
      },
      {
        type: "banner",
        position: 2,
        image: null,
      },
      {
        type: "hero",
        position: 1,
        image: null,
      },
      {
        type: "hero",
        position: 2,
        image: null,
      },
      {
        type: "hero",
        position: 3,
        image: null,
      },
      {
        type: "imagesCarousel",
        position: 1,
        image: null,
      },
      {
        type: "imagesCarousel",
        position: 2,
        image: null,
      },
      {
        type: "imagesCarousel",
        position: 3,
        image: null,
      },
      {
        type: "imagesCarousel",
        position: 4,
        image: null,
      },
      {
        type: "imagesCarousel",
        position: 5,
        image: null,
      },
    ];

    for (const asset of defaults) {
      const [exists] = await db.query(
        `SELECT id FROM assets WHERE type = ? AND position = ?`,
        [asset.type, asset.position]
      );

      if (exists.length > 0) {
        continue;
      }

      await db.query(
        `
        INSERT INTO assets (type, image, position)
        VALUES (?, ?, ?)
        `,
        [asset.type, asset.image, asset.position]
      );

      console.log(
        `✅ Seeded ${asset.type} (position ${asset.position}) → ${asset.image}`
      );
    }

    console.log("🎉 Default assets seeded successfully");
  } catch (err) {
    console.error("❌ Asset seeding failed:", err);
  }
};

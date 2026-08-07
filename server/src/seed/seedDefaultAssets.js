// seeders/seedDefaultAssets.js
import { db } from "../config/db.js";

export const seedDefaultAssets = async () => {
  try {
    const defaults = [
      {
        type: "logo",
        position: 0,
        image: "default-logo.png",
      },
      {
        type: "banner",
        position: 1,
        image: "default-banner-1.png",
      },
      {
        type: "banner",
        position: 2,
        image: "default-banner-2.png",
      },
      {
        type: "hero",
        position: 1,
        image: "default-hero-1.jpeg",
      },
      {
        type: "hero",
        position: 2,
        image: "default-hero-2.png",
      },
      {
        type: "hero",
        position: 3,
        image: "default-hero-3.png",
      },
      {
        type: "imagesCarousel",
        position: 1,
        image: "default-images-carousel-1.webp",
      },
      {
        type: "imagesCarousel",
        position: 2,
        image: "default-images-carousel-2.webp",
      },
      {
        type: "imagesCarousel",
        position: 3,
        image: "default-images-carousel-3.webp",
      },
      {
        type: "imagesCarousel",
        position: 4,
        image: "default-images-carousel-4.webp",
      },
      {
        type: "imagesCarousel",
        position: 5,
        image: "default-images-carousel-5.webp",
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

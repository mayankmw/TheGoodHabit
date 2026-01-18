import { db } from "../config/db.js";

const UPLOADS_APP_URL = process.env.UPLOADS_APP_URL || "";
const ASSET_IMAGE_URL = process.env.ASSET_IMAGE_URL || "";

export const getAssets = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT type, image, position
      FROM assets
      ORDER BY type ASC, position ASC
      `
    );

    const assets = rows.reduce(
      (acc, a) => {
        if (!acc[a.type]) acc[a.type] = [];
        acc[a.type].push({
          image: a.image
            ? `${UPLOADS_APP_URL}${ASSET_IMAGE_URL}${a.image}`
            : null,
          position: a.position,
        });
        return acc;
      },
      { logo: [], banner: [], hero: [] }
    );

    res.json({
      success: true,
      assets,
    });
  } catch (err) {
    console.error("Public Assets Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

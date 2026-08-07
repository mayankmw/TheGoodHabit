import { db } from "../config/db.js";

const UPLOADS_APP_URL = process.env.UPLOADS_APP_URL || "";
const ASSET_IMAGE_URL = process.env.ASSET_IMAGE_URL || "";
const STORY_IMAGE_URL = process.env.STORY_IMAGE_URL || "";
const REEL_SHORT_URL = process.env.REEL_SHORT_URL || "";
const REEL_MAIN_URL = process.env.REEL_MAIN_URL || "";

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
      { logo: [], banner: [], hero: [], imagesCarousel: [] }
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

export const getSliders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, text, position
      FROM sliders
      WHERE active = 1
      ORDER BY position, sort_order ASC
    `);

    const sliders = rows.reduce(
      (acc, row) => {
        if (!acc[row.position]) acc[row.position] = [];
        acc[row.position].push(row.text);
        return acc;
      },
      { top: [], bottom: [] }
    );

    res.json({
      success: true,
      sliders,
    });
  } catch (err) {
    console.error("Public sliders error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getStory = async (req, res) => {
  try {
    const [[story]] = await db.query(
      `SELECT image FROM story_assets LIMIT 1`
    );

    if (!story) {
      return res.json({
        success: true,
        story: null,
      });
    }

    res.json({
      success: true,
      story: {
        image: story.image
          ? `${UPLOADS_APP_URL}${STORY_IMAGE_URL}${story.image}`
          : null,
      },
    });
  } catch (err) {
    console.error("Public Story Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getSocials = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT platform, url FROM social_links WHERE active = 1`
    );

    const socials = rows.reduce((acc, s) => {
      acc[s.platform] = s.url;
      return acc;
    }, {});

    res.json({
      success: true,
      socials,
    });
  } catch (err) {
    console.error("Public socials error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getReels = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        r.id,
        r.short_video,
        r.main_video,
        r.product_id,
        r.views,
        r.sort_order,

        p.name,
        p.originalPrice,
        p.discountedPrice
      FROM reels r
      JOIN products p ON p.id = r.product_id
      WHERE r.active = 1
      ORDER BY r.sort_order ASC
    `);

    const reels = rows.map((r) => {
      const discountPercentage =
        r.originalPrice > 0
          ? Math.round(
              ((r.originalPrice - r.discountedPrice) / r.originalPrice) * 100
            )
          : null;

      return {
        id: r.id,

        video: r.short_video
          ? `${UPLOADS_APP_URL}${REEL_SHORT_URL}/${r.short_video}`
          : null,

        activeVideo: r.main_video
          ? `${UPLOADS_APP_URL}${REEL_MAIN_URL}/${r.main_video}`
          : null,

        views: r.views || "0",

        product: {
          id: r.product_id,
          name: r.name,
          price: r.discountedPrice,
          originalPrice: r.originalPrice,
          discount: discountPercentage
            ? `${discountPercentage}% Off`
            : null,
        },
      };
    });

    res.json({
      success: true,
      reels,
    });
  } catch (err) {
    console.error("Public Reels Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
import { db } from "../config/db.js";
import { listPublicReels } from "../utils/reels.js";
import { InstagramError } from "../utils/instagram.js";

const UPLOADS_APP_URL = process.env.UPLOADS_APP_URL || "";
const ASSET_IMAGE_URL = process.env.ASSET_IMAGE_URL || "";
const STORY_IMAGE_URL = process.env.STORY_IMAGE_URL || "";

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
    res.json({ success: true, reels: await listPublicReels() });
  } catch (err) {
    // no connected account, or Instagram down: the home page just skips the
    // section, and the admin panel is where the reason shows
    if (err instanceof InstagramError) {
      console.error("Public Reels Error:", err.message);
      return res.json({ success: true, reels: [] });
    }

    console.error("Public Reels Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
import { db } from "../config/db.js";
import { getMedia, getMediaByIds, InstagramError } from "./instagram.js";

const UPLOADS_APP_URL = process.env.UPLOADS_APP_URL || "";
const PRODUCT_IMAGE_URL = process.env.PRODUCT_IMAGE_URL || "";

const primaryImageUrl = (images) => {
  let list = images;
  if (typeof images === "string") {
    try {
      list = JSON.parse(images);
    } catch {
      list = [];
    }
  }

  const first = Array.isArray(list) ? list.find((item) => typeof item === "string" && item.trim()) : null;
  return first ? `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}${first.trim()}` : null;
};

const productExists = async (productId) => {
  const [[row]] = await db.query("SELECT id FROM products WHERE id = ? LIMIT 1", [productId]);
  return Boolean(row);
};

/**
 * Active reels for the home page, each with its playable video, cover and
 * product. A reel that is gone from Instagram is left out rather than shown
 * broken; if Instagram can't be reached at all the section is simply empty.
 */
export const listPublicReels = async () => {
  const [rows] = await db.query(
    `SELECT r.id, r.instagramMediaId, r.permalink,
            p.id AS productId, p.slug, p.name, p.images, p.originalPrice, p.discountedPrice, p.stock
     FROM reels r
     JOIN products p ON p.id = r.productId
     WHERE r.active = 1
     ORDER BY r.sortOrder, r.id`
  );

  if (!rows.length) return [];

  const media = await getMediaByIds(rows.map((r) => r.instagramMediaId));

  return rows
    .filter((r) => media.get(r.instagramMediaId))
    .map((r) => {
      const m = media.get(r.instagramMediaId);
      const originalPrice = Number(r.originalPrice) || 0;
      const discounted = Number(r.discountedPrice) || 0;

      return {
        id: r.id,
        permalink: m.permalink || r.permalink,
        // Instagram withholds the video for reels with licensed music, and its
        // own embed refuses to play them too, so the home page links those
        // out to Instagram
        videoUrl: m.media_url || null,
        thumbnailUrl: m.thumbnail_url || null,
        product: {
          id: Number(r.productId),
          slug: r.slug || null,
          name: r.name,
          price: discounted > 0 ? discounted : originalPrice,
          originalPrice,
          image: primaryImageUrl(r.images),
          // NULL stock is untracked, which never sells out
          inStock: r.stock === null || Number(r.stock) > 0,
        },
      };
    });
};

/**
 * Every reel for the admin table. Instagram is asked for fresh covers; if it
 * can't be reached the table still renders from what is stored, and
 * `available` is null rather than a false alarm.
 */
export const listAdminReels = async () => {
  const [rows] = await db.query(
    `SELECT r.id, r.instagramMediaId, r.permalink, r.caption, r.productId, r.active, r.sortOrder,
            p.name AS productName
     FROM reels r
     LEFT JOIN products p ON p.id = r.productId
     ORDER BY r.sortOrder, r.id`
  );

  let media = null;
  if (rows.length) {
    try {
      media = await getMediaByIds(rows.map((r) => r.instagramMediaId));
    } catch (err) {
      if (!(err instanceof InstagramError)) throw err;
    }
  }

  return rows.map((r) => {
    const m = media?.get(r.instagramMediaId);

    return {
      id: r.id,
      instagramMediaId: r.instagramMediaId,
      permalink: r.permalink,
      caption: r.caption,
      productId: Number(r.productId),
      productName: r.productName ?? null,
      active: Boolean(r.active),
      sortOrder: r.sortOrder,
      thumbnailUrl: m?.thumbnail_url || null,
      available: media ? Boolean(m) : null,
      // false for licensed music, which Instagram won't let play elsewhere
      playable: m ? Boolean(m.media_url) : null,
    };
  });
};

export const addReel = async ({ instagramMediaId, productId, adminId }) => {
  const mediaId = String(instagramMediaId || "").trim();
  const product = Number(productId);

  if (!mediaId || !Number.isInteger(product) || product <= 0)
    return { error: { code: 400, message: "Pick a reel and a product" } };

  if (!(await productExists(product)))
    return { error: { code: 404, message: "That product no longer exists" } };

  // asked fresh, so a reel deleted since the picker loaded is caught here
  const media = await getMedia(mediaId);

  if (!media)
    return { error: { code: 404, message: "That reel isn't on the connected Instagram account" } };

  if (media.media_type !== "VIDEO")
    return { error: { code: 400, message: "Only videos can be added as reels" } };

  const [[{ lastOrder }]] = await db.query(
    "SELECT COALESCE(MAX(sortOrder), 0) AS lastOrder FROM reels"
  );

  try {
    const [result] = await db.query(
      `INSERT INTO reels (instagramMediaId, permalink, caption, productId, sortOrder, createdBy)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [mediaId, media.permalink, media.caption || null, product, lastOrder + 1, adminId || null]
    );
    return { id: result.insertId };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return { error: { code: 409, message: "This reel is already added" } };
    throw err;
  }
};

export const changeReelProduct = async ({ id, productId }) => {
  const product = Number(productId);

  if (!Number.isInteger(product) || product <= 0)
    return { error: { code: 400, message: "Pick a product" } };

  if (!(await productExists(product)))
    return { error: { code: 404, message: "That product no longer exists" } };

  const [result] = await db.query("UPDATE reels SET productId = ? WHERE id = ?", [product, id]);
  if (!result.affectedRows) return { error: { code: 404, message: "Reel not found" } };

  return {};
};

export const setReelActive = async ({ id, active }) => {
  const [result] = await db.query("UPDATE reels SET active = ? WHERE id = ?", [active ? 1 : 0, id]);
  if (!result.affectedRows) return { error: { code: 404, message: "Reel not found" } };

  return {};
};

export const removeReel = async (id) => {
  const [result] = await db.query("DELETE FROM reels WHERE id = ?", [id]);
  if (!result.affectedRows) return { error: { code: 404, message: "Reel not found" } };

  return {};
};

/** `ids` in their new order; positions are rewritten from 1. */
export const reorderReels = async (ids) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    for (const [index, id] of ids.entries()) {
      await connection.query("UPDATE reels SET sortOrder = ? WHERE id = ?", [index + 1, id]);
    }

    await connection.commit();
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

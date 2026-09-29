import { db } from "../config/db.js";

/**
 * Product URLs: /products/<slug>. The numeric id stays the key everything
 * joins on; the slug only names the page, and a product keeps it through
 * renames so shared links never break.
 */

// long enough for any real product name, short enough to read in a link
const MAX_LENGTH = 80;

/**
 * "Nutty Peanut Medjool  Dates (Pack of 4)" → "nutty-peanut-medjool-dates-pack-of-4".
 * Accents are folded ("Crème" → "creme") and anything else that isn't a
 * letter or digit becomes a single hyphen.
 */
export const slugify = (value) => {
  const slug = String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, "");

  // an all-digit slug would be read as an old /products/<id> link
  return /^\d+$/.test(slug) ? `product-${slug}` : slug;
};

/**
 * Whether another product already answers to `slug`, as its current URL or
 * as one it used to have. Taking an old one would hijack that product's
 * shared links.
 */
const slugTaken = async (slug, productId = 0) => {
  const [rows] = await db.query(
    `SELECT 1 FROM products WHERE slug = ? AND id <> ?
     UNION ALL
     SELECT 1 FROM product_slug_redirects WHERE slug = ? AND productId <> ?
     LIMIT 1`,
    [slug, productId, slug, productId]
  );
  return rows.length > 0;
};

/** `base`, or the first free of `base-2`, `base-3`, … */
const freeSlug = async (base, productId = 0) => {
  const root = base || "product";

  for (let n = 1; ; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    if (!(await slugTaken(candidate, productId))) return candidate;
  }
};

/**
 * The slug for a new product: from its name, made unique, or exactly the one
 * the admin typed, which must be free.
 */
export const slugForNewProduct = async ({ name, requested }) => {
  if (requested !== undefined && String(requested).trim() !== "") {
    const slug = slugify(requested);
    if (!slug) return { error: { code: 400, message: "The URL needs at least one letter or number" } };
    if (await slugTaken(slug))
      return { error: { code: 409, message: `The URL "${slug}" is already used by another product` } };
    return { slug };
  }

  return { slug: await freeSlug(slugify(name)) };
};

/**
 * Validates a slug typed in the edit form. Returns the normalised slug, or
 * null when it matches the current one (nothing to change).
 */
export const slugForUpdate = async ({ productId, current, requested }) => {
  const slug = slugify(requested);

  if (!slug) return { error: { code: 400, message: "The URL needs at least one letter or number" } };
  if (slug === current) return { slug: null };
  if (await slugTaken(slug, productId))
    return { error: { code: 409, message: `The URL "${slug}" is already used by another product` } };

  return { slug };
};

/** Keeps the old slug answering, so links shared before the change still work. */
export const recordSlugChange = async (productId, oldSlug, newSlug) => {
  // current now, so it can't also be a redirect (it may be one of this
  // product's own old slugs coming back)
  await db.query("DELETE FROM product_slug_redirects WHERE slug = ?", [newSlug]);

  if (oldSlug && oldSlug !== newSlug) {
    await db.query(
      `INSERT INTO product_slug_redirects (slug, productId) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE productId = VALUES(productId)`,
      [oldSlug, productId]
    );
  }
};

/** A product by its current slug, or by one it used to have. */
export const findProductBySlug = async (slug) => {
  const [[product]] = await db.query("SELECT * FROM products WHERE slug = ? LIMIT 1", [slug]);
  if (product) return product;

  const [[moved]] = await db.query(
    `SELECT p.* FROM product_slug_redirects r
     JOIN products p ON p.id = r.productId
     WHERE r.slug = ? LIMIT 1`,
    [slug]
  );
  return moved || null;
};

/**
 * Gives every product without a slug one: rows from before slugs existed,
 * or inserted straight into the database (seed.sql). Runs at boot.
 */
export const ensureProductSlugs = async () => {
  try {
    const [rows] = await db.query(
      "SELECT id, name FROM products WHERE slug IS NULL OR slug = '' ORDER BY id"
    );

    for (const row of rows) {
      const slug = await freeSlug(slugify(row.name), row.id);
      await db.query("UPDATE products SET slug = ? WHERE id = ?", [slug, row.id]);
    }

    if (rows.length) console.log(`🔗 gave ${rows.length} product(s) a URL slug`);
  } catch (err) {
    console.error("Product slug backfill failed:", err.message);
  }
};

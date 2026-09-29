/**
 * Product pages live at /products/<slug>. The id is the fallback for a
 * product the server hasn't given a slug yet; the product page redirects
 * such links to the slug once it loads.
 */
export const productPath = (product: { id: string | number; slug?: string | null }) =>
  `/products/${product.slug || product.id}`;

// what an old /products/<id> link looks like; slugs are never all digits
export const isProductId = (key: string) => /^\d+$/.test(key);

/**
 * Preview of the URL the server will give a product. The server's slugify
 * (server/src/utils/productSlugs.js) is the one that counts; keep the two in step.
 */
export const slugify = (value: string) => {
  const slug = value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");

  return isProductId(slug) ? `product-${slug}` : slug;
};

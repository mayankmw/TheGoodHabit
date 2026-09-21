/**
 * DEV DEMO DATA — synthetic customers, delivered orders and reviews for the
 * two Medjool date products, so the review UI has something to render.
 *
 * Deliberately NOT imported by src/index.js: it must never run on boot, and
 * never against production. These are invented reviews, not customer feedback.
 *
 *   node src/seed/seedSampleReviews.js           seed (idempotent)
 *   node src/seed/seedSampleReviews.js --clean   remove every seeded row
 *
 * Everything is tagged by the @example.com email domain (RFC 2606 reserved,
 * so it can never collide with a real address). Deleting those users cascades
 * to orders -> payments/product_reviews; order_items has no FK in the live
 * schema, so it is cleared explicitly.
 */

import crypto from "crypto";
import bcrypt from "bcrypt";
import { db } from "../config/db.js";

const SEED_EMAIL_DOMAIN = "@example.com";

const NUTTY = 17;
const CHOCO = 18;

// name, city, state, postalCode
const CUSTOMERS = [
  ["Priya Nair", "Pune", "Maharashtra", "411045"],
  ["Rohit Malhotra", "New Delhi", "Delhi", "110024"],
  ["Ananya Iyer", "Chennai", "Tamil Nadu", "600028"],
  ["Karthik Reddy", "Hyderabad", "Telangana", "500081"],
  ["Sneha Deshpande", "Nagpur", "Maharashtra", "440010"],
  ["Imran Qureshi", "Lucknow", "Uttar Pradesh", "226010"],
  ["Lakshmi Narayanan", "Kochi", "Kerala", "682020"],
  ["Aditya Kulkarni", "Bengaluru", "Karnataka", "560076"],
  ["Fatima Sheikh", "Ahmedabad", "Gujarat", "380015"],
  ["Vikram Shetty", "Mumbai", "Maharashtra", "400058"],
  ["Divya Menon", "Jaipur", "Rajasthan", "302018"],
  ["Harsh Patel", "Indore", "Madhya Pradesh", "452010"],
  ["Nikhil Bose", "Kolkata", "West Bengal", "700029"],
];

// customer name, productId, quantity, rating, comment, ordered on, review written on
const SEED_ORDERS = [
  ["Priya Nair", NUTTY, 1, 5,
    "Ordered these after seeing them on Instagram and honestly they exceeded expectations. The dates are soft and the peanut filling isn't overly sweet, which was my main worry. Pack of 4 finished in two days at home.",
    "2026-04-22", "2026-05-02"],

  ["Rohit Malhotra", NUTTY, 2, 5, "", "2026-05-09", "2026-05-19"],

  ["Ananya Iyer", NUTTY, 1, 4,
    "Really good quality Medjool, you can tell it's not the dry cheap variety. Only thing is I wish the peanut filling was a little more generous. Still ordering again.",
    "2026-05-27", "2026-06-04"],

  ["Karthik Reddy", NUTTY, 2, 5,
    "Been having one post workout instead of a protein bar. Keeps me full and no crash afterwards. Packaging was sealed properly and it reached Hyderabad in 3 days.",
    "2026-06-11", "2026-06-17"],

  ["Sneha Deshpande", NUTTY, 1, 4,
    "Tastes great and my kids happily take them in their snack box. Slightly pricey for the quantity but the quality justifies it I think.",
    "2026-06-30", "2026-07-09"],

  ["Imran Qureshi", NUTTY, 1, 3,
    "Product is fine and the dates are fresh. But one date in my pack had a hard bit near the stem. Support replied the same day so no complaints on that front.",
    "2026-07-14", "2026-07-21"],

  ["Lakshmi Narayanan", NUTTY, 1, 5,
    "Bought a pack to try before gifting and I'm glad I did. Clean ingredients, no weird aftertaste like some stuffed dates have.",
    "2026-07-19", "2026-07-28"],

  ["Aditya Kulkarni", CHOCO, 1, 5,
    "The chocolate coating is proper dark, not the sugary compound stuff. Works really well with the peanut inside. This is my evening craving fix now.",
    "2026-05-16", "2026-05-24"],

  ["Fatima Sheikh", CHOCO, 2, 4,
    "Delicious, but mine arrived a little melted since I ordered in peak summer. An hour in the fridge sorted it out. Maybe worth adding an ice pack for May June orders.",
    "2026-06-02", "2026-06-12"],

  ["Vikram Shetty", CHOCO, 1, 5, "", "2026-06-21", "2026-06-27"],

  ["Divya Menon", CHOCO, 1, 5,
    "Genuinely tastes like a dessert but without the guilt afterwards. I've replaced my after dinner sweet with one of these. Would love a bigger pack option.",
    "2026-07-08", "2026-07-15"],

  ["Harsh Patel", CHOCO, 1, 3,
    "Taste is good, no issues there. But for the price I expected a few more pieces in the box. Delivery was quick at least.",
    "2026-08-03", "2026-08-11"],

  ["Nikhil Bose", CHOCO, 2, 4,
    "Good stuff. Chocolate is not too sweet which I appreciate, and the date underneath is properly soft.",
    "2026-08-20", "2026-08-29"],

  ["Lakshmi Narayanan", CHOCO, 1, 5,
    "Second time ordering and the quality was consistent both times, which is rarer than it should be. Sent a box to my daughter in Bangalore and she loved it too.",
    "2026-08-26", "2026-09-05"],
];

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toSqlDateTime = (date) =>
  new Date(date).toISOString().slice(0, 19).replace("T", " ");

const slugEmail = (name) =>
  `${name.toLowerCase().replace(/[^a-z]+/g, ".")}${SEED_EMAIL_DOMAIN}`;

// products.rating / products.reviews are denormalised for the storefront, so
// they get recomputed from whatever product_reviews now holds.
const syncProductRatings = async (productIds) => {
  const placeholders = productIds.map(() => "?").join(", ");
  await db.query(
    `UPDATE products p
     SET p.rating = COALESCE(
           (SELECT ROUND(AVG(r.rating), 1) FROM product_reviews r WHERE r.productId = p.id),
           0
         ),
         p.reviews = (SELECT COUNT(*) FROM product_reviews r WHERE r.productId = p.id)
     WHERE p.id IN (${placeholders})`,
    productIds
  );
};

const clean = async () => {
  const [seededUsers] = await db.query(
    "SELECT id FROM users WHERE email LIKE ?",
    [`%${SEED_EMAIL_DOMAIN}`]
  );

  if (!seededUsers.length) {
    console.log("Nothing to clean — no seeded users found.");
    return;
  }

  const userIds = seededUsers.map((user) => user.id);
  const userPlaceholders = userIds.map(() => "?").join(", ");

  const [seededOrders] = await db.query(
    `SELECT id FROM orders WHERE userId IN (${userPlaceholders})`,
    userIds
  );

  // order_items carries no FK in the live schema, so it won't cascade
  if (seededOrders.length) {
    const orderIds = seededOrders.map((order) => order.id);
    const orderPlaceholders = orderIds.map(() => "?").join(", ");
    const [items] = await db.query(
      `DELETE FROM order_items WHERE orderId IN (${orderPlaceholders})`,
      orderIds
    );
    console.log(`order_items removed: ${items.affectedRows}`);
  }

  const [users] = await db.query(
    `DELETE FROM users WHERE id IN (${userPlaceholders})`,
    userIds
  );
  console.log(`users removed: ${users.affectedRows} (orders, payments and reviews cascaded)`);

  await syncProductRatings([NUTTY, CHOCO]);
  console.log("product ratings recomputed");
};

const seed = async () => {
  const [prices] = await db.query(
    "SELECT id, discountedPrice FROM products WHERE id IN (?, ?)",
    [NUTTY, CHOCO]
  );
  const priceById = new Map(prices.map((p) => [Number(p.id), Number(p.discountedPrice)]));

  if (!priceById.has(NUTTY) || !priceById.has(CHOCO))
    throw new Error("Products 17 and 18 must exist before seeding reviews");

  // one unusable password for every seeded account — nobody can sign in as them
  const password = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

  const userIdByName = new Map();

  for (const [name, city, state, postalCode] of CUSTOMERS) {
    const email = slugEmail(name);

    const [[existing]] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing) {
      userIdByName.set(name, { id: existing.id, city, state, postalCode });
      continue;
    }

    const [inserted] = await db.query(
      "INSERT INTO users (role, email, password, name) VALUES ('customer', ?, ?, ?)",
      [email, password, name]
    );
    userIdByName.set(name, { id: inserted.insertId, city, state, postalCode });
  }

  console.log(`customers ready: ${userIdByName.size}`);

  let ordersCreated = 0;

  const [[{ total: countBefore }]] = await db.query(
    "SELECT COUNT(*) AS total FROM product_reviews"
  );

  for (const [name, productId, quantity, rating, comment, orderedOn, reviewedOn] of SEED_ORDERS) {
    const customer = userIdByName.get(name);
    const unitPrice = priceById.get(productId);
    const total = unitPrice * quantity;

    const placedAt = new Date(`${orderedOn}T10:30:00`);
    const shippedAt = addDays(placedAt, 1);
    const deliveredAt = addDays(placedAt, 4);

    // an order per (customer, product) pairing — re-running reuses it
    const [[existingOrder]] = await db.query(
      `SELECT o.id FROM orders o
       JOIN order_items oi ON oi.orderId = o.id
       WHERE o.userId = ? AND oi.productId = ? LIMIT 1`,
      [customer.id, String(productId)]
    );

    let orderId = existingOrder?.id;

    if (!orderId) {
      const [order] = await db.query(
        `INSERT INTO orders (
           userId, addressId,
           shippingAddressLine1, shippingAddressLine2, shippingPhone,
           shippingCity, shippingState, shippingPostalCode, shippingCountry,
           totalPrice, discountedPrice, status,
           shippingPartner, trackingNumber,
           shippedAt, deliveredAt, createdAt, updatedAt
         ) VALUES (?, NULL, ?, NULL, NULL, ?, ?, ?, 'India', ?, ?, 'delivered', ?, ?, ?, ?, ?, ?)`,
        [
          customer.id,
          `${12 + (customer.id % 80)}, Green Meadows Society`,
          customer.city,
          customer.state,
          customer.postalCode,
          total,
          total,
          "Delhivery",
          `SEED${String(customer.id).padStart(4, "0")}${productId}`,
          toSqlDateTime(shippedAt),
          toSqlDateTime(deliveredAt),
          toSqlDateTime(placedAt),
          toSqlDateTime(deliveredAt),
        ]
      );

      orderId = order.insertId;
      ordersCreated += 1;

      await db.query("UPDATE orders SET orderCode = ? WHERE id = ?", [
        `NB${String(orderId).padStart(6, "0")}`,
        orderId,
      ]);

      await db.query(
        `INSERT INTO order_items (orderId, productId, quantity, price, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, String(productId), quantity, unitPrice, toSqlDateTime(placedAt)]
      );

      // synthetic payment refs, formatted like Razorpay's but clearly seeded
      await db.query(
        `INSERT INTO payments (
           orderId, razorpayOrderId, razorpayPaymentId, amount, currency,
           status, method, email, createdAt, updatedAt
         ) VALUES (?, ?, ?, ?, 'INR', 'paid', ?, ?, ?, ?)`,
        [
          orderId,
          `order_SEED${String(orderId).padStart(10, "0")}`,
          `pay_SEED${String(orderId).padStart(10, "0")}`,
          total * 100,
          ["upi", "card", "netbanking"][orderId % 3],
          slugEmail(name),
          toSqlDateTime(placedAt),
          toSqlDateTime(deliveredAt),
        ]
      );
    }

    const writtenAt = toSqlDateTime(new Date(`${reviewedOn}T19:15:00`));

    // affectedRows can't distinguish insert from no-op upsert here, so the
    // real count comes from the row total either side of the loop
    await db.query(
      `INSERT INTO product_reviews (orderId, productId, userId, rating, comment, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
      [orderId, productId, customer.id, rating, comment.trim() || null, writtenAt, writtenAt]
    );
  }

  const [[{ total: countAfter }]] = await db.query(
    "SELECT COUNT(*) AS total FROM product_reviews"
  );

  console.log(`orders created: ${ordersCreated}`);
  console.log(`reviews added: ${countAfter - countBefore} (${SEED_ORDERS.length} kept in sync)`);

  await syncProductRatings([NUTTY, CHOCO]);

  const [summary] = await db.query(
    "SELECT id, name, rating, reviews FROM products WHERE id IN (?, ?)",
    [NUTTY, CHOCO]
  );
  console.table(summary);
};

const run = async () => {
  try {
    if (process.argv.includes("--clean")) await clean();
    else await seed();
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
};

run();

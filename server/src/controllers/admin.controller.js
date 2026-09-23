import { db } from "../config/db.js";
import sendEmail from "../utils/sendEmail.js";
import { syncProductRatings } from "./review.controller.js";
import {
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
} from "../utils/orderEmails.js";
import { cancelOrder as cancelOrderInternal } from "../utils/orderCancellation.js";
import { runAbandonedCheckoutSweep } from "../utils/abandonedCheckouts.js";
import {
  refreshEmailLogo,
  renderEmail,
  renderNewsletterEmail,
  unsubscribeLink,
  unsubscribeHeaders,
  heading,
  paragraph,
  button,
  escapeHtml,
  EMAIL_THEME,
} from "../utils/emailTemplates.js";

const PRODUCT_IMAGE_URL = process.env.PRODUCT_IMAGE_URL || "";
const UPLOADS_APP_URL = process.env.UPLOADS_APP_URL || "";
const ASSET_IMAGE_URL = process.env.ASSET_IMAGE_URL || "";
const STORY_IMAGE_URL = process.env.STORY_IMAGE_URL || "";
const REEL_SHORT_URL = process.env.REEL_SHORT_URL || "";
const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 5;
const REEL_MAIN_URL = process.env.REEL_MAIN_URL || "";

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseJsonObject = (value) => {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const toCleanStringArray = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

/**
 * Stock arrives from multer as a string, where "" and "0" are both falsy but
 * mean opposite things: "" is "not tracked, sell without limit" and "0" is
 * "genuinely sold out". Number("") is 0 and passes a finite check, so the
 * empty string has to be tested before any numeric parsing.
 *
 * Returns { value } where undefined means "field absent, leave the column
 * alone", or { error } carrying a message the admin should see.
 */
const parseJsonArrayValue = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseStockInput = (value) => {
  if (value === undefined) return { value: undefined };
  if (value === null || String(value).trim() === "") return { value: null };

  const parsed = Number(value);

  // Number.isInteger, not isFinite: MariaDB silently rounds 3.5 into an INT
  // column rather than erroring, so a decimal would be quietly changed
  if (!Number.isInteger(parsed) || parsed < 0)
    return {
      error: "Stock must be a whole number of 0 or more, or left blank to stop tracking it",
    };

  return { value: parsed };
};

const parseIngredientsInput = (value) => {
  if (value === undefined) return null;
  if (Array.isArray(value)) return toCleanStringArray(value);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    const parsed = parseJsonArray(trimmed);
    if (parsed.length) return toCleanStringArray(parsed);
    return toCleanStringArray(trimmed.split(","));
  }

  return [];
};

const toPublicProductImage = (fileName) =>
  fileName ? `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}${fileName}` : null;

const toStoredProductImage = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const fullPrefix = `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}`;
  if (trimmed.startsWith(fullPrefix)) {
    return trimmed.slice(fullPrefix.length);
  }

  if (trimmed.startsWith(PRODUCT_IMAGE_URL)) {
    return trimmed.slice(PRODUCT_IMAGE_URL.length);
  }

  const normalized = trimmed.split("?")[0].split("#")[0];
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || null;
};

const normalizeStoredProductImages = (rawImages) => {
  const images = toCleanStringArray(parseJsonArray(rawImages));
  return [...new Set(images)];
};

const collectUploadedProductImages = (req) => {
  const filesObj = req.files && !Array.isArray(req.files) ? req.files : {};
  const fromImages = Array.isArray(filesObj.images) ? filesObj.images : [];
  const fromLegacyImage = Array.isArray(filesObj.image) ? filesObj.image : [];
  const fromSingle = req.file ? [req.file] : [];

  return [...fromImages, ...fromLegacyImage, ...fromSingle]
    .map((file) => file?.filename)
    .filter(Boolean);
};

const formatProductRecord = (product) => {
  const imageFiles = normalizeStoredProductImages(product.images);
  const imageUrls = imageFiles
    .map((fileName) => toPublicProductImage(fileName))
    .filter(Boolean);
  const { image: _legacyImage, ...rest } = product;

  return {
    ...rest,
    ingredients: parseJsonArray(product.ingredients),
    images: imageUrls,
  };
};

const pad2 = (value) => String(value).padStart(2, "0");
const toSqlDate = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const resolveDashboardRange = (payload = {}) => {
  const range = payload?.range || "last7";
  const today = new Date();
  const end = new Date(today);
  let start = new Date(today);

  if (range === "last7") {
    start.setDate(end.getDate() - 6);
  } else if (range === "last30") {
    start.setDate(end.getDate() - 29);
  } else if (range === "lastYear") {
    start.setDate(end.getDate() - 364);
  } else if (range === "custom") {
    const { startDate, endDate } = payload;
    const validDateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!startDate || !endDate) {
      return { error: "Custom range requires startDate and endDate" };
    }

    if (!validDateRegex.test(startDate) || !validDateRegex.test(endDate)) {
      return { error: "Dates must be in YYYY-MM-DD format" };
    }

    if (startDate > endDate) {
      return { error: "startDate cannot be after endDate" };
    }

    return {
      range,
      startDate,
      endDate,
    };
  } else {
    return { error: "Invalid range" };
  }

  return {
    range,
    startDate: toSqlDate(start),
    endDate: toSqlDate(end),
  };
};

export const getStats = async (req, res) => {
  try {
    const parsedRange = resolveDashboardRange(req.body || {});
    if (parsedRange.error) {
      return res.status(400).json({
        success: false,
        message: parsedRange.error,
      });
    }

    const { range, startDate, endDate } = parsedRange;

    const [[ordersCount]] = await db.query(
      `
      SELECT 
        COUNT(*) AS total,
        COALESCE(SUM(status='processing'),0) AS processing,
        COALESCE(SUM(status='shipped'),0) AS shipped,
        COALESCE(SUM(status='delivered'),0) AS delivered,
        COALESCE(SUM(status='cancelled'),0) AS cancelled
      FROM orders
      WHERE status != 'pending'
      AND DATE(createdAt) BETWEEN ? AND ?
    `,
      [startDate, endDate]
    );

    const [[revenue]] = await db.query(
      `
      SELECT 
        COALESCE(SUM(amount)/100,0) AS totalRevenue,
        COUNT(*) AS paidOrders
      FROM payments
      WHERE status='paid'
      AND DATE(createdAt) BETWEEN ? AND ?
    `,
      [startDate, endDate]
    );

    const [[users]] = await db.query(
      `
      SELECT 
        COUNT(*) AS totalUsers
      FROM users
      WHERE DATE(createdAt) BETWEEN ? AND ?
    `,
      [startDate, endDate]
    );

    const [[products]] = await db.query(
      `
      SELECT COUNT(*) AS totalProducts
      FROM products
      WHERE DATE(createdAt) BETWEEN ? AND ?
    `,
      [startDate, endDate]
    );

    const [[abandoned]] = await db.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(discountedPrice), 0) AS value,
              SUM(recoveryEmailSentAt IS NOT NULL) AS nudged
       FROM orders
       WHERE status = 'abandoned'`
    );

    // Point-in-time, unlike every other query in getStats: stock is a current
    // level, not something that happened inside the selected date range.
    // `stock IS NOT NULL` is what keeps untracked products out — COALESCE(stock,0)
    // would match the entire catalogue.
    const [[stockCounts]] = await db.query(
      `SELECT
         SUM(stock IS NOT NULL AND stock > 0 AND stock <= ?) AS lowStock,
         SUM(stock IS NOT NULL AND stock = 0) AS outOfStock,
         SUM(stock IS NOT NULL) AS tracked
       FROM products`,
      [LOW_STOCK_THRESHOLD]
    );

    const [[oversoldOrders]] = await db.query(
      "SELECT COUNT(*) AS n FROM orders WHERE oversoldItems IS NOT NULL"
    );

    const [atRisk] = await db.query(
      `SELECT id, name, stock
       FROM products
       WHERE stock IS NOT NULL AND stock <= ?
       ORDER BY stock ASC, name ASC
       LIMIT 8`,
      [LOW_STOCK_THRESHOLD]
    );

    return res.json({
      success: true,
      range: {
        range,
        startDate,
        endDate,
      },
      stats: {
        orders: {
          ...ordersCount,
          todayOrders: Number(ordersCount.total || 0),
        },
        revenue: {
          totalRevenue: Number(revenue.totalRevenue || 0),
          averageOrderValue:
            revenue.paidOrders > 0
              ? Number((revenue.totalRevenue / revenue.paidOrders).toFixed(2))
              : 0,
          todayRevenue: Number(revenue.totalRevenue || 0),
        },
        users: {
          ...users,
          newToday: Number(users.totalUsers || 0),
        },
        products,
        abandoned: {
          total: Number(abandoned.total) || 0,
          value: Number(abandoned.value) || 0,
          nudged: Number(abandoned.nudged) || 0,
        },
        stock: {
          threshold: LOW_STOCK_THRESHOLD,
          tracked: Number(stockCounts.tracked) || 0,
          lowStock: Number(stockCounts.lowStock) || 0,
          outOfStock: Number(stockCounts.outOfStock) || 0,
          oversoldOrders: Number(oversoldOrders.n) || 0,
          items: atRisk.map((row) => ({
            id: Number(row.id),
            name: row.name,
            stock: Number(row.stock),
          })),
        }
      }
    });

  } catch (err) {
    console.error("Admin Stats Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getRevenueTrend = async (req, res) => {
  try {
    const parsedRange = resolveDashboardRange(req.body || {});
    if (parsedRange.error) {
      return res.status(400).json({
        success: false,
        message: parsedRange.error,
      });
    }

    const { range, startDate, endDate } = parsedRange;

    const [revenueTrend] = await db.query(
      `
      WITH RECURSIVE dates AS (
        SELECT DATE(?) AS day
        UNION ALL
        SELECT day + INTERVAL 1 DAY FROM dates WHERE day < DATE(?)
      )
      SELECT 
        dates.day AS date,
        COALESCE(SUM(p.amount)/100, 0) AS amount
      FROM dates
      LEFT JOIN payments p
      ON DATE(p.createdAt) = dates.day AND p.status='paid'
      GROUP BY dates.day
      ORDER BY dates.day ASC
    `,
      [startDate, endDate]
    );

    res.json({
      success: true,
      range: {
        range,
        startDate,
        endDate,
      },
      revenueTrend
    });

  } catch (err) {
    console.error("Revenue Trend Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getOrdersTrend = async (req, res) => {
  try {
    const parsedRange = resolveDashboardRange(req.body || {});
    if (parsedRange.error) {
      return res.status(400).json({
        success: false,
        message: parsedRange.error,
      });
    }

    const { range, startDate, endDate } = parsedRange;

    const [ordersTrend] = await db.query(
      `
      WITH RECURSIVE dates AS (
        SELECT DATE(?) AS day
        UNION ALL
        SELECT day + INTERVAL 1 DAY FROM dates WHERE day < DATE(?)
      )
      SELECT 
        dates.day AS date,
        COALESCE(COUNT(o.id), 0) AS orders
      FROM dates
      LEFT JOIN orders o
      ON DATE(o.createdAt) = dates.day
      GROUP BY dates.day
      ORDER BY dates.day ASC
    `,
      [startDate, endDate]
    );

    res.json({
      success: true,
      range: {
        range,
        startDate,
        endDate,
      },
      ordersTrend
    });

  } catch (err) {
    console.error("Orders Trend Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    let sql = `SELECT * FROM products WHERE 1=1`;
    const params = [];

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (search) {
      sql += ` AND name LIKE ?`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY createdAt DESC`;

    const [products] = await db.query(sql, params);
    const formatted = products.map((p) => formatProductRecord(p));

    res.json({ success: true, products: formatted });

  } catch (err) {
    console.error("Get Products Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.body;

    const [[product]] = await db.query(
      `SELECT * FROM products WHERE id = ?`,
      [id]
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product: formatProductRecord(product) });

  } catch (err) {
    console.error("Get Product Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      originalPrice,
      discountedPrice,
      description,
      ingredients,
      stock
    } = req.body;

    const parsedStock = parseStockInput(stock);
    if (parsedStock.error) {
      return res.status(400).json({ success: false, message: parsedStock.error });
    }

    const parsedOriginalPrice = Number(originalPrice);
    if (!name || originalPrice === undefined || originalPrice === "" || !Number.isFinite(parsedOriginalPrice)) {
      return res.status(400).json({
        success: false,
        message: "Name and a valid originalPrice are required"
      });
    }

    const parsedDiscountedPrice = Number(discountedPrice);
    const finalDiscountedPrice = discountedPrice === undefined || discountedPrice === "" || !Number.isFinite(parsedDiscountedPrice)
      ? parsedOriginalPrice
      : parsedDiscountedPrice;

    const parsedIngredients = parseIngredientsInput(ingredients ?? []);

    const uploadedImageFiles = collectUploadedProductImages(req);
    const requestedImageFiles = toCleanStringArray(parseJsonArray(req.body.images))
      .map((image) => toStoredProductImage(image))
      .filter(Boolean);
    const requestedPrimaryImage = toStoredProductImage(req.body.image);

    const imageFiles = [...new Set([
      ...(requestedPrimaryImage ? [requestedPrimaryImage] : []),
      ...requestedImageFiles,
      ...uploadedImageFiles,
    ])];

    await db.query(
      `
      INSERT INTO products (
        name, images, category,
        originalPrice, discountedPrice, stock,
        description, ingredients
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        JSON.stringify(imageFiles),
        category || null,
        parsedOriginalPrice,
        finalDiscountedPrice,
        parsedStock.value ?? null,
        description || null,
        JSON.stringify(parsedIngredients || []),
      ]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
    });

  } catch (err) {
    console.error("Create Product Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const {
      id,
      name,
      category,
      originalPrice,
      discountedPrice,
      description,
      ingredients,
      stock
    } = req.body;

    const [[existing]] = await db.query(`SELECT images FROM products WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const uploadedImageFiles = collectUploadedProductImages(req);
    const existingImageFiles = normalizeStoredProductImages(existing.images);

    let retainedExistingFiles = existingImageFiles;
    if (req.body.existingImages !== undefined) {
      const requestedExisting = new Set(
        toCleanStringArray(parseJsonArray(req.body.existingImages))
          .map((image) => toStoredProductImage(image))
          .filter(Boolean)
      );
      retainedExistingFiles = existingImageFiles.filter((image) => requestedExisting.has(image));
    }

    const requestedImageFiles = toCleanStringArray(parseJsonArray(req.body.images))
      .map((image) => toStoredProductImage(image))
      .filter(Boolean);
    const requestedPrimaryImage = toStoredProductImage(req.body.image);

    const mergedImages = [...new Set([
      ...retainedExistingFiles,
      ...(requestedPrimaryImage ? [requestedPrimaryImage] : []),
      ...requestedImageFiles,
      ...uploadedImageFiles,
    ])];

    const shouldUpdateImages =
      req.body.existingImages !== undefined ||
      req.body.images !== undefined ||
      req.body.image !== undefined ||
      uploadedImageFiles.length > 0;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (category !== undefined) {
      updates.push("category = ?");
      values.push(category || null);
    }
    if (originalPrice !== undefined) {
      const parsedOriginalPrice = Number(originalPrice);
      if (originalPrice === "" || !Number.isFinite(parsedOriginalPrice)) {
        return res.status(400).json({
          success: false,
          message: "originalPrice must be a valid number"
        });
      }
      updates.push("originalPrice = ?");
      values.push(parsedOriginalPrice);
    }
    if (discountedPrice !== undefined) {
      const parsedDiscountedPrice = Number(discountedPrice);
      if (discountedPrice === "" || !Number.isFinite(parsedDiscountedPrice)) {
        return res.status(400).json({
          success: false,
          message: "discountedPrice must be a valid number"
        });
      }
      updates.push("discountedPrice = ?");
      values.push(parsedDiscountedPrice);
    }
    if (stock !== undefined) {
      const parsedStock = parseStockInput(stock);
      if (parsedStock.error) {
        return res.status(400).json({ success: false, message: parsedStock.error });
      }
      // null here is meaningful — it switches tracking off
      updates.push("stock = ?");
      values.push(parsedStock.value);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description || null);
    }
    if (ingredients !== undefined) {
      updates.push("ingredients = ?");
      values.push(JSON.stringify(parseIngredientsInput(ingredients) || []));
    }

    if (shouldUpdateImages) {
      updates.push("images = ?");
      values.push(JSON.stringify(mergedImages));
    }

    if (!updates.length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    values.push(id);

    await db.query(
      `
      UPDATE products SET
        ${updates.join(", ")}
      WHERE id = ?
      `,
      values
    );

    res.json({ success: true, message: "Product updated successfully" });

  } catch (err) {
    console.error("Update Product Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const fetchOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.id,
        o.orderCode,
        o.totalPrice,
        o.discountedPrice,
        o.status,
        o.createdAt,
        o.oversoldItems,
        u.name AS customerName,
        u.email
      FROM orders o
      JOIN users u ON u.id = o.userId
      ORDER BY o.createdAt DESC
    `);

    // mysql2 hands JSON back as a string on this column type
    const formatted = orders.map((order) => {
      const { oversoldItems, ...rest } = order;
      const parsed = parseJsonArrayValue(oversoldItems);
      return { ...rest, oversold: parsed.length ? parsed : null };
    });

    return res.json({ success: true, orders: formatted });
  } catch (err) {
    console.error("Fetch Orders Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const fetchOrderById = async (req, res) => {
  const { id } = req.body;

  try {
    const [[order]] = await db.query(
      `
      SELECT
        o.*,
        u.name,
        u.email,
        u.phone,
        p.method AS paymentMethod,
        p.status AS paymentStatus,
        p.details AS paymentDetails,
        p.razorpayOrderId,
        p.razorpayPaymentId,
        p.amount AS paymentAmount,
        p.currency AS paymentCurrency,
        p.email AS paymentEmail,
        p.contact AS paymentContact
      FROM orders o
      JOIN users u ON u.id = o.userId
      LEFT JOIN payments p ON p.orderId = o.id
      WHERE o.id = ?
      `,
      [id]
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.paymentDetails = parseJsonObject(order.paymentDetails);

    const [items] = await db.query(
      `
      SELECT 
        oi.quantity,
        oi.price,
        p.name,
        p.images
      FROM order_items oi
      JOIN products p ON p.id = oi.productId
      WHERE oi.orderId = ?
      `,
      [id]
    );

    const formattedItems = items.map((item) => {
      const primaryImage = normalizeStoredProductImages(item.images)[0] || null;
      const { images: _images, ...rest } = item;
      return {
        ...rest,
        image: primaryImage ? toPublicProductImage(primaryImage) : null,
      };
    });

    return res.json({
      success: true,
      order: {
        ...order,
        appliedCoupons: order.appliedCoupons
          ? JSON.parse(order.appliedCoupons)
          : [],
        items: formattedItems
      }
    });
  } catch (err) {
    console.error("Fetch Order Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// "pending" is set automatically when an order is created (pre-payment) and
// is never a manually chosen target — it's included here only so an order
// stuck in it can still be moved forward.
const ALLOWED_NEXT_ORDER_STATUSES = {
  pending: ["processing", "cancelled"],
  processing: ["processing", "shipped", "cancelled"],
  shipped: ["shipped", "delivered", "cancelled"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

// "" and undefined both mean "not provided" — treat them the same as NULL
// so COALESCE below preserves the existing value instead of blanking it out.
const nullifyEmpty = (value) => (value === undefined || value === "" ? null : value);

export const updateOrder = async (req, res) => {
  const {
    id,
    status,
    shippingPartner,
    trackingNumber,
    trackingUrl,
    shippedAt,
    deliveredAt
  } = req.body;

  try {
    const [[existing]] = await db.query(
      `SELECT status, shippingPartner, trackingNumber, trackingUrl, shippedAt, deliveredAt FROM orders WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (
      status &&
      status !== existing.status &&
      !(ALLOWED_NEXT_ORDER_STATUSES[existing.status] || []).includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Order cannot move from "${existing.status}" to "${status}" directly`
      });
    }

    const safePartner = nullifyEmpty(shippingPartner);
    const safeTrackingNumber = nullifyEmpty(trackingNumber);
    const safeTrackingUrl = nullifyEmpty(trackingUrl);

    if (status === "shipped") {
      const effectivePartner = safePartner || existing.shippingPartner;
      const effectiveTracking = safeTrackingNumber || existing.trackingNumber;

      if (!effectivePartner || !effectiveTracking) {
        return res.status(400).json({
          success: false,
          message: "Shipping partner and tracking number are required before marking an order as shipped"
        });
      }
    }

    // A same-status save is legal (it is how an admin corrects a tracking
    // number), so the email trigger compares against the PRE-update row
    // rather than testing the incoming status alone.
    const justShipped = status === "shipped" && existing.status !== "shipped";
    const justDelivered = status === "delivered" && existing.status !== "delivered";
    const justCancelled = status === "cancelled" && existing.status !== "cancelled";

    let cancellation = null;

    if (justCancelled) {
      try {
        cancellation = await cancelOrderInternal({
          orderId: id,
          by: "admin",
          reason: nullifyEmpty(req.body.cancelReason),
        });

        if (cancellation.error)
          return res.status(cancellation.error.code).json({ success: false, message: cancellation.error.message });
      } catch (err) {
        console.error("Admin cancel refund error:", err);
        return res.status(502).json({
          success: false,
          message: "Refund failed at the payment provider — the order was NOT cancelled. Try again in a moment.",
        });
      }
    }

    // stamp shipped/delivered timestamps automatically the first time an
    // order reaches that status — nothing client-side ever sends these.
    const resolvedShippedAt =
      nullifyEmpty(shippedAt) ||
      (status === "shipped" && !existing.shippedAt ? new Date() : null);
    const resolvedDeliveredAt =
      nullifyEmpty(deliveredAt) ||
      (status === "delivered" && !existing.deliveredAt ? new Date() : null);

    await db.query(
      `
      UPDATE orders SET
        status = COALESCE(?, status),
        shippingPartner = COALESCE(?, shippingPartner),
        trackingNumber = COALESCE(?, trackingNumber),
        trackingUrl = COALESCE(?, trackingUrl),
        shippedAt = COALESCE(?, shippedAt),
        deliveredAt = COALESCE(?, deliveredAt)
      WHERE id = ?
      `,
      [
        nullifyEmpty(status),
        safePartner,
        safeTrackingNumber,
        safeTrackingUrl,
        resolvedShippedAt,
        resolvedDeliveredAt,
        id
      ]
    );

    // fire and forget after the row is written; req.user here is the ADMIN,
    // so the recipient is resolved from orders.userId inside these helpers
    if (justShipped) {
      sendOrderShippedEmail(id, {
        shippingPartner: safePartner || existing.shippingPartner,
        trackingNumber: safeTrackingNumber || existing.trackingNumber,
        trackingUrl: safeTrackingUrl || existing.trackingUrl,
      });
    }

    if (justDelivered) sendOrderDeliveredEmail(id);

    // "Order updated" hides the part the admin actually needs to know about
    const message = cancellation
      ? cancellation.refund
        ? `Order cancelled and ₹${cancellation.refund.amount / 100} refunded to the customer`
        : "Order cancelled — no payment had been taken, nothing to refund"
      : "Order updated successfully";

    return res.json({ success: true, message });
  } catch (err) {
    console.error("Update Order Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllAssets = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT * FROM assets
      ORDER BY type ASC, position ASC
      `
    );

    const formatted = rows.map(a => ({
      ...a,
      image: a.image
        ? `${UPLOADS_APP_URL}${ASSET_IMAGE_URL}${a.image}`
        : null
    }));

    res.json({ success: true, assets: formatted });
  } catch (err) {
    console.error("Get Assets Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const { id, type, position } = req.body;
    const imageFile = req.file?.filename || null;

    if (!id && !(type && position)) {
      return res.status(400).json({
        success: false,
        message: "Asset ID (or type + position) is required"
      });
    }

    if (id) {
      const [[existing]] = await db.query(
        `SELECT id FROM assets WHERE id = ?`,
        [id]
      );

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Asset not found"
        });
      }

      await db.query(
        `
        UPDATE assets SET
          image = COALESCE(?, image),
          position = COALESCE(?, position)
        WHERE id = ?
        `,
        [imageFile, position, id]
      );

      // a newly uploaded logo should reach emails without a restart
      await refreshEmailLogo();

      return res.json({
        success: true,
        message: "Asset updated successfully"
      });
    }

    // No id yet — this slot (e.g. an images-carousel position) hasn't been
    // seeded/created in the DB. Upsert by (type, position) so the admin can
    // still upload an image the first time.
    const [[existing]] = await db.query(
      `SELECT id FROM assets WHERE type = ? AND position = ?`,
      [type, position]
    );

    if (existing) {
      await db.query(
        `UPDATE assets SET image = COALESCE(?, image) WHERE id = ?`,
        [imageFile, existing.id]
      );
    } else {
      await db.query(
        `INSERT INTO assets (type, image, position) VALUES (?, ?, ?)`,
        [type, imageFile, position]
      );
    }

    await refreshEmailLogo();

    res.json({
      success: true,
      message: "Asset saved successfully"
    });
  } catch (err) {
    console.error("Update Asset Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const { search, active } = req.body;

    // redemption count was previously unknowable — there was no ledger to count
    let sql = `SELECT c.*,
                 (SELECT COUNT(*) FROM coupon_redemptions r WHERE r.couponId = c.id) AS redemptions,
                 (SELECT COUNT(DISTINCT r.userId) FROM coupon_redemptions r WHERE r.couponId = c.id) AS redeemedByUsers,
                 (SELECT COALESCE(SUM(r.discountValue), 0) FROM coupon_redemptions r WHERE r.couponId = c.id) AS totalDiscountGiven
               FROM coupons c WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (c.code LIKE ? OR c.title LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (active !== undefined) {
      sql += ` AND c.active = ?`;
      params.push(active);
    }

    sql += ` ORDER BY c.createdAt DESC`;

    const [coupons] = await db.query(sql, params);

    // COUNT comes back as a number but SUM arrives as a string from mysql2
    res.json({
      success: true,
      coupons: coupons.map((c) => ({
        ...c,
        redemptions: Number(c.redemptions) || 0,
        redeemedByUsers: Number(c.redeemedByUsers) || 0,
        totalDiscountGiven: Number(c.totalDiscountGiven) || 0,
      })),
    });
  } catch (err) {
    console.error("Get Coupons Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getCouponById = async (req, res) => {
  try {
    const { id } = req.body;

    const [[coupon]] = await db.query(
      `SELECT * FROM coupons WHERE id = ?`,
      [id]
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.json({ success: true, coupon });
  } catch (err) {
    console.error("Get Coupon Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createCoupon = async (req, res) => {
  try {
    let {
      code,
      title,
      description,
      discount_type = "flat",
      value,
      max_discount,
      min_order = 0,
      starts_at,
      expires_at,
      auto_award = 0,
      single_use_per_user = 0,
      gift_product_id,
    } = req.body;

    if (!code || !title) {
      return res.status(400).json({
        success: false,
        message: "Code and title are required",
      });
    }

    // prevent duplicate codes
    const [[exists]] = await db.query(
      `SELECT id FROM coupons WHERE code = ?`,
      [code]
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    if (discount_type === "free_gift") {
      if (!gift_product_id) {
        return res.status(400).json({
          success: false,
          message: "Gift product is required for free gift coupons",
        });
      }

      value = null;
      max_discount = null;
    } else {
      gift_product_id = null;

      if (!value) {
        return res.status(400).json({
          success: false,
          message: "Discount value is required",
        });
      }

      if (discount_type === "flat") {
        max_discount = null;
      }
    }

    await db.query(
      `
      INSERT INTO coupons (
        code, title, description, discount_type,
        gift_product_id,
        value, max_discount, min_order,
        starts_at, expires_at,
        auto_award, single_use_per_user
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        code,
        title,
        description || null,
        discount_type,
        gift_product_id,
        value,
        max_discount,
        min_order,
        starts_at || null,
        expires_at || null,
        auto_award,
        single_use_per_user,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
    });
  } catch (err) {
    console.error("Create Coupon Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    let {
      id,
      title,
      description,
      discount_type,
      value,
      max_discount,
      min_order,
      starts_at,
      expires_at,
      auto_award,
      single_use_per_user,
      gift_product_id,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Coupon ID is required",
      });
    }

    if (discount_type === "free_gift") {
      if (!gift_product_id) {
        return res.status(400).json({
          success: false,
          message: "Gift product is required for free gift coupons",
        });
      }

      value = null;
      max_discount = null;
    } else if (discount_type) {
      gift_product_id = null;

      if (!value) {
        return res.status(400).json({
          success: false,
          message: "Discount value is required",
        });
      }

      if (discount_type === "flat") {
        max_discount = null;
      }
    }

    await db.query(
      `
      UPDATE coupons SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        discount_type = COALESCE(?, discount_type),
        gift_product_id = COALESCE(?, gift_product_id),
        value = COALESCE(?, value),
        max_discount = COALESCE(?, max_discount),
        min_order = COALESCE(?, min_order),
        starts_at = COALESCE(?, starts_at),
        expires_at = COALESCE(?, expires_at),
        auto_award = COALESCE(?, auto_award),
        single_use_per_user = COALESCE(?, single_use_per_user)
      WHERE id = ?
      `,
      [
        title,
        description,
        discount_type,
        gift_product_id,
        value,
        max_discount,
        min_order,
        starts_at,
        expires_at,
        auto_award,
        single_use_per_user,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Coupon updated successfully",
    });
  } catch (err) {
    console.error("Update Coupon Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const toggleCouponStatus = async (req, res) => {
  try {
    const { id, active } = req.body;

    if (id === undefined || active === undefined) {
      return res.status(400).json({
        success: false,
        message: "Coupon ID and active status required",
      });
    }

    await db.query(
      `UPDATE coupons SET active = ? WHERE id = ?`,
      [active, id]
    );

    res.json({
      success: true,
      message: active ? "Coupon activated" : "Coupon deactivated",
    });
  } catch (err) {
    console.error("Toggle Coupon Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllSliders = async (req, res) => {
  const [sliders] = await db.query(
    `SELECT * FROM sliders ORDER BY position, sort_order ASC`
  );
  res.json({ success: true, sliders });
};

export const createSlider = async (req, res) => {
  const { position, text, sort_order = 0 } = req.body;

  if (!position || !text) {
    return res.status(400).json({
      success: false,
      message: "Position and text are required",
    });
  }

  await db.query(
    `INSERT INTO sliders (position, text, sort_order)
     VALUES (?, ?, ?)`,
    [position, text, sort_order]
  );

  res.json({ success: true, message: "Slider added" });
};

export const updateSlider = async (req, res) => {
  const { id, text, sort_order } = req.body;

  if (!id) {
    return res.status(400).json({ success: false });
  }

  await db.query(
    `UPDATE sliders SET
      text = COALESCE(?, text),
      sort_order = COALESCE(?, sort_order)
     WHERE id = ?`,
    [text, sort_order, id]
  );

  res.json({ success: true, message: "Slider updated" });
};

export const reorderSliders = async (req, res) => {
  try {
    const { items } = req.body;
    // items = [{ id, sort_order }]

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload",
      });
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();

    for (const item of items) {
      await conn.query(
        `UPDATE sliders SET sort_order = ? WHERE id = ?`,
        [item.sort_order, item.id]
      );
    }

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: "Slider order updated",
    });
  } catch (err) {
    console.error("Reorder slider error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const toggleSlider = async (req, res) => {
  try {
    const { id, active } = req.body;

    if (id === undefined || active === undefined) {
      return res.status(400).json({
        success: false,
        message: "Slider ID and active status are required",
      });
    }

    await db.query(
      `UPDATE sliders SET active = ? WHERE id = ?`,
      [active, id]
    );

    res.json({
      success: true,
      message: active
        ? "Slider activated successfully"
        : "Slider deactivated successfully",
    });
  } catch (err) {
    console.error("Toggle Slider Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const deleteSlider = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Slider ID is required",
      });
    }

    const [result] = await db.query(
      `DELETE FROM sliders WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Slider not found",
      });
    }

    res.json({
      success: true,
      message: "Slider deleted successfully",
    });
  } catch (err) {
    console.error("Delete Slider Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getStory = async (req, res) => {
  try {
    const [[story]] = await db.query(
      `SELECT * FROM story_assets LIMIT 1`
    );

    if (!story) {
      return res.json({ success: true, story: null });
    }

    res.json({
      success: true,
      story: {
        ...story,
        image: story.image
          ? `${UPLOADS_APP_URL}${STORY_IMAGE_URL}${story.image}`
          : null,
      },
    });
  } catch (err) {
    console.error("Get Story Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateStory = async (req, res) => {
  try {
    const image = req.file?.filename;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Story image is required",
      });
    }

    await db.query(
      `UPDATE story_assets SET image = ? LIMIT 1`,
      [image]
    );

    res.json({
      success: true,
      message: "Story image updated successfully",
    });
  } catch (err) {
    console.error("Update Story Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllSocials = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT platform, url, active FROM social_links ORDER BY platform`
    );

    res.json({
      success: true,
      socials: rows,
    });
  } catch (err) {
    console.error("Get Socials Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const updateSocial = async (req, res) => {
  try {
    const { platform, url } = req.body;

    if (!platform || !url) {
      return res.status(400).json({
        success: false,
        message: "Platform and URL are required",
      });
    }

    await db.query(
      `UPDATE social_links SET url = ? WHERE platform = ?`,
      [url, platform]
    );

    res.json({
      success: true,
      message: `${platform} link updated`,
    });
  } catch (err) {
    console.error("Update Social Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const toggleSocial = async (req, res) => {
  try {
    const { platform, active } = req.body;

    if (platform === undefined || active === undefined) {
      return res.status(400).json({
        success: false,
        message: "Platform and active status required",
      });
    }

    await db.query(
      `UPDATE social_links SET active = ? WHERE platform = ?`,
      [active, platform]
    );

    res.json({
      success: true,
      message: active
        ? `${platform} enabled`
        : `${platform} disabled`,
    });
  } catch (err) {
    console.error("Toggle Social Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const { search, status } = req.body;

    let sql = `SELECT * FROM contact_messages WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ? OR message LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY createdAt DESC`;

    const [rows] = await db.query(sql, params);

    res.json({
      success: true,
      contacts: rows,
    });
  } catch (err) {
    console.error("Get Contacts Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const markContactRead = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Contact ID is required",
      });
    }

    await db.query(
      `UPDATE contact_messages SET status = 'read' WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (err) {
    console.error("Mark Contact Read Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const replyToContact = async (req, res) => {
  try {
    const { id, reply } = req.body;

    if (!id || !reply) {
      return res.status(400).json({
        success: false,
        message: "Contact ID and reply message are required",
      });
    }

    const [[contact]] = await db.query(
      `SELECT name, email FROM contact_messages WHERE id = ?`,
      [id]
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    /* ================= SEND EMAIL ================= */
    const subject = "Re: Your message to NoshBOB";

    const html = renderEmail({
      preheader: "We've replied to your message",
      title: subject,
      bodyHtml: [
        heading("We've got back to you"),
        paragraph(`Hi ${escapeHtml(contact.name || "there")},`),
        // the admin types plain text, so it is escaped and only newlines
        // become markup
        paragraph(escapeHtml(reply).replace(/\n/g, "<br />")),
        button("Shop NoshBOB", EMAIL_THEME.CLIENT_APP_URL),
        paragraph("Just reply to this email if you need anything else.", EMAIL_THEME.MUTED),
      ].join("\n"),
    });

    await sendEmail(contact.email, subject, reply, html);

    /* ================= UPDATE STATUS ================= */
    await db.query(
      `UPDATE contact_messages SET status = 'replied' WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Reply sent successfully",
    });
  } catch (err) {
    console.error("Reply Contact Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send reply",
    });
  }
};

export const getNewsletterSubscribers = async (req, res) => {
  try {
    const { search, status = "all" } = req.body || {};
    const hasPagination =
      req.body?.page !== undefined || req.body?.limit !== undefined;
    const page = Math.max(Number(req.body?.page || 1), 1);
    const limit = hasPagination
      ? Math.min(Math.max(Number(req.body?.limit || 20), 1), 100)
      : undefined;
    const offset = hasPagination ? (page - 1) * (limit || 20) : 0;

    let sql = `
      SELECT
        id,
        email,
        status,
        CASE WHEN status = 'active' THEN 1 ELSE 0 END AS active,
        createdAt AS subscribedAt,
        unsubscribedAt
      FROM newsletter_subscribers
      WHERE 1=1
    `;
    const params = [];

    let countSql = `
      SELECT COUNT(*) AS total
      FROM newsletter_subscribers
      WHERE 1=1
    `;
    const countParams = [];

    if (search) {
      sql += ` AND email LIKE ?`;
      params.push(`%${search}%`);

      countSql += ` AND email LIKE ?`;
      countParams.push(`%${search}%`);
    }

    if (status && status !== "all") {
      sql += ` AND status = ?`;
      params.push(status);

      countSql += ` AND status = ?`;
      countParams.push(status);
    }

    if (hasPagination) {
      sql += ` ORDER BY subscribedAt DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    } else {
      sql += ` ORDER BY subscribedAt DESC`;
    }

    const [rows] = await db.query(sql, params);
    const [[countResult]] = await db.query(countSql, countParams);
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'active') AS active,
        SUM(status = 'unsubscribed') AS unsubscribed
      FROM newsletter_subscribers
    `);

    const total = Number(countResult?.total || 0);
    const totalPages = hasPagination
      ? Math.max(Math.ceil(total / (limit || 20)), 1)
      : 1;

    res.json({
      success: true,
      subscribers: rows,
      pagination: {
        page,
        limit: limit || rows.length || 1,
        total,
        totalPages,
      },
      stats: {
        total: Number(stats?.total || 0),
        active: Number(stats?.active || 0),
        unsubscribed: Number(stats?.unsubscribed || 0),
      },
    });
  } catch (err) {
    console.error("Get newsletter subscribers error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getNewsletters = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, subject, content, sentCount, createdAt
      FROM newsletters
      ORDER BY createdAt DESC
    `);

    res.json({
      success: true,
      newsletters: rows,
    });
  } catch (err) {
    console.error("Get newsletters error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const sendNewsletter = async (req, res) => {
  try {
    const { subject, content } = req.body;
    const attachments = Array.isArray(req.files)
      ? req.files.map((file) => ({
          filename: file.originalname,
          content: file.buffer,
          contentType: file.mimetype,
        }))
      : [];

    const plainTextContent = (content || "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: "Subject and content are required",
      });
    }

    /* ================= FETCH ACTIVE SUBSCRIBERS ================= */
    const [subscribers] = await db.query(
      `SELECT email, unsubscribeToken FROM newsletter_subscribers WHERE status = 'active'`
    );

    if (!subscribers.length) {
      return res.json({
        success: false,
        message: "No active subscribers found",
      });
    }

    // `content` is the admin's own CKEditor HTML and is injected verbatim —
    // escaping it here would show them their own tags as text. The footer link
    // and the List-Unsubscribe headers are per recipient, so the body is built
    // inside the send loop below rather than once here.
    const buildHtml = (token) =>
      renderNewsletterEmail({
        preheader: plainTextContent ? String(plainTextContent).slice(0, 120) : subject,
        title: subject,
        contentHtml: content,
        unsubscribeUrl: unsubscribeLink(token),
      });

    /* ================= SEND EMAILS IN BATCHES ================= */
    let sentCount = 0;
    let failedCount = 0;
    const BATCH_SIZE = 25;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const result = await Promise.allSettled(
        batch.map((sub) =>
          sendEmail(
            sub.email,
            subject,
            plainTextContent || subject,
            buildHtml(sub.unsubscribeToken),
            attachments,
            // RFC 8058: what makes Gmail and Yahoo show a native
            // "Unsubscribe" control beside the sender name
            unsubscribeHeaders(sub.unsubscribeToken)
          )
        )
      );

      result.forEach((item) => {
        if (item.status === "fulfilled") {
          sentCount += 1;
        } else {
          failedCount += 1;
        }
      });
    }

    /* ================= SAVE NEWSLETTER ================= */
    await db.query(
      `
      INSERT INTO newsletters (subject, content, sentCount)
      VALUES (?, ?, ?)
      `,
      [subject, content, sentCount]
    );

    res.json({
      success: true,
      message:
        failedCount > 0
          ? `Newsletter sent to ${sentCount} subscribers (${failedCount} failed)`
          : `Newsletter sent to ${sentCount} subscribers`,
      sentCount,
      failedCount,
    });
  } catch (err) {
    console.error("Send newsletter error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send newsletter",
    });
  }
};

export const getAllReels = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        r.*,
        p.name AS product_name
      FROM reels r
      JOIN products p ON p.id = r.product_id
      ORDER BY r.sort_order ASC, r.created_at DESC
    `);

    const reels = rows.map((r) => ({
      ...r,

      short_video_url: r.short_video
        ? `${UPLOADS_APP_URL}${REEL_SHORT_URL}/${r.short_video}`
        : null,

      main_video_url: r.main_video
        ? `${UPLOADS_APP_URL}${REEL_MAIN_URL}/${r.main_video}`
        : null,
    }));

    res.json({
      success: true,
      reels,
    });
  } catch (err) {
    console.error("Get Reels Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createReel = async (req, res) => {
  try {
    const { product_id } = req.body;

    const shortVideo = req.files?.short_video?.[0]?.filename;
    const mainVideo = req.files?.main_video?.[0]?.filename;

    if (!shortVideo || !mainVideo || !product_id) {
      return res.status(400).json({
        success: false,
        message: "Short video, main video and product are required",
      });
    }

    // 🔹 Auto-calculate next sort order
    const [[{ maxOrder }]] = await db.query(
      `SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM reels`
    );

    const nextOrder = maxOrder + 1;

    await db.query(
      `
      INSERT INTO reels
        (short_video, main_video, product_id, sort_order, created_by)
      VALUES (?, ?, ?, ?, ?)
      `,
      [shortVideo, mainVideo, product_id, nextOrder, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: "Reel created successfully",
    });
  } catch (err) {
    console.error("Create Reel Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateReel = async (req, res) => {
  try {
    const { id, product_id, sort_order } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Reel ID is required",
      });
    }

    const shortVideo = req.files?.short_video?.[0]?.filename || null;
    const mainVideo = req.files?.main_video?.[0]?.filename || null;

    const [[existing]] = await db.query(
      `SELECT id FROM reels WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Reel not found",
      });
    }

    await db.query(
      `
      UPDATE reels SET
        short_video = COALESCE(?, short_video),
        main_video = COALESCE(?, main_video),
        product_id = COALESCE(?, product_id),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?
      `,
      [shortVideo, mainVideo, product_id, sort_order, id]
    );

    res.json({
      success: true,
      message: "Reel updated successfully",
    });
  } catch (err) {
    console.error("Update Reel Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const reorderReels = async (req, res) => {
  try {
    const { items } = req.body;
    // items = [{ id, sort_order }]

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload",
      });
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();

    for (const item of items) {
      await conn.query(
        `UPDATE reels SET sort_order = ? WHERE id = ?`,
        [item.sort_order, item.id]
      );
    }

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: "Reel order updated",
    });
  } catch (err) {
    console.error("Reorder reels error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const toggleReel = async (req, res) => {
  try {
    const { id, active } = req.body;

    if (id === undefined || active === undefined) {
      return res.status(400).json({
        success: false,
        message: "Reel ID and active status are required",
      });
    }

    await db.query(
      `UPDATE reels SET active = ? WHERE id = ?`,
      [active, id]
    );

    res.json({
      success: true,
      message: active ? "Reel activated" : "Reel deactivated",
    });
  } catch (err) {
    console.error("Toggle Reel Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteReel = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Reel ID is required",
      });
    }

    await db.query(`DELETE FROM reels WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: "Reel deleted successfully",
    });
  } catch (err) {
    console.error("Delete Reel Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const cancelOrderAsAdmin = async (req, res) => {
  try {
    const result = await cancelOrderInternal({
      orderId: Number(req.body.id),
      by: "admin",
      reason: nullifyEmpty(req.body.reason),
    });

    if (result.error)
      return res.status(result.error.code).json({ success: false, message: result.error.message });

    return res.json({
      success: true,
      message: result.alreadyCancelled
        ? "Refund completed for the cancelled order"
        : result.refund
        ? `Order cancelled and ₹${result.refund.amount / 100} refunded`
        : "Order cancelled (no payment was taken)",
    });
  } catch (err) {
    console.error("Admin Cancel Order Error:", err);
    return res.status(502).json({
      success: false,
      message: "Refund failed at the payment provider — nothing has changed, try again",
    });
  }
};

export const sweepAbandonedCheckouts = async (req, res) => {
  try {
    const result = await runAbandonedCheckoutSweep();

    return res.json({
      success: true,
      message: `${result.abandoned} checkout${result.abandoned === 1 ? "" : "s"} marked abandoned, ${result.emailed} recovery email${result.emailed === 1 ? "" : "s"} sent`,
      ...result,
    });
  } catch (err) {
    console.error("Sweep Abandoned Checkouts Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ================= REVIEWS ================= */

const REVIEW_STATUSES = ["visible", "hidden"];

export const getAllReviews = async (req, res) => {
  try {
    const { search, status, productId, rating } = req.body;

    const limit = Math.min(Math.max(Number(req.body.limit) || 20, 1), 100);
    const page = Math.max(Number(req.body.page) || 1, 1);
    const offset = (page - 1) * limit;

    // LEFT JOIN on products: product_reviews.productId carries no FK, so an
    // inner join would silently swallow reviews whose product was removed
    const baseFrom = `
      FROM product_reviews r
      JOIN users u ON u.id = r.userId
      LEFT JOIN products p ON p.id = r.productId
      LEFT JOIN orders o ON o.id = r.orderId
    `;

    let where = " WHERE 1=1";
    const params = [];

    if (status && status !== "all") {
      where += " AND r.status = ?";
      params.push(status);
    }

    if (productId && productId !== "all") {
      where += " AND r.productId = ?";
      params.push(Number(productId));
    }

    if (rating && rating !== "all") {
      where += " AND r.rating = ?";
      params.push(Number(rating));
    }

    if (search) {
      where += " AND (r.comment LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR p.name LIKE ? OR o.orderCode LIKE ?)";
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }

    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS total ${baseFrom} ${where}`,
      params
    );
    const total = Number(countRow.total) || 0;

    // LIMIT/OFFSET placeholders need real numbers, not strings
    const [rows] = await db.query(
      `SELECT r.id, r.rating, r.comment, r.status, r.createdAt, r.moderatedAt,
              r.productId, p.name AS productName,
              u.name AS customerName, u.email AS customerEmail,
              o.orderCode
       ${baseFrom} ${where}
       ORDER BY r.createdAt DESC, r.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // unfiltered, so the tiles keep reading the same while filters change
    const [[counts]] = await db.query(
      `SELECT COUNT(*) AS total,
              SUM(status = 'visible') AS visible,
              SUM(status = 'hidden') AS hidden
       FROM product_reviews`
    );

    // populates the product filter without a second round trip from the client
    const [products] = await db.query(
      `SELECT DISTINCT r.productId AS id, p.name
       FROM product_reviews r
       LEFT JOIN products p ON p.id = r.productId
       ORDER BY p.name`
    );

    return res.json({
      success: true,
      reviews: rows.map((row) => ({
        ...row,
        id: Number(row.id),
        productId: Number(row.productId),
        rating: Number(row.rating),
        productName: row.productName || "(product removed)",
        customerName: row.customerName || "Unnamed customer",
      })),
      products: products.map((row) => ({
        id: Number(row.id),
        name: row.name || `Product #${row.id}`,
      })),
      stats: {
        total: Number(counts.total) || 0,
        visible: Number(counts.visible) || 0,
        hidden: Number(counts.hidden) || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error("Fetch Reviews Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const toggleReviewStatus = async (req, res) => {
  const { id, status } = req.body;

  try {
    // `=== undefined` rather than falsiness, matching the other admin toggles
    if (id === undefined || status === undefined)
      return res.status(400).json({
        success: false,
        message: "Review id and status are required",
      });

    if (!REVIEW_STATUSES.includes(status))
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${REVIEW_STATUSES.join(", ")}`,
      });

    // unlike the other toggles we read first — the productId is needed to
    // resync the denormalised rating once the row flips
    const [[existing]] = await db.query(
      "SELECT id, productId FROM product_reviews WHERE id = ? LIMIT 1",
      [Number(id)]
    );

    if (!existing)
      return res.status(404).json({ success: false, message: "Review not found" });

    await db.query(
      `UPDATE product_reviews
       SET status = ?, moderatedAt = NOW(), moderatedBy = ?
       WHERE id = ?`,
      [status, req.user.id, existing.id]
    );

    // hidden rows leave products.rating/products.reviews, so the storefront
    // stars move the moment a review is pulled
    await syncProductRatings([Number(existing.productId)]);

    return res.json({
      success: true,
      message:
        status === "hidden"
          ? "Review hidden from the product page"
          : "Review restored to the product page",
    });
  } catch (err) {
    console.error("Toggle Review Status Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

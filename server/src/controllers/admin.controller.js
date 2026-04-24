import { db } from "../config/db.js";
import sendEmail from "../utils/sendEmail.js";

const PRODUCT_IMAGE_URL = process.env.PRODUCT_IMAGE_URL || "";
const UPLOADS_APP_URL = process.env.UPLOADS_APP_URL || "";
const ASSET_IMAGE_URL = process.env.ASSET_IMAGE_URL || "";
const STORY_IMAGE_URL = process.env.STORY_IMAGE_URL || "";
const REEL_SHORT_URL = process.env.REEL_SHORT_URL || "";
const REEL_MAIN_URL = process.env.REEL_MAIN_URL || "";

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
        COALESCE(SUM(status='pending'),0) AS pending,
        COALESCE(SUM(status='processing'),0) AS processing,
        COALESCE(SUM(status='shipped'),0) AS shipped,
        COALESCE(SUM(status='delivered'),0) AS delivered,
        COALESCE(SUM(status='cancelled'),0) AS cancelled
      FROM orders
      WHERE DATE(createdAt) BETWEEN ? AND ?
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
        products
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

    const formatted = products.map(p => ({
      ...p,
      ingredients: p.ingredients ? JSON.parse(p.ingredients) : [],
      image: p.image
        ? `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}${p.image}`
        : null
    }));

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

    product.ingredients = product.ingredients ? JSON.parse(product.ingredients) : [];
    product.image = product.image
      ? `${UPLOADS_APP_URL}${PRODUCT_IMAGE_URL}${product.image}`
      : null;

    res.json({ success: true, product });

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
      ingredients = []
    } = req.body;

    if (!name || originalPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name and originalPrice are required"
      });
    }

    const productId = crypto.randomUUID();
    const imageFile = req.file ? req.file.filename : null;

    await db.query(
      `
      INSERT INTO products (
        id, name, image, category,
        originalPrice, discountedPrice,
        description, ingredients
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        productId,
        name,
        imageFile,
        category || null,
        originalPrice,
        discountedPrice || originalPrice,
        description || null,
        ingredients
      ]
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      productId
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
      ingredients
    } = req.body;

    const imageFile = req.file ? req.file.filename : null;

    const [[existing]] = await db.query(
      `SELECT image FROM products WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await db.query(
      `
      UPDATE products SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        originalPrice = COALESCE(?, originalPrice),
        discountedPrice = COALESCE(?, discountedPrice),
        description = COALESCE(?, description),
        ingredients = COALESCE(?, ingredients),
        image = COALESCE(?, image)
      WHERE id = ?
      `,
      [
        name,
        category,
        originalPrice,
        discountedPrice,
        description,
        ingredients ?? null,
        imageFile,
        id
      ]
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
        u.name AS customerName,
        u.email
      FROM orders o
      JOIN users u ON u.id = o.userId
      ORDER BY o.createdAt DESC
    `);

    return res.json({ success: true, orders });
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
        u.phone
      FROM orders o
      JOIN users u ON u.id = o.userId
      WHERE o.id = ?
      `,
      [id]
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const [items] = await db.query(
      `
      SELECT 
        oi.quantity,
        oi.price,
        p.name,
        p.image
      FROM order_items oi
      JOIN products p ON p.id = oi.productId
      WHERE oi.orderId = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      order: {
        ...order,
        appliedCoupons: order.appliedCoupons
          ? JSON.parse(order.appliedCoupons)
          : [],
        items
      }
    });
  } catch (err) {
    console.error("Fetch Order Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

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
        status,
        shippingPartner,
        trackingNumber,
        trackingUrl,
        shippedAt,
        deliveredAt,
        id
      ]
    );

    return res.json({ success: true, message: "Order updated successfully" });
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
    const { id, position } = req.body;
    const imageFile = req.file?.filename || null;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Asset ID is required"
      });
    }

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

    res.json({
      success: true,
      message: "Asset updated successfully"
    });
  } catch (err) {
    console.error("Update Asset Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const { search, active } = req.body;

    let sql = `SELECT * FROM coupons WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (code LIKE ? OR title LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (active !== undefined) {
      sql += ` AND active = ?`;
      params.push(active);
    }

    sql += ` ORDER BY createdAt DESC`;

    const [coupons] = await db.query(sql, params);

    res.json({ success: true, coupons });
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

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <p>Hi ${contact.name},</p>

        <p>${reply.replace(/\n/g, "<br />")}</p>

        <br />
        <p>Best regards,</p>
        <p><strong>NoshBOB Team</strong></p>
      </div>
    `;

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
      `SELECT email FROM newsletter_subscribers WHERE status = 'active'`
    );

    if (!subscribers.length) {
      return res.json({
        success: false,
        message: "No active subscribers found",
      });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.55;">
        ${content}
        <br /><br />
        <p style="font-size:12px;color:#999">
          You received this email because you subscribed to NoshBOB.
        </p>
      </div>
    `;

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
            html,
            attachments
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

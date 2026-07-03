import { db } from "../config/db.js";

const PINCODE_REGEX = /^\d{6}$/;

const normalizeAddressPayload = (payload = {}) => ({
  addressLine1: String(payload.addressLine1 || "").trim(),
  addressLine2: String(payload.addressLine2 || "").trim(),
  city: String(payload.city || "").trim(),
  state: String(payload.state || "").trim(),
  postalCode: String(payload.postalCode || "")
    .replace(/\D/g, "")
    .slice(0, 6),
  country: String(payload.country || "India").trim(),
});

const getAddressValidationError = ({
  addressLine1,
  city,
  state,
  postalCode,
  country,
}) => {
  if (!addressLine1 || !city || !state || !postalCode || !country) {
    return "Address line 1, city, state, country, and pincode are required";
  }

  if (!PINCODE_REGEX.test(postalCode)) {
    return "Pincode must be exactly 6 digits";
  }

  return null;
};

const getAddressesForUser = async (connectionOrDb, userId) => {
  await promoteFallbackPrimary(connectionOrDb, userId);

  const [addresses] = await connectionOrDb.query(
    `SELECT 
       id,
       addressLine1,
       addressLine2,
       city,
       state,
       postalCode,
       country,
       isPrimary,
       createdAt,
       updatedAt
     FROM addresses
     WHERE userId = ?
     ORDER BY isPrimary DESC, createdAt DESC, id DESC`,
    [userId]
  );

  return addresses;
};

const promoteFallbackPrimary = async (connectionOrDb, userId, excludeId = null) => {
  const primaryParams = [userId];
  let primarySql = `
    SELECT id
    FROM addresses
    WHERE userId = ? AND isPrimary = 1
  `;

  if (excludeId !== null) {
    primarySql += " AND id <> ?";
    primaryParams.push(excludeId);
  }

  primarySql += " LIMIT 1";

  const [existingPrimaryRows] = await connectionOrDb.query(primarySql, primaryParams);

  if (existingPrimaryRows.length > 0) return;

  const params = [userId];
  let sql = `
    SELECT id
    FROM addresses
    WHERE userId = ?
  `;

  if (excludeId !== null) {
    sql += " AND id <> ?";
    params.push(excludeId);
  }

  sql += " ORDER BY createdAt DESC, id DESC LIMIT 1";

  const [fallbackRows] = await connectionOrDb.query(sql, params);
  const fallbackAddressId = fallbackRows[0]?.id;

  if (!fallbackAddressId) return;

  await connectionOrDb.query(
    "UPDATE addresses SET isPrimary = 0 WHERE userId = ?",
    [userId]
  );

  await connectionOrDb.query(
    "UPDATE addresses SET isPrimary = 1 WHERE id = ? AND userId = ?",
    [fallbackAddressId, userId]
  );
};

export const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = normalizeAddressPayload(req.body);

    const validationError = getAddressValidationError({
      addressLine1,
      city,
      state,
      postalCode,
      country,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const [[addressStats]] = await db.query(
      `
      SELECT COUNT(*) AS totalAddresses, SUM(CASE WHEN isPrimary = 1 THEN 1 ELSE 0 END) AS primaryCount
      FROM addresses
      WHERE userId = ?
      `,
      [userId]
    );

    const shouldBePrimary =
      Number(addressStats?.totalAddresses || 0) === 0 ||
      Number(addressStats?.primaryCount || 0) === 0;

    const [result] = await db.query(
      `INSERT INTO addresses 
       (addressLine1, addressLine2, city, state, postalCode, country, isPrimary, userId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        addressLine1,
        addressLine2 || null,
        city,
        state,
        postalCode,
        country,
        shouldBePrimary ? 1 : 0,
        userId,
      ]
    );

    return res.json({
      success: true,
      message: "Address added successfully",
    });

  } catch (err) {
    console.error("Create Address Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.body;
    const {
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = normalizeAddressPayload(req.body);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required"
      });
    }

    const validationError = getAddressValidationError({
      addressLine1,
      city,
      state,
      postalCode,
      country,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const [rows] = await db.query(
      "SELECT id FROM addresses WHERE id = ? AND userId = ?",
      [id, userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    await db.query(
      `UPDATE addresses 
       SET addressLine1=?, addressLine2=?, city=?, state=?, postalCode=?, country=? 
       WHERE id = ?`,
      [
        addressLine1,
        addressLine2 || null,
        city,
        state,
        postalCode,
        country || "India",
        id
      ]
    );

    return res.json({
      success: true,
      message: "Address updated successfully"
    });

  } catch (err) {
    console.error("Update Address Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required"
      });
    }

    const [rows] = await db.query(
      "SELECT id, isPrimary FROM addresses WHERE id = ? AND userId = ?",
      [id, userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    await db.query("DELETE FROM addresses WHERE id = ?", [id]);

    if (Number(rows[0]?.isPrimary) === 1) {
      await promoteFallbackPrimary(db, userId, id);
    }

    return res.json({
      success: true,
      message: "Address deleted successfully"
    });

  } catch (err) {
    console.error("Delete Address Error:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await getAddressesForUser(db, userId);

    return res.json({
      success: true,
      addresses
    });

  } catch (err) {
    console.error("Fetch Addresses Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

export const setPrimaryAddress = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Address ID is required",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT id, isPrimary FROM addresses WHERE id = ? AND userId = ?",
      [id, userId]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (Number(rows[0].isPrimary) === 1) {
      await connection.rollback();
      return res.json({
        success: true,
        message: "Address is already primary",
      });
    }

    await connection.query(
      "UPDATE addresses SET isPrimary = 0 WHERE userId = ?",
      [userId]
    );

    await connection.query(
      "UPDATE addresses SET isPrimary = 1 WHERE id = ? AND userId = ?",
      [id, userId]
    );

    await connection.commit();

    const addresses = await getAddressesForUser(connection, userId);

    return res.json({
      success: true,
      message: "Primary address updated successfully",
      addresses,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Set Primary Address Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  } finally {
    connection.release();
  }
};

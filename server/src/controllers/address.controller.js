import { db } from "../config/db.js";

export const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = "India"
    } = req.body;

    if (!addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    const [result] = await db.query(
      `INSERT INTO addresses 
       (addressLine1, addressLine2, city, state, postalCode, country, userId) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [addressLine1, addressLine2 || null, city, state, postalCode, country, userId]
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
    const {
      id, 
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required"
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
      "SELECT id FROM addresses WHERE id = ? AND userId = ?",
      [id, userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    await db.query("DELETE FROM addresses WHERE id = ?", [id]);

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

    const [addresses] = await db.query(
      `SELECT 
         id,
         addressLine1,
         addressLine2,
         city,
         state,
         postalCode,
         country,
         createdAt,
         updatedAt
       FROM addresses
       WHERE userId = ?
       ORDER BY createdAt DESC`,
      [userId]
    );

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

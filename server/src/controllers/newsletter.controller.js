import { db } from "../config/db.js";

export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    /* ================= VALIDATION ================= */
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    /* ================= CHECK EXISTING ================= */
    const [[existing]] = await db.query(
      `SELECT id, status FROM newsletter_subscribers WHERE email = ?`,
      [email]
    );

    if (existing) {
      if (existing.status === "active") {
        return res.json({
          success: true,
          message: "You're already subscribed 😊",
        });
      }

      // Re-activate if previously unsubscribed
      await db.query(
        `UPDATE newsletter_subscribers SET status = 'active' WHERE email = ?`,
        [email]
      );

      return res.json({
        success: true,
        message: "Subscription reactivated 🎉",
      });
    }

    /* ================= INSERT ================= */
    await db.query(
      `INSERT INTO newsletter_subscribers (email) VALUES (?)`,
      [email]
    );

    return res.json({
      success: true,
      message: "Subscribed successfully 🎉",
    });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to subscribe",
    });
  }
};

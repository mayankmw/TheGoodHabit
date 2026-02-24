import { db } from "../config/db.js";

const isValidEmail = (email = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

    if (!isValidEmail(email)) {
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
        `UPDATE newsletter_subscribers
         SET status = 'active', unsubscribedAt = NULL
         WHERE email = ?`,
        [email]
      );

      return res.json({
        success: true,
        message: "Subscription reactivated 🎉",
      });
    }

    /* ================= INSERT ================= */
    await db.query(
      `INSERT INTO newsletter_subscribers (email, unsubscribedAt) VALUES (?, NULL)`,
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

export const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    const [[existing]] = await db.query(
      `SELECT id, status FROM newsletter_subscribers WHERE email = ?`,
      [email]
    );

    if (!existing) {
      return res.json({
        success: true,
        message: "This email is not subscribed",
      });
    }

    if (existing.status === "unsubscribed") {
      return res.json({
        success: true,
        message: "You are already unsubscribed",
      });
    }

    await db.query(
      `UPDATE newsletter_subscribers
       SET status = 'unsubscribed', unsubscribedAt = NOW()
       WHERE email = ?`,
      [email]
    );

    return res.json({
      success: true,
      message: "Unsubscribed successfully",
    });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unsubscribe",
    });
  }
};

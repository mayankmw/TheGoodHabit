import { db } from "../config/db.js";
import sendEmail from "../utils/sendEmail.js";

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

      await sendEmail(
        email,
        "Welcome back to The Good Habit Newsletter",
        "Your newsletter subscription has been reactivated successfully.",
        `
          <div style="font-family: Arial, sans-serif; line-height:1.6;">
            <h2 style="margin:0 0 12px;">Welcome back!</h2>
            <p>Your newsletter subscription has been reactivated.</p>
            <p>You will now receive updates, offers, and new launches from The Good Habit.</p>
          </div>
        `
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

    await sendEmail(
      email,
      "You're subscribed to The Good Habit Newsletter",
      "Your newsletter subscription is confirmed.",
      `
        <div style="font-family: Arial, sans-serif; line-height:1.6;">
          <h2 style="margin:0 0 12px;">Subscription confirmed</h2>
          <p>Thank you for subscribing to The Good Habit newsletter.</p>
          <p>You will receive product updates, wellness tips, and special offers.</p>
        </div>
      `
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

    await sendEmail(
      email,
      "You've been unsubscribed from The Good Habit Newsletter",
      "Your newsletter unsubscription is confirmed.",
      `
        <div style="font-family: Arial, sans-serif; line-height:1.6;">
          <h2 style="margin:0 0 12px;">Unsubscribed successfully</h2>
          <p>You have been unsubscribed from The Good Habit newsletter.</p>
          <p>If this was accidental, you can subscribe again anytime from our website.</p>
        </div>
      `
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

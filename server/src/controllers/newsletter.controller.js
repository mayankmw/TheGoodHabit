import { db } from "../config/db.js";
import {
  safeSend,
  renderEmail,
  heading,
  paragraph,
  button,
  EMAIL_THEME,
} from "../utils/emailTemplates.js";

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

      await safeSend(
        email,
        "Welcome back to NoshBOB Newsletter",
        "Your newsletter subscription has been reactivated successfully.",
        renderEmail({
          preheader: "Your subscription is active again",
          title: "Welcome back to NoshBOB",
          bodyHtml: [
            heading("Welcome back!"),
            paragraph("Your newsletter subscription has been reactivated."),
            paragraph("You'll get new launches, wellness tips and subscriber-only offers — a couple of times a month, never more."),
            button("See what's new", EMAIL_THEME.CLIENT_APP_URL),
          ].join("\n"),
          footerNote: `Changed your mind? You can unsubscribe from the footer of <a href="${EMAIL_THEME.CLIENT_APP_URL}" style="color:${EMAIL_THEME.MUTED};text-decoration:underline;">our site</a> at any time.`,
        })
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

    await safeSend(
      email,
      "You're subscribed to NoshBOB Newsletter",
      "Your newsletter subscription is confirmed.",
      renderEmail({
        preheader: "You're on the list — here's what to expect",
        title: "Subscription confirmed",
        bodyHtml: [
          heading("You're on the list"),
          paragraph("Thanks for subscribing to the NoshBOB newsletter."),
          paragraph("You'll get product launches, wellness tips and subscriber-only offers — a couple of times a month, never more."),
          button("Shop bestsellers", EMAIL_THEME.CLIENT_APP_URL),
        ].join("\n"),
        footerNote: `Changed your mind? You can unsubscribe from the footer of <a href="${EMAIL_THEME.CLIENT_APP_URL}" style="color:${EMAIL_THEME.MUTED};text-decoration:underline;">our site</a> at any time.`,
      })
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

    await safeSend(
      email,
      "You've been unsubscribed from NoshBOB Newsletter",
      "You have been unsubscribed from the NoshBOB newsletter.",
      renderEmail({
        preheader: "You won't hear from us again",
        title: "You've been unsubscribed",
        bodyHtml: [
          heading("You've been unsubscribed"),
          paragraph("You won't receive any more newsletters from us. Order and delivery emails are unaffected."),
          // no promotional CTA here on purpose — a hard-sell goodbye invites
          // spam complaints
          paragraph(
            `Changed your mind? You can resubscribe any time from <a href="${EMAIL_THEME.CLIENT_APP_URL}" style="color:${EMAIL_THEME.BRAND};">our site</a>.`,
            EMAIL_THEME.MUTED
          ),
        ].join("\n"),
      })
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

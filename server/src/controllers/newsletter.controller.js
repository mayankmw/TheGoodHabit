import { db } from "../config/db.js";
import crypto from "crypto";
import {
  safeSend,
  unsubscribeLink,
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
          footerNote: `Changed your mind? <a href="${unsubscribeLink(await ensureUnsubscribeToken(email))}" style="color:${EMAIL_THEME.MUTED};text-decoration:underline;">Unsubscribe here</a>.`,
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
        footerNote: `Changed your mind? <a href="${unsubscribeLink(await ensureUnsubscribeToken(email))}" style="color:${EMAIL_THEME.MUTED};text-decoration:underline;">Unsubscribe here</a>.`,
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


const newToken = () => crypto.randomBytes(16).toString("hex");

/** Every active subscriber needs a token; older rows were backfilled by migration. */
export const ensureUnsubscribeToken = async (email) => {
  const [[row]] = await db.query(
    "SELECT id, unsubscribeToken FROM newsletter_subscribers WHERE email = ? LIMIT 1",
    [email]
  );

  if (!row) return "";
  if (row.unsubscribeToken) return row.unsubscribeToken;

  const token = newToken();
  await db.query(
    "UPDATE newsletter_subscribers SET unsubscribeToken = ? WHERE id = ?",
    [token, row.id]
  );
  return token;
};

const unsubscribeRowByToken = async (token) => {
  const clean = String(token || "").trim();
  if (!clean) return null;

  const [[row]] = await db.query(
    "SELECT id, email, status FROM newsletter_subscribers WHERE unsubscribeToken = ? LIMIT 1",
    [clean]
  );
  return row || null;
};

/**
 * Token-based opt-out for the page a human lands on from the email footer.
 * The token identifies the subscriber without ever putting their address in
 * a URL, where it would leak into referrers and access logs.
 */
export const unsubscribeByToken = async (req, res) => {
  try {
    const row = await unsubscribeRowByToken(req.body.token);

    if (!row)
      return res.status(404).json({
        success: false,
        message: "This unsubscribe link is no longer valid",
      });

    if (row.status === "unsubscribed")
      return res.json({
        success: true,
        alreadyUnsubscribed: true,
        email: row.email,
        message: "You're already unsubscribed",
      });

    await db.query(
      "UPDATE newsletter_subscribers SET status = 'unsubscribed', unsubscribedAt = NOW() WHERE id = ?",
      [row.id]
    );

    return res.json({
      success: true,
      email: row.email,
      message: "You've been unsubscribed",
    });
  } catch (error) {
    console.error("Unsubscribe by token error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/** Lets someone undo an unsubscribe they landed on by accident. */
export const resubscribeByToken = async (req, res) => {
  try {
    const row = await unsubscribeRowByToken(req.body.token);

    if (!row)
      return res.status(404).json({
        success: false,
        message: "This link is no longer valid",
      });

    await db.query(
      "UPDATE newsletter_subscribers SET status = 'active', unsubscribedAt = NULL WHERE id = ?",
      [row.id]
    );

    return res.json({ success: true, email: row.email, message: "You're subscribed again" });
  } catch (error) {
    console.error("Resubscribe by token error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * RFC 8058 one-click target. Mail providers POST here with no session and no
 * confirmation step, so it must act immediately and always answer 200 — a
 * failure here is read as a broken unsubscribe and counts against the sender.
 */
export const oneClickUnsubscribe = async (req, res) => {
  try {
    const token = req.query.token || req.body?.token;
    const row = await unsubscribeRowByToken(token);

    if (row && row.status !== "unsubscribed") {
      await db.query(
        "UPDATE newsletter_subscribers SET status = 'unsubscribed', unsubscribedAt = NOW() WHERE id = ?",
        [row.id]
      );
    }

    // a plain GET means a person clicked it, so show them something
    if (req.method === "GET") {
      return res
        .status(200)
        .send(
          `<!doctype html><meta charset="utf-8" /><title>Unsubscribed</title><body style="font-family:Arial,sans-serif;text-align:center;padding:60px 20px;color:#262626;"><h1 style="font-size:20px;">You've been unsubscribed</h1><p style="color:#737373;">You won't receive any more NoshBOB newsletters. Order emails are unaffected.</p></body>`
        );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("One-click unsubscribe error:", error);
    return res.status(200).json({ success: true });
  }
};

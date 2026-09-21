import {
  safeSend,
  renderInternalEmail,
  escapeHtml,
  EMAIL_THEME,
} from "../utils/emailTemplates.js";
import { db } from "../config/db.js";

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    /* ================= SAVE TO DB ================= */
    await db.query(
      `
      INSERT INTO contact_messages (name, email, message)
      VALUES (?, ?, ?)
      `,
      [name, email, message]
    );

    /* ================= SEND EMAIL ================= */
    const adminEmail = process.env.EMAIL_USER;

    const subject = `New contact message from ${name}`;

    const html = renderInternalEmail({
      title: "New contact form submission",
      rows: [
        ["Name", escapeHtml(name)],
        ["Email", `<a href="mailto:${escapeHtml(email)}" style="color:${EMAIL_THEME.BRAND};">${escapeHtml(email)}</a>`],
      ],
      bodyHtml: `<div style="border-left:3px solid ${EMAIL_THEME.BORDER};padding:4px 0 4px 14px;font-family:${EMAIL_THEME.FONT};font-size:14px;line-height:1.7;color:${EMAIL_THEME.TEXT};white-space:pre-wrap;">${escapeHtml(message)}</div>`,
    });

    // the message row is already committed, so a mail fault must not 500 and
    // push the customer into resubmitting a duplicate
    await safeSend(adminEmail, subject, message, html);

    return res.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

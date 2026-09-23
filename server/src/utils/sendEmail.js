import nodemailer from "nodemailer";

const emailPort = Number(process.env.EMAIL_PORT || 587);
// Development safety net. When set, EVERY outgoing message is delivered here
// instead of its real recipient — so testing a flow on a dev machine can never
// reach an actual customer. Leave it unset in production and nothing changes.
const MAIL_REDIRECT_TO = (process.env.MAIL_REDIRECT_TO || "").trim();

const emailSecure =
  process.env.EMAIL_SECURE === "true" || emailPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,      // e.g. smtp.gmail.com
  port: emailPort,      // e.g. 587
  secure: emailSecure,   // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,     // your email
    pass: process.env.EMAIL_PASS,     // app password
  },
});

/**
 * Send Email Utility
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text message
 * @param {string} html - Optional HTML content
 */

  const sendEmail = async (
    to,
    subject,
    text,
    html = null,
    attachments = [],
    headers = null
  ) => {
    try {
      // the true recipient is preserved as a header so a redirected inbox can
      // still tell who each message was actually for
      const redirected = Boolean(MAIL_REDIRECT_TO) && to !== MAIL_REDIRECT_TO;

      const mailOptions = {
        from: `"NoshBOB" <${process.env.EMAIL_USER}>`,
        to: redirected ? MAIL_REDIRECT_TO : to,
        subject,
        text,
        html: html || `<p>${text}</p>`,
        attachments,
        // List-Unsubscribe / List-Unsubscribe-Post live here: Gmail and Yahoo
        // require them on bulk mail, and mailOptions was a fixed literal that
        // could not carry any header at all
        ...(headers || redirected
          ? { headers: { ...(headers || {}), ...(redirected ? { "X-Original-To": to } : {}) } }
          : {}),
      };

      if (redirected) console.log(`✉️  redirected: ${to} -> ${MAIL_REDIRECT_TO} (${subject})`);

      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error("❌ Email sending failed:", error.message);
      throw new Error("Email sending failed");
    }
  };


export default sendEmail;

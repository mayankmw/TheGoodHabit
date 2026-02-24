import nodemailer from "nodemailer";

const emailPort = Number(process.env.EMAIL_PORT || 587);
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
    attachments = []
  ) => {
    try {
      const mailOptions = {
        from: `"The Good Habit" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html: html || `<p>${text}</p>`,
        attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error("❌ Email sending failed:", error.message);
      throw new Error("Email sending failed");
    }
  };


export default sendEmail;

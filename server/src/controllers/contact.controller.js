import sendEmail from "../utils/sendEmail.js";

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const adminEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.EMAIL_USER;

    const subject = `📩 New Contact Message from ${name}`;

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br />")}</p>
      </div>
    `;

    await sendEmail(adminEmail, subject, message, html);

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

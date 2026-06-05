import nodemailer from "nodemailer";

/**
 * Send Email
 * Sends an email using configured SMTP transport
 */
export async function sendEmail({ to, subject, html }) {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || "587", 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  if (!host || !user || !pass) {
    throw new Error("Email config missing in .env (EMAIL_HOST/USER/PASS)");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: { user, pass },
    family: 4, // Use IPv4 to avoid potential issues with IPv6
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}
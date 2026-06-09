import nodemailer from "nodemailer";
import dns from "dns";

// Force Node.js to prefer IPv4 instead of IPv6
dns.setDefaultResultOrder("ipv4first");

export async function sendEmail({ to, subject, html }) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  if (!user || !pass) {
    throw new Error("Email credentials are missing");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,

    // Important for Render IPv6 problem
    family: 4,

    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.verify();

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Email sending failed:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });

    throw new Error("Email failed");
  }
}
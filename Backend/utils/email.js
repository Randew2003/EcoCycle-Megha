// email.js

import dns from "dns";
import nodemailer from "nodemailer";

// Force IPv4 first because Render may fail with Gmail IPv6 SMTP
dns.setDefaultResultOrder("ipv4first");

export async function sendEmail({ to, subject, html }) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT) || 587;

  if (!user || !pass) {
    throw new Error("Email credentials are missing. Check EMAIL_USER and EMAIL_PASS.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,

    // Important for Render ENETUNREACH IPv6 issue
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
import nodemailer from "nodemailer";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

export async function sendEmail({ to, subject, html }) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },

    tls: {
      // optional but helps stability
      rejectUnauthorized: false,
    },
  });

  await transporter.verify();

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}
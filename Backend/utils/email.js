import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send Email
 * Sends an email using Resend API
 */
export async function sendEmail({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || "E-Waste Platform <onboarding@resend.dev>";

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY missing in environment variables");
  }

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Email sending failed");
  }

  return data;
}
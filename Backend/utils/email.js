import { Resend } from "resend";

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "E-Waste Platform <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY missing in .env");
  }

  const resend = new Resend(apiKey);

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
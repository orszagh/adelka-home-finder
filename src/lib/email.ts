import "server-only";

export type EmailMessage = { to: string[]; subject: string; html: string; text: string };

export type SendResult = { sent: true; id: string } | { sent: false; reason: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL);
}

export function notifyRecipients(): string[] {
  return (process.env.NOTIFY_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Sends through the Resend REST API (https://resend.com/docs/api-reference/emails/send-email). */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY nie je nastavený" };
  if (message.to.length === 0) return { sent: false, reason: "NOTIFY_EMAIL nie je nastavený" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Domček pri mori <onboarding@resend.dev>",
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${await response.text()}`);
  }
  const { id } = (await response.json()) as { id: string };
  return { sent: true, id };
}

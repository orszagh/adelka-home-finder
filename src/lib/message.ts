export const MAX_INTENT = 1000;
export const MAX_SIGNATURE = 80;

export type MessageDraft = { subject_it: string; body_it: string; translation_sk: string };

export function mailtoHref(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body }).toString().replace(/\+/g, "%20");
  return `mailto:${encodeURIComponent(to.trim()).replace(/%40/g, "@")}?${params}`;
}

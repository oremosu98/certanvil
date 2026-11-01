// The "from" address for every Resend send. NOTIFY_FROM_EMAIL is used only when it is one plain address; anything else
// (a value pasted several times over, as prod had on 1 Nov 2026) falls back to notify@certanvil.com, because Resend
// rejects a malformed sender with a 422 and the email is silently lost.
export function senderEmail() {
  const v = String(process.env.NOTIFY_FROM_EMAIL || '').trim();
  return /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i.test(v) ? v : 'notify@certanvil.com';
}

// Email through Brevo's HTTP API (free tier). Needs BREVO_API_KEY and a verified sender MAIL_FROM.
import { esc } from './util.js';

const API = 'https://api.brevo.com/v3/smtp/email';
const sender = (env) => ({ email: env.MAIL_FROM, name: env.MAIL_FROM_NAME || 'مكتبة الحيالي الرقمية' });

export function layout(inner) {
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:16px;line-height:1.8;color:#1b2b2b;max-width:520px;margin:auto;padding:16px">${inner}</div>`;
}
async function call(env, payload) {
  if (!env.BREVO_API_KEY || !env.MAIL_FROM) return false;
  const r = await fetch(API, { method: 'POST', headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ sender: sender(env), ...payload }) });
  return r.ok;
}
export const sendMail = (env, { to, subject, html }) => call(env, { to: [{ email: to }], subject, htmlContent: html });
// One API call for many recipients, each with its own HTML (e.g. personal unsubscribe link).
export const sendMany = (env, { subject, versions }) =>
  call(env, { subject, htmlContent: '.', messageVersions: versions.map((v) => ({ to: [{ email: v.to }], htmlContent: v.html })) });

export const codeMail = (code) => layout(`<p>رمز الدخول إلى حسابك في مكتبة الحيالي الرقمية:</p><p style="font-size:32px;letter-spacing:6px;font-weight:700;direction:ltr">${esc(code)}</p><p>صالح لمدة 10 دقائق. إن لم تطلبه فتجاهل هذه الرسالة.</p><p dir="ltr" style="color:#667">Your login code is above. It expires in 10 minutes.</p>`);

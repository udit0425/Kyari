// Guest emails: templates + delivery through Resend's HTTP API (no SDK needed).
//
// Configured from the admin Settings tab (Resend API key, default From / Reply-to).
// Env vars RESEND_API_KEY / EMAIL_FROM / EMAIL_REPLY_TO override them if ever set.

import { getSetting } from './settings.js';

const BRAND = 'Malbagadh Homestay';
const PHONE_DISPLAY = '+91 98370 56370';
const WA_NUMBER = '919837056370';
const SITE_URL = 'https://malbagadh.in';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0 ? n : null; };
const inr = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtDate = (d) => {
  if (!d) return '';
  const t = Date.parse(`${d}T00:00:00Z`);
  return Number.isNaN(t) ? String(d) : new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};
const nightsBetween = (a, b) => {
  const n = Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const count = (v) => { const n = parseInt(v, 10); return n > 0 ? n : 0; };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// "2 adults, 1 child, 1 staff" (older data with a single `guests` number counts as adults)
export const describeGuests = (d = {}) => {
  const adults = count(d.adults ?? d.guests), children = count(d.children), staff = count(d.staff);
  return [adults && plural(adults, 'adult', 'adults'), children && plural(children, 'child', 'children'), staff && `${staff} staff`]
    .filter(Boolean).join(', ');
};

// --- UPI payment requests ---
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://api.malbagadh.in').replace(/\/$/, '');
export const getUpiId = () => (getSetting('upi_id') || '9105056370@pthdfc').trim();
export const getUpiName = () => (getSetting('upi_payee_name') || 'Kyari').trim();
const cleanRef = (ref) => String(ref || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 35);
const cleanAmount = (a) => { const n = parseFloat(a); return Number.isFinite(n) && n > 0 ? String(Math.round(n * 100) / 100) : ''; };

// upi://pay?pa=…&pn=Kyari&am=15000&cu=INR&tn=Kyari%20Booking%20KYR1025&tr=KYR1025
export const buildUpiLink = ({ amount, ref }) => {
  const pn = getUpiName(), r = cleanRef(ref), am = cleanAmount(amount);
  const q = [`pa=${encodeURIComponent(getUpiId())}`, `pn=${encodeURIComponent(pn)}`];
  if (am) q.push(`am=${am}`);
  q.push('cu=INR');
  if (r) q.push(`tn=${encodeURIComponent(`${pn} Booking ${r}`)}`, `tr=${encodeURIComponent(r)}`);
  return `upi://pay?${q.join('&')}`;
};

// Gmail strips upi:// links, so emails link to our /pay page, which opens the UPI app (or shows a QR).
export const buildPayPageUrl = ({ amount, ref }) => {
  const q = new URLSearchParams();
  if (cleanAmount(amount)) q.set('am', cleanAmount(amount));
  if (cleanRef(ref)) q.set('tr', cleanRef(ref));
  return `${PUBLIC_BASE_URL}/pay?${q.toString()}`;
};

// Emails are only ever sent manually from the admin Email Manager — never automatically.
export const TEMPLATES = {
  payment_received: 'Payment confirmation',
  booking_received: 'Booking received – asking guest to pay'
};

// Build subject + HTML + plain-text for a template. `d` is the form data from the admin UI.
export const renderEmail = (template, d = {}) => {
  if (!TEMPLATES[template]) throw new Error(`Unknown template: ${template}`);

  const name = String(d.guest_name || '').trim();
  const ref = String(d.booking_ref || '').trim();
  const nights = nightsBetween(d.check_in, d.check_out);
  const guests = describeGuests(d);
  const amount = num(d.amount);
  const total = num(d.total);
  const paymentLink = template === 'booking_received' && amount ? buildPayPageUrl({ amount, ref }) : '';
  const mode = String(d.payment_mode || '').trim();
  const note = String(d.note || '').trim();
  const isPayment = template === 'payment_received';

  const subject = isPayment
    ? `Payment received – your ${BRAND} booking is confirmed${ref ? ` (${ref})` : ''}`
    : `Your ${BRAND} booking request${ref ? ` – ${ref}` : ''}`;

  const heading = isPayment ? 'Your booking is confirmed 🎉' : 'Thank you for choosing us!';
  const intro = isPayment
    ? `We have received your payment${amount ? ` of <b>${esc(inr(amount))}</b>` : ''}${mode ? ` via ${esc(mode)}` : ''}. Your stay at ${BRAND} is confirmed — we look forward to hosting you!`
    : `Your booking request has been received.${amount ? ` Please complete the payment of <b>${esc(inr(amount))}</b> to confirm your reservation.` : ' We will share the payment details shortly to confirm your reservation.'}`;
  const introText = intro.replace(/<[^>]+>/g, '');

  // Summary rows: [label, value]
  const rows = [];
  if (ref) rows.push(['Booking ID', ref]);
  if (d.check_in) rows.push(['Check-in', fmtDate(d.check_in)]);
  if (d.check_out) rows.push(['Check-out', `${fmtDate(d.check_out)}${nights ? ` (${nights} night${nights !== 1 ? 's' : ''})` : ''}`]);
  if (guests) rows.push(['Guests', guests]);
  if (isPayment) {
    if (total) rows.push(['Total amount', inr(total)]);
    if (amount) rows.push(['Amount received', inr(amount)]);
    if (mode) rows.push(['Payment mode', mode]);
    if (total) {
      const balance = total - (amount || 0);
      rows.push(['Balance', balance > 0 ? `${inr(balance)} due` : 'Fully paid ✅']);
    }
  } else {
    if (amount) rows.push(['Amount payable', inr(amount)]);
    rows.push(['UPI ID', getUpiId()]);
    rows.push(['Status', 'Payment pending']);
  }

  const rowsHtml = rows.map(([k, v]) => `
          <tr>
            <td style="padding:8px 0;color:#6b756f;font-size:14px;border-bottom:1px solid #ece8df;">${esc(k)}</td>
            <td style="padding:8px 0;color:#1f2a24;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #ece8df;">${esc(v)}</td>
          </tr>`).join('');

  const button = !isPayment && paymentLink
    ? `<tr><td align="center" style="padding:8px 0 24px;">
         <a href="${esc(paymentLink)}" style="display:inline-block;background:#2f6b4f;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:8px;">Pay ${esc(inr(amount))} via UPI</a>
         <div style="font-size:12px;color:#6b756f;margin-top:8px;">Opens GPay / PhonePe / Paytm on your phone · or pay to UPI ID <b>${esc(getUpiId())}</b></div>
       </td></tr>`
    : '';

  const noteHtml = note
    ? `<tr><td style="padding:0 0 20px;color:#1f2a24;font-size:15px;line-height:1.6;">${esc(note).replace(/\n/g, '<br>')}</td></tr>`
    : '';

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ee;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#2f6b4f;padding:22px 28px;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.8;">${BRAND}</div>
          <div style="font-size:22px;font-weight:700;margin-top:4px;">${esc(heading)}</div>
        </td></tr>
        <tr><td style="padding:24px 28px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 0 12px;color:#1f2a24;font-size:15px;">Hello${name ? ` ${esc(name)}` : ''},</td></tr>
            <tr><td style="padding:0 0 20px;color:#1f2a24;font-size:15px;line-height:1.6;">${intro}</td></tr>
            ${noteHtml}
            ${button}
            <tr><td style="padding:0 0 6px;color:#2f6b4f;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Booking summary</td></tr>
            <tr><td style="padding:0 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}
              </table>
            </td></tr>
            <tr><td style="padding:0 0 24px;color:#1f2a24;font-size:14px;line-height:1.6;">
              Questions? Reply to this email, call <a href="tel:+${WA_NUMBER}" style="color:#2f6b4f;">${PHONE_DISPLAY}</a>
              or <a href="https://wa.me/${WA_NUMBER}" style="color:#2f6b4f;">message us on WhatsApp</a>.
              <br><br>Warm regards,<br><b>${BRAND}</b>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#faf8f3;padding:14px 28px;color:#6b756f;font-size:12px;text-align:center;">
          <a href="${SITE_URL}" style="color:#6b756f;">malbagadh.in</a> · Forest getaway near Jim Corbett
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    `Hello${name ? ` ${name}` : ''},`,
    '',
    introText,
    ...(note ? ['', note] : []),
    ...(!isPayment && paymentLink ? ['', `Pay ${inr(amount)} via UPI (opens GPay / PhonePe / Paytm): ${paymentLink}`, `Or pay to UPI ID: ${getUpiId()}`] : []),
    '',
    'Booking summary:',
    ...rows.map(([k, v]) => `• ${k}: ${v}`),
    '',
    `Questions? Reply to this email or call/WhatsApp ${PHONE_DISPLAY}.`,
    '',
    'Warm regards,',
    BRAND,
    SITE_URL
  ].join('\n');

  return {
    subject, html, text,
    pay_url: paymentLink || null,
    upi_link: paymentLink ? buildUpiLink({ amount, ref }) : null
  };
};

// Settings come from the admin Settings tab (DB); env vars, if present, take priority.
const getApiKey = () => (process.env.RESEND_API_KEY || getSetting('resend_api_key') || '').trim();
export const isEmailConfigured = () => Boolean(getApiKey());
export const apiKeyHint = () => { const k = getApiKey(); return k ? `${k.slice(0, 3)}…${k.slice(-4)}` : ''; };

// Defaults shown in the admin form; the admin can change them per email.
export const getDefaultFrom = () =>
  (process.env.EMAIL_FROM || getSetting('default_from_email') || 'bookings@send.malbagadh.in').replace(/^.*<([^>]+)>.*$/, '$1').trim();
export const getDefaultReplyTo = () => (process.env.EMAIL_REPLY_TO || getSetting('default_reply_to') || '').trim();

// Accepts "you@domain" or "Name <you@domain>"; a bare address gets the brand name.
const formatFrom = (from) => (String(from).includes('<') ? String(from).trim() : `${BRAND} <${String(from).trim()}>`);

export const sendEmail = async ({ from, replyTo, to, subject, html, text }) => {
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, error: 'Resend API key is not set — add it in the Settings tab' };

  const body = { from: formatFrom(from || getDefaultFrom()), to: [to], subject, html, text };
  if (replyTo) body.reply_to = replyTo;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = data.message || data.error || `Resend returned ${res.status}`;
      console.error(`[Email] ❌ ${error}`);
      return { success: false, error };
    }
    console.log(`[Email] ✅ Sent "${subject}" (${data.id})`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[Email] ❌ Send failed:', err.message);
    return { success: false, error: err.message };
  }
};

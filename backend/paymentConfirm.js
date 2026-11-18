// Self-contained HTML page for drafting a payment-received confirmation to a guest.
// Opened from the Slack booking alert. The owner enters the amount received, previews
// the message, then opens WhatsApp or their email app with it prefilled.

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// JSON safe to embed inside a <script> tag
const toScriptJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

export const renderPaymentConfirmPage = (booking = {}) => {
  const phoneDigits = String(booking.guest_phone || '').replace(/\D/g, '');
  const prefill = {
    bookingKey: booking.id ? `req-${booking.id}` : '',
    phone: phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits,
    check_in: booking.check_in || '',
    check_out: booking.check_out || '',
    guests: booking.guest_count || ''
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Payment Confirmation · Malbagadh</title>
<style>
  :root { --bg:#f5f3ee; --card:#fff; --text:#1f2a24; --muted:#6b756f; --line:#dcd8cf; --accent:#2f6b4f; --wa:#1f9d55; --mail:#2b5c9e; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#141816; --card:#1d2320; --text:#e8ece9; --muted:#9aa49e; --line:#333b37; --accent:#6fbf96; --wa:#2fb566; --mail:#5b8fd6; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  main { max-width:640px; margin:0 auto; padding:20px 16px 40px; }
  h1 { font-size:20px; margin:0 0 4px; }
  p.sub { margin:0 0 18px; color:var(--muted); }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; margin-bottom:14px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .full { grid-column:1 / -1; }
  .guests { display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; }
  label { display:block; font-size:13px; color:var(--muted); margin-bottom:4px; }
  input, select, textarea { width:100%; padding:10px; border:1px solid var(--line); border-radius:8px; background:var(--bg); color:var(--text); font:inherit; }
  input:focus, select:focus, textarea:focus { outline:2px solid var(--accent); outline-offset:-1px; }
  .amount input { font-size:20px; font-weight:600; }
  textarea { min-height:280px; resize:vertical; }
  .row { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
  .link { background:none; border:0; color:var(--accent); cursor:pointer; font:inherit; font-size:13px; padding:0; }
  .actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .btn { display:block; text-align:center; padding:12px; border:0; border-radius:10px; color:#fff; font:inherit; font-weight:600; cursor:pointer; }
  .btn.wa { background:var(--wa); } .btn.mail { background:var(--mail); }
  .btn.copy { background:transparent; color:var(--text); border:1px solid var(--line); grid-column:1 / -1; }
  .btn:disabled { opacity:.45; cursor:not-allowed; }
  .hint { color:var(--muted); font-size:13px; margin-top:8px; min-height:1.2em; }
  @media (max-width:480px) { .grid, .actions { grid-template-columns:1fr; } }
</style>
</head>
<body>
<main>
  <h1>Payment confirmation</h1>
  <p class="sub">Enter the amount received, check the message, then send it on WhatsApp or email.</p>

  <div class="card grid">
    <div class="full amount">
      <label for="amount">Amount received (₹) *</label>
      <input id="amount" type="number" inputmode="decimal" min="0" step="1" placeholder="e.g. 5000" autofocus>
    </div>
    <div>
      <label for="total">Total booking amount (₹)</label>
      <input id="total" type="number" inputmode="decimal" min="0" step="1" placeholder="optional">
    </div>
    <div>
      <label for="mode">Payment mode</label>
      <select id="mode">
        <option>UPI</option><option>Bank transfer</option><option>Cash</option><option>Card</option><option value="">—</option>
      </select>
    </div>
    <div>
      <label for="name">Guest name</label>
      <input id="name" type="text" placeholder="optional">
    </div>
    <div class="full guests">
      <div><label for="adults">Adults</label><input id="adults" type="number" min="1" inputmode="numeric" value="${esc(prefill.guests)}"></div>
      <div><label for="children">Children</label><input id="children" type="number" min="0" inputmode="numeric" placeholder="0"></div>
      <div><label for="staff">Staff</label><input id="staff" type="number" min="0" inputmode="numeric" placeholder="0"></div>
    </div>
    <div>
      <label for="checkin">Check-in</label>
      <input id="checkin" type="date" value="${esc(prefill.check_in)}">
    </div>
    <div>
      <label for="checkout">Check-out</label>
      <input id="checkout" type="date" value="${esc(prefill.check_out)}">
    </div>
    <div>
      <label for="phone">Guest WhatsApp number</label>
      <input id="phone" type="tel" placeholder="91XXXXXXXXXX" value="${esc(prefill.phone)}">
    </div>
    <div>
      <label for="email">Guest email</label>
      <input id="email" type="email" placeholder="for email confirmation">
    </div>
  </div>

  <div class="card">
    <div class="row">
      <label for="message" style="margin:0">Message preview (editable)</label>
      <button type="button" class="link" id="reset" hidden>Reset to template</button>
    </div>
    <textarea id="message"></textarea>
  </div>

  <div class="actions">
    <button type="button" class="btn wa" id="sendWa">💬 Send on WhatsApp</button>
    <button type="button" class="btn mail" id="sendMail">✉️ Send by Email</button>
    <button type="button" class="btn copy" id="copy">Copy message</button>
  </div>
  <div class="hint" id="hint"></div>
</main>

<script>
const PREFILL = ${toScriptJson(prefill)};
const $ = (id) => document.getElementById(id);
const fields = ['amount', 'total', 'mode', 'name', 'adults', 'children', 'staff', 'checkin', 'checkout', 'phone', 'email'];
let edited = false;

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const buildMessage = () => {
  const amount = parseFloat($('amount').value);
  const total = parseFloat($('total').value);
  const name = $('name').value.trim();
  const mode = $('mode').value;
  const n = (id) => Math.max(0, parseInt($(id).value, 10) || 0);
  const a = n('adults'), c = n('children'), st = n('staff');
  const guests = [a && a + ' adult' + (a !== 1 ? 's' : ''), c && c + (c !== 1 ? ' children' : ' child'), st && st + ' staff'].filter(Boolean).join(', ');
  const ci = $('checkin').value, co = $('checkout').value;
  const nights = ci && co ? Math.round((Date.parse(co) - Date.parse(ci)) / 86400000) : 0;

  const lines = [];
  lines.push(name ? 'Hello ' + name + ',' : 'Hello,');
  lines.push('');
  lines.push('Thank you! We have received your payment of ' + (amount > 0 ? inr(amount) : '₹____') +
    (mode ? ' via ' + mode : '') + ' for your stay at Malbagadh Homestay.');
  lines.push('');
  lines.push('Booking details:');
  if (ci) lines.push('• Check-in: ' + fmtDate(ci));
  if (co) lines.push('• Check-out: ' + fmtDate(co) + (nights > 0 ? ' (' + nights + ' night' + (nights !== 1 ? 's' : '') + ')' : ''));
  if (guests) lines.push('• Guests: ' + guests);
  if (total > 0) {
    lines.push('• Total amount: ' + inr(total));
    lines.push('• Amount received: ' + (amount > 0 ? inr(amount) : '₹____'));
    const balance = total - (amount || 0);
    lines.push(balance > 0 ? '• Balance due: ' + inr(balance) : '• Fully paid ✅');
  }
  lines.push('');
  lines.push('Your booking is confirmed. We look forward to hosting you!');
  lines.push('');
  lines.push('Warm regards,');
  lines.push('Malbagadh Homestay');
  lines.push('📞 +91 98370 56370');
  return lines.join('\\n');
};

const refresh = () => {
  if (!edited) $('message').value = buildMessage();
  const hasAmount = parseFloat($('amount').value) > 0;
  const phone = $('phone').value.replace(/\\D/g, '');
  $('sendWa').disabled = !hasAmount || phone.length < 10;
  $('sendMail').disabled = !hasAmount;
  $('hint').textContent = !hasAmount ? 'Enter the amount received to enable sending.'
    : phone.length < 10 ? 'Add the guest’s WhatsApp number to send on WhatsApp.' : '';
};

fields.forEach((f) => $(f).addEventListener('input', refresh));
$('message').addEventListener('input', () => { edited = true; $('reset').hidden = false; });
$('reset').addEventListener('click', () => { edited = false; $('reset').hidden = true; refresh(); });

$('sendWa').addEventListener('click', () => {
  let phone = $('phone').value.replace(/\\D/g, '');
  if (phone.length === 10) phone = '91' + phone;
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent($('message').value), '_blank');
});

// Email goes through the admin Email Manager (login required), which sends a designed
// email via Resend and logs it in History. Everything entered here is carried over.
$('sendMail').addEventListener('click', () => {
  const q = new URLSearchParams({
    template: 'payment_received',
    amount: $('amount').value, total: $('total').value, payment_mode: $('mode').value,
    guest_name: $('name').value.trim(), guest_email: $('email').value.trim(),
    adults: $('adults').value, children: $('children').value, staff: $('staff').value, check_in: $('checkin').value, check_out: $('checkout').value
  });
  if (PREFILL.bookingKey) q.set('booking', PREFILL.bookingKey);
  window.open('/admin?' + q.toString(), '_blank');
});

$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('message').value); $('hint').textContent = 'Message copied.'; }
  catch { $('message').select(); $('hint').textContent = 'Press Ctrl/Cmd+C to copy.'; }
});

refresh();
</script>
</body>
</html>`;
};

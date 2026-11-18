// HTML for the admin Email Manager (/admin). Plain HTML + vanilla JS, served by Express.

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const BASE_CSS = `
  :root { --bg:#f5f3ee; --card:#fff; --text:#1f2a24; --muted:#6b756f; --line:#dcd8cf; --accent:#2f6b4f; --accent-ink:#fff; --ok:#1f8a4c; --bad:#c0392b; --warn:#9a6a00; --warn-bg:#fff4d6; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#141816; --card:#1d2320; --text:#e8ece9; --muted:#9aa49e; --line:#333b37; --accent:#6fbf96; --accent-ink:#0f1a14; --ok:#5ccf8c; --bad:#ef7a6d; --warn:#f0c560; --warn-bg:#3a3020; }
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  input, select, textarea, button { font:inherit; }
  input, select, textarea { width:100%; padding:9px 10px; border:1px solid var(--line); border-radius:8px; background:var(--bg); color:var(--text); }
  input:focus, select:focus, textarea:focus { outline:2px solid var(--accent); outline-offset:-1px; }
  label { display:block; font-size:13px; color:var(--muted); margin-bottom:4px; }
  .btn { border:0; border-radius:8px; padding:10px 16px; background:var(--accent); color:var(--accent-ink); font-weight:600; cursor:pointer; }
  .btn.ghost { background:transparent; color:var(--text); border:1px solid var(--line); }
  .btn.small { padding:5px 10px; font-size:13px; }
  .btn:disabled { opacity:.45; cursor:not-allowed; }
`;

export const renderLoginPage = (error = '', next = '/admin') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Email Manager · Login</title>
<style>${BASE_CSS}
  main { max-width:360px; margin:12vh auto; padding:0 16px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:20px; }
  h1 { font-size:20px; margin:0 0 14px; } .err { color:var(--bad); font-size:14px; margin:0 0 10px; }
  .btn { width:100%; margin-top:12px; }
</style></head>
<body><main><div class="card">
  <h1>Malbagadh · Email Manager</h1>
  ${error ? `<p class="err">${esc(error)}</p>` : ''}
  <form method="post" action="/admin/login">
    <input type="hidden" name="next" value="${esc(String(next || '/admin').startsWith('/admin') ? next : '/admin')}">
    <label for="pw">Password</label>
    <input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
    <button class="btn" type="submit">Log in</button>
  </form>
</div></main></body></html>`;

export const renderSetupPage = (error = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Email Manager · Setup</title>
<style>${BASE_CSS}
  main { max-width:400px; margin:10vh auto; padding:0 16px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:20px; }
  h1 { font-size:20px; margin:0 0 8px; } p { color:var(--muted); font-size:14px; margin:0 0 14px; }
  .err { color:var(--bad); } .field { margin-bottom:12px; } .btn { width:100%; margin-top:4px; }
  code { background:var(--bg); padding:1px 5px; border-radius:4px; }
</style></head>
<body><main><div class="card">
  <h1>Set up Email Manager</h1>
  <p>Find the <b>setup code</b> in your Render dashboard → backend service → <b>Logs</b>
     (line starting <code>[Admin] Email Manager setup code</code>). Then choose your admin password.</p>
  ${error ? `<p class="err">${esc(error)}</p>` : ''}
  <form method="post" action="/admin/setup">
    <div class="field"><label for="code">Setup code</label><input id="code" name="code" autocomplete="off" autofocus required></div>
    <div class="field"><label for="pw">New admin password (min 8 characters)</label><input id="pw" name="password" type="password" autocomplete="new-password" minlength="8" required></div>
    <div class="field"><label for="pw2">Confirm password</label><input id="pw2" name="confirm" type="password" autocomplete="new-password" minlength="8" required></div>
    <button class="btn" type="submit">Save password &amp; continue</button>
  </form>
</div></main></body></html>`;

export const renderAdminPage = ({ emailConfigured, templates, defaults = {}, loginRequired = true }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Email Manager · Malbagadh</title>
<style>${BASE_CSS}
  header { display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--line); background:var(--card); flex-wrap:wrap; }
  header h1 { font-size:17px; margin:0; flex:1; }
  nav { display:flex; gap:4px; }
  nav button { background:none; border:0; padding:7px 12px; border-radius:8px; color:var(--muted); cursor:pointer; font-weight:600; }
  nav button[aria-selected="true"] { background:var(--bg); color:var(--text); }
  .banner { background:var(--warn-bg); color:var(--warn); padding:10px 16px; font-size:14px; }
  main { max-width:1200px; margin:0 auto; padding:16px; }
  .compose { display:grid; grid-template-columns:minmax(0,420px) minmax(0,1fr); gap:16px; align-items:start; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .full { grid-column:1 / -1; }
  .section-label { font-size:12px; letter-spacing:1px; text-transform:uppercase; color:var(--muted); font-weight:700; margin:4px 0 -2px; }
  .preview { position:sticky; top:16px; }
  .subject { font-weight:600; margin:0 0 10px; word-break:break-word; }
  .subject span { color:var(--muted); font-weight:400; }
  iframe { width:100%; height:70vh; min-height:480px; border:1px solid var(--line); border-radius:8px; background:#f5f3ee; }
  .sendbar { display:flex; gap:10px; align-items:center; margin-top:14px; flex-wrap:wrap; }
  .msg { font-size:14px; } .msg.ok { color:var(--ok); } .msg.bad { color:var(--bad); }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th, td { text-align:left; padding:9px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { color:var(--muted); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.5px; }
  .pill { display:inline-block; padding:2px 8px; border-radius:99px; font-size:12px; font-weight:600; }
  .pill.sent { background:color-mix(in srgb, var(--ok) 15%, transparent); color:var(--ok); }
  .pill.opened { background:color-mix(in srgb, var(--accent) 15%, transparent); color:var(--accent); }
  .pill.failed { background:color-mix(in srgb, var(--bad) 15%, transparent); color:var(--bad); }
  .err-text { color:var(--bad); font-size:12px; margin-top:3px; }
  .muted { color:var(--muted); }
  .table-wrap { overflow-x:auto; }
  .settings { max-width:640px; display:grid; gap:16px; }
  .guests { display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; }
  .upi-box { background:var(--bg); border:1px dashed var(--line); border-radius:8px; padding:9px 10px; font-size:12px; word-break:break-all; color:var(--muted); }
  .actions { white-space:nowrap; display:flex; gap:6px; }
  [hidden] { display:none !important; }
  @media (max-width:860px) { .compose { grid-template-columns:1fr; } .preview { position:static; } iframe { height:60vh; } }
  @media (max-width:480px) { .grid { grid-template-columns:1fr; } }
</style></head>
<body>
<header>
  <h1>Malbagadh · Email Manager</h1>
  <nav role="tablist">
    <button role="tab" aria-selected="true" data-tab="compose">Compose</button>
    <button role="tab" aria-selected="false" data-tab="history">History</button>
    <button role="tab" aria-selected="false" data-tab="settings">Settings</button>
  </nav>
  ${loginRequired ? '<form method="post" action="/admin/logout"><button class="btn ghost small" type="submit">Log out</button></form>' : ''}
</header>

<main>
  <section id="tab-compose" class="compose">
    <div class="card grid">
      <div class="full">
        <label for="booking">Fill from an existing booking</label>
        <select id="booking"><option value="">— Manual entry —</option></select>
      </div>
      <div class="full">
        <label for="template">Email template</label>
        <select id="template">
          ${Object.entries(templates).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('')}
        </select>
      </div>

      <div class="full section-label">Emails</div>
      <div class="full"><label for="guest_email">To (guest's) email *</label><input id="guest_email" type="email" autocomplete="off" placeholder="guest@example.com"></div>
      <div data-resend-only><label for="from_email">From email <span class="muted">(Resend only)</span></label><input id="from_email" type="email" autocomplete="off" placeholder="bookings@send.malbagadh.in"></div>
      <div data-resend-only><label for="reply_to">Reply-to email <span class="muted">(Resend only)</span></label><input id="reply_to" type="email" autocomplete="off" placeholder="e.g. your Gmail"></div>

      <div class="full section-label">Guest &amp; booking</div>
      <div><label for="guest_name">Guest name</label><input id="guest_name" autocomplete="off"></div>
      <div><label for="booking_ref">Booking ID</label><input id="booking_ref" autocomplete="off"></div>
      <div><label for="check_in">Check-in *</label><input id="check_in" type="date"></div>
      <div><label for="check_out">Check-out *</label><input id="check_out" type="date"></div>
      <div class="full guests">
        <div><label for="adults">Adults *</label><input id="adults" type="number" min="1" inputmode="numeric"></div>
        <div><label for="children">Children</label><input id="children" type="number" min="0" inputmode="numeric" placeholder="0"></div>
        <div><label for="staff">Staff</label><input id="staff" type="number" min="0" inputmode="numeric" placeholder="0" title="Drivers / helpers travelling with the guests"></div>
      </div>

      <div class="full section-label">Payment</div>
      <div><label for="amount" id="amount_label">Amount (₹)</label><input id="amount" type="number" min="0" step="1" inputmode="decimal"></div>
      <div data-for="payment_received"><label for="total">Total booking amount (₹)</label><input id="total" type="number" min="0" step="1" inputmode="decimal" placeholder="optional"></div>
      <div data-for="payment_received"><label for="payment_mode">Payment mode</label>
        <select id="payment_mode"><option>UPI</option><option>Bank transfer</option><option>Cash</option><option>Card</option><option value="">—</option></select>
      </div>
      <div class="full" data-for="booking_received">
        <label>UPI payment request <span class="muted">(made automatically from amount + booking ID)</span></label>
        <p class="muted" style="font-size:12px;margin:0 0 6px">Share the <b>payment link</b> (not the raw upi:// link) — it lets the guest pick GPay / PhonePe / Paytm instead of opening WhatsApp Pay.</p>
        <div class="upi-box"><code id="upi_link">Enter the amount to create the payment request</code></div>
        <div class="sendbar" style="margin-top:8px">
          <button type="button" class="btn ghost small" id="copy_upi" disabled>Copy payment link</button>
          <a class="btn ghost small" id="open_pay" target="_blank" rel="noopener" hidden>Open pay page</a>
        </div>
      </div>

      <div class="full"><label for="note">Personal note (optional)</label><textarea id="note" rows="3" placeholder="Added under the greeting, e.g. directions or check-in time"></textarea></div>
    </div>

    <div class="card preview">
      <p class="subject"><span>Subject:</span> <span id="subject"></span></p>
      <iframe id="frame" title="Email preview" sandbox></iframe>
      <div class="sendbar">
        <button class="btn" id="gmail">✉️ Open in Gmail (designed)</button>
        <button class="btn ghost" id="gmailtext">Gmail – plain text</button>
        <button class="btn ghost" id="mailapp">Other mail app</button>
        <button class="btn ghost" id="copyhtml">Copy designed email</button>
        <button class="btn ghost" id="send" data-resend-only>Send via Resend</button>
        <button class="btn ghost" id="clear">Clear form</button>
      </div>
      <p class="msg" id="msg" role="status" style="margin:10px 0 0"></p>
      <p class="muted" style="font-size:13px;margin:8px 0 0">
        <b>Open in Gmail (designed)</b> copies the template and opens Gmail with To + Subject filled in —
        click the message box, <b>paste</b> (Ctrl+V / ⌘V, or long-press → Paste on phone) and press Send.
        Gmail links can't carry designs, so this paste step is needed.
      </p>
    </div>
  </section>

  <section id="tab-history" class="card" hidden>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Sent</th><th>From → To</th><th>Template</th><th>Booking</th><th>Status</th><th></th></tr></thead>
        <tbody id="history"><tr><td colspan="6" class="muted">Loading…</td></tr></tbody>
      </table>
    </div>
  </section>

  <section id="tab-settings" class="settings" hidden>
    <div class="card grid">
      <div class="full section-label" style="margin-top:0">UPI payments</div>
      <div><label for="s_upi">UPI ID</label><input id="s_upi" autocomplete="off" placeholder="9105056370@pthdfc"></div>
      <div><label for="s_upi_name">Payee name</label><input id="s_upi_name" autocomplete="off" placeholder="Kyari"></div>
      <div class="full section-label">Direct sending via Resend (optional)</div>
      <div class="full">
        <label for="s_key">Resend API key</label>
        <input id="s_key" type="password" autocomplete="off" placeholder="re_…">
        <div class="muted" style="font-size:13px;margin-top:4px" id="s_key_status"></div>
      </div>
      <div><label for="s_from">Default From email</label><input id="s_from" type="email" placeholder="bookings@send.malbagadh.in"></div>
      <div><label for="s_reply">Default Reply-to email</label><input id="s_reply" type="email" placeholder="optional, e.g. your Gmail"></div>
      <div class="full sendbar" style="margin-top:0">
        <button class="btn" id="s_save">Save settings</button>
        <button class="btn ghost" id="s_remove" hidden>Remove API key</button>
        <span class="msg" id="s_msg" role="status"></span>
      </div>
    </div>

    <div class="card grid" id="pw_card">
      <div class="full section-label">Admin password</div>
      <div><label for="p_current">Current password</label><input id="p_current" type="password" autocomplete="current-password"></div>
      <div><label for="p_new">New password (min 8)</label><input id="p_new" type="password" autocomplete="new-password"></div>
      <div class="full sendbar" style="margin-top:0">
        <button class="btn" id="p_save">Change password</button>
        <span class="msg" id="p_msg" role="status"></span>
      </div>
    </div>
  </section>
</main>

<script>
const TEMPLATES = ${JSON.stringify(templates).replace(/</g, '\\u003c')};
let RESEND_ON = ${emailConfigured ? 'true' : 'false'};
// Resend-only fields/buttons appear only once a Resend API key is saved in Settings
const syncResend = () => document.querySelectorAll('[data-resend-only]').forEach((el) => { el.hidden = !RESEND_ON; });
const DEFAULTS =${JSON.stringify(defaults).replace(/</g, '\\u003c')};
const SENDER_FIELDS = ['from_email', 'reply_to'];
const FIELDS = ['from_email', 'reply_to', 'guest_name', 'guest_email', 'booking_ref', 'adults', 'children', 'staff', 'check_in', 'check_out', 'amount', 'total', 'payment_mode', 'note'];
const $ = (id) => document.getElementById(id);
const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let bookings = [];

const api = async (path, body) => {
  const res = await fetch('/admin/api' + path, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (res.status === 401) { location.reload(); throw new Error('Logged out'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !('success' in data)) throw new Error(data.error || 'Request failed');
  return data;
};

const formData = () => Object.fromEntries(FIELDS.map((f) => [f, $(f).value]));
const setForm = (d) => {
  if (d.guests !== undefined && d.adults === undefined) d = { ...d, adults: d.guests }; // older entries had one guests number
  FIELDS.forEach((f) => { if (d[f] !== undefined && d[f] !== null) $(f).value = d[f]; });
};

// Template-specific fields
const syncTemplate = () => {
  const t = $('template').value;
  document.querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== t; });
  $('amount_label').textContent = t === 'payment_received' ? 'Amount received (₹) *' : 'Amount to pay (₹) *';
};

// Sender emails: server defaults, overridden by whatever the admin used last on this device
const loadSender = () => {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('mb_sender') || '{}'); } catch {}
  SENDER_FIELDS.forEach((f) => { $(f).value = saved[f] ?? DEFAULTS[f] ?? ''; });
};
const saveSender = () => {
  try { localStorage.setItem('mb_sender', JSON.stringify(Object.fromEntries(SENDER_FIELDS.map((f) => [f, $(f).value.trim()])))); } catch {}
};

const EMAIL_OK = (v) => /^[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+$/.test(String(v).trim());
// Returns what's still missing, or '' when the email is ready to send
const missing = () => {
  const d = formData();
  if (!EMAIL_OK(d.guest_email)) return 'guest email';
  if (!d.check_in || !d.check_out) return 'check-in and check-out dates';
  if (d.check_out <= d.check_in) return 'a check-out date after check-in';
  if (!(parseInt(d.adults, 10) > 0)) return 'number of adults';
  if (!(parseFloat(d.amount) > 0)) return 'amount';
  return '';
};

// Latest rendered email { subject, html, text }. Buttons stay disabled until it matches the form,
// so clicks can open Gmail synchronously (phones block app/popup opens after an await).
let lastPreview = null;
const SEND_BUTTONS = ['gmail', 'gmailtext', 'mailapp', 'copyhtml', 'send'];
const setButtons = () => {
  const blocked = Boolean(missing()) || !lastPreview;
  SEND_BUTTONS.forEach((id) => { $(id).disabled = blocked; });
};

let previewTimer;
const refreshPreview = () => {
  clearTimeout(previewTimer);
  lastPreview = null;
  setButtons();
  previewTimer = setTimeout(async () => {
    try {
      lastPreview = await api('/preview', { template: $('template').value, data: formData() });
      $('subject').textContent = lastPreview.subject;
      $('frame').srcdoc = lastPreview.html;
      $('upi_link').textContent = lastPreview.upi_link || 'Enter the amount to create the payment request';
      $('copy_upi').disabled = !lastPreview.upi_link;
      $('open_pay').hidden = !lastPreview.pay_url;
      if (lastPreview.pay_url) $('open_pay').href = lastPreview.pay_url;
    } catch (e) { $('subject').textContent = e.message; }
    setButtons();
  }, 250);
  const need = missing();
  if (!$('msg').classList.contains('ok') && !$('msg').classList.contains('bad')) {
    $('msg').textContent = need ? 'Enter ' + need + ' to continue.' : '';
  }
};

// --- Open in Gmail / mail app ---
// Gmail's compose link only accepts plain text, so to get the designed template into your own
// Gmail we copy it as rich HTML first, then open Gmail with To + Subject — you just paste.
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isMobile = isIOS || /Android|Mobi/i.test(navigator.userAgent);
const enc = encodeURIComponent;
const pasteKey = isMobile ? 'long-press → Paste' : (/Mac/i.test(navigator.platform) ? '⌘V' : 'Ctrl+V');

const emailBodyHtml = (html) => { const m = html.match(/<body[^>]*>([\\s\\S]*)<\\/body>/i); return m ? m[1] : html; };

// Copies rich HTML synchronously (must run inside the click, before Gmail takes focus).
const copyRich = (html, text) => {
  // 1) copy-event route: exact HTML + plain-text fallback
  let done = false;
  const onCopy = (e) => { e.clipboardData.setData('text/html', html); e.clipboardData.setData('text/plain', text); e.preventDefault(); done = true; };
  document.addEventListener('copy', onCopy);
  try { document.execCommand('copy'); } catch {}
  document.removeEventListener('copy', onCopy);
  if (done) return true;
  // 2) selection route (iPhone Safari): select a hidden rendered copy and copy it
  const holder = document.createElement('div');
  holder.contentEditable = 'true';
  holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:600px;';
  holder.innerHTML = html;
  document.body.appendChild(holder);
  const range = document.createRange(); range.selectNodeContents(holder);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch {}
  sel.removeAllRanges(); holder.remove();
  return ok;
};

const openGmail = (to, subject, body) => {
  const b = body ? '&body=' + enc(body) : '';
  if (isIOS) {
    // Gmail iPhone app; if it isn't installed the page stays visible → fall back to the mail app
    location.href = 'googlegmail://co?to=' + enc(to) + '&subject=' + enc(subject) + b;
    setTimeout(() => { if (!document.hidden) location.href = 'mailto:' + enc(to) + '?subject=' + enc(subject) + b; }, 1500);
  } else if (isMobile) {
    location.href = 'mailto:' + enc(to) + '?subject=' + enc(subject) + b; // Android → Gmail app
  } else {
    window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + enc(to) + '&su=' + enc(subject) + (body ? '&body=' + enc(body) : ''), '_blank');
  }
};

const logDraft = (channel) => api('/emails/draft', { template: $('template').value, data: formData(), channel }).catch(() => {});
const say = (cls, text) => { $('msg').className = 'msg ' + cls; $('msg').textContent = text; };

$('gmail').addEventListener('click', () => {
  const to = $('guest_email').value.trim(), { subject, html, text } = lastPreview;
  const copied = copyRich(emailBodyHtml(html), text);
  if (copied) {
    openGmail(to, subject, ''); // empty body — paste the design into it
    say('ok', '✓ Designed email copied. In Gmail, tap the message box and paste (' + pasteKey + '), then press Send.');
  } else {
    openGmail(to, subject, text); // couldn't copy → at least send the plain-text version
    say('bad', 'This browser blocked copying the design, so Gmail opened with the plain-text version.');
  }
  logDraft('gmail');
});

$('gmailtext').addEventListener('click', () => {
  const { subject, text } = lastPreview;
  openGmail($('guest_email').value.trim(), subject, text);
  say('ok', '✓ Opened in Gmail with the plain-text message — press Send there.');
  logDraft('gmail');
});

$('mailapp').addEventListener('click', () => {
  const { subject, text } = lastPreview;
  location.href = 'mailto:' + enc($('guest_email').value.trim()) + '?subject=' + enc(subject) + '&body=' + enc(text);
  say('ok', '✓ Opened in your mail app — press Send there.');
  logDraft('mail app');
});

$('copy_upi').addEventListener('click', async () => {
  // Share the https pay page, not the raw upi:// link — inside WhatsApp a upi:// link opens WhatsApp Pay.
  try { await navigator.clipboard.writeText(lastPreview.pay_url); $('copy_upi').textContent = 'Copied ✓'; setTimeout(() => { $('copy_upi').textContent = 'Copy payment link'; }, 1500); }
  catch { prompt('Copy payment link:', lastPreview.pay_url); }
});

$('copyhtml').addEventListener('click', () => {
  const ok = copyRich(emailBodyHtml(lastPreview.html), lastPreview.text);
  say(ok ? 'ok' : 'bad', ok ? '✓ Designed email copied — paste it into any email (' + pasteKey + ').' : 'Copy failed — select the preview and copy manually.');
});

const loadBookings = async () => {
  try {
    bookings = await api('/bookings');
    const sel = $('booking');
    bookings.forEach((b) => {
      const o = document.createElement('option');
      o.value = b.key;
      o.textContent = [b.booking_ref, b.source, b.check_in + ' → ' + b.check_out, b.guest_name || (b.guest_phone ? '+' + b.guest_phone.replace(/\\D/g, '') : ''), b.status]
        .filter(Boolean).join(' · ');
      sel.appendChild(o);
    });
  } catch (e) { console.error(e); }
};

const applyBooking = (key) => {
  const b = bookings.find((x) => x.key === key);
  if (!b) return;
  setForm({ guest_name: b.guest_name, booking_ref: b.booking_ref, adults: b.adults, children: '', staff: '', check_in: b.check_in, check_out: b.check_out, total: b.total || '' });
  refreshPreview();
};

$('booking').addEventListener('change', (e) => applyBooking(e.target.value));
$('template').addEventListener('change', () => { syncTemplate(); refreshPreview(); });
FIELDS.forEach((f) => $(f).addEventListener('input', () => { $('msg').className = 'msg'; refreshPreview(); }));
SENDER_FIELDS.forEach((f) => $(f).addEventListener('change', saveSender));

$('clear').addEventListener('click', () => {
  FIELDS.forEach((f) => { if (f !== 'payment_mode' && !SENDER_FIELDS.includes(f)) $(f).value = ''; });
  $('booking').value = ''; $('msg').className = 'msg'; refreshPreview();
});

$('send').addEventListener('click', async () => {
  const to = $('guest_email').value.trim();
  if (!EMAIL_OK($('from_email').value)) { $('msg').className = 'msg bad'; $('msg').textContent = 'Enter the From email to send via Resend.'; return; }
  if (!confirm('Send "' + $('subject').textContent + '"\\n\\nFrom: ' + $('from_email').value.trim() + '\\nTo: ' + to + '?')) return;
  saveSender();
  $('send').disabled = true; $('msg').className = 'msg'; $('msg').textContent = 'Sending…';
  try {
    const r = await api('/send', { template: $('template').value, data: formData() });
    $('msg').className = 'msg ' + (r.success ? 'ok' : 'bad');
    $('msg').textContent = r.success ? '✓ Sent to ' + to : 'Failed: ' + r.error;
  } catch (e) {
    $('msg').className = 'msg bad'; $('msg').textContent = 'Failed: ' + e.message;
  }
  setButtons();
});

// --- History ---
let history = [];
const loadHistory = async () => {
  const tbody = $('history');
  try {
    history = await api('/emails');
    if (!history.length) { tbody.innerHTML = '<tr><td colspan="6" class="muted">No emails sent yet.</td></tr>'; return; }
    tbody.innerHTML = history.map((e) => '<tr>' +
      '<td>' + escHtml(new Date(e.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })) + (e.resent_from ? '<div class="muted" style="font-size:12px">resend of #' + e.resent_from + '</div>' : '') + '</td>' +
      '<td>' + escHtml(e.guest_name || '') + '<div class="muted">' + escHtml(e.status === 'opened'
        ? 'via ' + (e.provider_id || 'Gmail') + ' → ' + e.to_email
        : (e.data.from_email || '?') + ' → ' + e.to_email) + '</div></td>' +
      '<td>' + escHtml(TEMPLATES[e.template] || e.template) + '</td>' +
      '<td>' + escHtml(e.booking_ref || '—') + '</td>' +
      '<td><span class="pill ' + escHtml(e.status) + '">' + escHtml(e.status) + '</span>' + (e.error ? '<div class="err-text">' + escHtml(e.error) + '</div>' : '') + '</td>' +
      '<td><div class="actions"><button class="btn ghost small" data-edit="' + e.id + '">Open again</button>' +
        (RESEND_ON ? '<button class="btn ghost small" data-resend="' + e.id + '">Resend</button>' : '') + '</div></td>' +
      '</tr>').join('');
  } catch (e) { tbody.innerHTML = '<tr><td colspan="6" class="err-text">' + escHtml(e.message) + '</td></tr>'; }
};

$('history').addEventListener('click', async (ev) => {
  const edit = ev.target.closest('[data-edit]'), resend = ev.target.closest('[data-resend]');
  if (edit) {
    const e = history.find((x) => String(x.id) === edit.dataset.edit);
    $('template').value = e.template; syncTemplate(); setForm(e.data); showTab('compose'); refreshPreview();
  } else if (resend) {
    const e = history.find((x) => String(x.id) === resend.dataset.resend);
    if (!confirm('Resend "' + e.subject + '" to ' + e.to_email + '?')) return;
    resend.disabled = true;
    try {
      const r = await api('/emails/' + e.id + '/resend', {});
      if (!r.success) alert('Failed: ' + r.error);
    } catch (err) { alert('Failed: ' + err.message); }
    loadHistory();
  }
});

// --- Tabs ---
const showTab = (name) => {
  document.querySelectorAll('nav [data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  $('tab-compose').hidden = name !== 'compose';
  $('tab-history').hidden = name !== 'history';
  $('tab-settings').hidden = name !== 'settings';
  if (name === 'history') loadHistory();
  if (name === 'settings') loadSettings();
};

// --- Settings ---
const showSettings = (s) => {
  $('s_key').value = '';
  $('s_key_status').textContent = s.resend_key_from_env ? 'Set on the server (' + s.resend_key_hint + ') — managed outside this page.'
    : s.resend_key_set ? 'Saved: ' + s.resend_key_hint + ' — paste a new key to replace it.' : 'Not set — that’s fine, emails open in your Gmail instead. Add a key only if you want to send directly from this page.';
  $('s_remove').hidden = !s.resend_key_set || s.resend_key_from_env;
  $('s_from').value = s.default_from_email || '';
  $('s_reply').value = s.default_reply_to || '';
  $('s_upi').value = s.upi_id || ''; $('s_upi_name').value = s.upi_payee_name || '';
  $('pw_card').hidden = s.password_from_env || !s.login_required;
  RESEND_ON = s.resend_key_set; syncResend(); setButtons();
  DEFAULTS.from_email = s.default_from_email; DEFAULTS.reply_to = s.default_reply_to;
};
const loadSettings = async () => {
  try { showSettings(await api('/settings')); } catch (e) { $('s_msg').className = 'msg bad'; $('s_msg').textContent = e.message; }
};
const saveSettings = async (extra) => {
  $('s_msg').className = 'msg'; $('s_msg').textContent = 'Saving…';
  try {
    const r = await api('/settings', { resend_api_key: $('s_key').value, default_from_email: $('s_from').value, default_reply_to: $('s_reply').value, upi_id: $('s_upi').value, upi_payee_name: $('s_upi_name').value, ...extra });
    showSettings(r.settings);
    // New defaults apply to the compose form too
    try { localStorage.removeItem('mb_sender'); } catch {}
    loadSender(); refreshPreview();
    $('s_msg').className = 'msg ok'; $('s_msg').textContent = '✓ Saved';
  } catch (e) { $('s_msg').className = 'msg bad'; $('s_msg').textContent = e.message; }
};
$('s_save').addEventListener('click', () => saveSettings());
$('s_remove').addEventListener('click', () => { if (confirm('Remove the saved Resend API key? Sending will stop working.')) saveSettings({ remove_resend_key: true }); });
$('p_save').addEventListener('click', async () => {
  $('p_msg').className = 'msg'; $('p_msg').textContent = 'Saving…';
  try {
    await api('/password', { current: $('p_current').value, password: $('p_new').value });
    $('p_current').value = $('p_new').value = '';
    $('p_msg').className = 'msg ok'; $('p_msg').textContent = '✓ Password changed';
  } catch (e) { $('p_msg').className = 'msg bad'; $('p_msg').textContent = e.message; }
});
document.querySelectorAll('nav [data-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

// --- Init: optional prefill from URL, e.g. /admin?booking=req-12&template=payment_received&amount=5000 ---
(async () => {
  const q = new URLSearchParams(location.search);
  if (q.get('template') && TEMPLATES[q.get('template')]) $('template').value = q.get('template');
  syncTemplate();
  syncResend();
  loadSender();
  await loadBookings();
  if (q.get('booking')) { $('booking').value = q.get('booking'); applyBooking(q.get('booking')); }
  setForm(Object.fromEntries(FIELDS.filter((f) => q.has(f)).map((f) => [f, q.get(f)])));
  refreshPreview();
})();
</script>
</body></html>`;

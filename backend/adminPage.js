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

export const renderAdminPage = ({ emailConfigured, templates, defaults = {} }) => `<!doctype html>
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
  .pill.failed { background:color-mix(in srgb, var(--bad) 15%, transparent); color:var(--bad); }
  .err-text { color:var(--bad); font-size:12px; margin-top:3px; }
  .muted { color:var(--muted); }
  .table-wrap { overflow-x:auto; }
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
  </nav>
  <form method="post" action="/admin/logout"><button class="btn ghost small" type="submit">Log out</button></form>
</header>
${emailConfigured ? '' : '<div class="banner">Sending is not set up yet — add <b>RESEND_API_KEY</b> on the server. You can still preview emails; sends will be logged as failed.</div>'}

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
      <div><label for="from_email">From (sending) email *</label><input id="from_email" type="email" autocomplete="off" placeholder="bookings@send.malbagadh.in"></div>
      <div><label for="guest_email">To (guest's) email *</label><input id="guest_email" type="email" autocomplete="off" placeholder="guest@example.com"></div>
      <div class="full"><label for="reply_to">Reply-to email <span class="muted">(where guest replies go — optional)</span></label><input id="reply_to" type="email" autocomplete="off" placeholder="e.g. your Gmail"></div>

      <div class="full section-label">Guest &amp; booking</div>
      <div><label for="guest_name">Guest name</label><input id="guest_name" autocomplete="off"></div>
      <div><label for="booking_ref">Booking ID</label><input id="booking_ref" autocomplete="off"></div>
      <div><label for="check_in">Check-in *</label><input id="check_in" type="date"></div>
      <div><label for="check_out">Check-out *</label><input id="check_out" type="date"></div>
      <div><label for="guests">Number of guests *</label><input id="guests" type="number" min="1"></div>

      <div class="full section-label">Payment</div>
      <div><label for="amount" id="amount_label">Amount (₹)</label><input id="amount" type="number" min="0" step="1" inputmode="decimal"></div>
      <div data-for="payment_received"><label for="total">Total booking amount (₹)</label><input id="total" type="number" min="0" step="1" inputmode="decimal" placeholder="optional"></div>
      <div data-for="payment_received"><label for="payment_mode">Payment mode</label>
        <select id="payment_mode"><option>UPI</option><option>Bank transfer</option><option>Cash</option><option>Card</option><option value="">—</option></select>
      </div>
      <div class="full" data-for="booking_received"><label for="payment_link">Payment link (UPI / gateway URL)</label><input id="payment_link" type="url" placeholder="https://… or upi://…"></div>

      <div class="full"><label for="note">Personal note (optional)</label><textarea id="note" rows="3" placeholder="Added under the greeting, e.g. directions or check-in time"></textarea></div>
    </div>

    <div class="card preview">
      <p class="subject"><span>Subject:</span> <span id="subject"></span></p>
      <iframe id="frame" title="Email preview" sandbox></iframe>
      <div class="sendbar">
        <button class="btn" id="send">Send email</button>
        <button class="btn ghost" id="clear">Clear form</button>
        <span class="msg" id="msg" role="status"></span>
      </div>
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
</main>

<script>
const TEMPLATES = ${JSON.stringify(templates).replace(/</g, '\\u003c')};
const DEFAULTS = ${JSON.stringify(defaults).replace(/</g, '\\u003c')};
const SENDER_FIELDS = ['from_email', 'reply_to'];
const FIELDS = ['from_email', 'reply_to', 'guest_name', 'guest_email', 'booking_ref', 'guests', 'check_in', 'check_out', 'amount', 'total', 'payment_mode', 'payment_link', 'note'];
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
const setForm = (d) => FIELDS.forEach((f) => { if (d[f] !== undefined && d[f] !== null) $(f).value = d[f]; });

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
  if (!EMAIL_OK(d.from_email)) return 'From email';
  if (!EMAIL_OK(d.guest_email)) return 'guest email';
  if (d.reply_to.trim() && !EMAIL_OK(d.reply_to)) return 'a valid reply-to email';
  if (!d.check_in || !d.check_out) return 'check-in and check-out dates';
  if (d.check_out <= d.check_in) return 'a check-out date after check-in';
  if (!(parseInt(d.guests, 10) > 0)) return 'number of guests';
  if (!(parseFloat(d.amount) > 0)) return 'amount';
  return '';
};

let previewTimer;
const refreshPreview = () => {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(async () => {
    try {
      const { subject, html } = await api('/preview', { template: $('template').value, data: formData() });
      $('subject').textContent = subject;
      $('frame').srcdoc = html;
    } catch (e) { $('subject').textContent = e.message; }
  }, 250);
  const need = missing();
  $('send').disabled = Boolean(need);
  if (!$('msg').classList.contains('ok') && !$('msg').classList.contains('bad')) {
    $('msg').textContent = need ? 'Enter ' + need + ' to send.' : '';
  }
};

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
  setForm({ guest_name: b.guest_name, booking_ref: b.booking_ref, guests: b.guests, check_in: b.check_in, check_out: b.check_out, total: b.total || '' });
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
  $('send').disabled = false;
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
      '<td>' + escHtml(e.guest_name || '') + '<div class="muted">' + escHtml((e.data.from_email || '?') + ' → ' + e.to_email) + '</div></td>' +
      '<td>' + escHtml(TEMPLATES[e.template] || e.template) + '</td>' +
      '<td>' + escHtml(e.booking_ref || '—') + '</td>' +
      '<td><span class="pill ' + escHtml(e.status) + '">' + escHtml(e.status) + '</span>' + (e.error ? '<div class="err-text">' + escHtml(e.error) + '</div>' : '') + '</td>' +
      '<td><div class="actions"><button class="btn ghost small" data-edit="' + e.id + '">Edit &amp; send</button><button class="btn ghost small" data-resend="' + e.id + '">Resend</button></div></td>' +
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
  if (name === 'history') loadHistory();
};
document.querySelectorAll('nav [data-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

// --- Init: optional prefill from URL, e.g. /admin?booking=req-12&template=payment_received&amount=5000 ---
(async () => {
  const q = new URLSearchParams(location.search);
  if (q.get('template') && TEMPLATES[q.get('template')]) $('template').value = q.get('template');
  syncTemplate();
  loadSender();
  await loadBookings();
  if (q.get('booking')) { $('booking').value = q.get('booking'); applyBooking(q.get('booking')); }
  setForm(Object.fromEntries(FIELDS.filter((f) => q.has(f)).map((f) => [f, q.get(f)])));
  refreshPreview();
})();
</script>
</body></html>`;

// Admin Email Manager: password-protected UI + API at /admin for drafting, previewing,
// sending and re-sending guest emails. No env vars needed:
//   - First run: the server logs a one-time SETUP CODE; enter it at /admin to choose the password.
//   - Resend API key and default sender emails are set in the Settings tab (stored in the DB).
// (ADMIN_PASSWORD env var, if ever set, still works and overrides the stored password.)

import express from 'express';
import crypto from 'crypto';
import { dbAll, dbGet, dbRun } from './database.js';
import { renderEmail, sendEmail, isEmailConfigured, apiKeyHint, TEMPLATES, getDefaultFrom, getDefaultReplyTo } from './email.js';
import { renderAdminPage, renderLoginPage, renderSetupPage } from './adminPage.js';
import { loadSettings, getSetting, setSetting } from './settings.js';

const router = express.Router();
const COOKIE = 'mb_admin';
const SESSION_DAYS = 30;
const MIN_PASSWORD = 8;

// --- Password storage (scrypt hash in settings) ---
const hashPassword = (pw) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
};
const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};
const envPassword = () => (process.env.ADMIN_PASSWORD || '').trim();
const hasPassword = () => Boolean(envPassword() || getSetting('admin_password_hash'));
const checkPassword = (pw) => {
  pw = String(pw || '');
  if (envPassword()) return safeEqual(pw, envPassword());
  const [, salt, hash] = String(getSetting('admin_password_hash') || '').split('$');
  if (!salt || !hash) return false;
  return safeEqual(crypto.scryptSync(pw, salt, 64).toString('hex'), hash);
};

// One-time setup code, shown only in the server logs, needed to set the first password.
let setupCode = null;
export const initAdmin = async () => {
  await loadSettings();
  if (!getSetting('session_secret')) await setSetting('session_secret', crypto.randomBytes(32).toString('hex'));
  if (!hasPassword()) {
    setupCode = crypto.randomBytes(5).toString('hex').toUpperCase();
    console.log('==================================================================');
    console.log(`[Admin] Email Manager setup code: ${setupCode}`);
    console.log('[Admin] Open /admin and enter this code to choose your admin password.');
    console.log('==================================================================');
  }
};

// Sessions are signed with a stored secret + the current password, so changing it logs everyone out.
const sign = (value) => crypto
  .createHmac('sha256', `${getSetting('session_secret')}:${envPassword() || getSetting('admin_password_hash')}`)
  .update(value).digest('hex');

const readCookie = (req, name) => {
  const match = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

const isLoggedIn = (req) => {
  if (!hasPassword() || !getSetting('session_secret')) return false;
  const raw = readCookie(req, COOKIE);
  if (!raw) return false;
  const [expires, sig] = raw.split('.');
  return Number(expires) > Date.now() && safeEqual(sig || '', sign(expires));
};

const setSessionCookie = (req, res) => {
  const expires = String(Date.now() + SESSION_DAYS * 86400000);
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader('Set-Cookie',
    `${COOKIE}=${expires}.${sign(expires)}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure ? '; Secure' : ''}`);
};

const safeNext = (n) => (typeof n === 'string' && n.startsWith('/admin') ? n : '/admin');

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex');
  res.set('X-Frame-Options', 'DENY');
  next();
});

// --- Throttle for login / setup code guessing (per IP, in memory) ---
const attempts = new Map();
const throttled = (req) => (attempts.get(req.ip)?.until || 0) > Date.now();
const recordFailure = (req) => {
  const a = attempts.get(req.ip) || { count: 0, until: 0 };
  a.count += 1;
  if (a.count >= 8) { a.count = 0; a.until = Date.now() + 15 * 60000; }
  if (attempts.size > 1000) attempts.clear();
  attempts.set(req.ip, a);
};
const TOO_MANY = 'Too many attempts. Try again in 15 minutes.';

// --- First-time setup ---
router.post('/setup', express.urlencoded({ extended: false }), async (req, res) => {
  if (hasPassword()) return res.redirect(303, '/admin');
  if (throttled(req)) return res.status(429).type('html').send(renderSetupPage(TOO_MANY));
  const { code, password, confirm } = req.body || {};
  if (!setupCode || !safeEqual(String(code || '').trim().toUpperCase(), setupCode)) {
    recordFailure(req);
    return res.status(401).type('html').send(renderSetupPage('Wrong setup code. Check the server logs on Render.'));
  }
  if (String(password || '').length < MIN_PASSWORD) return res.status(400).type('html').send(renderSetupPage(`Password must be at least ${MIN_PASSWORD} characters.`));
  if (password !== confirm) return res.status(400).type('html').send(renderSetupPage('Passwords do not match.'));
  await setSetting('admin_password_hash', hashPassword(password));
  setupCode = null;
  attempts.delete(req.ip);
  console.log('[Admin] ✅ Admin password set');
  setSessionCookie(req, res);
  res.redirect(303, '/admin');
});

// --- Login ---
router.post('/login', express.urlencoded({ extended: false }), (req, res) => {
  if (!hasPassword()) return res.redirect(303, '/admin');
  if (throttled(req)) return res.status(429).type('html').send(renderLoginPage(TOO_MANY));
  if (checkPassword(req.body?.password)) {
    attempts.delete(req.ip);
    setSessionCookie(req, res);
    return res.redirect(303, safeNext(req.body?.next));
  }
  recordFailure(req);
  res.status(401).type('html').send(renderLoginPage('Wrong password.', req.body?.next));
});

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.redirect(303, '/admin');
});

router.get('/', (req, res) => {
  if (!hasPassword()) return res.type('html').send(renderSetupPage(setupCode ? '' : 'Server is still starting — refresh in a few seconds.'));
  if (!isLoggedIn(req)) return res.type('html').send(renderLoginPage('', req.originalUrl));
  res.type('html').send(renderAdminPage({
    emailConfigured: isEmailConfigured(), templates: TEMPLATES,
    defaults: { from_email: getDefaultFrom(), reply_to: getDefaultReplyTo() }
  }));
});

// --- JSON API (login required; JSON body required on POST so plain cross-site forms can't hit it) ---
const api = express.Router();
api.use((req, res, next) => {
  if (!isLoggedIn(req)) return res.status(401).json({ error: 'Not logged in' });
  if (req.method === 'POST' && !req.is('application/json')) return res.status(415).json({ error: 'JSON required' });
  next();
});

// --- Settings (Resend key is write-only: only a masked hint is ever returned) ---
const settingsView = () => ({
  resend_key_set: isEmailConfigured(),
  resend_key_hint: apiKeyHint(),
  resend_key_from_env: Boolean(process.env.RESEND_API_KEY),
  default_from_email: getDefaultFrom(),
  default_reply_to: getDefaultReplyTo(),
  password_from_env: Boolean(envPassword())
});

api.get('/settings', (req, res) => res.json(settingsView()));

api.post('/settings', async (req, res) => {
  try {
    const b = req.body || {};
    if (typeof b.resend_api_key === 'string' && b.resend_api_key.trim()) {
      if (!/^re_[A-Za-z0-9_-]{10,}$/.test(b.resend_api_key.trim())) return res.status(400).json({ error: 'That does not look like a Resend API key (it starts with re_)' });
      await setSetting('resend_api_key', b.resend_api_key.trim());
    }
    if (b.remove_resend_key) await setSetting('resend_api_key', null);
    if (typeof b.default_from_email === 'string') {
      const v = b.default_from_email.trim();
      if (v && !EMAIL_RE.test(v)) return res.status(400).json({ error: 'Default From email is not valid' });
      await setSetting('default_from_email', v || null);
    }
    if (typeof b.default_reply_to === 'string') {
      const v = b.default_reply_to.trim();
      if (v && !EMAIL_RE.test(v)) return res.status(400).json({ error: 'Default Reply-to email is not valid' });
      await setSetting('default_reply_to', v || null);
    }
    res.json({ success: true, settings: settingsView() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

api.post('/password', async (req, res) => {
  try {
    if (envPassword()) return res.status(400).json({ error: 'Password is set by ADMIN_PASSWORD on the server' });
    const { current, password } = req.body || {};
    if (!checkPassword(current)) return res.status(401).json({ error: 'Current password is wrong' });
    if (String(password || '').length < MIN_PASSWORD) return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD} characters` });
    await setSetting('admin_password_hash', hashPassword(password));
    setSessionCookie(req, res); // old sessions are now invalid; keep this one logged in
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Booking requests from the website + calendar bookings, newest first, for the picker
api.get('/bookings', async (req, res) => {
  try {
    const [requests, bookings] = await Promise.all([
      dbAll('SELECT id, guest_phone, check_in, check_out, guest_count, status, created_at FROM booking_requests ORDER BY created_at DESC LIMIT 200'),
      dbAll('SELECT id, platform, guest_name, check_in, check_out, guest_count, total_price, status FROM bookings ORDER BY check_in DESC LIMIT 200')
    ]);
    res.json([
      ...requests.map(r => ({
        key: `req-${r.id}`, source: 'Website request', booking_ref: `MBR${r.id}`,
        guest_name: '', guest_phone: r.guest_phone, check_in: r.check_in, check_out: r.check_out,
        guests: r.guest_count, total: null, status: r.status, created_at: r.created_at
      })),
      ...bookings.map(b => ({
        key: `bk-${b.id}`, source: b.platform, booking_ref: `MB${b.id}`,
        guest_name: b.guest_name || '', guest_phone: '', check_in: b.check_in, check_out: b.check_out,
        guests: b.guest_count, total: b.total_price || null, status: b.status
      }))
    ]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

api.post('/preview', (req, res) => {
  try {
    const { template, data } = req.body || {};
    res.json(renderEmail(template, data));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const EMAIL_RE = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !Number.isNaN(Date.parse(v));

// Everything the admin must enter before an email can go out
const validate = (data) => {
  const from = String(data.from_email || '').trim();
  const fromAddr = from.includes('<') ? (from.match(/<([^>]+)>/) || [])[1] : from;
  if (!EMAIL_RE.test(fromAddr || '')) return 'Enter a valid From (sending) email';
  if (!EMAIL_RE.test(String(data.guest_email || '').trim())) return 'Enter a valid guest (receiving) email';
  if (data.reply_to && !EMAIL_RE.test(String(data.reply_to).trim())) return 'Reply-to email is not valid';
  if (!isDate(data.check_in) || !isDate(data.check_out)) return 'Enter check-in and check-out dates';
  if (Date.parse(data.check_out) <= Date.parse(data.check_in)) return 'Check-out must be after check-in';
  if (!(parseInt(data.guests, 10) > 0)) return 'Enter the number of guests';
  if (!(parseFloat(data.amount) > 0)) return 'Enter the amount';
  return null;
};

const sendAndLog = async (template, data, resentFrom = null) => {
  const invalid = validate(data);
  if (invalid) return { status: 400, body: { error: invalid } };
  const to = String(data.guest_email).trim();

  const email = renderEmail(template, data);
  const result = await sendEmail({
    from: String(data.from_email).trim(),
    replyTo: String(data.reply_to || '').trim() || undefined,
    to, ...email
  });
  const log = await dbRun(
    `INSERT INTO email_logs (template, to_email, guest_name, booking_ref, subject, data, status, provider_id, error, resent_from, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [template, to, data.guest_name || null, data.booking_ref || null, email.subject, JSON.stringify(data),
      result.success ? 'sent' : 'failed', result.id || null, result.error || null, resentFrom, new Date().toISOString()]
  );
  return result.success
    ? { status: 200, body: { success: true, id: log.lastID } }
    : { status: 502, body: { success: false, id: log.lastID, error: result.error } };
};

api.post('/send', async (req, res) => {
  try {
    const { template, data } = req.body || {};
    if (!TEMPLATES[template]) return res.status(400).json({ error: 'Unknown template' });
    const r = await sendAndLog(template, data || {});
    res.status(r.status).json(r.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

api.get('/emails', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 200');
    res.json(rows.map(r => ({ ...r, data: (() => { try { return JSON.parse(r.data || '{}'); } catch { return {}; } })() })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

api.post('/emails/:id/resend', async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM email_logs WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Email not found' });
    const data = JSON.parse(row.data || '{}');
    if (!data.from_email) data.from_email = getDefaultFrom();
    const r = await sendAndLog(row.template, data, row.id);
    res.status(r.status).json(r.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use('/api', express.json({ limit: '100kb' }), api);

export default router;

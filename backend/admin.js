// Admin Email Manager: password-protected UI + API at /admin for drafting, previewing,
// sending and re-sending guest emails.
//
// Env: ADMIN_PASSWORD (required — /admin is disabled without it)

import express from 'express';
import crypto from 'crypto';
import { dbAll, dbGet, dbRun } from './database.js';
import { renderEmail, sendEmail, isEmailConfigured, TEMPLATES, DEFAULT_FROM_EMAIL, DEFAULT_REPLY_TO } from './email.js';
import { renderAdminPage, renderLoginPage } from './adminPage.js';

const router = express.Router();
const COOKIE = 'mb_admin';
const SESSION_DAYS = 30;

const getPassword = () => (process.env.ADMIN_PASSWORD || '').trim();
// Signing key derives from the password, so changing the password logs everyone out.
const sign = (value) => crypto.createHmac('sha256', `mb-admin:${getPassword()}`).update(value).digest('hex');

const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

const readCookie = (req, name) => {
  const match = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

const isLoggedIn = (req) => {
  if (!getPassword()) return false;
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

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex');
  res.set('X-Frame-Options', 'DENY');
  if (!getPassword()) {
    return res.status(503).type('text').send('Email Manager is disabled: set ADMIN_PASSWORD on the server.');
  }
  next();
});

// --- Login (simple in-memory throttle against password guessing) ---
const attempts = new Map();
router.post('/login', express.urlencoded({ extended: false }), (req, res) => {
  const key = req.ip;
  const a = attempts.get(key) || { count: 0, until: 0 };
  if (a.until > Date.now()) return res.status(429).type('html').send(renderLoginPage('Too many attempts. Try again in 15 minutes.'));

  if (safeEqual(String(req.body?.password || ''), getPassword())) {
    attempts.delete(key);
    setSessionCookie(req, res);
    const next = typeof req.body?.next === 'string' && req.body.next.startsWith('/admin') ? req.body.next : '/admin';
    return res.redirect(303, next);
  }
  a.count += 1;
  if (a.count >= 8) { a.count = 0; a.until = Date.now() + 15 * 60000; }
  attempts.set(key, a);
  if (attempts.size > 1000) attempts.clear();
  res.status(401).type('html').send(renderLoginPage('Wrong password.', req.body?.next));
});

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.redirect(303, '/admin');
});

router.get('/', (req, res) => {
  if (!isLoggedIn(req)) return res.type('html').send(renderLoginPage('', req.originalUrl));
  res.type('html').send(renderAdminPage({
    emailConfigured: isEmailConfigured(), templates: TEMPLATES,
    defaults: { from_email: DEFAULT_FROM_EMAIL, reply_to: DEFAULT_REPLY_TO }
  }));
});

// --- JSON API (login required; JSON body required on POST so plain cross-site forms can't hit it) ---
const api = express.Router();
api.use((req, res, next) => {
  if (!isLoggedIn(req)) return res.status(401).json({ error: 'Not logged in' });
  if (req.method === 'POST' && !req.is('application/json')) return res.status(415).json({ error: 'JSON required' });
  next();
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
    if (!data.from_email) data.from_email = DEFAULT_FROM_EMAIL;
    const r = await sendAndLog(row.template, data, row.id);
    res.status(r.status).json(r.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use('/api', express.json({ limit: '100kb' }), api);

export default router;

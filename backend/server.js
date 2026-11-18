import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, dbAll, dbRun, dbGet } from './database.js';
import { runCrawl } from './scraper.js';

import crypto from 'crypto';
import { sendSlackBookingAlert, sendSlackClickAlert } from './slack.js';
import { renderPaymentConfirmPage } from './paymentConfirm.js';
import adminRouter, { initAdmin } from './admin.js';

const app = express();
const PORT = process.env.PORT || 5001;
// Public URL of this backend — used for links placed in Slack messages
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://api.malbagadh.in').replace(/\/$/, '');

// Middleware
app.use(cors({
  origin: [
    'https://malbagadh.in',
    'https://www.malbagadh.in',
    'http://localhost:5173',
    'http://localhost:4173',
    'https://udit0425.github.io'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.set('trust proxy', true); // real client IP behind Render/Cloudflare proxy
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  '/assets/gallery',
  express.static(path.join(__dirname, '../frontend/public/assets/gallery'))
);

// Routes
// 1. Get all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const platform = req.query.platform;
    let query = 'SELECT * FROM reviews ORDER BY date DESC';
    let params = [];
    
    if (platform && platform !== 'All') {
      query = 'SELECT * FROM reviews WHERE platform = ? ORDER BY date DESC';
      params = [platform];
    }
    
    const reviews = await dbAll(query, params);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get all bookings (Central Calendar feed)
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await dbAll('SELECT * FROM bookings ORDER BY check_in ASC');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Create a direct booking
app.post('/api/bookings', async (req, res) => {
  const { check_in, check_out, guest_name, guest_count, total_price } = req.body;
  
  if (!check_in || !check_out || !guest_name) {
    return res.status(400).json({ error: 'Missing check-in date, check-out date, or guest name' });
  }
  
  try {
    const timestamp = new Date().toISOString();
    const result = await dbRun(
      'INSERT INTO bookings (platform, check_in, check_out, guest_name, guest_count, total_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Direct', check_in, check_out, guest_name, guest_count || 2, total_price || 0, 'Confirmed', timestamp]
    );
    res.status(201).json({ id: result.lastID, message: 'Booking created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3a. Submit a guest booking request — saved to DB, owner alerted in Slack
app.post('/api/booking-request', async (req, res) => {
  const { check_in, check_out, guest_phone, guest_count } = req.body;
  
  if (!check_in || !check_out || !guest_phone) {
    return res.status(400).json({ error: 'Missing check-in, check-out, or mobile number' });
  }

  try {
    const timestamp = new Date().toISOString();
    const confirmToken = crypto.randomBytes(16).toString('hex');
    const result = await dbRun(
      'INSERT INTO booking_requests (guest_phone, check_in, check_out, guest_count, status, created_at, confirm_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [guest_phone, check_in, check_out, guest_count || 2, 'Pending', timestamp, confirmToken]
    );

    console.log(`[Booking Request] ✅ Saved to DB — ID: ${result.lastID}, phone: ${guest_phone}, dates: ${check_in} → ${check_out}, guests: ${guest_count || 2}`);

    const paymentConfirmUrl = `${PUBLIC_BASE_URL}/payment-confirm?id=${result.lastID}&t=${confirmToken}`;
    const slackResult = await sendSlackBookingAlert({ check_in, check_out, guest_phone, guest_count, paymentConfirmUrl });

    if (!slackResult.success) {
      // The request is safely stored; don't fail the guest's submission.
      console.error(`[Booking Request] ⚠️ Slack alert failed: ${slackResult.error} (request ${result.lastID} is saved)`);
    }

    res.status(201).json({ success: true, id: result.lastID, notified: slackResult.success });
  } catch (error) {
    console.error(`[Booking Request] ❌ Unexpected error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Payment confirmation drafter — opened from the "Payment Confirmation" button in Slack.
// With a valid id + token the guest's details are prefilled; without them it's a blank form
// usable for any booking (Airbnb, phone, walk-in...). It only drafts: WhatsApp / email open
// with the message prefilled and the owner presses send.
app.get('/payment-confirm', async (req, res) => {
  let booking = {};
  const { id, t } = req.query;
  if (id && t) {
    try {
      const row = await dbGet('SELECT * FROM booking_requests WHERE id = ?', [id]);
      const valid = row?.confirm_token && typeof t === 'string' && t.length === row.confirm_token.length &&
        crypto.timingSafeEqual(Buffer.from(t), Buffer.from(row.confirm_token));
      if (valid) {
        booking = { id: row.id, guest_phone: row.guest_phone, check_in: row.check_in, check_out: row.check_out, guest_count: row.guest_count };
      }
    } catch (error) {
      console.error('[Payment Confirm] Lookup failed:', error.message);
    }
  }
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex');
  res.type('html').send(renderPaymentConfirmPage(booking));
});

// Admin Email Manager (password-protected)
app.use('/admin', adminRouter);

// Get all booking requests
app.get('/api/booking-requests', async (req, res) => {
  try {
    const requests = await dbAll('SELECT * FROM booking_requests ORDER BY created_at DESC');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lightweight user-agent parsing (no extra dependency)
const parseUserAgent = (ua = '') => {
  const device_type = /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Mobile' : 'Desktop';
  const os =
    /Windows/i.test(ua) ? 'Windows' :
    /iPhone|iPad|iOS/i.test(ua) ? 'iOS' :
    /Android/i.test(ua) ? 'Android' :
    /Mac OS X/i.test(ua) ? 'macOS' :
    /Linux/i.test(ua) ? 'Linux' : 'Other';
  const browser =
    /Edg\//i.test(ua) ? 'Edge' :
    /SamsungBrowser/i.test(ua) ? 'Samsung Internet' :
    /OPR\/|Opera/i.test(ua) ? 'Opera' :
    /FBAN|FBAV|Instagram/i.test(ua) ? 'In-app (FB/IG)' :
    /Chrome|CriOS/i.test(ua) ? 'Chrome' :
    /Firefox|FxiOS/i.test(ua) ? 'Firefox' :
    /Safari/i.test(ua) ? 'Safari' : 'Other';
  return { device_type, os, browser };
};

const clip = (v, n = 500) => (v == null || v === '' ? null : String(v).slice(0, n));

// IP -> city / region / ISP via ipinfo.io (free tier, no key needed; set IPINFO_TOKEN for higher limits).
// Cached in memory so repeat visitors don't trigger repeat lookups.
const geoCache = new Map();
const lookupIp = async (ip) => {
  if (!ip || /^(127\.|10\.|192\.168\.|::1|::ffff:127\.)/.test(ip)) return {};
  if (geoCache.has(ip)) return geoCache.get(ip);
  try {
    const token = process.env.IPINFO_TOKEN ? `?token=${process.env.IPINFO_TOKEN}` : '';
    const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json${token}`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return {};
    const d = await res.json();
    const geo = {
      city: d.city || null,
      region: d.region || null,
      country: d.country || null,
      postal: d.postal || null,
      isp: d.org ? d.org.replace(/^AS\d+\s*/, '') : null
    };
    if (geoCache.size > 5000) geoCache.clear();
    geoCache.set(ip, geo);
    return geo;
  } catch {
    return {};
  }
};

const asList = (v, max = 20) => (Array.isArray(v) ? v.slice(0, max).map(x => String(x).slice(0, 60)) : []);

// Record a page view (one per page load) — lets us count visits before a click
app.post('/api/track-pageview', async (req, res) => {
  const b = req.body || {};
  const userAgent = req.get('user-agent') || '';
  const { device_type, os, browser } = parseUserAgent(userAgent);
  try {
    await dbRun(
      `INSERT INTO page_views (visitor_id, session_id, ip, user_agent, device_type, os, browser, page_url, referrer,
        utm_source, utm_medium, utm_campaign, language, timezone, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [clip(b.visitor_id, 64), clip(b.session_id, 64), req.ip, clip(userAgent), device_type, os, browser,
        clip(b.page_url), clip(b.referrer), clip(b.utm_source, 100), clip(b.utm_medium, 100), clip(b.utm_campaign, 100),
        clip(b.language, 20), clip(b.timezone, 50), new Date().toISOString()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Page View] Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Track clicks on Call / WhatsApp buttons and notify on Slack
app.post('/api/track-click', async (req, res) => {
  const b = req.body || {};
  const timestamp = new Date().toISOString();
  const userAgent = req.get('user-agent') || '';
  const { device_type, os, browser } = parseUserAgent(userAgent);

  const click = {
    type: clip(b.type, 20) || 'unknown',
    source: clip(b.source, 100) || 'unknown',
    visitor_id: clip(b.visitor_id, 64),
    session_id: clip(b.session_id, 64),
    ip: req.ip,
    user_agent: clip(userAgent),
    device_type, browser, os,
    page_url: clip(b.page_url),
    landing_page: clip(b.landing_page),
    referrer: clip(b.referrer),
    utm_source: clip(b.utm_source, 100),
    utm_medium: clip(b.utm_medium, 100),
    utm_campaign: clip(b.utm_campaign, 100),
    utm_term: clip(b.utm_term, 100),
    utm_content: clip(b.utm_content, 100),
    gclid: clip(b.gclid, 200),
    fbclid: clip(b.fbclid, 200),
    screen: clip(b.screen, 20),
    viewport: clip(b.viewport, 20),
    language: clip(b.language, 20),
    timezone: clip(b.timezone, 50),
    // Populated only if the API sits behind Cloudflare (free geo headers)
    country: clip(req.get('cf-ipcountry'), 10),
    region: clip(req.get('cf-region'), 100),
    city: clip(req.get('cf-ipcity'), 100),
    dark_mode: clip(b.dark_mode, 5),
    connection: clip(b.connection, 30),
    touch: clip(b.touch, 5),
    sections_viewed: JSON.stringify(asList(b.sections_viewed)),
    dates_checked: JSON.stringify(asList(b.dates_checked, 10)),
    guests_selected: Number.isFinite(b.guests_selected) ? b.guests_selected : null,
    photos_opened: Number.isFinite(b.photos_opened) ? b.photos_opened : 0,
    booking_request_sent: b.booking_request_sent ? 1 : 0,
    time_on_page_sec: Number.isFinite(b.time_on_page_sec) ? b.time_on_page_sec : null,
    scroll_depth_pct: Number.isFinite(b.scroll_depth_pct) ? Math.min(100, b.scroll_depth_pct) : null,
    created_at: timestamp
  };

  try {
    const prior = click.visitor_id
      ? await dbGet('SELECT COUNT(*) AS n FROM contact_clicks WHERE visitor_id = ?', [click.visitor_id])
      : { n: 0 };
    click.visit_number = (prior?.n || 0) + 1;

    if (click.visitor_id) {
      const visits = await dbGet(
        'SELECT COUNT(DISTINCT session_id) AS n, MIN(created_at) AS first FROM page_views WHERE visitor_id = ?',
        [click.visitor_id]
      );
      click.visits_count = visits?.n || 1;
      click.first_seen_at = visits?.first || null;
    }

    // Fill location from IP if Cloudflare headers didn't provide it
    const geo = await lookupIp(click.ip);
    click.city = click.city || geo.city || null;
    click.region = click.region || geo.region || null;
    click.country = click.country || geo.country || null;
    click.postal = geo.postal || null;
    click.isp = geo.isp || null;

    const cols = Object.keys(click);
    await dbRun(
      `INSERT INTO contact_clicks (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
      cols.map(c => click[c])
    );

    // Send background Slack notification (clicks channel)
    sendSlackClickAlert(click).catch(err => {
      console.error('[Track Click] Slack notification error:', err.message);
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Track Click] Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// 4. Trigger manual platform sync/crawl
app.post('/api/crawl', async (req, res) => {
  try {
    const syncResult = await runCrawl();
    res.json(syncResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get crawler sync logs
app.get('/api/sync-logs', async (req, res) => {
  try {
    const logs = await dbAll('SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT 10');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get crawled gallery images
app.get('/api/gallery', async (req, res) => {
  try {
    const images = await dbAll('SELECT * FROM gallery_images ORDER BY id ASC');
    const baseUrl = `https://kyari.onrender.com`;
    
    res.json(
      images.map(image => ({
        ...image,
        url: image.url.startsWith('http')
          ? image.url
          : `${baseUrl}${image.url}`
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server and Init Database
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  try {
    // 1. Initialize SQLite Database Tables and Seed Data
    await initDb();
    await initAdmin(); // loads settings; logs a one-time setup code if no admin password yet

    // 2. Run initial crawl to sync with platform contents
    await runCrawl();
    
    // 3. Schedule auto-crawler sync every 5 minutes (300,000 ms)
    setInterval(async () => {
      try {
        await runCrawl();
      } catch (err) {
        console.error('[Scheduler] Auto-sync crawl error:', err.message);
      }
    }, 300000);
    
  } catch (dbError) {
    console.error('Database initialization failed:', dbError.message);
  }
});

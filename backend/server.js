import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, dbAll, dbRun } from './database.js';
import { runCrawl } from './scraper.js';

import { sendSlackBookingAlert } from './slack.js';

const app = express();
const PORT = process.env.PORT || 5001;

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
    const result = await dbRun(
      'INSERT INTO booking_requests (guest_phone, check_in, check_out, guest_count, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [guest_phone, check_in, check_out, guest_count || 2, 'Pending', timestamp]
    );

    console.log(`[Booking Request] ✅ Saved to DB — ID: ${result.lastID}, phone: ${guest_phone}, dates: ${check_in} → ${check_out}, guests: ${guest_count || 2}`);

    const slackResult = await sendSlackBookingAlert({ check_in, check_out, guest_phone, guest_count });

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

// Get all booking requests
app.get('/api/booking-requests', async (req, res) => {
  try {
    const requests = await dbAll('SELECT * FROM booking_requests ORDER BY created_at DESC');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

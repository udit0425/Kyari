import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, dbAll, dbRun } from './database.js';
import { runCrawl } from './scraper.js';

import qrcodeImg from 'qrcode';
import { sendWhatsAppAlert, getLatestQR, isReady } from './whatsapp.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
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

// 3a. Serve WhatsApp QR Code for Authentication
app.get('/api/whatsapp/qr', async (req, res) => {
  if (isReady()) {
    return res.send('WhatsApp is already authenticated and ready. No QR code needed.');
  }
  
  const qrString = getLatestQR();
  if (!qrString) {
    return res.status(404).send('QR code not generated yet. Try again in a few seconds.');
  }
  
  try {
    const qrBuffer = await qrcodeImg.toBuffer(qrString, {
      color: { dark: '#000000', light: '#ffffff' }
    });
    res.setHeader('Content-Type', 'image/png');
    res.send(qrBuffer);
  } catch (err) {
    res.status(500).send('Error generating QR code image');
  }
});

app.get('/api/whatsapp/status', (req, res) => {
  const ready = isReady();
  const hasQR = !!getLatestQR();
  console.log(`[WhatsApp Status] ready=${ready} hasQR=${hasQR}`);
  res.json({
    ready,
    hasQR,
    message: ready
      ? '✅ WhatsApp client is authenticated and ready to send messages.'
      : hasQR
        ? '⏳ QR code is available. Visit /api/whatsapp/qr and scan it with your phone.'
        : '❌ WhatsApp client is not ready and no QR code has been generated yet. The client may still be starting up — try again in 15 seconds.'
  });
});

// 3b. Submit a guest booking request (internal notification, no frontend redirect)
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

    // Send WhatsApp notification to the owner (9989750728)
    const ownerNumber = '9989750728';
    const message = `🏡 *NEW BOOKING REQUEST*\n\n📅 *Check-in:* ${check_in}\n📅 *Check-out:* ${check_out}\n👥 *Guests:* ${guest_count || 2}\n📱 *Guest:* +91 ${guest_phone}\n\n━━━━━━━━━━━━━━\nPlease contact the guest to confirm availability.`;

    console.log(`[Booking Request] 📲 Attempting WhatsApp notification to ${ownerNumber}...`);
    console.log(`[Booking Request] WhatsApp client ready: ${isReady()}`);
    
    const whatsappResult = await sendWhatsAppAlert(ownerNumber, message);

    console.log(`[Booking Request] WhatsApp result:`, JSON.stringify(whatsappResult));

    if (!whatsappResult.success) {
      console.error(`[Booking Request] ❌ WhatsApp failed: ${whatsappResult.error}`);
      return res.status(503).json({
        success: false,
        error: whatsappResult.error,
        bookingRequestId: result.lastID
      });
    }

    console.log(`[Booking Request] ✅ WhatsApp notification sent successfully`);
    res.status(201).json({ success: true, id: result.lastID, message: 'Booking request saved and WhatsApp notification sent successfully' });
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

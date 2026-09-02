import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import qrcodeImg from 'qrcode';

const { Client, LocalAuth } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------
// Render persistent storage
// --------------------------------------------------

const PERSISTENT_DIR = '/var/data';

const SESSION_DIR = fs.existsSync(PERSISTENT_DIR)
  ? path.join(PERSISTENT_DIR, 'whatsapp-session')
  : './.wwebjs_auth';

const QR_DIR = fs.existsSync(PERSISTENT_DIR)
  ? path.join(PERSISTENT_DIR, 'whatsapp')
  : './whatsapp';

fs.mkdirSync(QR_DIR, { recursive: true });

// --------------------------------------------------
// Resolve Chrome executable path using puppeteer's own API
// Falls back to system chrome if puppeteer's bundled one isn't found
// --------------------------------------------------
let chromePath;
try {
  const { executablePath } = await import('puppeteer');
  chromePath = executablePath();
  console.log(`[WhatsApp] Using Chrome at: ${chromePath}`);
} catch (err) {
  // Fallback — let whatsapp-web.js find it automatically
  console.warn('[WhatsApp] Could not resolve Chrome path via puppeteer API, falling back to auto-detect');
  chromePath = undefined;
}

// --------------------------------------------------
// WhatsApp client
// --------------------------------------------------

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: SESSION_DIR
  }),

  puppeteer: {
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
});

// --------------------------------------------------
// State
// --------------------------------------------------

let isClientReady = false;
let latestQR = null;
let initializing = false;

// --------------------------------------------------
// QR CODE
// --------------------------------------------------

client.on('qr', async (qr) => {
  console.log('');
  console.log('======================================================');
  console.log(' WHATSAPP QR CODE GENERATED');
  console.log('======================================================');
  console.log('Scan this QR code with the WhatsApp account that');
  console.log('will be used to send booking notifications.');
  console.log('======================================================');

  latestQR = qr;

  // Terminal QR
  qrcode.generate(qr, { small: true });

  // Save QR image
  const qrPath = path.join(QR_DIR, 'qr.png');

  try {
    await qrcodeImg.toFile(qrPath, qr, {
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    console.log(`✅ QR code saved to: ${qrPath}`);
  } catch (error) {
    console.error('❌ Failed to save QR code:', error.message);
  }
});

// --------------------------------------------------
// AUTHENTICATED
// --------------------------------------------------

client.on('authenticated', () => {
  console.log('✅ WhatsApp authentication successful');
});

// --------------------------------------------------
// READY
// --------------------------------------------------

client.on('ready', () => {
  console.log('');
  console.log('======================================================');
  console.log('✅ WHATSAPP CLIENT IS READY');
  console.log('======================================================');

  isClientReady = true;
  latestQR = null;
});

// --------------------------------------------------
// AUTH FAILURE
// --------------------------------------------------

client.on('auth_failure', (message) => {
  console.error('❌ WhatsApp authentication failure:', message);

  isClientReady = false;
});

// --------------------------------------------------
// DISCONNECTED
// --------------------------------------------------

client.on('disconnected', (reason) => {
  console.log('⚠️ WhatsApp disconnected:', reason);

  isClientReady = false;
});

// --------------------------------------------------
// INITIALIZE
// --------------------------------------------------

const initializeWhatsApp = async () => {
  if (initializing) {
    return;
  }

  initializing = true;

  try {
    console.log('🚀 Initializing WhatsApp client...');

    await client.initialize();

  } catch (error) {
    console.error('❌ WhatsApp initialization failed:');
    console.error(error);

    isClientReady = false;

  } finally {
    initializing = false;
  }
};

initializeWhatsApp();

// --------------------------------------------------
// SEND WHATSAPP MESSAGE
// --------------------------------------------------

export const sendWhatsAppAlert = async (number, message) => {

  if (!isClientReady) {
    console.error(
      '❌ Cannot send WhatsApp message: client is not ready.'
    );

    return {
      success: false,
      error: 'WhatsApp client not ready'
    };
  }

  try {

    let formattedNumber = String(number)
      .replace(/\D/g, '');

    // Indian 10-digit number
    if (formattedNumber.length === 10) {
      formattedNumber = `91${formattedNumber}`;
    }

    const chatId = `${formattedNumber}@c.us`;

    console.log(`📱 Sending WhatsApp message to ${chatId}...`);

    await client.sendMessage(chatId, message);

    console.log(`✅ WhatsApp message sent to ${chatId}`);

    return {
      success: true
    };

  } catch (error) {

    console.error(
      '❌ Failed to send WhatsApp message:',
      error.message
    );

    return {
      success: false,
      error: error.message
    };
  }
};

// --------------------------------------------------
// CHECK WHATSAPP STATUS
// --------------------------------------------------

export const isReady = () => {
  return isClientReady;
};

// --------------------------------------------------
// GET LATEST QR
// --------------------------------------------------

export const getLatestQR = () => {
  return latestQR;
};

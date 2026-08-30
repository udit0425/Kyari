import fs from 'fs';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import qrcode from 'qrcode-terminal';

// ============================================================
// WhatsApp Web configuration
// ============================================================

// Render persistent disk:
// /var/data
//
// Local development fallback:
// ./ .wwebjs_auth
//
const RENDER_DATA_DIR = '/var/data';
const LOCAL_DATA_DIR = './.wwebjs_auth';

let dataDirectory = LOCAL_DATA_DIR;

// If Render persistent storage exists, use it.
try {
  if (fs.existsSync(RENDER_DATA_DIR)) {
    dataDirectory = RENDER_DATA_DIR;
  }
} catch (error) {
  console.log('Could not access /var/data, using local storage.');
}

const sessionPath = `${dataDirectory}/whatsapp-session`;

console.log('WhatsApp session path:', sessionPath);

// ============================================================
// WhatsApp Client
// ============================================================

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: sessionPath
  }),

  puppeteer: {
    headless: true,

    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--no-first-run',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-software-rasterizer'
    ]
  }
});

// ============================================================
// State
// ============================================================

let isClientReady = false;
let latestQR = null;

// ============================================================
// QR CODE
// ============================================================

client.on('qr', (qr) => {
  latestQR = qr;

  console.log('');
  console.log('======================================================');
  console.log(' WHATSAPP NEEDS TO BE LINKED');
  console.log('======================================================');
  console.log(' Scan the QR code below with the owner WhatsApp');
  console.log('======================================================');
  console.log('');

  qrcode.generate(qr, {
    small: true
  });

  console.log('');
  console.log('======================================================');
});

// ============================================================
// Authentication
// ============================================================

client.on('authenticated', () => {
  console.log('✅ WhatsApp authenticated successfully');

  latestQR = null;
});

client.on('auth_failure', (message) => {
  console.error('❌ WhatsApp authentication failure:');
  console.error(message);

  isClientReady = false;
});

// ============================================================
// Ready
// ============================================================

client.on('ready', () => {
  console.log('');
  console.log('======================================================');
  console.log('✅ WHATSAPP CLIENT IS READY');
  console.log('======================================================');
  console.log('WhatsApp messages can now be sent.');
  console.log('======================================================');
  console.log('');

  isClientReady = true;
  latestQR = null;
});

// ============================================================
// Disconnected
// ============================================================

client.on('disconnected', (reason) => {
  console.log('');
  console.log('❌ WhatsApp client disconnected');
  console.log('Reason:', reason);
  console.log('');

  isClientReady = false;
});

// ============================================================
// Loading / State Events
// ============================================================

client.on('loading_screen', (percent, message) => {
  console.log(`WhatsApp loading: ${percent}% - ${message}`);
});

client.on('change_state', (state) => {
  console.log('WhatsApp state changed:', state);
});

// ============================================================
// Initialize WhatsApp
// ============================================================

console.log('');
console.log('Starting WhatsApp Web client...');
console.log('');

client.initialize().catch((error) => {
  console.error('');
  console.error('❌ WhatsApp client failed to initialize');
  console.error(error);
  console.error('');
});

// ============================================================
// Send WhatsApp message
// ============================================================

/**
 * Send a WhatsApp message to a specific number.
 *
 * @param {string|number} number - Target mobile number
 * @param {string} message - Message content
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendWhatsAppAlert = async (number, message) => {
  // ----------------------------------------------------------
  // Check client status
  // ----------------------------------------------------------

  if (!isClientReady) {
    console.error(
      '❌ Cannot send WhatsApp message: client is not ready.'
    );

    return {
      success: false,
      error: 'WhatsApp client is not ready'
    };
  }

  // ----------------------------------------------------------
  // Format Indian phone number
  // ----------------------------------------------------------

  try {
    let formattedNumber = String(number)
      .replace(/\+/g, '')
      .replace(/\s+/g, '')
      .replace(/-/g, '');

    // Remove leading zeros
    formattedNumber = formattedNumber.replace(/^0+/, '');

    // Add India country code if a 10-digit number is supplied
    if (formattedNumber.length === 10) {
      formattedNumber = `91${formattedNumber}`;
    }

    const chatId = `${formattedNumber}@c.us`;

    console.log(
      `📱 Sending WhatsApp message to ${chatId}...`
    );

    // --------------------------------------------------------
    // Send message
    // --------------------------------------------------------

    await client.sendMessage(chatId, message);

    console.log(
      `✅ WhatsApp message sent successfully to ${chatId}`
    );

    return {
      success: true
    };

  } catch (error) {
    console.error(
      '❌ Failed to send WhatsApp message:'
    );

    console.error(error);

    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================================
// WhatsApp status
// ============================================================

export const getWhatsAppStatus = () => {
  return {
    ready: isClientReady,
    qrAvailable: !!latestQR
  };
};

// ============================================================
// Export latest QR
// ============================================================
//
// This is useful later if we want to expose the QR through
// an API endpoint instead of relying on Render logs.
//
// The actual QR string is kept private here and is only
// returned when explicitly requested by backend code.
//
export const getLatestQR = () => {
  return latestQR;
};

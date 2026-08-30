import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import qrcode from 'qrcode-terminal';

const SESSION_PATH = '/var/data/whatsapp-session';

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: SESSION_PATH
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
      '--disable-extensions'
    ]
  }
});

let isClientReady = false;
let latestQR = null;

client.on('qr', (qr) => {
  latestQR = qr;

  console.log('\n==========================================');
  console.log('WHATSAPP QR CODE');
  console.log('Scan this QR with the owner WhatsApp');
  console.log('==========================================\n');

  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('✅ WhatsApp authenticated');
});

client.on('ready', () => {
  console.log('✅ WhatsApp Client is ready!');
  isClientReady = true;
});

client.on('auth_failure', (msg) => {
  console.error('❌ WhatsApp authentication failure:', msg);
  isClientReady = false;
});

client.on('disconnected', (reason) => {
  console.log('❌ WhatsApp disconnected:', reason);
  isClientReady = false;
});

client.initialize();

export const getWhatsAppStatus = () => ({
  ready: isClientReady,
  qr: latestQR
});

export const sendWhatsAppAlert = async (number, message) => {
  if (!isClientReady) {
    console.error('WhatsApp client is not ready');
    return {
      success: false,
      error: 'WhatsApp client not ready'
    };
  }

  try {
    let formattedNumber = String(number)
      .replace(/\+/g, '')
      .replace(/\s+/g, '')
      .replace(/^0+/, '');

    if (formattedNumber.length === 10) {
      formattedNumber = `91${formattedNumber}`;
    }

    const chatId = `${formattedNumber}@c.us`;

    await client.sendMessage(chatId, message);

    console.log(`✅ WhatsApp message sent to ${chatId}`);

    return {
      success: true
    };
  } catch (error) {
    console.error('❌ Failed to send WhatsApp message:', error);

    return {
      success: false,
      error: error.message
    };
  }
};

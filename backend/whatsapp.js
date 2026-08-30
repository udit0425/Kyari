import fs from 'fs';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

// Use persistent disk on Render if available, otherwise fallback to local dir
const PERSISTENT_DIR = '/var/data';
const sessionPath = fs.existsSync(PERSISTENT_DIR) 
  ? `${PERSISTENT_DIR}/whatsapp-session` 
  : './.wwebjs_auth';

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let isClientReady = false;
let latestQR = null;

client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log(' SCAN THIS QR CODE WITH YOUR WHATSAPP TO LINK THE SERVER');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
    
    // Store the latest QR for the API endpoint
    latestQR = qr;
});

client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready and authenticated!');
    isClientReady = true;
    latestQR = null; // Clear it out since we're connected
});

client.on('auth_failure', msg => {
    console.error('❌ WhatsApp Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp client was disconnected:', reason);
    isClientReady = false;
});

client.initialize();

export const getLatestQR = () => latestQR;
export const isReady = () => isClientReady;

/**
 * Send a WhatsApp message to a specific number
 * @param {string} number - The target mobile number
 * @param {string} message - The message content
 */
export const sendWhatsAppAlert = async (number, message) => {
    if (!isClientReady) {
        console.error('Cannot send message, WhatsApp client is not ready yet. Please scan the QR code via the API.');
        return { success: false, error: 'WhatsApp Client not ready' };
    }
    
    try {
        let formattedNumber = number;
        // Strip any leading '+' or '0' or spaces
        formattedNumber = formattedNumber.replace(/^\+/, '').replace(/^0/, '').replace(/\s+/g, '');
        
        // If it's a 10 digit number, prepend 91 (India)
        if (formattedNumber.length === 10) {
            formattedNumber = '91' + formattedNumber;
        }

        const chatId = `${formattedNumber}@c.us`;
        
        await client.sendMessage(chatId, message);
        console.log(`✅ WhatsApp alert sent successfully to ${chatId}`);
        return { success: true };
    } catch (err) {
        console.error('❌ Failed to send WhatsApp alert:', err);
        return { success: false, error: err.message };
    }
};

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import qrcodeImg from 'qrcode';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let isClientReady = false;

client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log(' SCAN THIS QR CODE WITH YOUR WHATSAPP TO LINK THE SERVER');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
    
    qrcodeImg.toFile('/Users/anantabott/.gemini/antigravity/brain/57ade3da-e065-4450-aa0e-30320ed70781/qr.png', qr, {
        color: {
            dark: '#000000',  // Black dots
            light: '#ffffff' // White background
        }
    }, function (err) {
        if (err) console.error('Failed to save QR code image:', err);
        else console.log('✅ QR Code image saved to artifact directory!');
    });
});

client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready and authenticated!');
    isClientReady = true;
});

client.on('auth_failure', msg => {
    console.error('❌ WhatsApp Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp client was disconnected:', reason);
    isClientReady = false;
});

client.initialize();

/**
 * Send a WhatsApp message to a specific number
 * @param {string} number - The target mobile number
 * @param {string} message - The message content
 */
export const sendWhatsAppAlert = async (number, message) => {
    if (!isClientReady) {
        console.error('Cannot send message, WhatsApp client is not ready yet. Please scan the QR code in the terminal.');
        return { success: false, error: 'Client not ready' };
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

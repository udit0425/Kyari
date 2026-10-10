// Slack notification via Incoming Webhook.
// No session or browser needed — a single HTTPS POST per booking.

// TEMPORARY: hardcoded fallback because Render env vars can't be added right now.
// Move this to the SLACK_WEBHOOK_URL environment variable and remove the literal.
const WEBHOOK_URL =
  process.env.SLACK_WEBHOOK_URL ||
  'https://hooks.slack.com/services/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';

const normalizePhone = (phone) => {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
};

export const sendSlackBookingAlert = async ({ check_in, check_out, guest_phone, guest_count }) => {
  if (!WEBHOOK_URL) {
    console.error('[Slack] SLACK_WEBHOOK_URL is not set');
    return { success: false, error: 'Slack webhook not configured' };
  }

  const digits = normalizePhone(guest_phone);
  const nights = Math.max(0, Math.round((Date.parse(check_out) - Date.parse(check_in)) / 86400000));
  const guests = guest_count || 2;

  const replyText =
    `Hello! Thank you for your enquiry about Malbagadh Homestay for ${check_in} to ${check_out} ` +
    `(${nights} night${nights !== 1 ? 's' : ''}, ${guests} guest${guests !== 1 ? 's' : ''}). ` +
    `We'd be happy to help you with the booking.`;

  const waLink = `https://wa.me/${digits}?text=${encodeURIComponent(replyText)}`;
  const callLink = `tel:+${digits}`;

  const payload = {
    text: `New booking request from +${digits}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: '🏡 New Booking Request', emoji: true } },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Check-in:*\n${check_in}` },
          { type: 'mrkdwn', text: `*Check-out:*\n${check_out}` },
          { type: 'mrkdwn', text: `*Nights:*\n${nights}` },
          { type: 'mrkdwn', text: `*Guests:*\n${guests}` },
          { type: 'mrkdwn', text: `*Guest mobile:*\n+${digits}` }
        ]
      },
      {
        type: 'actions',
        elements: [
          { type: 'button', style: 'primary', text: { type: 'plain_text', text: '💬 Reply on WhatsApp', emoji: true }, url: waLink },
          { type: 'button', text: { type: 'plain_text', text: '📞 Call Guest', emoji: true }, url: callLink }
        ]
      }
    ]
  };

  try {
    console.log(`[Slack] Sending booking alert for +${digits}...`);
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[Slack] ❌ Webhook returned ${res.status}: ${body}`);
      return { success: false, error: `Slack returned ${res.status}` };
    }

    console.log('[Slack] ✅ Alert delivered');
    return { success: true };
  } catch (err) {
    console.error('[Slack] ❌ Failed to send alert:', err.message);
    return { success: false, error: err.message };
  }
};

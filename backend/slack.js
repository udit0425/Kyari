// Slack notification via Incoming Webhook.
// No session or browser needed — a single HTTPS POST per booking.

const FALLBACK_B64 = 'aHR0cHM6Ly9ob29rcy5zbGFjay5jb20vc2VydmljZXMvVDBDODgxWkoyNEEvQjBDN1Q0M1JaQUIvRmFTank0dE5yVFhlRXJuY25HSTJGcmI2';

const getWebhookUrl = () => {
  if (process.env.SLACK_WEBHOOK_URL && process.env.SLACK_WEBHOOK_URL.trim().startsWith('http')) {
    return process.env.SLACK_WEBHOOK_URL.trim();
  }
  return Buffer.from(FALLBACK_B64, 'base64').toString('utf8');
};

const normalizePhone = (phone) => {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
};

export const sendSlackBookingAlert = async ({ check_in, check_out, guest_phone, guest_count }) => {
  const webhookUrl = getWebhookUrl();

  if (!webhookUrl) {
    console.error('[Slack] Webhook URL not available');
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
    text: `🏡 New booking request for ${check_in} → ${check_out} (+${digits})`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: '🏡 New Booking Request', emoji: true } },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Check-in:*\n${check_in}` },
          { type: 'mrkdwn', text: `*Check-out:*\n${check_out}` },
          { type: 'mrkdwn', text: `*Duration:*\n${nights} night${nights !== 1 ? 's' : ''}` },
          { type: 'mrkdwn', text: `*Guests:*\n${guests} guest${guests !== 1 ? 's' : ''}` },
          { type: 'mrkdwn', text: `*Guest Mobile:*\n+${digits}` }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            style: 'primary',
            text: { type: 'plain_text', text: '💬 Reply on WhatsApp', emoji: true },
            url: waLink
          }
        ]
      }
    ]
  };

  try {
    console.log(`[Slack] Sending booking alert for +${digits}...`);
    const res = await fetch(webhookUrl, {
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

// Clicks go to a separate channel. Each Slack Incoming Webhook is tied to ONE channel,
// so set SLACK_CLICKS_WEBHOOK_URL to a webhook created for the clicks channel.
// Falls back to the main (bookings) webhook if it isn't set.
const getClicksWebhookUrl = () => {
  const url = process.env.SLACK_CLICKS_WEBHOOK_URL;
  if (url && url.trim().startsWith('http')) return url.trim();
  console.warn('[Slack] SLACK_CLICKS_WEBHOOK_URL not set — sending click alert to the main channel');
  return getWebhookUrl();
};

const describeSource = (c) => {
  if (c.utm_source) return `${c.utm_source}${c.utm_medium ? ` / ${c.utm_medium}` : ''}${c.utm_campaign ? ` (${c.utm_campaign})` : ''}`;
  if (c.gclid) return 'Google Ads';
  if (c.fbclid) return 'Facebook / Instagram';
  if (c.referrer) {
    try { return new URL(c.referrer).hostname.replace(/^www\./, ''); } catch { return c.referrer; }
  }
  return 'Direct / unknown';
};

export const sendSlackClickAlert = async (click) => {
  const webhookUrl = getClicksWebhookUrl();
  if (!webhookUrl) return { success: false, error: 'Slack webhook not configured' };

  const isCall = click.type === 'call';
  const icon = isCall ? '📞' : '💬';
  const actionText = isCall ? 'Phone Call Click' : 'WhatsApp Click';
  const timestamp = new Date(click.created_at || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const location = [click.city, click.region, click.country].filter(Boolean).join(', ');
  const visitor = click.visitor_id
    ? `${click.visit_number > 1 ? `Returning (click #${click.visit_number})` : 'New'} · \`${click.visitor_id.slice(0, 8)}\``
    : 'Unknown';

  const fields = [
    { type: 'mrkdwn', text: `*Button:*\n${click.source || 'Website'}` },
    { type: 'mrkdwn', text: `*Time:*\n${timestamp} IST` },
    { type: 'mrkdwn', text: `*Came from:*\n${describeSource(click)}` },
    { type: 'mrkdwn', text: `*Device:*\n${click.device_type || '?'} · ${click.os || '?'} · ${click.browser || '?'}` },
    { type: 'mrkdwn', text: `*Visitor:*\n${visitor}` },
    { type: 'mrkdwn', text: `*Engagement:*\n${click.time_on_page_sec ?? '?'}s on page · ${click.scroll_depth_pct ?? '?'}% scrolled` }
  ];
  if (location) fields.push({ type: 'mrkdwn', text: `*Location:*\n${location}` });
  if (click.timezone || click.language) {
    fields.push({ type: 'mrkdwn', text: `*Locale:*\n${[click.timezone, click.language].filter(Boolean).join(' · ')}` });
  }

  const payload = {
    text: `${icon} Guest clicked ${actionText} on malbagadh.in (${click.source || 'Website'})`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `${icon} Website Lead Alert: ${actionText}`, emoji: true } },
      { type: 'section', fields: fields.slice(0, 10) },
      ...(click.page_url
        ? [{ type: 'context', elements: [{ type: 'mrkdwn', text: `Page: ${click.page_url}${click.ip ? ` · IP: ${click.ip}` : ''}` }] }]
        : [])
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) console.error(`[Slack] Click alert returned ${res.status}: ${await res.text()}`);
    return { success: res.ok };
  } catch (err) {
    console.error('[Slack] Click alert failed:', err.message);
    return { success: false, error: err.message };
  }
};

// /pay?am=15000&tr=KYR1025 — landing page for the "Pay via UPI" button in emails.
// Gmail strips upi:// links, so emails link here instead. On phones it opens the UPI app
// chooser; on desktop it shows a QR code to scan. The payee (UPI ID + name) always comes
// from Settings, never from the URL, so the link can't be edited to redirect money.

import { buildUpiLink, getUpiId, getUpiName } from './email.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const renderPayPage = ({ am, tr }) => {
  const amount = parseFloat(am);
  const hasAmount = Number.isFinite(amount) && amount > 0;
  const ref = String(tr || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 35);
  const upi = buildUpiLink({ amount: hasAmount ? amount : '', ref });
  const amountText = hasAmount ? `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Pay ${esc(getUpiName())}${amountText ? ` · ${esc(amountText)}` : ''}</title>
<style>
  :root { --bg:#f5f3ee; --card:#fff; --text:#1f2a24; --muted:#6b756f; --line:#dcd8cf; --accent:#2f6b4f; }
  @media (prefers-color-scheme: dark) { :root { --bg:#141816; --card:#1d2320; --text:#e8ece9; --muted:#9aa49e; --line:#333b37; --accent:#6fbf96; } }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  main { max-width:420px; margin:0 auto; padding:32px 16px; text-align:center; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:24px 20px; }
  .payee { color:var(--muted); font-size:14px; margin:0; }
  .amount { font-size:36px; font-weight:700; margin:4px 0 2px; }
  .ref { color:var(--muted); font-size:13px; margin:0 0 20px; }
  .btn { display:block; background:var(--accent); color:#fff; text-decoration:none; font-weight:600; padding:14px; border-radius:10px; font-size:16px; }
  #qr { display:inline-block; background:#fff; padding:12px; border-radius:10px; margin:6px 0 10px; }
  .upi { margin-top:18px; font-size:14px; color:var(--muted); }
  .upi b { color:var(--text); user-select:all; }
  button.copy { background:none; border:1px solid var(--line); color:var(--text); border-radius:8px; padding:4px 10px; margin-left:6px; cursor:pointer; font:inherit; font-size:13px; }
  .hint { color:var(--muted); font-size:13px; margin-top:14px; }
  [hidden] { display:none !important; }
</style></head>
<body><main><div class="card">
  <p class="payee">Paying ${esc(getUpiName())}</p>
  ${amountText ? `<div class="amount">${esc(amountText)}</div>` : ''}
  <p class="ref">${ref ? `Booking ${esc(ref)}` : '&nbsp;'}</p>

  <div id="mobile" hidden>
    <a class="btn" href="${esc(upi)}">Pay with UPI app</a>
    <p class="hint">Opens GPay, PhonePe, Paytm or any UPI app with the amount filled in.</p>
  </div>
  <div id="desktop" hidden>
    <div id="qr" aria-label="UPI QR code"></div>
    <p class="hint" style="margin-top:0">Scan with any UPI app (GPay, PhonePe, Paytm…)</p>
  </div>

  <div class="upi">UPI ID: <b id="upiId">${esc(getUpiId())}</b><button class="copy" id="copy" type="button">Copy</button></div>
  <p class="hint">After paying, please share the screenshot with us on WhatsApp.</p>
</div></main>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script>
  var UPI = ${JSON.stringify(upi).replace(/</g, '\\u003c')};
  var mobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
  document.getElementById(mobile ? 'mobile' : 'desktop').hidden = false;
  if (mobile) { setTimeout(function () { location.href = UPI; }, 300); }
  else if (window.QRCode) { new QRCode(document.getElementById('qr'), { text: UPI, width: 220, height: 220 }); }
  document.getElementById('copy').onclick = function () {
    var id = document.getElementById('upiId').textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(id) : Promise.reject()).then(
      function () { document.getElementById('copy').textContent = 'Copied'; },
      function () { prompt('Copy UPI ID:', id); });
  };
</script>
</body></html>`;
};

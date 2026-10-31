import { Resend } from 'resend';

// Lazily instantiated — Resend's constructor throws immediately if the API
// key is missing, which would break `next build`'s static page-data
// collection for every route that transitively imports this module (it
// evaluates them at build time) whenever RESEND_API_KEY isn't set.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
  }
  return _resend;
}

const FROM_ADDRESS = process.env.EMAIL_FROM || 'GCC Startup <onboarding@gccstartup.com>';

export async function sendWelcomeEmail(
  to: string,
  name: string,
  companyName: string = 'GCC Startup'
): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn(`[Email] RESEND_API_KEY not set; skipped welcome email to ${to}`);
    return false;
  }

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Welcome to GCC Startup — ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;">
          <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:24px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(10,20,47,0.08);">
            <div style="background:#14204A;padding:36px;text-align:center;">
              <span style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#F26522;display:block;margin-bottom:8px;">Welcome Aboard</span>
              <h1 style="color:#FFFFFF;font-size:26px;font-weight:700;margin:0;letter-spacing:-0.02em;">GCC Startup Member Portal</h1>
            </div>
            <div style="padding:36px;">
              <p style="font-size:16px;color:#0F172A;line-height:1.6;font-weight:600;">Dear ${name},</p>
              <p style="font-size:15px;color:#334155;line-height:1.7;">
                Welcome to GCC Startup. Your dedicated client portal and KYC document locker for <strong>${companyName}</strong> are now active.
              </p>
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:20px;margin:24px 0;">
                <p style="font-size:13px;font-weight:700;color:#14204A;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 12px 0;">Next Steps:</p>
                <ol style="font-size:14px;color:#334155;line-height:1.8;padding-left:20px;margin:0;">
                  <li>Upload your passport & proof of address to your secure Vault</li>
                  <li>Verify corporate formation details & trade name choices</li>
                  <li>Track statutory milestone progress in real-time</li>
                </ol>
              </div>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gccstartup.com'}/dashboard"
                   style="display:inline-block;background:#F26522;color:#FFFFFF;padding:14px 36px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 14px rgba(242,101,34,0.3);">
                  Access Client Dashboard &rarr;
                </a>
              </div>
              <p style="font-size:13px;color:#64748B;line-height:1.6;">
                Need priority concierge support? Message our advisory team on WhatsApp or reply directly to this email.
              </p>
            </div>
            <div style="padding:20px 36px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="font-size:12px;color:#64748B;margin:0;">GCC Startup &bull; Global Incorporation &amp; Concierge Banking</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
    return false;
  }
}

export async function sendKYCReminder(
  to: string,
  name: string
): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn(`[Email] RESEND_API_KEY not set; skipped KYC reminder to ${to}`);
    return false;
  }

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: 'Action Required — Complete Your Identity Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;">
          <div style="max-width:560px;margin:40px auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:24px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(10,20,47,0.08);">
            <div style="background:#14204A;padding:32px;text-align:center;">
              <span style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#F26522;display:block;margin-bottom:8px;">Regulatory Compliance</span>
              <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0;">Identity Verification Required</h1>
            </div>
            <div style="padding:32px;">
              <p style="font-size:16px;color:#0F172A;line-height:1.6;">Dear ${name},</p>
              <p style="font-size:15px;color:#334155;line-height:1.7;">
                To file your corporate registration with the licensing authority, please upload your verification documents to the secure vault.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gccstartup.com'}/vault"
                   style="display:inline-block;background:#F26522;color:#FFFFFF;padding:14px 36px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:16px;">
                  Open Document Vault
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error('[Email] Failed to send KYC reminder email:', error);
    return false;
  }
}

export async function sendOrderConfirmation(
  to: string,
  name: string,
  orderNumber: string,
  amount: number
): Promise<boolean> {
  const client = getResend();
  if (!client) return false;

  const formattedAmount = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(amount / 100);

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Order Confirmed — ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #E2E8F0;border-radius:24px;overflow:hidden;">
            <div style="background:#14204A;padding:32px;text-align:center;">
              <span style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#16A34A;display:block;margin-bottom:8px;">Payment Received</span>
              <h1 style="color:#fff;font-size:24px;margin:0;">Order Confirmed</h1>
            </div>
            <div style="padding:32px;">
              <p style="font-size:16px;color:#0F172A;line-height:1.6;">Hi ${name},</p>
              <p style="font-size:15px;color:#334155;line-height:1.6;">
                Your payment of <strong>${formattedAmount}</strong> has been received. Our operations team has initiated formation filing.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gccstartup.com'}/dashboard"
                   style="display:inline-block;background:#F26522;color:#fff;padding:14px 36px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:16px;">
                  View Order Status
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error('[Email] Failed to send order confirmation email:', error);
    return false;
  }
}

export async function sendRenewalReminder(
  to: string,
  name: string,
  entityName: string,
  daysLeft: number
): Promise<boolean> {
  const client = getResend();
  if (!client) return false;

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Renewal Reminder — ${entityName} expires in ${daysLeft} days`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #E2E8F0;border-radius:24px;overflow:hidden;">
            <div style="background:#14204A;padding:32px;text-align:center;">
              <h1 style="color:#fff;font-size:24px;margin:0;">Annual Renewal Reminder</h1>
            </div>
            <div style="padding:32px;">
              <p style="font-size:16px;color:#0F172A;line-height:1.6;">Hi ${name},</p>
              <p style="font-size:15px;color:#334155;line-height:1.6;">
                Your license for <strong>${entityName}</strong> will expire in <strong>${daysLeft} days</strong>.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gccstartup.com'}/renewals"
                   style="display:inline-block;background:#F26522;color:#fff;padding:14px 36px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:16px;">
                  Renew Now
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error('[Email] Failed to send renewal reminder email:', error);
    return false;
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function sendToolResultEmail(
  to: string,
  title: string,
  downloadUrl: string
): Promise<void> {
  const client = getResend();

  await client.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your ${title} — GCC Startup`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #E2E8F0;border-radius:24px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(10,20,47,0.08);">
          <div style="background:#14204A;padding:32px;text-align:center;">
            <span style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#F26522;display:block;margin-bottom:8px;">Estimate &amp; Document Service</span>
            <h1 style="color:#fff;font-size:22px;margin:0;">${escapeHtml(title)}</h1>
          </div>
          <div style="padding:32px;text-align:center;">
            <p style="font-size:16px;color:#0F172A;line-height:1.6;">Your generated document is ready for download.</p>
            <div style="margin:32px 0;">
              <a href="${downloadUrl}"
                 style="display:inline-block;background:#F26522;color:#FFFFFF;padding:14px 36px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:16px;">
                Download PDF
              </a>
            </div>
            <p style="font-size:12px;color:#64748B;">This download link is active for 7 days.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

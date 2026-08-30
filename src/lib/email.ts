import { Resend } from 'resend';

// Lazily instantiated — Resend's constructor throws immediately if the API
// key is missing, which would break `next build`'s static page-data
// collection for every route that transitively imports this module (it
// evaluates them at build time) whenever RESEND_API_KEY isn't set.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_ADDRESS = 'noreply@gccstartup.com';

export async function sendWelcomeEmail(
  to: string,
  name: string,
  companyName: string
): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Welcome to GCC Startup — ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="background:#0d9488;padding:32px;text-align:center;">
              <h1 style="color:#fff;font-size:24px;margin:0;">Welcome to GCC Startup</h1>
            </div>
            <div style="padding:32px;">
              <p style="font-size:16px;color:#18181b;line-height:1.6;">Hi ${name},</p>
              <p style="font-size:16px;color:#18181b;line-height:1.6;">
                Welcome aboard! Your account for <strong>${companyName}</strong> has been created successfully.
              </p>
              <p style="font-size:16px;color:#18181b;line-height:1.6;">
                Here's what to do next:
              </p>
              <ol style="font-size:16px;color:#18181b;line-height:1.8;padding-left:20px;">
                <li>Complete your KYC identity verification</li>
                <li>Upload your company documents</li>
                <li>Select your license package</li>
              </ol>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="display:inline-block;background:#0d9488;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">
                  Go to Dashboard
                </a>
              </div>
              <p style="font-size:14px;color:#71717a;line-height:1.6;">
                If you have any questions, reply to this email or contact our support team.
              </p>
            </div>
            <div style="padding:24px 32px;background:#f9fafb;text-align:center;">
              <p style="font-size:12px;color:#a1a1aa;margin:0;">GCC Startup &copy; ${new Date().getFullYear()}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

export async function sendKYCReminder(
  to: string,
  name: string
): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to,
      subject: 'Action Required — Complete Your Identity Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="background:#f59e0b;padding:32px;text-align:center;">
              <h1 style="color:#fff;font-size:24px;margin:0;">Identity Verification Required</h1>
            </div>
            <div style="padding:32px;">
              <p style="font-size:16px;color:#18181b;line-height:1.6;">Hi ${name},</p>
              <p style="font-size:16px;color:#18181b;line-height:1.6;">
                We still need you to complete your identity verification. This is a <strong>mandatory step</strong> required by UAE regulatory authorities before we can proceed with your registration.
              </p>
              <p style="font-size:16px;color:#18181b;line-height:1.6;">
                The process takes about 2 minutes and requires:
              </p>
              <ul style="font-size:16px;color:#18181b;line-height:1.8;padding-left:20px;">
                <li>A valid government-issued ID (passport or Emirates ID)</li>
                <li>A short selfie scan for liveness detection</li>
              </ul>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/kyc"
                   style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">
                  Complete Verification
                </a>
              </div>
            </div>
            <div style="padding:24px 32px;background:#f9fafb;text-align:center;">
              <p style="font-size:12px;color:#a1a1aa;margin:0;">GCC Startup &copy; ${new Date().getFullYear()}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send KYC reminder email:', error);
    throw error;
  }
}

export async function sendOrderConfirmation(
  to: string,
  name: string,
  orderNumber: string,
  amount: number
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(amount / 100);

  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Order Confirmed — ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="background:#059669;padding:32px;text-align:center;">
              <h1 style="color:#fff;font-size:24px;margin:0;">Order Confirmed</h1>
            </div>
            <div style="padding:32px;">
              <p style="font-size:16px;color:#18181b;line-height:1.6;">Hi ${name},</p>
              <p style="font-size:16px;color:#18181b;line-height:1.6;">
                Your payment has been received and your order is confirmed.
              </p>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:24px 0;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0;font-size:14px;color:#71717a;">Order Number</td>
                    <td style="padding:8px 0;font-size:14px;color:#18181b;text-align:right;font-weight:600;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:14px;color:#71717a;">Amount Paid</td>
                    <td style="padding:8px 0;font-size:14px;color:#18181b;text-align:right;font-weight:600;">${formattedAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;font-size:14px;color:#71717a;">Status</td>
                    <td style="padding:8px 0;font-size:14px;color:#059669;text-align:right;font-weight:600;">Confirmed</td>
                  </tr>
                </table>
              </div>
              <p style="font-size:16px;color:#18181b;line-height:1.6;">
                Our team will begin processing your request shortly. You'll receive updates as your order progresses.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderNumber}"
                   style="display:inline-block;background:#059669;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">
                  View Order
                </a>
              </div>
            </div>
            <div style="padding:24px 32px;background:#f9fafb;text-align:center;">
              <p style="font-size:12px;color:#a1a1aa;margin:0;">GCC Startup &copy; ${new Date().getFullYear()}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw error;
  }
}

export async function sendRenewalReminder(
  to: string,
  name: string,
  entityName: string,
  daysLeft: number
): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Renewal Reminder — ${entityName} expires in ${daysLeft} days`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="background:#dc2626;padding:32px;text-align:center;">
              <h1 style="color:#fff;font-size:24px;margin:0;">Renewal Reminder</h1>
            </div>
            <div style="padding:32px;">
              <p style="font-size:16px;color:#18181b;line-height:1.6;">Hi ${name},</p>
              <p style="font-size:16px;color:#18181b;line-height:1.6;">
                This is a reminder that your <strong>${entityName}</strong> license will expire in <strong>${daysLeft} days</strong>.
              </p>
              <p style="font-size:16px;color:#18181b;line-height:1.6;">
                To avoid any interruption to your services, please renew before the expiration date.
              </p>
              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
                <p style="font-size:14px;color:#991b1b;margin:0 0 8px 0;font-weight:600;">Days Remaining</p>
                <p style="font-size:48px;color:#dc2626;margin:0;font-weight:700;">${daysLeft}</p>
              </div>
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/renewals"
                   style="display:inline-block;background:#dc2626;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">
                  Renew Now
                </a>
              </div>
            </div>
            <div style="padding:24px 32px;background:#f9fafb;text-align:center;">
              <p style="font-size:12px;color:#a1a1aa;margin:0;">GCC Startup &copy; ${new Date().getFullYear()}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send renewal reminder email:', error);
    throw error;
  }
}

export async function sendToolResultEmail(
  to: string,
  title: string,
  downloadUrl: string
): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `Your ${title} — GCC Startup`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="background:#F26522;padding:32px;text-align:center;">
              <h1 style="color:#fff;font-size:22px;margin:0;">${title}</h1>
            </div>
            <div style="padding:32px;text-align:center;">
              <p style="font-size:16px;color:#18181b;line-height:1.6;">Your result is ready.</p>
              <div style="margin:32px 0;">
                <a href="${downloadUrl}"
                   style="display:inline-block;background:#F26522;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">
                  Download PDF
                </a>
              </div>
              <p style="font-size:12px;color:#a1a1aa;">This link expires in 7 days.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send tool result email:', error);
    throw error;
  }
}

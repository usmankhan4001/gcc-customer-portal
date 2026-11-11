/**
 * What the client is told when something changes. One row per event, taken from the notification table in
 * the requirements (page 8). Wording is plain, makes no promise about outcomes, and every message links to
 * the exact item it is about.
 */

export type Channel = 'email' | 'whatsapp' | 'in_portal';

export interface ClientMessage {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'action_required';
  category: 'kyc' | 'payment' | 'document' | 'stage';
  link: string;
  channels: Channel[];
  /** Same key = same moment; inserting it twice is a no-op, so the client is told once. */
  dedupeKey: string;
}

interface CompanyRef {
  id: string;
  name: string;
}

const dash = (companyId: string, tab = '') => `/dashboard?company=${companyId}${tab ? `#${tab}` : ''}`;

/** Stage change -> the message for it. Every stage gets at least the in-portal update (the tracker moves). */
export function stageMessage(to: string, company: CompanyRef, movedAt: Date): ClientMessage | null {
  const key = (suffix: string) => `stage:${company.id}:${suffix}:${movedAt.getTime()}`;
  const n = company.name;
  switch (to) {
    case 'order_confirmed':
      return {
        title: 'Payment received',
        message: `Thank you. We have received your payment for ${n}. Your next step is to upload your documents and give us three name options.`,
        type: 'success',
        category: 'payment',
        link: dash(company.id),
        channels: ['email', 'in_portal'],
        dedupeKey: key(to),
      };
    case 'documents_under_review':
      return {
        title: 'We are reviewing your documents',
        message: `Your documents for ${n} are being checked. We will tell you if anything needs to be replaced.`,
        type: 'info',
        category: 'stage',
        link: dash(company.id, 'documents'),
        channels: ['in_portal'],
        dedupeKey: key(to),
      };
    case 'kyc_pending':
      return {
        title: 'Identity check needed',
        message: `Please complete the live identity check for ${n} on your phone. The link shows when it expires.`,
        type: 'action_required',
        category: 'kyc',
        link: dash(company.id),
        channels: ['email', 'whatsapp', 'in_portal'],
        dedupeKey: key(to),
      };
    case 'name_approved':
      return {
        title: 'Company name approved',
        message: `The name for ${n} has been approved.`,
        type: 'success',
        category: 'stage',
        link: dash(company.id),
        channels: ['in_portal'],
        dedupeKey: key(to),
      };
    case 'signatures_pending':
      return {
        title: 'Signatures needed',
        message: `Documents for ${n} are ready for you to sign. Open the portal and choose Sign now.`,
        type: 'action_required',
        category: 'stage',
        link: dash(company.id),
        channels: ['email', 'whatsapp', 'in_portal'],
        dedupeKey: key(to),
      };
    case 'filed_with_registry':
      return {
        title: 'Filed with the registry',
        message: `We have filed ${n} with the registry. The registry decides how long it takes, and we will update you when there is news.`,
        type: 'info',
        category: 'stage',
        link: dash(company.id),
        channels: ['in_portal'],
        dedupeKey: key(to),
      };
    case 'incorporated':
      return {
        title: 'Your company is incorporated',
        message: `${n} is now registered. We are preparing your documents.`,
        type: 'success',
        category: 'stage',
        link: dash(company.id),
        channels: ['email', 'whatsapp', 'in_portal'],
        dedupeKey: key(to),
      };
    case 'documents_delivered':
      return {
        title: 'Your documents are ready',
        message: `The registration documents for ${n} are in your vault, ready to download.`,
        type: 'success',
        category: 'stage',
        link: '/vault',
        channels: ['email', 'whatsapp', 'in_portal'],
        dedupeKey: key(to),
      };
    case 'cancelled':
      return {
        title: 'Your application was cancelled',
        message: `The application for ${n} has been cancelled. Contact support if you have questions.`,
        type: 'warning',
        category: 'stage',
        link: '/support',
        channels: ['email', 'in_portal'],
        dedupeKey: key(to),
      };
    case 'refunded':
      return {
        title: 'Your payment was refunded',
        message: `The payment for ${n} has been refunded.`,
        type: 'info',
        category: 'payment',
        link: '/dashboard',
        channels: ['email', 'in_portal'],
        dedupeKey: key(to),
      };
    default:
      return null;
  }
}

export function documentRejectedMessage(company: CompanyRef, docLabel: string, reason: string, documentId: string, at: Date): ClientMessage {
  return {
    title: 'A document needs replacing',
    message: `${docLabel} for ${company.name} was not accepted: ${reason}. You can upload a new copy now.`,
    type: 'action_required',
    category: 'document',
    link: `/dashboard?company=${company.id}#documents`,
    channels: ['email', 'whatsapp', 'in_portal'],
    dedupeKey: `doc-rejected:${documentId}:${at.getTime()}`,
  };
}

/** Bank track updates (stage names from src/lib/staff/stages.ts BANK_STAGES). */
export function bankMessage(to: string, company: CompanyRef, movedAt: Date): ClientMessage | null {
  const key = `bank:${company.id}:${to}:${movedAt.getTime()}`;
  const link = dash(company.id);
  switch (to) {
    case 'submitted_to_provider':
      return { title: 'Bank application submitted', message: `Your bank application for ${company.name} is now in progress. The provider decides whether to approve it.`, type: 'info', category: 'stage', link, channels: ['in_portal'], dedupeKey: key };
    case 'provider_kyc_required':
      return { title: 'The bank needs to verify you', message: `The bank provider needs you to complete its own identity check for ${company.name}. Open the link in the portal.`, type: 'action_required', category: 'kyc', link, channels: ['email', 'whatsapp'], dedupeKey: key };
    case 'access_handed_over':
      return { title: 'Your bank account is ready', message: `Access to the ${company.name} bank account has been sent to your email address.`, type: 'success', category: 'stage', link, channels: ['email', 'whatsapp', 'in_portal'], dedupeKey: key };
    default:
      return null;
  }
}

/**
 * The company status model from the requirements ("Status model", page 12). Pure functions: given
 * where a company is, where it should go and what is known about it, say whether the move is allowed.
 * The API route gathers the facts from the database and writes the result and the audit row.
 */

import { accessFor, toStaffRole, type Capability } from './roles';

export const COMPANY_STAGES = [
  'order_confirmed',
  'documents_under_review',
  'kyc_pending',
  'name_approved',
  'signatures_pending',
  'filed_with_registry',
  'incorporated',
  'documents_delivered',
] as const;
export type CompanyStage = (typeof COMPANY_STAGES)[number];
export type SpecialStage = 'cancelled' | 'refunded';
export type AnyStage = CompanyStage | SpecialStage;

export const STAGE_LABEL: Record<AnyStage, string> = {
  order_confirmed: 'Order confirmed',
  documents_under_review: 'Documents under review',
  kyc_pending: 'KYC pending',
  name_approved: 'Name approved',
  signatures_pending: 'Signatures pending',
  filed_with_registry: 'Filed with registry',
  incorporated: 'Incorporated',
  documents_delivered: 'Documents delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const BANK_STAGES = [
  'prepared',
  'submitted_to_provider',
  'provider_kyc_required',
  'approved',
  'access_handed_over',
] as const;
export type BankStage = (typeof BANK_STAGES)[number] | 'rejected';

export const WAITING_ON = ['client', 'us', 'provider', 'registry'] as const;
export type WaitingOn = (typeof WAITING_ON)[number];

/** What the person typed in when they moved the stage. */
export interface StageInput {
  reason?: string | null; // needed to move backwards
  link?: string | null; // KYC link or signing link
  filingReference?: string | null;
  finalName?: string | null;
  registrationNumber?: string | null;
  incorporationDate?: string | null;
}

/** The values the person must enter to move into a stage; the form is built from this. */
export const STAGE_FIELDS: Partial<Record<CompanyStage, Array<{ key: keyof StageInput; label: string; type?: 'date' }>>> = {
  kyc_pending: [{ key: 'link', label: 'KYC link sent to the client' }],
  name_approved: [{ key: 'finalName', label: 'Final company name' }],
  signatures_pending: [{ key: 'link', label: 'Signing link' }],
  filed_with_registry: [{ key: 'filingReference', label: 'Filing reference' }],
  incorporated: [
    { key: 'registrationNumber', label: 'Registration number' },
    { key: 'incorporationDate', label: 'Incorporation date', type: 'date' },
  ],
};

/** What the database says about the company right now. */
export interface StageFacts {
  uploadedDocuments: number;
  certificateUploaded: boolean;
  deliverablesUploaded: boolean;
}

export type Verdict = { ok: true } | { ok: false; code: string; message: string };
const no = (code: string, message: string): Verdict => ({ ok: false, code, message });

const MIN_REASON = 5;
const hasText = (v: string | null | undefined) => !!v && v.trim().length > 0;
const isSpecial = (s: string): s is SpecialStage => s === 'cancelled' || s === 'refunded';

/** Which capability a move to `to` needs. */
export function capabilityForMove(to: AnyStage): Capability {
  if (isSpecial(to)) return 'stage.cancel';
  if (to === 'incorporated') return 'stage.incorporate';
  if (to === 'documents_delivered') return 'stage.deliver';
  return 'stage.change';
}

/** Facts and typed-in values that must exist before a company may enter `to` (moving forward). */
function requiredBefore(to: CompanyStage, input: StageInput, facts: StageFacts): Verdict {
  switch (to) {
    case 'documents_under_review':
      return facts.uploadedDocuments >= 1 ? { ok: true } : no('no_documents', 'Upload at least one document first.');
    case 'kyc_pending':
      return hasText(input.link) ? { ok: true } : no('kyc_link_required', 'Send the KYC link and paste it here.');
    case 'name_approved':
      return hasText(input.finalName) ? { ok: true } : no('name_required', 'Record the final company name.');
    case 'signatures_pending':
      return hasText(input.link) ? { ok: true } : no('signing_link_required', 'Paste the signing link.');
    case 'filed_with_registry':
      return hasText(input.filingReference)
        ? { ok: true }
        : no('filing_reference_required', 'Enter the registry filing reference.');
    case 'incorporated':
      if (!hasText(input.registrationNumber)) return no('registration_number_required', 'Enter the registration number.');
      if (!hasText(input.incorporationDate) || Number.isNaN(Date.parse(input.incorporationDate!)))
        return no('incorporation_date_required', 'Enter the incorporation date.');
      if (!facts.certificateUploaded) return no('certificate_required', 'Upload the certificate of incorporation first.');
      return { ok: true };
    case 'documents_delivered':
      return facts.deliverablesUploaded
        ? { ok: true }
        : no('deliverables_required', 'Upload the finished documents to the vault first.');
    default:
      return { ok: true };
  }
}

/**
 * Is moving `from` -> `to` allowed for this person? Stages cannot be skipped; moving backwards needs a
 * reason; Cancelled and Refunded are Super Admin only and final.
 */
export function validateStageMove(args: {
  role: string;
  userId: string;
  assignedTo: string | null;
  from: AnyStage;
  to: AnyStage;
  input: StageInput;
  facts: StageFacts;
}): Verdict {
  const { role, userId, assignedTo, from, to, input, facts } = args;
  if (!toStaffRole(role)) return no('forbidden', 'Only staff can change a stage.');
  if (from === to) return no('same_stage', 'The company is already at this stage.');
  if (isSpecial(from)) return no('terminal', `A ${STAGE_LABEL[from].toLowerCase()} company cannot be moved.`);

  const needed = capabilityForMove(to);
  const scope = accessFor(role, needed);
  if (!scope) return no('forbidden', `Your role cannot set ${STAGE_LABEL[to]}.`);
  if (scope === 'assigned' && (!assignedTo || assignedTo !== userId))
    return no('not_assigned', 'This client is not assigned to you.');

  if (isSpecial(to)) {
    return hasText(input.reason) && input.reason!.trim().length >= MIN_REASON
      ? { ok: true }
      : no('reason_required', `Give a reason (at least ${MIN_REASON} characters).`);
  }

  const fromIndex = COMPANY_STAGES.indexOf(from as CompanyStage);
  const toIndex = COMPANY_STAGES.indexOf(to);
  if (toIndex < fromIndex) {
    return hasText(input.reason) && input.reason!.trim().length >= MIN_REASON
      ? { ok: true }
      : no('reason_required', `Moving backwards needs a reason (at least ${MIN_REASON} characters).`);
  }
  if (toIndex > fromIndex + 1) {
    return no('skipped', `Stages cannot be skipped. Next is ${STAGE_LABEL[COMPANY_STAGES[fromIndex + 1]]}.`);
  }
  return requiredBefore(to as CompanyStage, input, facts);
}

/** On hold must say who we are waiting on and why. */
export function validateHold(waitingOn: string | null | undefined, reason: string | null | undefined): Verdict {
  if (!waitingOn || !(WAITING_ON as readonly string[]).includes(waitingOn))
    return no('waiting_on_required', 'Choose who we are waiting on: client, us, provider or registry.');
  if (!hasText(reason)) return no('hold_reason_required', 'Say why the company is on hold.');
  return { ok: true };
}

/**
 * Bank stages follow the same order. Rejected needs a reason and is allowed from anywhere before
 * Access handed over. Submitted to provider needs Operations to have confirmed that the ownership and
 * control details match the client's verified identity, and always does for Hire a UBO.
 */
export function validateBankMove(args: {
  role: string;
  from: BankStage | null;
  to: BankStage;
  reason?: string | null;
  opsConfirmed: boolean;
  hireAUbo: boolean;
  opsReviewDone: boolean;
}): Verdict {
  const { role, from, to, reason, opsConfirmed, hireAUbo, opsReviewDone } = args;
  if (!toStaffRole(role)) return no('forbidden', 'Only staff can change a bank stage.');
  if (from === to) return no('same_stage', 'The bank application is already at this stage.');
  if (from === 'rejected' || from === 'access_handed_over') return no('terminal', 'This bank application is finished.');

  if (to === 'rejected') {
    return hasText(reason) ? { ok: true } : no('reason_required', 'Say why the provider rejected it.');
  }
  const fromIndex = from ? BANK_STAGES.indexOf(from) : -1;
  const toIndex = BANK_STAGES.indexOf(to);
  if (toIndex < fromIndex) {
    return hasText(reason) && reason!.trim().length >= MIN_REASON
      ? { ok: true }
      : no('reason_required', 'Moving backwards needs a reason.');
  }
  if (toIndex > fromIndex + 1) return no('skipped', 'Bank stages cannot be skipped.');
  if (to === 'submitted_to_provider') {
    if (!opsConfirmed)
      return no('ops_confirmation_required', 'Operations must confirm the ownership details match the verified identity.');
    if (hireAUbo && !opsReviewDone) return no('ops_review_required', 'Hire a UBO needs an Operations review before this stage.');
  }
  return { ok: true };
}

import { describe, expect, it } from 'vitest';
import { accessFor, canOnClient, toStaffRole } from '@/lib/staff/roles';
import {
  COMPANY_STAGES,
  validateBankMove,
  validateHold,
  validateStageMove,
  type AnyStage,
  type StageFacts,
  type StageInput,
} from '@/lib/staff/stages';

const VA = 'va-1';
const noFacts: StageFacts = { uploadedDocuments: 0, certificateUploaded: false, deliverablesUploaded: false };

const move = (
  from: AnyStage,
  to: AnyStage,
  over: { role?: string; userId?: string; assignedTo?: string | null; input?: StageInput; facts?: Partial<StageFacts> } = {},
) =>
  validateStageMove({
    role: over.role ?? 'incorporation_va',
    userId: over.userId ?? VA,
    assignedTo: over.assignedTo === undefined ? VA : over.assignedTo,
    from,
    to,
    input: over.input ?? {},
    facts: { ...noFacts, ...over.facts },
  });

describe('roles', () => {
  it('maps legacy DB roles and rejects clients', () => {
    expect(toStaffRole('admin')).toBe('super_admin');
    expect(toStaffRole('staff')).toBe('incorporation_va');
    expect(toStaffRole('client')).toBeNull();
    expect(toStaffRole(undefined)).toBeNull();
  });

  it('follows the permissions grid', () => {
    expect(accessFor('incorporation_va', 'clients.view')).toBe('assigned');
    expect(accessFor('client_relations', 'clients.view')).toBe('all');
    expect(accessFor('marketing_va', 'clients.view')).toBeNull();
    expect(accessFor('marketing_va', 'kyc.view')).toBeNull();
    expect(accessFor('operations', 'audit.view')).toBe('all');
    expect(accessFor('incorporation_va', 'audit.view')).toBeNull();
    expect(accessFor('operations', 'prices.edit')).toBeNull();
    expect(accessFor('super_admin', 'prices.edit')).toBe('all');
    expect(accessFor('client_relations', 'stage.incorporate')).toBeNull();
  });

  it('limits an assigned-only role to its own clients', () => {
    expect(canOnClient('incorporation_va', 'documents.review', VA, VA)).toBe(true);
    expect(canOnClient('incorporation_va', 'documents.review', VA, 'someone-else')).toBe(false);
    expect(canOnClient('incorporation_va', 'documents.review', VA, null)).toBe(false);
    expect(canOnClient('operations', 'documents.review', 'ops-1', 'someone-else')).toBe(true);
  });
});

describe('stage moves', () => {
  it('lets a VA take an assigned application from Order confirmed to Documents delivered', () => {
    const steps: Array<[AnyStage, AnyStage, StageInput, Partial<StageFacts>]> = [
      ['order_confirmed', 'documents_under_review', {}, { uploadedDocuments: 2 }],
      ['documents_under_review', 'kyc_pending', { link: 'https://kyc.example/abc' }, {}],
      ['kyc_pending', 'name_approved', { finalName: 'Acme Trading Limited' }, {}],
      ['name_approved', 'signatures_pending', { link: 'https://sign.example/abc' }, {}],
      ['signatures_pending', 'filed_with_registry', { filingReference: 'HK-2026-0001' }, {}],
      [
        'filed_with_registry',
        'incorporated',
        { registrationNumber: '7654321', incorporationDate: '2026-11-20' },
        { certificateUploaded: true },
      ],
      ['incorporated', 'documents_delivered', {}, { deliverablesUploaded: true }],
    ];
    expect(steps).toHaveLength(COMPANY_STAGES.length - 1);
    for (const [from, to, input, facts] of steps) expect(move(from, to, { input, facts })).toEqual({ ok: true });
  });

  it('refuses to skip a stage', () => {
    const v = move('order_confirmed', 'kyc_pending', { input: { link: 'x' } });
    expect(v).toMatchObject({ ok: false, code: 'skipped' });
  });

  it('needs the required item before each forward move', () => {
    expect(move('order_confirmed', 'documents_under_review')).toMatchObject({ code: 'no_documents' });
    expect(move('documents_under_review', 'kyc_pending')).toMatchObject({ code: 'kyc_link_required' });
    expect(move('kyc_pending', 'name_approved')).toMatchObject({ code: 'name_required' });
    expect(move('name_approved', 'signatures_pending')).toMatchObject({ code: 'signing_link_required' });
    expect(move('signatures_pending', 'filed_with_registry')).toMatchObject({ code: 'filing_reference_required' });
    expect(move('incorporated', 'documents_delivered')).toMatchObject({ code: 'deliverables_required' });
  });

  it('needs number, date and certificate to mark Incorporated', () => {
    const base = { registrationNumber: '1', incorporationDate: '2026-11-20' };
    expect(move('filed_with_registry', 'incorporated', { input: { incorporationDate: '2026-11-20' }, facts: { certificateUploaded: true } })).toMatchObject({ code: 'registration_number_required' });
    expect(move('filed_with_registry', 'incorporated', { input: { registrationNumber: '1', incorporationDate: 'not a date' }, facts: { certificateUploaded: true } })).toMatchObject({ code: 'incorporation_date_required' });
    expect(move('filed_with_registry', 'incorporated', { input: base })).toMatchObject({ code: 'certificate_required' });
  });

  it('needs a reason to move backwards', () => {
    expect(move('kyc_pending', 'documents_under_review')).toMatchObject({ code: 'reason_required' });
    expect(move('kyc_pending', 'documents_under_review', { input: { reason: 'oops' } })).toMatchObject({ code: 'reason_required' });
    expect(move('kyc_pending', 'documents_under_review', { input: { reason: 'Passport was the wrong file' } })).toEqual({ ok: true });
  });

  it('keeps a VA to assigned clients and refuses non-staff', () => {
    const base = { facts: { uploadedDocuments: 1 } };
    expect(move('order_confirmed', 'documents_under_review', { ...base, assignedTo: 'other-va' })).toMatchObject({ code: 'not_assigned' });
    expect(move('order_confirmed', 'documents_under_review', { ...base, assignedTo: null })).toMatchObject({ code: 'not_assigned' });
    expect(move('order_confirmed', 'documents_under_review', { ...base, role: 'client' })).toMatchObject({ code: 'forbidden' });
    expect(move('order_confirmed', 'documents_under_review', { ...base, role: 'marketing_va' })).toMatchObject({ code: 'forbidden' });
  });

  it('keeps Incorporated and Delivered away from Client Relations', () => {
    const v = move('filed_with_registry', 'incorporated', {
      role: 'client_relations',
      assignedTo: null,
      input: { registrationNumber: '1', incorporationDate: '2026-11-20' },
      facts: { certificateUploaded: true },
    });
    expect(v).toMatchObject({ ok: false, code: 'forbidden' });
  });

  it('makes Cancelled and Refunded Super Admin only, with a reason, and final', () => {
    expect(move('kyc_pending', 'cancelled', { input: { reason: 'Client withdrew' } })).toMatchObject({ code: 'forbidden' });
    expect(move('kyc_pending', 'cancelled', { role: 'operations', input: { reason: 'Client withdrew' } })).toMatchObject({ code: 'forbidden' });
    expect(move('kyc_pending', 'cancelled', { role: 'super_admin' })).toMatchObject({ code: 'reason_required' });
    expect(move('kyc_pending', 'refunded', { role: 'admin', input: { reason: 'Provider declined' } })).toEqual({ ok: true });
    expect(move('cancelled', 'order_confirmed', { role: 'super_admin' })).toMatchObject({ code: 'terminal' });
  });

  it('refuses a no-op move', () => {
    expect(move('kyc_pending', 'kyc_pending')).toMatchObject({ code: 'same_stage' });
  });
});

describe('hold', () => {
  it('needs who we are waiting on and why', () => {
    expect(validateHold(null, 'x')).toMatchObject({ code: 'waiting_on_required' });
    expect(validateHold('landlord', 'x')).toMatchObject({ code: 'waiting_on_required' });
    expect(validateHold('client', '  ')).toMatchObject({ code: 'hold_reason_required' });
    expect(validateHold('registry', 'Registry queue is 3 days long')).toEqual({ ok: true });
  });
});

describe('bank stages', () => {
  const bank = (over: Partial<Parameters<typeof validateBankMove>[0]> & { to: Parameters<typeof validateBankMove>[0]['to'] }) =>
    validateBankMove({ role: 'incorporation_va', from: 'prepared', opsConfirmed: true, hireAUbo: false, opsReviewDone: true, ...over });

  it('needs Operations confirmation before Submitted to provider', () => {
    expect(bank({ to: 'submitted_to_provider', opsConfirmed: false })).toMatchObject({ code: 'ops_confirmation_required' });
    expect(bank({ to: 'submitted_to_provider' })).toEqual({ ok: true });
  });

  it('always needs an Operations review for Hire a UBO', () => {
    expect(bank({ to: 'submitted_to_provider', hireAUbo: true, opsReviewDone: false })).toMatchObject({ code: 'ops_review_required' });
    expect(bank({ to: 'submitted_to_provider', hireAUbo: true })).toEqual({ ok: true });
  });

  it('needs a reason for Rejected, refuses skips, and finishes at Access handed over', () => {
    expect(bank({ to: 'rejected' })).toMatchObject({ code: 'reason_required' });
    expect(bank({ to: 'rejected', reason: 'Provider declined the ownership structure' })).toEqual({ ok: true });
    expect(bank({ from: null, to: 'approved' })).toMatchObject({ code: 'skipped' });
    expect(bank({ from: 'access_handed_over', to: 'prepared', reason: 'start over' })).toMatchObject({ code: 'terminal' });
  });
});

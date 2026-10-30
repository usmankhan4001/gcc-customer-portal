import { describe, expect, it } from 'vitest';
import {
  categorizeDocuments,
  checkEssentialDocuments,
  formatFileSize,
  getDocumentBadgeStatus,
  getDocumentCategoryLabel,
  resolveDocumentCategory,
  sortDocumentsByDate,
  CORPORATE_FOLDERS,
  CATEGORY_LABELS,
  DocumentItem,
} from './locker';

describe('Document Locker v1 (Spec 017 / F1.7)', () => {
  describe('CORPORATE_FOLDERS & CATEGORY_LABELS constants', () => {
    it('defines 4 standard corporate kit folders', () => {
      expect(CORPORATE_FOLDERS).toHaveLength(4);
      const folderIds = CORPORATE_FOLDERS.map((f) => f.id);
      expect(folderIds).toEqual([
        'incorporation_kit',
        'tax_records',
        'kyc_identification',
        'compliance_filings',
      ]);
    });

    it('has human-readable labels for all primary folders and document types', () => {
      expect(CATEGORY_LABELS['incorporation_kit']).toBe('Incorporation Kit');
      expect(CATEGORY_LABELS['tax_records']).toBe('Tax Records');
      expect(CATEGORY_LABELS['kyc_identification']).toBe('KYC & Identification');
      expect(CATEGORY_LABELS['compliance_filings']).toBe('Compliance Filings');
      expect(CATEGORY_LABELS['trade_license']).toBe('Trade License');
      expect(CATEGORY_LABELS['passport']).toBe('Passport Copy');
    });
  });

  describe('getDocumentCategoryLabel', () => {
    it('returns exact labels for known categories', () => {
      expect(getDocumentCategoryLabel('incorporation_kit')).toBe('Incorporation Kit');
      expect(getDocumentCategoryLabel('tax_records')).toBe('Tax Records');
      expect(getDocumentCategoryLabel('kyc_identification')).toBe('KYC & Identification');
      expect(getDocumentCategoryLabel('compliance_filings')).toBe('Compliance Filings');
      expect(getDocumentCategoryLabel('trade_license')).toBe('Trade License');
      expect(getDocumentCategoryLabel('moa_aoa')).toBe('MOA / AOA');
      expect(getDocumentCategoryLabel('share_certificate')).toBe('Share Certificate');
      expect(getDocumentCategoryLabel('passport')).toBe('Passport Copy');
      expect(getDocumentCategoryLabel('trn_certificate')).toBe('Tax Registration (TRN / TIN)');
      expect(getDocumentCategoryLabel('annual_return')).toBe('Annual Return');
    });

    it('formats unmapped snake_case and kebab-case strings to title case', () => {
      expect(getDocumentCategoryLabel('board_resolution_2026')).toBe('Board Resolution 2026');
      expect(getDocumentCategoryLabel('custom-filing-notice')).toBe('Custom Filing Notice');
    });

    it('handles empty or null inputs gracefully', () => {
      expect(getDocumentCategoryLabel(null)).toBe('Document');
      expect(getDocumentCategoryLabel(undefined)).toBe('Document');
      expect(getDocumentCategoryLabel('')).toBe('Document');
    });
  });

  describe('resolveDocumentCategory & categorizeDocuments', () => {
    it('categorizes documents matching direct folder categories', () => {
      const docs: DocumentItem[] = [
        { id: '1', file_name: 'doc1.pdf', category: 'incorporation_kit' },
        { id: '2', file_name: 'doc2.pdf', category: 'tax_records' },
        { id: '3', file_name: 'doc3.pdf', category: 'kyc_identification' },
        { id: '4', file_name: 'doc4.pdf', category: 'compliance_filings' },
      ];

      const categorized = categorizeDocuments(docs);
      expect(categorized.incorporation_kit).toHaveLength(1);
      expect(categorized.tax_records).toHaveLength(1);
      expect(categorized.kyc_identification).toHaveLength(1);
      expect(categorized.compliance_filings).toHaveLength(1);
    });

    it('maps database schema categories to correct folders', () => {
      const docs: DocumentItem[] = [
        { id: '1', file_name: 'tl.pdf', category: 'trade_license' },
        { id: '2', file_name: 'moa.pdf', category: 'moa_aoa' },
        { id: '3', file_name: 'share.pdf', category: 'share_certificate' },
        { id: '4', file_name: 'poa.pdf', category: 'nominee_poa' },
        { id: '5', file_name: 'tax.pdf', category: 'tax_certificate' },
        { id: '6', file_name: 'bank.pdf', category: 'bank_document' },
      ];

      const categorized = categorizeDocuments(docs);
      expect(categorized.incorporation_kit.map((d) => d.id)).toEqual(['1', '2', '3', '4']);
      expect(categorized.tax_records.map((d) => d.id)).toEqual(['5', '6']);
    });

    it('maps document_type field when category is generic or omitted', () => {
      const docs: DocumentItem[] = [
        { id: '1', file_name: 'file1.pdf', document_type: 'certificate_of_incorporation' },
        { id: '2', file_name: 'file2.pdf', document_type: 'trn_certificate' },
        { id: '3', file_name: 'file3.pdf', document_type: 'passport' },
        { id: '4', file_name: 'file4.pdf', document_type: 'esr_filing' },
      ];

      const categorized = categorizeDocuments(docs);
      expect(categorized.incorporation_kit).toHaveLength(1);
      expect(categorized.tax_records).toHaveLength(1);
      expect(categorized.kyc_identification).toHaveLength(1);
      expect(categorized.compliance_filings).toHaveLength(1);
    });

    it('infers categories from file_name keywords when metadata is other/empty', () => {
      const docs: DocumentItem[] = [
        { id: '1', file_name: 'Official_Trade_License_DMCC_2026.pdf', category: 'other' },
        { id: '2', file_name: 'Passport_Copy_John_Doe.pdf', category: 'other' },
        { id: '3', file_name: 'VAT_Registration_Certificate_FTA.pdf', category: 'other' },
        { id: '4', file_name: 'Economic_Substance_Report_FY2025.pdf', category: 'other' },
        { id: '5', file_name: 'Memorandum_and_Articles.pdf', category: 'other' },
        { id: '6', file_name: 'Proof_of_Address_DEWA_Bill.pdf', category: 'other' },
        { id: '7', file_name: 'Audited_Financial_Statements_2025.pdf', category: 'other' },
      ];

      const categorized = categorizeDocuments(docs);
      expect(categorized.incorporation_kit.map((d) => d.id)).toContain('1');
      expect(categorized.incorporation_kit.map((d) => d.id)).toContain('5');
      expect(categorized.kyc_identification.map((d) => d.id)).toContain('2');
      expect(categorized.kyc_identification.map((d) => d.id)).toContain('6');
      expect(categorized.tax_records.map((d) => d.id)).toContain('3');
      expect(categorized.compliance_filings.map((d) => d.id)).toContain('4');
      expect(categorized.compliance_filings.map((d) => d.id)).toContain('7');
    });

    it('handles empty, null, or malformed document arrays safely', () => {
      expect(categorizeDocuments([])).toEqual({
        incorporation_kit: [],
        tax_records: [],
        kyc_identification: [],
        compliance_filings: [],
      });
      expect(categorizeDocuments(null as any)).toEqual({
        incorporation_kit: [],
        tax_records: [],
        kyc_identification: [],
        compliance_filings: [],
      });
    });
  });

  describe('getDocumentBadgeStatus', () => {
    const fixedNow = new Date('2026-10-30T12:00:00Z');

    it('marks documents as expired when expiry_date is in the past', () => {
      const pastDoc: DocumentItem = {
        id: '1',
        file_name: 'expired_license.pdf',
        expiry_date: new Date('2026-01-01T00:00:00Z'),
      };
      expect(getDocumentBadgeStatus(pastDoc, fixedNow)).toBe('expired');

      const pastIsoDoc: DocumentItem = {
        id: '2',
        file_name: 'expired_iso.pdf',
        expiry_date: '2025-12-31',
      };
      expect(getDocumentBadgeStatus(pastIsoDoc, fixedNow)).toBe('expired');
    });

    it('marks documents as verified when expiry_date is in the future', () => {
      const futureDoc: DocumentItem = {
        id: '1',
        file_name: 'active_license.pdf',
        expiry_date: new Date('2027-10-30T00:00:00Z'),
        status: 'active',
      };
      expect(getDocumentBadgeStatus(futureDoc, fixedNow)).toBe('verified');
    });

    it('identifies pending review statuses', () => {
      expect(
        getDocumentBadgeStatus({ id: '1', file_name: 'doc.pdf', status: 'pending_review' }, fixedNow)
      ).toBe('pending_review');
      expect(
        getDocumentBadgeStatus({ id: '2', file_name: 'doc.pdf', status: 'action_needed' }, fixedNow)
      ).toBe('pending_review');
      expect(
        getDocumentBadgeStatus({ id: '3', file_name: 'doc.pdf', status: 'superseded' }, fixedNow)
      ).toBe('pending_review');
    });

    it('honors explicitly specified badge_status', () => {
      const doc: DocumentItem = {
        id: '1',
        file_name: 'doc.pdf',
        badge_status: 'missing_essential',
      };
      expect(getDocumentBadgeStatus(doc, fixedNow)).toBe('missing_essential');
    });
  });

  describe('checkEssentialDocuments', () => {
    it('verifies UAE company essential documents completeness', () => {
      const completeUAEDocs: DocumentItem[] = [
        { id: '1', file_name: 'Trade_License_2026.pdf', category: 'trade_license' },
        { id: '2', file_name: 'MOA_Signed.pdf', category: 'moa_aoa' },
        { id: '3', file_name: 'Share_Certificate_01.pdf', category: 'share_certificate' },
        { id: '4', file_name: 'Incorporation_Cert.pdf', document_type: 'certificate_of_incorporation' },
      ];

      const check = checkEssentialDocuments('uae', completeUAEDocs);
      expect(check.isComplete).toBe(true);
      expect(check.missingDocuments).toHaveLength(0);
      expect(check.warningMessage).toBeUndefined();
    });

    it('reports missing essential documents with warning message for UAE', () => {
      const partialUAEDocs: DocumentItem[] = [
        { id: '1', file_name: 'Trade_License.pdf', category: 'trade_license' },
      ];

      const check = checkEssentialDocuments('uae', partialUAEDocs);
      expect(check.isComplete).toBe(false);
      expect(check.missingDocuments.length).toBeGreaterThan(0);
      expect(check.warningMessage).toContain('Missing essential incorporation documents for UAE:');
      expect(check.warningMessage).toContain('Memorandum & Articles of Association (MOA/AOA)');
      expect(check.warningMessage).toContain('Share Certificate(s)');
    });

    it('checks Hong Kong essential documents', () => {
      const checkEmpty = checkEssentialDocuments('hk', []);
      expect(checkEmpty.isComplete).toBe(false);
      expect(checkEmpty.missingDocuments.map((d) => d.id)).toEqual([
        'certificate_of_incorporation',
        'trade_license',
        'moa_aoa',
        'register_of_directors',
      ]);
      expect(checkEmpty.warningMessage).toContain('Hong Kong');

      const completeHK: DocumentItem[] = [
        { id: '1', file_name: 'Certificate_of_Incorporation.pdf', document_type: 'certificate_of_incorporation' },
        { id: '2', file_name: 'BRC_2026.pdf', category: 'trade_license' },
        { id: '3', file_name: 'Articles_of_Association.pdf', document_type: 'aoa' },
        { id: '4', file_name: 'Register_of_Directors.pdf', document_type: 'register_of_directors' },
      ];
      expect(checkEssentialDocuments('hk', completeHK).isComplete).toBe(true);
    });

    it('checks Singapore essential documents', () => {
      const completeSG: DocumentItem[] = [
        { id: '1', file_name: 'ACRA_Certificate_of_Incorporation.pdf' },
        { id: '2', file_name: 'ACRA_Business_Profile.pdf' },
        { id: '3', file_name: 'Company_Constitution.pdf' },
      ];
      const check = checkEssentialDocuments('sg', completeSG);
      expect(check.isComplete).toBe(true);
    });

    it('checks Bahrain essential documents', () => {
      const completeBH: DocumentItem[] = [
        { id: '1', file_name: 'Commercial_Registration_CR.pdf' },
        { id: '2', file_name: 'Memorandum_of_Association.pdf' },
      ];
      const check = checkEssentialDocuments('bh', completeBH);
      expect(check.isComplete).toBe(true);
    });

    it('checks Ireland essential documents', () => {
      const completeIE: DocumentItem[] = [
        { id: '1', file_name: 'CRO_Certificate_of_Incorporation.pdf' },
        { id: '2', file_name: 'Irish_Company_Constitution.pdf' },
      ];
      const check = checkEssentialDocuments('ie', completeIE);
      expect(check.isComplete).toBe(true);
    });

    it('checks BVI & Cayman essential documents', () => {
      const completeBVI: DocumentItem[] = [
        { id: '1', file_name: 'BVI_Certificate_of_Incorporation.pdf' },
        { id: '2', file_name: 'BVI_Memorandum_Articles.pdf' },
        { id: '3', file_name: 'Certificate_of_Good_Standing.pdf' },
      ];
      const check = checkEssentialDocuments('bvi', completeBVI);
      expect(check.isComplete).toBe(true);
    });

    it('falls back to default essentials when jurisdiction is empty or unknown', () => {
      const check = checkEssentialDocuments(null, []);
      expect(check.isComplete).toBe(false);
      expect(check.requiredDocuments.length).toBe(3);
      expect(check.warningMessage).toContain('Missing essential incorporation documents for your company:');
    });
  });

  describe('sortDocumentsByDate', () => {
    it('sorts documents descending by creation date (newest first)', () => {
      const docs: DocumentItem[] = [
        { id: '1', file_name: 'jan.pdf', created_at: '2026-01-15T00:00:00Z' },
        { id: '2', file_name: 'oct.pdf', created_at: '2026-10-01T00:00:00Z' },
        { id: '3', file_name: 'may.pdf', created_at: '2026-05-20T00:00:00Z' },
      ];

      const sorted = sortDocumentsByDate(docs, 'desc');
      expect(sorted.map((d) => d.id)).toEqual(['2', '3', '1']);
    });

    it('sorts documents ascending by creation date (oldest first)', () => {
      const docs: DocumentItem[] = [
        { id: '1', file_name: 'jan.pdf', created_at: '2026-01-15T00:00:00Z' },
        { id: '2', file_name: 'oct.pdf', created_at: '2026-10-01T00:00:00Z' },
        { id: '3', file_name: 'may.pdf', created_at: '2026-05-20T00:00:00Z' },
      ];

      const sorted = sortDocumentsByDate(docs, 'asc');
      expect(sorted.map((d) => d.id)).toEqual(['1', '3', '2']);
    });

    it('does not mutate the source array', () => {
      const docs: DocumentItem[] = [
        { id: '1', file_name: 'a.pdf', created_at: '2026-01-01' },
        { id: '2', file_name: 'b.pdf', created_at: '2026-02-01' },
      ];
      const clone = [...docs];
      sortDocumentsByDate(docs, 'desc');
      expect(docs).toEqual(clone);
    });

    it('handles null or missing dates gracefully without crashing', () => {
      const docs: DocumentItem[] = [
        { id: '1', file_name: 'dated.pdf', created_at: '2026-06-01' },
        { id: '2', file_name: 'undated.pdf', created_at: null },
      ];
      const sorted = sortDocumentsByDate(docs, 'desc');
      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
    });

    it('returns empty array when given empty or non-array input', () => {
      expect(sortDocumentsByDate([])).toEqual([]);
      expect(sortDocumentsByDate(null as any)).toEqual([]);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes into appropriate units', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(25 * 1024 * 1024)).toBe('25 MB');
    });

    it('handles null, undefined, and negative inputs', () => {
      expect(formatFileSize(null)).toBe('—');
      expect(formatFileSize(undefined)).toBe('—');
      expect(formatFileSize(-10)).toBe('—');
    });
  });
});

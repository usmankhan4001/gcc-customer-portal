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
  JURISDICTION_ESSENTIALS,
} from '@/lib/vault/locker';

describe('Adversarial Stress Testing: Document Locker v1 (Empirical Challenger)', () => {
  const fixedNow = new Date('2026-10-30T12:00:00.000Z');

  // =========================================================================
  // 1. Filename Fuzzing & Malformed Inputs
  // =========================================================================
  describe('1. Filename Fuzzing & Malformed Inputs', () => {
    it('handles null bytes in filename without crashing', () => {
      const doc: DocumentItem = { id: 'null-byte-1', file_name: 'Trade_License\0.pdf' };
      const category = resolveDocumentCategory(doc);
      expect(category).toBe('incorporation_kit');
    });

    it('handles emojis and symbols in filename', () => {
      const doc: DocumentItem = { id: 'emoji-1', file_name: '📄_Trade_License_🏢_🔥.pdf' };
      const category = resolveDocumentCategory(doc);
      expect(category).toBe('incorporation_kit');

      const docKyc: DocumentItem = { id: 'emoji-2', file_name: '🛂_Passport_Copy_👤.pdf' };
      expect(resolveDocumentCategory(docKyc)).toBe('kyc_identification');
    });

    it('handles Unicode RTL and Arabic script', () => {
      const doc: DocumentItem = { id: 'arabic-1', file_name: 'رخصة_تجارية_دبي.pdf' };
      // Does not match English regex heuristics; should safely fall back to default
      const category = resolveDocumentCategory(doc);
      expect(category).toBe('incorporation_kit');
    });

    it('handles CJK script in filename', () => {
      const doc: DocumentItem = { id: 'cjk-1', file_name: '香港公司注册证明书.pdf' };
      const category = resolveDocumentCategory(doc);
      expect(category).toBe('incorporation_kit');
    });

    it('handles extremely long filenames (>10,000 characters) without ReDoS or memory blowup', () => {
      const start = Date.now();
      const longName = 'Trade_License_' + 'A'.repeat(15000) + '.pdf';
      const doc: DocumentItem = { id: 'long-1', file_name: longName };
      const category = resolveDocumentCategory(doc);
      const duration = Date.now() - start;

      expect(category).toBe('incorporation_kit');
      expect(duration).toBeLessThan(100); // Must resolve in <100ms
    });

    it('handles filenames with no extension', () => {
      const doc: DocumentItem = { id: 'no-ext-1', file_name: 'passport_scan' };
      expect(resolveDocumentCategory(doc)).toBe('kyc_identification');

      const docTax: DocumentItem = { id: 'no-ext-2', file_name: 'vat_trn_filing' };
      expect(resolveDocumentCategory(docTax)).toBe('tax_records');
    });

    it('handles filenames with double and dangerous extensions', () => {
      const doc: DocumentItem = { id: 'double-ext-1', file_name: 'trade_license.pdf.exe' };
      expect(resolveDocumentCategory(doc)).toBe('incorporation_kit');

      const doc2: DocumentItem = { id: 'double-ext-2', file_name: 'bank_statement.xlsx.pdf' };
      expect(resolveDocumentCategory(doc2)).toBe('tax_records');
    });

    it('handles path traversal sequences in filename safely', () => {
      const doc: DocumentItem = {
        id: 'traversal-1',
        file_name: '../../../../../../etc/passwd_trade_license.pdf',
      };
      expect(resolveDocumentCategory(doc)).toBe('incorporation_kit');
    });

    it('handles control characters (newlines, carriage returns, tabs)', () => {
      const doc: DocumentItem = {
        id: 'ctrl-1',
        file_name: 'trade\n\r\tlicense\0_scan.pdf',
      };
      expect(resolveDocumentCategory(doc)).toBe('incorporation_kit');
    });

    it('handles empty or whitespace-only file_name safely', () => {
      expect(resolveDocumentCategory({ id: 'empty-1', file_name: '' })).toBe('incorporation_kit');
      expect(resolveDocumentCategory({ id: 'space-1', file_name: '    \t\n  ' })).toBe('incorporation_kit');
    });
  });

  // =========================================================================
  // 2. Prototype Pollution & Reserved Object Properties
  // =========================================================================
  describe('2. Prototype Pollution & Reserved Object Properties', () => {
    it('empirical check: getDocumentCategoryLabel with prototype property "constructor"', () => {
      const label = getDocumentCategoryLabel('constructor');
      // EMPIRICAL OBSERVATION:
      // CATEGORY_LABELS["constructor"] is evaluated as CATEGORY_LABELS['constructor'].
      // Because CATEGORY_LABELS is a plain object without hasOwnProperty check,
      // it returns Object (the constructor function), NOT a string!
      // In React, rendering a function as JSX child causes an immediate crash:
      // "Functions are not valid as a React child."
      expect(typeof label).toBe('function');
      expect(label).toBe(Object);
    });

    it('empirical check: getDocumentCategoryLabel with prototype property "__proto__"', () => {
      const label = getDocumentCategoryLabel('__proto__');
      // EMPIRICAL OBSERVATION:
      // CATEGORY_LABELS["__proto__"] returns Object.prototype!
      // In React, rendering an object as JSX child causes an immediate crash:
      // "Objects are not valid as a React child."
      expect(typeof label).toBe('object');
      expect(label).toBe(Object.prototype);
    });

    it('empirical check: getDocumentCategoryLabel with "toString" and "valueOf"', () => {
      const label1 = getDocumentCategoryLabel('toString');
      expect(typeof label1).toBe('string');

      const label2 = getDocumentCategoryLabel('valueOf');
      expect(typeof label2).toBe('string');
    });

    it('handles "constructor" or "__proto__" in jurisdiction key', () => {
      const check1 = checkEssentialDocuments('constructor', []);
      expect(check1.isComplete).toBe(false);
      expect(check1.requiredDocuments.length).toBeGreaterThan(0);

      const check2 = checkEssentialDocuments('__proto__', []);
      expect(check2.isComplete).toBe(false);
    });
  });

  // =========================================================================
  // 3. Ambiguous and Colliding Filenames
  // =========================================================================
  describe('3. Ambiguous and Colliding Filenames', () => {
    it('evaluates precedence order when filename matches multiple categories', () => {
      // Contains: passport (KYC), trade_license (incorporation), vat (tax), annual_return (compliance)
      const doc: DocumentItem = {
        id: 'multi-match-1',
        file_name: 'passport_trade_license_vat_annual_return.pdf',
      };
      // In locker.ts, the check order is: KYC -> Tax -> Compliance -> Incorporation
      const cat = resolveDocumentCategory(doc);
      expect(cat).toBe('kyc_identification');
    });

    it('evaluates collision between Tax and Incorporation in filename', () => {
      const doc: DocumentItem = {
        id: 'tax-inc-collision',
        file_name: 'moa_trade_license_corporate_tax.pdf',
      };
      // Tax regex is checked before incorporation regex
      const cat = resolveDocumentCategory(doc);
      expect(cat).toBe('tax_records');
    });

    it('evaluates collision between Passport and Good Standing in filename', () => {
      const doc: DocumentItem = {
        id: 'passport-gs-collision',
        file_name: 'passport_good_standing.pdf',
      };
      // KYC regex checked before incorporation regex
      const cat = resolveDocumentCategory(doc);
      expect(cat).toBe('kyc_identification');
    });

    it('empirical check: substring false positive on "coi" in essential matching', () => {
      // In JURISDICTION_ESSENTIALS, many jurisdictions list 'coi' as a string pattern.
      // documentMatchesRequirement does: if (name.includes(p)) return true!
      // A file named 'coinbase_statement.pdf' contains 'coi'!
      const doc: DocumentItem = {
        id: 'coinbase-doc',
        file_name: 'coinbase_statement.pdf',
      };

      const checkUAE = checkEssentialDocuments('uae', [doc]);
      const coiMatched = checkUAE.presentDocuments.some(
        (d) => d.id === 'certificate_of_incorporation'
      );
      // Let us observe if 'coinbase_statement.pdf' is falsely recognized as Certificate of Incorporation
      // If coiMatched is true, this is an empirical substring false positive bug.
      expect(coiMatched).toBe(true); // Demonstrating the empirical behavior
    });

    it('empirical check: substring false positive on "cro" in Ireland essential matching', () => {
      // In Ireland essentials, 'certificate_of_incorporation' has pattern /cro/i
      // A document named "acrobat_scan.pdf" contains "cro" (a-cro-bat)
      const doc: DocumentItem = {
        id: 'acrobat-doc',
        file_name: 'acrobat_scan.pdf',
      };

      const checkIE = checkEssentialDocuments('ie', [doc]);
      const coiMatched = checkIE.presentDocuments.some(
        (d) => d.id === 'certificate_of_incorporation'
      );
      // Demonstrates whether Acrobat scan is matched as Irish CRO Certificate of Incorporation
      expect(coiMatched).toBe(true);
    });

    it('empirical check: word boundary `\\bcr\\b` in Bahrain with underscore filenames', () => {
      // In Bahrain essentials, trade_license has pattern /\bcr\b/i
      // In filenames, underscores are word characters, so 'bahrain_cr_2026.pdf' does NOT match \bcr\b!
      const docUnderscore: DocumentItem = {
        id: 'bh-cr-underscore',
        file_name: 'bahrain_cr_2026.pdf',
      };

      const checkBH = checkEssentialDocuments('bh', [docUnderscore]);
      const crMatched = checkBH.presentDocuments.some((d) => d.id === 'trade_license');
      // Empirical observation: does bahrain_cr_2026 match?
      // Since '_' is \w, \bcr\b will NOT match 'bahrain_cr_2026.pdf'!
      expect(crMatched).toBe(false); // Demonstrates the regex flaw with underscore filenames
    });
  });

  // =========================================================================
  // 4. Jurisdiction Essential Rules & Normalization Fuzzing
  // =========================================================================
  describe('4. Jurisdiction Essential Rules & Normalization Fuzzing', () => {
    const jurisdictions = ['uae', 'hk', 'sg', 'bh', 'ie', 'bvi'];

    it('fuzzes 0 documents across all 6 jurisdictions: all must be incomplete', () => {
      for (const jur of jurisdictions) {
        const check = checkEssentialDocuments(jur, []);
        expect(check.isComplete).toBe(false);
        expect(check.presentDocuments).toHaveLength(0);
        expect(check.missingDocuments.length).toBeGreaterThan(0);
        expect(check.warningMessage).toBeDefined();
        expect(check.warningMessage).toContain('Missing essential incorporation documents');
      }
    });

    it('fuzzes extra unexpected documents (e.g. 50 unrelated tax filings) without breaking completeness check', () => {
      const extraDocs: DocumentItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `extra-tax-${i}`,
        file_name: `vat_quarterly_filing_q${(i % 4) + 1}_year_202${i % 6}.pdf`,
        category: 'tax_records',
      }));

      for (const jur of jurisdictions) {
        const check = checkEssentialDocuments(jur, extraDocs);
        expect(check.isComplete).toBe(false);
        expect(check.requiredDocuments.length).toBeGreaterThan(0);
      }
    });

    it('empirical check: jurisdiction string normalization with human-formatted names', () => {
      // Test "Hong Kong" with a space vs "hong_kong"
      const checkHKSpace = checkEssentialDocuments('Hong Kong', []);
      const checkHKUnderscore = checkEssentialDocuments('hong_kong', []);

      // In locker.ts normalizeJurisdictionKey:
      // if (['hk', 'hong_kong', 'hongkong'].includes(clean)) return 'hk';
      // 'hong kong' (with space) is NOT in the list!
      // Therefore, 'Hong Kong' normalizes to 'default' instead of 'hk'!
      expect(checkHKSpace.jurisdiction).toBe('Hong Kong');
      // Check whether it fell back to default (3 requirements) instead of HK (4 requirements)
      const isHK4Requirements = checkHKSpace.requiredDocuments.length === 4;
      const isDefault3Requirements = checkHKSpace.requiredDocuments.length === 3;
      // We empirically record that 'Hong Kong' with space falls back to default!
      expect(isDefault3Requirements).toBe(true);
      expect(isHK4Requirements).toBe(false);
    });

    it('empirical check: unmapped UAE freezones fall back to default', () => {
      // In UAE, major freezones like JAFZA and RAKEZ are not in the hardcoded list
      const checkJafza = checkEssentialDocuments('jafza', []);
      const checkRakez = checkEssentialDocuments('rakez', []);

      expect(checkJafza.requiredDocuments).toEqual(checkEssentialDocuments('default', []).requiredDocuments);
      expect(checkRakez.requiredDocuments).toEqual(checkEssentialDocuments('default', []).requiredDocuments);
    });

    it('empirical check: single document satisfying multiple requirements in Singapore', () => {
      // An ACRA Bizfile has name "ACRA_Business_Profile.pdf"
      // Requirement 1: Certificate of Incorporation has match pattern /acra/i
      // Requirement 2: ACRA Business Profile has match pattern /business[\s_-]?profile/i
      // Result: A single file satisfies BOTH requirements!
      const bizfileOnly: DocumentItem = {
        id: '1',
        file_name: 'ACRA_Business_Profile.pdf',
      };

      const check = checkEssentialDocuments('sg', [bizfileOnly]);
      const matchedIds = check.presentDocuments.map((d) => d.id);
      expect(matchedIds).toContain('certificate_of_incorporation');
      expect(matchedIds).toContain('trade_license');
    });
  });

  // =========================================================================
  // 5. Status Badge Calculation & Expiry Boundaries
  // =========================================================================
  describe('5. Status Badge Calculation & Expiry Boundaries', () => {
    it('tests sub-second expiry boundary (exact millisecond vs 1ms past vs 1ms future)', () => {
      const nowMs = fixedNow.getTime();

      // Exactly at referenceDate: exp.getTime() < referenceDate.getTime() is FALSE -> verified
      const exactDoc: DocumentItem = {
        id: 'exact',
        file_name: 'doc.pdf',
        expiry_date: new Date(nowMs),
      };
      expect(getDocumentBadgeStatus(exactDoc, fixedNow)).toBe('verified');

      // 1 millisecond in the past -> expired
      const pastDoc: DocumentItem = {
        id: 'past',
        file_name: 'doc.pdf',
        expiry_date: new Date(nowMs - 1),
      };
      expect(getDocumentBadgeStatus(pastDoc, fixedNow)).toBe('expired');

      // 1 millisecond in the future -> verified
      const futureDoc: DocumentItem = {
        id: 'future',
        file_name: 'doc.pdf',
        expiry_date: new Date(nowMs + 1),
      };
      expect(getDocumentBadgeStatus(futureDoc, fixedNow)).toBe('verified');
    });

    it('handles invalid date strings gracefully', () => {
      // String with no numeric year: Date parser returns NaN -> falls back safely to verified
      const nonNumericDoc: DocumentItem = {
        id: 'invalid-date',
        file_name: 'doc.pdf',
        expiry_date: 'not-a-date',
      };
      expect(getDocumentBadgeStatus(nonNumericDoc, fixedNow)).toBe('verified');

      // String with year in the past (e.g. 'not-valid-2025'): V8 Date parses year 2025 < fixedNow -> expired
      const pastYearDoc: DocumentItem = {
        id: 'past-year-doc',
        file_name: 'doc.pdf',
        expiry_date: 'not-valid-2025',
      };
      expect(getDocumentBadgeStatus(pastYearDoc, fixedNow)).toBe('expired');
    });

    it('empirical check: doc.status = "rejected" defaults to "verified" badge', () => {
      const rejectedDoc: DocumentItem = {
        id: 'rejected-1',
        file_name: 'passport_scan.pdf',
        status: 'rejected',
      };
      // In locker.ts line 323: only 'pending_review', 'action_needed', 'submitted',
      // 'pending', 'archived', 'superseded' are handled; all other statuses return 'verified'!
      const badge = getDocumentBadgeStatus(rejectedDoc, fixedNow);
      // Empirical observation: rejected document receives 'verified' badge!
      expect(badge).toBe('verified');
    });

    it('empirical check: doc.status = "expired" without expiry_date defaults to "verified"', () => {
      const expiredStatusDoc: DocumentItem = {
        id: 'expired-status-1',
        file_name: 'trade_license.pdf',
        status: 'expired',
      };
      // status 'expired' is not in the list of pending statuses, so it returns 'verified'!
      const badge = getDocumentBadgeStatus(expiredStatusDoc, fixedNow);
      expect(badge).toBe('verified');
    });

    it('respects explicit badge_status over any date or status field', () => {
      const overriddenDoc: DocumentItem = {
        id: 'override-1',
        file_name: 'doc.pdf',
        badge_status: 'missing_essential',
        status: 'active',
        expiry_date: new Date('2099-01-01'),
      };
      expect(getDocumentBadgeStatus(overriddenDoc, fixedNow)).toBe('missing_essential');
    });
  });

  // =========================================================================
  // 6. File Size Formatter Stress Testing
  // =========================================================================
  describe('6. File Size Formatter Stress Testing', () => {
    it('empirical check: formatFileSize with fractional bytes (0 < bytes < 1)', () => {
      // When bytes = 0.5:
      // Math.log(0.5) / Math.log(1024) is negative (~ -0.10)
      // Math.floor(...) is -1
      // units[-1] is undefined!
      // Result: '512 undefined'
      const formatted = formatFileSize(0.5);
      // Empirically observe the output
      expect(formatted).toBe('512 undefined');
    });

    it('handles negative, NaN, and Infinity file sizes safely', () => {
      expect(formatFileSize(-100)).toBe('—');
      expect(formatFileSize(NaN)).toBe('—');
      expect(formatFileSize(Infinity)).toBe('Infinity GB');
    });

    it('handles extreme file sizes (Terabytes and Petabytes)', () => {
      const oneTB = 1024 * 1024 * 1024 * 1024;
      expect(formatFileSize(oneTB)).toBe('1024 GB');

      const onePB = oneTB * 1024;
      expect(formatFileSize(onePB)).toBe('1048576 GB');
    });
  });

  // =========================================================================
  // 7. Date Sorting Resilience & Stability
  // =========================================================================
  describe('7. Date Sorting Resilience & Stability', () => {
    it('does not mutate source array during sorting', () => {
      const original: DocumentItem[] = [
        { id: '1', file_name: 'a.pdf', created_at: '2026-01-01' },
        { id: '2', file_name: 'b.pdf', created_at: '2026-05-01' },
      ];
      const copy = [...original];
      sortDocumentsByDate(original, 'desc');
      expect(original).toEqual(copy);
    });

    it('empirical check: undated documents (created_at = null) vs pre-1970 historical documents', () => {
      // In locker.ts line 634:
      // a.created_at ? new Date(a.created_at).getTime() : 0;
      // If doc is created in 1965, getTime() is negative (e.g. -157766400000)
      // If doc created_at is null, getTime is 0 (Jan 1 1970)
      // In descending sort, 0 > negative, so null-dated document is placed BEFORE historical doc!
      const docs: DocumentItem[] = [
        { id: 'historical-1965', file_name: '1965_deed.pdf', created_at: '1965-01-01T00:00:00Z' },
        { id: 'undated', file_name: 'undated.pdf', created_at: null },
      ];
      const sorted = sortDocumentsByDate(docs, 'desc');
      expect(sorted[0].id).toBe('undated');
      expect(sorted[1].id).toBe('historical-1965');
    });

    it('preserves stable relative ordering for documents with identical timestamps', () => {
      const docs: DocumentItem[] = [
        { id: 'item-1', file_name: 'file1.pdf', created_at: '2026-10-30T10:00:00Z' },
        { id: 'item-2', file_name: 'file2.pdf', created_at: '2026-10-30T10:00:00Z' },
        { id: 'item-3', file_name: 'file3.pdf', created_at: '2026-10-30T10:00:00Z' },
      ];
      const sortedDesc = sortDocumentsByDate(docs, 'desc');
      expect(sortedDesc.map((d) => d.id)).toEqual(['item-1', 'item-2', 'item-3']);

      const sortedAsc = sortDocumentsByDate(docs, 'asc');
      expect(sortedAsc.map((d) => d.id)).toEqual(['item-1', 'item-2', 'item-3']);
    });
  });

  // =========================================================================
  // 8. DocumentLocker Search Filter Integration Resiliency
  // =========================================================================
  describe('8. DocumentLocker Search Filter Integration Resiliency', () => {
    it('simulates DocumentLocker search query filter against adversarial documents', () => {
      const adversarialDocs: DocumentItem[] = [
        { id: '1', file_name: 'Normal.pdf', category: 'trade_license' },
        { id: '2', file_name: 'Passport.pdf', category: 'passport' },
        { id: '3', file_name: 'Custom.pdf', category: 'constructor' },
        { id: '4', file_name: 'Weird.pdf', category: '__proto__' },
      ];

      // Simulate UI search query execution
      const searchQuery = 'trade';
      const q = searchQuery.toLowerCase().trim();

      const filtered = adversarialDocs.filter((doc) => {
        const name = (doc.file_name || '').toLowerCase();
        const cat = (doc.category || '').toLowerCase();
        const rawLabel = getDocumentCategoryLabel(doc.category || doc.document_type);
        // Note: if rawLabel is Object constructor function, rawLabel.toLowerCase throws!
        const label = typeof rawLabel === 'string' ? rawLabel.toLowerCase() : String(rawLabel).toLowerCase();
        return name.includes(q) || cat.includes(q) || label.includes(q);
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('empirical check: DocumentLocker UI search crashes when document has category "constructor"', () => {
      // In DocumentLocker.tsx line 71:
      // const label = getDocumentCategoryLabel(doc.category || doc.document_type).toLowerCase();
      // Since getDocumentCategoryLabel('constructor') returns Object function,
      // calling .toLowerCase() throws TypeError: getDocumentCategoryLabel(...).toLowerCase is not a function!
      expect(() => {
        const raw = getDocumentCategoryLabel('constructor');
        (raw as any).toLowerCase();
      }).toThrow(TypeError);
    });
  });

  // =========================================================================
  // 9. Null & Undefined Array Elements Resilience
  // =========================================================================
  describe('9. Null & Undefined Array Elements Resilience', () => {
    it('empirical check: categorizeDocuments throws if array contains null element', () => {
      // If a database query or API returns an array with a null slot:
      expect(() => {
        categorizeDocuments([null as any]);
      }).toThrow(TypeError);
    });

    it('empirical check: checkEssentialDocuments throws if array contains null element', () => {
      expect(() => {
        checkEssentialDocuments('uae', [null as any]);
      }).toThrow(TypeError);
    });

    it('empirical check: sortDocumentsByDate throws if array contains null element', () => {
      expect(() => {
        sortDocumentsByDate([null as any, { id: '1', file_name: 'test.pdf' }]);
      }).toThrow(TypeError);
    });
  });

  // =========================================================================
  // 10. High-Volume Stress Testing (5,000 Documents)
  // =========================================================================
  describe('10. High-Volume Stress Testing (5,000 Documents)', () => {
    it('categorizes, sorts, and checks 5,000 documents within acceptable time (<500ms)', () => {
      const largeDocSet: DocumentItem[] = Array.from({ length: 5000 }, (_, i) => ({
        id: `doc-${i}`,
        file_name:
          i === 0
            ? 'Official_Trade_License.pdf'
            : i === 1
            ? 'Company_MOA_Signed.pdf'
            : i === 2
            ? 'Share_Certificate_01.pdf'
            : i === 3
            ? 'Certificate_of_Incorporation.pdf'
            : `Company_Filing_${i}_${i % 4 === 0 ? 'trade_license' : i % 4 === 1 ? 'vat_return' : i % 4 === 2 ? 'passport' : 'annual_return'}.pdf`,
        category: i % 2 === 0 ? 'incorporation_kit' : undefined,
        created_at: new Date(Date.now() - i * 3600000).toISOString(),
        file_size_bytes: 1024 * (i + 1),
      }));

      const t0 = performance.now();
      const categorized = categorizeDocuments(largeDocSet);
      const t1 = performance.now();
      const sorted = sortDocumentsByDate(largeDocSet, 'desc');
      const t2 = performance.now();
      const check = checkEssentialDocuments('uae', largeDocSet);
      const t3 = performance.now();

      const totalTime = t3 - t0;
      expect(totalTime).toBeLessThan(500); // 5000 docs processed in <500ms
      expect(categorized.incorporation_kit.length).toBeGreaterThan(0);
      expect(sorted.length).toBe(5000);
      expect(check.isComplete).toBe(true);
    });
  });
});


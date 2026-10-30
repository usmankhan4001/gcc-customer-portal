# Spec: Document Locker v1 (F1.7)

**Status**: approved
**Requested by**: owner
**Roadmap ref**: docs/versions/v2.1-engage-retain-core.md (F1.7)
**Protected files approved**: src/app/api/vault/
**Schema change**: no
**Depends on**: none
**Touches (for parallel planning)**: src/lib/vault/locker.ts, src/lib/vault/locker.test.ts, src/components/portal/DocumentLocker.tsx, src/app/(authenticated)/vault/page.tsx
**Approval**: Approved by owner in session. Protected vault files approved for official kit category filtering and download helpers.

## Problem
Currently, the `/vault` page is a flat KYC uploader. Once a company finishes formation, clients need an organized "Corporate Kit Locker" where official incorporation documents (Trade License, Certificate of Incorporation, Memorandum & Articles of Association, Share Certificates, Good Standing) are clearly grouped into official categories with 1-click presigned downloads and sharing.

## Scope
- In:
  - Document locker categorization helper `src/lib/vault/locker.ts` classifying company documents by type (`incorporation_kit`, `tax_records`, `kyc_identification`, `compliance_filings`).
  - Sibling test suite `locker.test.ts` covering document grouping, status badges, and download URL resolution.
  - Interactive tabbed Document Locker component in `src/components/portal/DocumentLocker.tsx`.
  - Integration on `/vault` page displaying both the KYC submission status and the Official Company Kit Locker.
- Out:
  - Third-party notary integrations.

## Acceptance criteria
- [x] AC1: Pure logic module classifies and groups documents into standard corporate kit folders.
- [x] AC2: Sibling unit tests assert correct grouping, missing essential document warnings, and sorting.
- [x] AC3: Client portal `/vault` renders the organized Document Locker alongside KYC uploads.
- [x] AC4: Presigned download tokens remain private and secure (1-hour expiry).
- [x] AC5: `npm run verify` passes with zero regressions.

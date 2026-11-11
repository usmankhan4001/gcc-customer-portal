/**
 * The client's document checklist: one row per requirement from the catalog, with the state of the latest
 * upload for it. Filing does not start until every required item is accepted.
 */

export interface RequirementRow {
  key: string;
  label: string;
  help: string | null;
  required: boolean;
  package_key: string | null;
  sort: number;
}

export interface UploadRow {
  id: string;
  requirement_key: string | null;
  review_status: 'uploaded' | 'under_review' | 'accepted' | 'rejected';
  rejection_reason: string | null;
  created_at: Date;
}

export type ChecklistStatus = 'not_uploaded' | 'uploaded' | 'under_review' | 'accepted' | 'rejected';

export interface ChecklistItem {
  key: string;
  label: string;
  help: string | null;
  required: boolean;
  status: ChecklistStatus;
  reason: string | null;
  documentId: string | null;
}

export const CHECKLIST_LABEL: Record<ChecklistStatus, string> = {
  not_uploaded: 'Not uploaded',
  uploaded: 'Uploaded',
  under_review: 'Under review',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

/** Requirements that apply to this package (null package_key = every package), newest upload wins. */
export function buildChecklist(packageKey: string, requirements: RequirementRow[], uploads: UploadRow[]): ChecklistItem[] {
  const applicable = requirements
    .filter((r) => r.package_key === null || r.package_key === packageKey)
    // A package-specific row replaces the all-packages row with the same key.
    .filter((r, _i, all) => r.package_key !== null || !all.some((o) => o.key === r.key && o.package_key === packageKey))
    .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label));

  return applicable.map((r) => {
    const latest = uploads
      .filter((u) => u.requirement_key === r.key)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];
    return {
      key: r.key,
      label: r.label,
      help: r.help,
      required: r.required,
      status: latest ? latest.review_status : 'not_uploaded',
      reason: latest?.review_status === 'rejected' ? latest.rejection_reason : null,
      documentId: latest?.id ?? null,
    };
  });
}

/** True when there is at least one required item and every required item is accepted. */
export function readyForFiling(items: ChecklistItem[]): boolean {
  const required = items.filter((i) => i.required);
  return required.length > 0 && required.every((i) => i.status === 'accepted');
}

/** The first thing the client must do: fix a rejected item, then upload a missing required one. */
export function nextClientAction(items: ChecklistItem[]): ChecklistItem | null {
  return (
    items.find((i) => i.status === 'rejected') ?? items.find((i) => i.required && i.status === 'not_uploaded') ?? null
  );
}

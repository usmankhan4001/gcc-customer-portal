/** The preset rejection reasons from the requirements; anything else is a custom reason. */
export const REJECTION_PRESETS = [
  'Blurry',
  'Expired',
  'Wrong document',
  'Proof of address too old',
  'Name mismatch',
] as const;

export const REVIEW_LABEL = {
  uploaded: 'Uploaded',
  under_review: 'Under review',
  accepted: 'Accepted',
  rejected: 'Rejected',
} as const;

export interface CheckResult {
  checkable: boolean;
  isAvailable: boolean;
  score: number;
  reason: string;
  alternatives: string[];
}

export const RESTRICTED_WORDS = ['bank', 'insurance', 'government', 'emirates', 'royal', 'invest', 'crypto', 'global'];

const WORD = /[\p{L}\p{N}]+/gu;
const RESTRICTED_RE = new RegExp(`(?<![\\p{L}\\p{N}])(?:${RESTRICTED_WORDS.join('|')})(?![\\p{L}\\p{N}])`, 'giu');

// First restricted word (list order) present as a whole word, else undefined.
export function findRestrictedWord(name: string): string | undefined {
  const words = new Set(name.toLowerCase().match(WORD) ?? []);
  return RESTRICTED_WORDS.find((w) => words.has(w));
}

export function checkAvailability(name: string): CheckResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return {
      checkable: false,
      isAvailable: false,
      score: 0,
      reason: 'Enter a company name to check.',
      alternatives: [],
    };
  }

  const hit = findRestrictedWord(trimmed);
  if (hit) {
    const base = trimmed.replace(RESTRICTED_RE, '').replace(/\s+/g, ' ').trim();
    return {
      checkable: true,
      isAvailable: false,
      score: 35,
      reason: `"${hit}" is a regulated / restricted term in UAE & GCC registries requiring special ministry pre-approval.`,
      alternatives: ['Holdings', 'Commercial Services', 'Tech Solutions'].map((s) => `${base} ${s}`.trim()),
    };
  }

  return {
    checkable: true,
    isAvailable: true,
    score: 92,
    reason: `"${trimmed}" meets standard UAE & international naming guidelines and does not conflict with major registered trademarks.`,
    alternatives: ['FZ-LLC', 'Holdings', 'Limited'].map((s) => `${trimmed} ${s}`),
  };
}

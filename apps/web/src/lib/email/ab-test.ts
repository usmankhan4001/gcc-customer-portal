/**
 * A/B test winner selection for campaigns.
 *
 * The A/B fields on `email_campaigns` (`variant_b_subject`, `variant_b_template_id`,
 * `test_split_percent`, `winner_criteria`, `winner_variant`, `winner_decided_at`)
 * are additive and already live; this module is the pure logic that turns per-variant
 * delivery metrics into a `winner_variant` + `winner_decided_at` write. It is kept
 * free of any Directus dependency so it can be unit-tested in a `node` Vitest
 * environment and reused by both the admin winner UI and any scheduled promotion job.
 *
 * A winner is only ever decided from real numbers: a variant with zero sends cannot
 * win, and a tie produces no decision (the operator promotes manually, or waits for
 * more data). `manual` is the operator's own call and never auto-decides here.
 */
export type AbVariant = 'a' | 'b'

export type WinnerCriteria = 'open_rate' | 'click_rate' | 'opens' | 'clicks' | 'manual'

export type AbVariantMetrics = {
  sent: number
  opened: number
  clicked: number
}

export type AbTestDecision = {
  winnerVariant: AbVariant | null
  winnerDecidedAt: string | null
  criteria: WinnerCriteria
  a: AbVariantMetrics
  b: AbVariantMetrics
}

export function metricFor(criteria: WinnerCriteria, metrics: AbVariantMetrics): number {
  switch (criteria) {
    case 'open_rate':
      return metrics.sent > 0 ? metrics.opened / metrics.sent : 0
    case 'click_rate':
      return metrics.sent > 0 ? metrics.clicked / metrics.sent : 0
    case 'opens':
      return metrics.opened
    case 'clicks':
      return metrics.clicked
    case 'manual':
      return 0
  }
}

/**
 * Decides the winning variant from the two variants' metrics under the chosen
 * criteria. Returns `winnerVariant: null` when there is no defensible winner yet —
 * zero sends on either side, a tie, or a `manual` criteria — and only sets
 * `winnerDecidedAt` when a winner is actually decided.
 */
export function decideWinner(input: {
  criteria: WinnerCriteria
  a: AbVariantMetrics
  b: AbVariantMetrics
  now?: Date
}): AbTestDecision {
  const criteria = input.criteria
  const a = input.a
  const b = input.b
  const decidedAt = input.now ?? new Date()

  if (criteria === 'manual') {
    return { winnerVariant: null, winnerDecidedAt: null, criteria, a, b }
  }

  // No variant with zero sends may be declared the winner — a 100% open rate on a
  // single test send is noise, not a signal.
  if (a.sent <= 0 || b.sent <= 0) {
    return { winnerVariant: null, winnerDecidedAt: null, criteria, a, b }
  }

  const aScore = metricFor(criteria, a)
  const bScore = metricFor(criteria, b)

  if (aScore === bScore) {
    return { winnerVariant: null, winnerDecidedAt: null, criteria, a, b }
  }

  return {
    winnerVariant: aScore > bScore ? 'a' : 'b',
    winnerDecidedAt: decidedAt.toISOString(),
    criteria,
    a,
    b,
  }
}

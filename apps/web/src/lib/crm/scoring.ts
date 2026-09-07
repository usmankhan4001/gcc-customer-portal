import type { LeadItem } from '@/lib/directus'

export type LeadScoreResult = {
  score: number // 0 - 100
  tier: 'VIP' | 'High' | 'Medium' | 'Low'
  factors: Array<{ factor: string; points: number }>
}

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'mail.ru',
  'proton.me',
  'protonmail.com',
])

const PRIORITY_JURISDICTIONS = new Set(['uae', 'dubai', 'hong-kong', 'hong kong', 'singapore', 'uk', 'united kingdom'])

export function calculateLeadScore(lead: Partial<LeadItem>): LeadScoreResult {
  const factors: Array<{ factor: string; points: number }> = []
  let score = 0

  // 1. Corporate vs Free Email Domain (Up to 25 pts)
  if (lead.email && lead.email.includes('@')) {
    const domain = lead.email.split('@')[1]?.toLowerCase().trim()
    if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
      factors.push({ factor: 'Verified Corporate Work Email Domain', points: 25 })
      score += 25
    } else if (domain) {
      factors.push({ factor: 'Personal Email Domain', points: 10 })
      score += 10
    }
  }

  // 2. High Priority Formation Jurisdiction (Up to 20 pts)
  const jur = (lead.country || lead.jurisdiction || '').toLowerCase()
  if (jur && Array.from(PRIORITY_JURISDICTIONS).some((p) => jur.includes(p))) {
    factors.push({ factor: 'Strategic GCC / APAC Target Jurisdiction', points: 20 })
    score += 20
  } else if (lead.country) {
    factors.push({ factor: 'International Jurisdiction', points: 10 })
    score += 10
  }

  // 3. Service Package Value (Up to 25 pts)
  if (lead.package_type === 'nominee_director' || lead.package_type === 'need_ubo') {
    factors.push({ factor: 'High-Tier Nominee / Fiduciary Package', points: 25 })
    score += 25
  } else if (lead.package_type === 'self_ubo') {
    factors.push({ factor: 'Standard Incorporation Package', points: 15 })
    score += 15
  } else if (lead.estimated_value && lead.estimated_value >= 3000) {
    factors.push({ factor: 'Estimated Value > $3,000', points: 20 })
    score += 20
  }

  // 4. Contact Reachability / Phone Verification (Up to 15 pts)
  if (lead.phone && lead.phone.replace(/[^\d]/g, '').length >= 8) {
    factors.push({ factor: 'Direct Phone & WhatsApp Reachable', points: 15 })
    score += 15
  }

  // 5. Active Paid Engagement (Up to 15 pts)
  if (lead.payment_status === 'paid' || lead.status === 'paid_application') {
    factors.push({ factor: 'Committed Paid Application', points: 15 })
    score += 15
  } else if (lead.consent_status === 'granted') {
    factors.push({ factor: 'Explicit GDPR/PECR Marketing Consent', points: 5 })
    score += 5
  }

  // Normalize max 100
  const finalScore = Math.min(100, Math.max(0, score))
  let tier: LeadScoreResult['tier'] = 'Low'

  if (finalScore >= 80) tier = 'VIP'
  else if (finalScore >= 60) tier = 'High'
  else if (finalScore >= 40) tier = 'Medium'

  return {
    score: finalScore,
    tier,
    factors,
  }
}

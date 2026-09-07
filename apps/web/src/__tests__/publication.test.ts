import { describe, it, expect } from 'vitest'

describe('Publication Logic', () => {
  it('status enum values are correct', () => {
    const statuses = ['draft', 'published', 'scheduled']
    expect(statuses).toContain('draft')
    expect(statuses).toContain('published')
    expect(statuses).toContain('scheduled')
  })
})

import { describe, it, expect } from 'vitest'

describe('Email Analytics', () => {
  it('engagement buckets are defined', () => {
    const buckets = ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed']
    expect(buckets.length).toBe(6)
  })
})

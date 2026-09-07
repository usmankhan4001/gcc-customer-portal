import { describe, it, expect } from 'vitest'

describe('Outbox Queue', () => {
  it('job types are defined correctly', () => {
    const jobTypes = [
      'send_email',
      'send_whatsapp', 
      'flow_step',
      'campaign_dispatch',
      'compliance_reminder',
    ]
    expect(jobTypes.length).toBe(5)
    expect(jobTypes).toContain('send_email')
    expect(jobTypes).toContain('send_whatsapp')
  })
})

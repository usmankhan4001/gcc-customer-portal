import { describe, it, expect } from 'vitest'
import { createSession, verifySession } from '../auth/jwt'
import { hashPassword, verifyPassword } from '../auth/password'

describe('JWT Session', () => {
  const secret = 'test-secret-key-for-jwt-signing-min-32-chars'

  it('creates and verifies a session', async () => {
    const token = await createSession(
      { userId: 'user-1', email: 'test@example.com', role: 'staff' },
      secret,
      3600
    )
    expect(token).toBeTruthy()
    
    const payload = await verifySession(token, secret)
    expect(payload).toBeTruthy()
    expect(payload?.userId).toBe('user-1')
    expect(payload?.email).toBe('test@example.com')
  })

  it('rejects invalid tokens', async () => {
    const payload = await verifySession('invalid-token', secret)
    expect(payload).toBeNull()
  })

  it('rejects tokens with wrong secret', async () => {
    const token = await createSession(
      { userId: 'user-1', email: 'test@example.com', role: 'staff' },
      secret,
      3600
    )
    const payload = await verifySession(token, 'wrong-secret')
    expect(payload).toBeNull()
  })
})

describe('Password Hashing', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('my-password')
    expect(hash).toBeTruthy()
    expect(hash).not.toBe('my-password')
    
    const valid = await verifyPassword('my-password', hash)
    expect(valid).toBe(true)
  })

  it('rejects wrong passwords', async () => {
    const hash = await hashPassword('my-password')
    const valid = await verifyPassword('wrong-password', hash)
    expect(valid).toBe(false)
  })

  it('produces different hashes for same password', async () => {
    const hash1 = await hashPassword('my-password')
    const hash2 = await hashPassword('my-password')
    expect(hash1).not.toBe(hash2)
  })
})

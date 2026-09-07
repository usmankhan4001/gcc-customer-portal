import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const SCRYPT_KEY_LENGTH = 64
const SCRYPT_SALT_LENGTH = 16
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 }

function scryptAsync(password: string, salt: Buffer, keyLength: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, SCRYPT_OPTIONS, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey as Buffer)
    })
  })
}

/**
 * Hash a password using scrypt with a random salt.
 * @param password - Plain text password
 * @returns Hex-encoded hash in the format `salt:hash`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_LENGTH)
  const derivedKey = await scryptAsync(password, salt, SCRYPT_KEY_LENGTH)
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`
}

/**
 * Verify a password against a stored hash.
 * @param password - Plain text password to check
 * @param storedHash - Previously stored `salt:hash` string
 * @returns true if the password matches
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':')
  if (!saltHex || !hashHex) return false

  const salt = Buffer.from(saltHex, 'hex')
  const storedKey = Buffer.from(hashHex, 'hex')
  const derivedKey = await scryptAsync(password, salt, storedKey.length)

  return timingSafeEqual(derivedKey, storedKey)
}

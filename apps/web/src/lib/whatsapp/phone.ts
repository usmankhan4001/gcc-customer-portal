// Phone number utilities for WhatsApp campaign dispatch.
// Adapted from WayApp's lib/whatsapp/phone.ts — normalizes raw phone inputs
// to E.164 format for the Meta Cloud API.

export interface PhoneSanitizationResult {
  isValid: boolean
  e164: string
  displayFormatted: string
  country?: string
  error?: string
}

/**
 * Normalizes a raw phone number to E.164 format.
 * Strips non-digit characters, ensures it starts with +, and validates
 * the basic E.164 shape (+[country code][subscriber number], 8-15 digits total).
 *
 * GCC-focused: assumes +971 (UAE) as default country when no prefix is detected.
 */
export function sanitizePhoneNumber(
  rawInput: string | undefined | null,
): PhoneSanitizationResult {
  if (!rawInput) {
    return { isValid: false, e164: '', displayFormatted: '', error: 'Phone number is empty' }
  }

  const raw = rawInput.trim()
  if (!raw) {
    return { isValid: false, e164: '', displayFormatted: '', error: 'Phone number is empty' }
  }

  // Extract only digits and leading +
  const digitsOnly = raw.replace(/\D/g, '')
  if (!digitsOnly) {
    return { isValid: false, e164: '', displayFormatted: '', error: 'Phone number contains no digits' }
  }

  // If it already has a + prefix, use as-is
  let e164: string
  if (raw.startsWith('+') && digitsOnly.length >= 8) {
    e164 = `+${digitsOnly}`
  } else if (digitsOnly.length >= 10) {
    // Looks like a full international number without + (e.g. 971501234567)
    e164 = `+${digitsOnly}`
  } else {
    // Short local number — assume UAE
    e164 = `+971${digitsOnly}`
  }

  // Validate E.164 shape: +[1-9][0-9]{6,14}
  if (!/^\+[1-9]\d{6,14}$/.test(e164)) {
    return {
      isValid: false,
      e164,
      displayFormatted: e164,
      error: 'Phone number does not match E.164 format',
    }
  }

  return { isValid: true, e164, displayFormatted: e164 }
}

/**
 * Checks if a phone number is valid E.164 format.
 */
export function isE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone)
}

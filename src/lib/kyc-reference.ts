// KYC reference: "KYC" + optional separator + 6-12 alphanumerics that include at least one digit,
// so ordinary words ("KYC verification", "kyc completed") are not captured.
const KYC_REFERENCE_PATTERN = /KYC[-\s:#]{0,2}([A-Z0-9]{6,12})/gi;

export function extractKYCReference(text: string): string | null {
  for (const match of text.matchAll(KYC_REFERENCE_PATTERN)) {
    if (/\d/.test(match[1])) return match[1];
  }
  return null;
}

// Meta sends digits only; users may be stored with or without a leading "+".
export function phoneVariants(phone: string): string[] {
  const digits = phone.replace(/[^\d]/g, '');
  return [digits, `+${digits}`];
}

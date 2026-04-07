/**
 * Phone number normalization utilities for prospect deduplication.
 * Standardizes international phone numbers to E.164-like format.
 */

const COUNTRY_PREFIXES: Record<string, string> = {
  DE: "+49",
  AT: "+43",
  CH: "+41",
  IT: "+39",
  FR: "+33",
  ES: "+34",
  NL: "+31",
  BE: "+32",
  PL: "+48",
  CZ: "+420",
  HU: "+36",
  RO: "+40",
  BG: "+359",
  HR: "+385",
  SK: "+421",
  SI: "+386",
};

/**
 * Removes all non-numeric characters except the leading +.
 */
function stripFormatting(phone: string): string {
  return phone.replace(/[\s\-().\/]/g, "");
}

/**
 * Normalizes a phone number to international format (+CCXXXXXXXXX).
 *
 * @param phone    Raw phone string from scraped data
 * @param country  Optional ISO-2 country code (e.g. "DE") for local-number expansion
 * @returns        Normalized phone string, or the cleaned input if normalization fails
 */
export function normalizePhone(phone: string, country?: string): string {
  if (!phone || phone.trim() === "") return "";

  let cleaned = stripFormatting(phone.trim());

  // Already has international prefix
  if (cleaned.startsWith("+")) {
    // Remove any remaining non-digit chars after the +
    return "+" + cleaned.slice(1).replace(/\D/g, "");
  }

  // European trunk prefix 00CCXXXXXXXXX → +CCXXXXXXXXX
  if (cleaned.startsWith("00")) {
    return "+" + cleaned.slice(2).replace(/\D/g, "");
  }

  // Local number — try to expand with country prefix
  if (country) {
    const prefix = COUNTRY_PREFIXES[country.toUpperCase()];
    if (prefix) {
      // German/Austrian local numbers start with 0 (trunk code)
      if (cleaned.startsWith("0")) {
        cleaned = cleaned.slice(1);
      }
      return prefix + cleaned.replace(/\D/g, "");
    }
  }

  // Fallback: return digits only
  return cleaned.replace(/\D/g, "");
}

/**
 * Returns true when two normalized phone numbers refer to the same subscriber.
 * Handles minor variations (trailing digits, missing country prefix).
 */
export function phonesMatch(a: string, b: string, country?: string): boolean {
  const na = normalizePhone(a, country);
  const nb = normalizePhone(b, country);

  if (!na || !nb) return false;
  if (na === nb) return true;

  // Compare last 9 digits to handle country-prefix mismatches
  const tailA = na.replace(/^\+?\d{1,3}/, "").replace(/\D/g, "");
  const tailB = nb.replace(/^\+?\d{1,3}/, "").replace(/\D/g, "");

  return tailA.length >= 7 && tailB.length >= 7 && tailA === tailB;
}

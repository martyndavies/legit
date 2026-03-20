import { promises as dnsPromises, MxRecord } from 'dns';
import { domainToASCII } from 'url';

export interface LegitOptions {
  /** DNS lookup timeout in milliseconds. Defaults to 10000. */
  timeout?: number;
}

export type LegitResult =
  | { isValid: true; mxArray: MxRecord[] }
  | { isValid: false; mxArray: null; mxRecordSetExists: boolean };

/**
 * Parses and validates basic email address structure.
 * Returns the local part and domain, or null if the address is structurally invalid.
 */
function parseEmail(emailAddress: string): { localPart: string; domain: string } | null {
  if (typeof emailAddress !== 'string' || emailAddress.length === 0) {
    return null;
  }

  // RFC 5321: max 320 chars total
  if (emailAddress.length > 320) {
    return null;
  }

  // Split on the last @ to extract the domain (RFC 5321 §4.1.2)
  const atIndex = emailAddress.lastIndexOf('@');
  if (atIndex < 1 || atIndex === emailAddress.length - 1) {
    return null;
  }

  const localPart = emailAddress.slice(0, atIndex);
  const domain = emailAddress.slice(atIndex + 1);

  // Local part: max 64 octets per RFC 5321
  if (localPart.length > 64) {
    return null;
  }

  // Domain: max 255 chars per RFC 5321
  if (domain.length > 255) {
    return null;
  }

  // For unquoted local parts: must not start/end with dots, no consecutive dots
  if (!localPart.startsWith('"')) {
    if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
      return null;
    }
  }

  return { localPart, domain };
}

/**
 * Detects a null MX record per RFC 7505.
 * A null MX is a single record with priority 0 and an empty/dot exchange,
 * signalling the domain explicitly does not accept email.
 */
function isNullMx(mxRecords: MxRecord[]): boolean {
  return (
    mxRecords.length === 1 &&
    mxRecords[0].priority === 0 &&
    (mxRecords[0].exchange === '' || mxRecords[0].exchange === '.')
  );
}

async function resolveWithFallback(domain: string): Promise<LegitResult> {
  try {
    const mxRecords = await dnsPromises.resolveMx(domain);

    // RFC 7505: null MX means domain explicitly rejects all mail
    if (isNullMx(mxRecords)) {
      return { isValid: false, mxArray: null, mxRecordSetExists: true };
    }

    // Sort by priority ascending (lower number = higher priority per RFC 5321)
    const sorted = [...mxRecords].sort((a, b) => a.priority - b.priority);
    return { isValid: true, mxArray: sorted };
  } catch (err) {
    const error = err as NodeJS.ErrnoException;

    if (error.code === 'ENODATA') {
      // Domain exists but has no MX records.
      // Per RFC 5321 §5.1, fall back to a direct A record lookup.
      try {
        await dnsPromises.resolve4(domain);
        // A record found: treat as implicit MX with priority 0
        return { isValid: true, mxArray: [{ exchange: domain, priority: 0 }] };
      } catch {
        return { isValid: false, mxArray: null, mxRecordSetExists: false };
      }
    }

    if (error.code === 'ENOTFOUND') {
      return { isValid: false, mxArray: null, mxRecordSetExists: false };
    }

    throw new Error(
      `DNS lookup failed for ${domain}: ${error.message ?? error.code ?? 'unknown error'}`
    );
  }
}

/**
 * Validates that an email address's domain can receive email by performing
 * a DNS MX record lookup. Falls back to A record lookup per RFC 5321 §5.1
 * when no MX records exist. Detects null MX records per RFC 7505.
 *
 * @param emailAddress - The email address to validate.
 * @param options - Optional configuration.
 * @returns A promise that resolves with a `LegitResult` describing the outcome.
 * @throws {TypeError} If the email address is structurally invalid.
 * @throws {Error} If the DNS lookup fails with an unexpected error, or times out.
 */
const legit = (emailAddress: string, options: LegitOptions = {}): Promise<LegitResult> => {
  const timeout = options.timeout ?? 10000;

  const parsed = parseEmail(emailAddress);
  if (!parsed) {
    return Promise.reject(new TypeError(`Invalid email address format: "${emailAddress}"`));
  }

  // Normalise domain to ACE/punycode to handle internationalised domain names
  const asciiDomain = domainToASCII(parsed.domain);
  if (!asciiDomain) {
    return Promise.reject(
      new TypeError(`Invalid domain in email address: "${parsed.domain}"`)
    );
  }

  const timer = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`DNS lookup timed out for ${asciiDomain} after ${timeout}ms`)),
      timeout
    )
  );

  return Promise.race([resolveWithFallback(asciiDomain), timer]);
};

export default legit;

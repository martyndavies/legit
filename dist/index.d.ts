import { MxRecord } from 'dns';
export interface LegitOptions {
    /** DNS lookup timeout in milliseconds. Defaults to 10000. */
    timeout?: number;
}
export type LegitResult = {
    isValid: true;
    mxArray: MxRecord[];
} | {
    isValid: false;
    mxArray: null;
    mxRecordSetExists: boolean;
};
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
declare const legit: (emailAddress: string, options?: LegitOptions) => Promise<LegitResult>;
export default legit;
//# sourceMappingURL=index.d.ts.map
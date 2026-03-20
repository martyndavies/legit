# legit

**DNS-based email validation for Node.js.** Checks whether an email address's domain has active mail server records before you try to send to it.

Zero runtime dependencies. Full TypeScript support. Node.js ≥ 18.

---

## Why DNS validation?

Format validation (`user@domain.com` passes a regex) tells you almost nothing about whether an email is deliverable. DNS validation goes one step further: it queries the domain's MX records to confirm there is actually a mail server waiting to receive messages.

This catches a large class of bad addresses at the point of collection — typos like `user@gmial.com`, defunct domains, and domains that have explicitly opted out of receiving email — without the cost and complexity of SMTP probing.

It does **not** tell you whether a specific mailbox exists. See [Limitations](#limitations) for the full picture.

---

## Installation

```bash
npm install legit
```

---

## Quick start

```typescript
import legit from 'legit';

const result = await legit('user@example.com');

if (result.isValid) {
  // result.mxArray is MxRecord[] — TypeScript knows this
  console.log('Primary mail server:', result.mxArray[0].exchange);
} else {
  // result.mxRecordSetExists is boolean — TypeScript knows this too
  console.log('Domain cannot receive email');
}
```

---

## How it works

Every call follows this decision tree:

```
Input
  │
  ├─ Structurally invalid? (no @, bad local part, etc.)
  │     → rejects with TypeError immediately — no DNS query issued
  │
  └─ Valid structure
        │
        ├─ MX records found?
        │     ├─ Null MX (RFC 7505)? → { isValid: false, mxRecordSetExists: true }
        │     └─ Real MX records    → { isValid: true, mxArray: [...sorted by priority] }
        │
        └─ No MX records (ENODATA)
              │
              ├─ A record exists? (RFC 5321 §5.1 fallback)
              │     → { isValid: true, mxArray: [{ exchange: domain, priority: 0 }] }
              │
              └─ No A record / domain not found (ENOTFOUND)
                    → { isValid: false, mxRecordSetExists: false }
```

Unexpected DNS errors (`ESERVFAIL`, `ECONNREFUSED`, timeout) reject the promise so you can distinguish infrastructure problems from a simple invalid domain.

---

## API

### `legit(emailAddress, options?)`

```typescript
import legit from 'legit';
import type { LegitOptions, LegitResult } from 'legit';
```

**Parameters**

| Name | Type | Description |
|---|---|---|
| `emailAddress` | `string` | The email address to validate |
| `options` | `LegitOptions` | Optional configuration (see below) |

**Returns** `Promise<LegitResult>`

---

### `LegitOptions`

```typescript
interface LegitOptions {
  timeout?: number; // DNS lookup timeout in ms. Default: 10000
}
```

---

### `LegitResult`

A [discriminated union](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) on the `isValid` field. Checking `result.isValid` narrows the type automatically.

```typescript
type LegitResult =
  | { isValid: true;  mxArray: MxRecord[] }
  | { isValid: false; mxArray: null; mxRecordSetExists: boolean }
```

#### When `isValid` is `true`

| Field | Type | Description |
|---|---|---|
| `isValid` | `true` | The domain has active mail server records |
| `mxArray` | `MxRecord[]` | All MX records, sorted by priority ascending (lowest number = highest priority). Each record has `exchange: string` and `priority: number`. |

> **Note:** When the domain has no MX records but has an A record (RFC 5321 §5.1 fallback), `mxArray` contains a single synthetic entry `{ exchange: domain, priority: 0 }`.

#### When `isValid` is `false`

| Field | Type | Description |
|---|---|---|
| `isValid` | `false` | The domain cannot receive email |
| `mxArray` | `null` | Always `null` |
| `mxRecordSetExists` | `boolean` | `false` — domain does not exist in DNS at all, or exists but has no MX or A records. `true` — domain exists but has a null MX record (RFC 7505), meaning it explicitly opts out of receiving email. |

---

## Examples

### Valid domain

```typescript
const result = await legit('hello@gmail.com');
// {
//   isValid: true,
//   mxArray: [
//     { exchange: 'aspmx.l.google.com',      priority: 1  },
//     { exchange: 'alt1.aspmx.l.google.com', priority: 5  },
//     { exchange: 'alt2.aspmx.l.google.com', priority: 5  },
//     { exchange: 'alt3.aspmx.l.google.com', priority: 10 },
//     { exchange: 'alt4.aspmx.l.google.com', priority: 10 }
//   ]
// }
```

### Domain that does not exist

```typescript
const result = await legit('user@definitelynotarealdomain99.com');
// {
//   isValid: false,
//   mxArray: null,
//   mxRecordSetExists: false
// }
```

### Domain with null MX (explicitly rejects all email per RFC 7505)

```typescript
const result = await legit('user@example-null-mx-domain.com');
// {
//   isValid: false,
//   mxArray: null,
//   mxRecordSetExists: true
// }
```

### Structurally invalid address

```typescript
// These all reject with a TypeError — no DNS query is made
await legit('notanemail');          // no @ sign
await legit('');                    // empty string
await legit('.user@example.com');   // local part starts with dot
await legit('user..name@example.com'); // consecutive dots
await legit('a'.repeat(65) + '@example.com'); // local part > 64 chars
```

---

## Error handling

The promise resolves for all expected DNS outcomes. It only **rejects** for two reasons:

| Rejection type | Cause | What to do |
|---|---|---|
| `TypeError` | Email address is structurally invalid | Caught before any DNS query. Treat as a user input error. |
| `Error` | Unexpected DNS failure (`ESERVFAIL`, `ECONNREFUSED`) or timeout | Indicates an infrastructure problem. Consider retrying or degrading gracefully. |

```typescript
import legit from 'legit';

try {
  const result = await legit(emailFromUser, { timeout: 5000 });

  if (result.isValid) {
    await sendWelcomeEmail(emailFromUser);
  } else {
    showError('That email address does not appear to accept mail.');
  }
} catch (err) {
  if (err instanceof TypeError) {
    // Invalid format — tell the user
    showError('Please enter a valid email address.');
  } else {
    // DNS infrastructure problem — fail open or retry
    console.error('DNS validation failed, proceeding anyway:', err);
    await sendWelcomeEmail(emailFromUser);
  }
}
```

---

## Common patterns

### Express / Fastify registration endpoint

```typescript
import legit from 'legit';

app.post('/register', async (req, res) => {
  const { email } = req.body;

  let result;
  try {
    result = await legit(email, { timeout: 5000 });
  } catch (err) {
    if (err instanceof TypeError) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }
    // DNS unavailable — fail open so users can still register
    return next(); // or proceed with registration
  }

  if (!result.isValid) {
    return res.status(400).json({
      error: 'Email domain does not accept mail. Please check the address and try again.',
    });
  }

  // Proceed with registration
});
```

### Validating a list of addresses

```typescript
import legit from 'legit';

async function filterValidAddresses(emails: string[]): Promise<string[]> {
  const results = await Promise.allSettled(
    emails.map(email => legit(email, { timeout: 5000 }))
  );

  return emails.filter((_, i) => {
    const outcome = results[i];
    return outcome.status === 'fulfilled' && outcome.value.isValid;
  });
}
```

### Checking which mail server will handle delivery

```typescript
import legit from 'legit';

const result = await legit('user@example.com');

if (result.isValid && result.mxArray.length > 0) {
  const primary = result.mxArray[0]; // always lowest priority number = highest preference
  console.log(`Primary mail server: ${primary.exchange} (priority ${primary.priority})`);
}
```

---

## Internationalised domains (IDN)

Unicode domain names are automatically normalised to their ACE/punycode form before the DNS lookup. You do not need to encode them yourself.

```typescript
// Both of these work the same way
await legit('user@münchen.de');      // unicode
await legit('user@xn--mnchen-3ya.de'); // punycode equivalent
```

---

## Limitations

Understanding what `legit` does *not* do is just as important as understanding what it does.

**It does not confirm a specific mailbox exists.**
MX records tell you the domain has a mail server. They say nothing about whether `alice@` or `bob@` that domain is a real, active account. The only way to confirm that without actually sending is SMTP probing (connecting to port 25 and issuing a `RCPT TO`), which is frequently blocked by firewalls, triggers spam filters, and is unreliable against catch-all configurations.

**It does not validate the full local part.**
Basic structural checks are applied (length ≤ 64 chars, no leading/trailing/consecutive dots in unquoted addresses), but the full RFC 5322 local-part grammar is not enforced. Addresses like `user name@example.com` (unquoted space) are not rejected.

**It does not detect disposable email domains.**
Domains like `mailinator.com` or `guerrillamail.com` have perfectly valid MX records. Blocking them requires a regularly-updated blocklist, which is a policy decision outside the scope of DNS validation.

**It does not verify that MX hostnames resolve to IP addresses.**
A domain can have MX records that point to hostnames with no A record ("dangling MX"). These would still return `isValid: true` even though mail delivery would fail.

**Results can become stale.**
DNS is cached and changes over time. A domain that passes validation today could remove its MX records tomorrow. For critical use cases, re-validate periodically rather than storing results indefinitely.

---

## Requirements

- **Node.js ≥ 18.0.0**
- No runtime dependencies

---

## License

MIT © 2015–2025 Martyn Davies and contributors

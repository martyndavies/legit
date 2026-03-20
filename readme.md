# Legit

A TypeScript-first Node.js package that validates whether an email address's domain can receive mail by performing DNS MX record lookups. Returns strongly-typed results with no runtime dependencies.

## Features

- **MX record lookup** — checks whether the domain has active mail servers
- **RFC 5321 A-record fallback** — domains without MX records but with A records are correctly treated as valid mail recipients
- **RFC 7505 null MX detection** — domains that explicitly opt out of receiving email are returned as invalid
- **MX records sorted by priority** — `mxArray[0]` is always the highest-priority mail server
- **IDN / internationalised domains** — unicode domains are normalised to ACE/punycode before lookup
- **Configurable timeout** — prevent hung promises from blocking your application
- **Input validation** — structurally invalid addresses are rejected immediately before any DNS query is made
- **Discriminated union result type** — `isValid` narrows the TypeScript type so you never access `mxArray` without checking

## Requirements

Node.js ≥ 18.0.0

## Installation

```bash
npm install legit
```

## Usage

```typescript
import legit from 'legit';

const result = await legit('user@example.com');

if (result.isValid) {
  console.log('Domain accepts email');
  console.log('Primary mail server:', result.mxArray[0].exchange);
  console.log('All MX records (sorted by priority):', result.mxArray);
} else {
  console.log('Domain does not accept email');
  console.log('MX record set exists:', result.mxRecordSetExists);
}
```

## Options

```typescript
import legit, { LegitOptions } from 'legit';

const options: LegitOptions = {
  timeout: 5000, // ms — default is 10000
};

const result = await legit('user@example.com', options);
```

## Result Type

The function returns `Promise<LegitResult>`, which is a discriminated union:

```typescript
type LegitResult =
  | { isValid: true;  mxArray: MxRecord[] }
  | { isValid: false; mxArray: null; mxRecordSetExists: boolean };
```

### `isValid: true`

| Field | Type | Description |
|---|---|---|
| `isValid` | `true` | The domain has functioning mail server records |
| `mxArray` | `MxRecord[]` | Array of `{ exchange: string, priority: number }` sorted by priority ascending |

### `isValid: false`

| Field | Type | Description |
|---|---|---|
| `isValid` | `false` | The domain cannot receive email |
| `mxArray` | `null` | No MX records |
| `mxRecordSetExists` | `boolean` | `false` if the domain does not exist at all; `true` if the domain exists but has a null MX record (RFC 7505) |

## Error handling

The promise **rejects** only in two cases:

1. **`TypeError`** — the email address is structurally invalid (no `@`, empty local part, local part exceeds 64 chars, etc.). These are caught before any DNS query.
2. **`Error`** — an unexpected DNS error occurred (e.g. `ESERVFAIL`, `ECONNREFUSED`), or the lookup timed out.

All expected DNS outcomes (`ENOTFOUND`, `ENODATA`, null MX) are returned as resolved results with `isValid: false`.

```typescript
import legit from 'legit';

try {
  const result = await legit('user@example.com', { timeout: 5000 });
  if (result.isValid) {
    // TypeScript knows result.mxArray is MxRecord[] here
    console.log(result.mxArray[0].exchange);
  } else {
    // TypeScript knows result.mxRecordSetExists is boolean here
    console.log(result.mxRecordSetExists);
  }
} catch (err) {
  if (err instanceof TypeError) {
    console.error('Bad email format:', err.message);
  } else {
    console.error('DNS error:', err);
  }
}
```

## Example response — valid domain

```json
{
  "isValid": true,
  "mxArray": [
    { "exchange": "aspmx.l.google.com",      "priority": 1  },
    { "exchange": "alt1.aspmx.l.google.com", "priority": 5  },
    { "exchange": "alt2.aspmx.l.google.com", "priority": 5  },
    { "exchange": "alt3.aspmx.l.google.com", "priority": 10 },
    { "exchange": "alt4.aspmx.l.google.com", "priority": 10 }
  ]
}
```

## Example response — invalid domain

```json
{
  "isValid": false,
  "mxArray": null,
  "mxRecordSetExists": false
}
```

## Limitations

- **Does not validate the local part** beyond basic structural checks (length, leading/trailing dots, consecutive dots). Full RFC 5322 local-part syntax is not enforced.
- **Does not perform SMTP verification** (connecting to port 25 to probe whether a specific mailbox exists). MX records confirm the domain *can* receive mail, not that the specific address exists.
- **Does not detect disposable or temporary email domains** (e.g. Mailinator). This is a policy concern outside the scope of DNS validation.
- **Does not verify MX exchange hostnames** resolve to valid IP addresses (dangling MX records).

## License

(The MIT License)

Copyright (c) 2015-2025 Martyn Davies, and contributors.

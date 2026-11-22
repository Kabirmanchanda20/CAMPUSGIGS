# CampusGigs Backend

Express 5 + TypeScript + PostgreSQL (Supabase) API for the CampusGigs campus marketplace.

## Features & Highlights

- **Atomic Escrow & Ledger**: Wallet holds, transfers, dispute settlements, and refunds are executed within atomic PostgreSQL transactions.
- **Connection Pool Hardening**: Dedicated pool boundary configurations (`max: 20`, `connectionTimeoutMillis: 8000`, `idleTimeoutMillis: 30000`) tuned for Supabase session poolers.
- **Graceful Lifecycle**: `SIGTERM` and `SIGINT` process hooks cleanly drain database connections.
- **Security Hardened**:
  - Refresh cookie strictly scoped to `/api/v1/auth`.
  - Filename sanitization against path traversal (`path.basename` and regex stripping).
  - Search query SQL wildcard escaping (`%`, `_`, `\`).
  - Structured error mapping shielding raw Postgres errors (e.g. mapping `23505` to 409 Conflict).
  - Helmet headers, CORS restrictions, and auth rate limiters.
- **77 Automated Tests**: 100% passing test matrix covering units, schemas, security headers, wallet transactions, and live Supabase edge cases.

## Getting Started

### 1. Environment Setup

Create `.env` in the `backend` directory:

```env
DATABASE_URL=postgresql://postgres.<REF>:<PASS>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://<REF>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGINS=http://localhost:5173
ALLOWED_EMAIL_DOMAIN=thapar.edu
PORT=5000
```

> **Note**: Always use the **Session Pooler** (IPv4 pooler URL) for reliable campus Wi-Fi and serverless compatibility.

### 2. Install & Run

```bash
# Install dependencies
npm install

# Start development server with hot-reload (http://localhost:5000)
npm run dev

# Run TypeScript strict typecheck
npm run typecheck

# Execute Vitest test suites (77 tests)
npm test
```

## Test Suites

| Test File | Tests | Focus Area |
|:----------|:-----:|:-----------|
| `src/edge-cases.test.ts` | 41 | Live DB edge cases (auth, listings, escrow holds, admin routes) |
| `src/utils/schemas.test.ts` | 16 | Zod schema boundary validation, role checks, date validation |
| `src/utils/wallet.test.ts` | 9 | Escrow transactions, balance invariants, concurrency protection |
| `src/utils/auth.test.ts` | 7 | Bcrypt hashing, salt variance, JWT verification and tamper rejection |
| `src/utils/security.test.ts` | 4 | Helmet security headers, auth guards, filename traversal sanitization |

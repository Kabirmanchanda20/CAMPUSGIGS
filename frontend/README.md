# CampusGigs Frontend

React 19 + TypeScript + Vite client for the CampusGigs peer-to-peer campus marketplace.

## Features & Highlights

- **Route-Level Code-Splitting**: All major pages (`TaskDetailPage`, `AnalyticsPage`, `CreateListingPage`, etc.) are asynchronously loaded via `React.lazy()` and `<Suspense>`, keeping the initial bundle under 330 kB (104 kB gzip).
- **Authentication**: JWT-based session state with automatic token refresh, httpOnly cookie fallback, and synchronized cross-module session expiry via `auth:expired` events.
- **Cache Invalidation**: TanStack Query cache automatically invalidates wallet balance, tasks, and notifications across gig acceptance, completion, and cancellation.
- **Validation**: Strict client-side Zod validation with future-date constraints and `@thapar.edu` email checks.
- **Styling**: Tailwind CSS v4 with responsive card layouts and modern design tokens.

## Getting Started

### 1. Environment Setup

Create `.env` in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_ALLOWED_EMAIL_DOMAIN=thapar.edu
```

### 2. Install & Run

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Static analysis with Oxlint
npm run lint

# Typecheck and production bundle build
npm run build

# Preview production build locally
npm run preview
```

## Quality Gates

- **Linter**: [Oxlint](https://oxc.rs/docs/guide/usage/linter) checking 53 files with 116 rules in <50ms.
- **Typecheck & Build**: `tsc -b && vite build` validating all TypeScript types and generating split production chunks.

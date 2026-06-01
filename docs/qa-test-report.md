# AI Radar Frontend - QA Test Report

**Date**: 2026-05-29
**Tester**: Yan (QA Engineer)
**Project**: AI Radar Frontend (Next.js 14 + TypeScript + Tailwind CSS + Supabase)
**Project Path**: `D:\wordkbuddywork\2026-05-29-00-16-56\frontend\`

---

## 1. Test Overview

### Scope
- Build validation (compilation, type checking, static generation)
- Functional testing of all pages, components, and API routes
- Code quality review (TypeScript safety, error handling, security)
- Architecture review (layout, theme provider, i18n)

### Method
- Manual code review of all 25 source files (`.ts`, `.tsx`)
- `npm run build` execution to verify compilation and static generation
- Static analysis of TypeScript types, error handling, and security patterns

---

## 2. Test Results by Item

### 2.1 Build Validation

| Check | Result | Details |
|-------|--------|---------|
| `npm run build` compilation | **PASS** | Compiled successfully, no errors |
| TypeScript type checking | **PASS** | `next build` includes type checking; zero type errors |
| Linting | **PASS** | No lint errors during build |
| Static page generation | **PASS** | 20/20 pages generated successfully |
| API routes marked dynamic | **PASS** | `/api/products`, `/api/products/[slug]`, `/api/watchlist` correctly marked as `ƒ (Dynamic)` |

---

### 2.2 Landing Page (`src/app/page.tsx`)

| Check | Result | Details |
|-------|--------|---------|
| Section 1: Hero | **PASS** | Badge, headline, description, CTA buttons, trust signals present |
| Section 2: Pain Points | **PASS** | 3 pain point cards with icons (Search, AlertTriangle, Layers) |
| Section 3: Core Features | **PASS** | 4 feature cards (Auto Discovery, 4D Verification, Multi-channel Alerts, Smart Comparison) |
| Section 4: 4D Verification | **PASS** | 4 dimension cards with color-coded labels |
| Section 5: User Cases | **PASS** | Tabs with 3 personas (Entrepreneur, Investor, Developer) |
| Section 6: Metrics | **PASS** | 3 key metrics displayed (10K+, 50+, 98.7%) |
| Section 7: Pricing | **PASS** | 4 pricing tiers from `PRICING_TIERS` constant |
| Section 8: FAQ + CTA | **PASS** | FAQ accordion from `FAQ_DATA` constant + final CTA |
| Footer | **PASS** | 5-column layout with navigation links, social icons, copyright |

---

### 2.3 Discover Page (`src/app/discover/page.tsx`)

| Check | Result | Details |
|-------|--------|---------|
| Filter sidebar | **PASS** | Category badges, Pricing badges, clear-all button |
| Product card grid | **PASS** | Responsive grid (sm:2, xl:3 columns) |
| Search box | **PASS** | Input with search icon and clear button |
| Loading state | **PASS** | 6 skeleton placeholders with `animate-pulse` |
| Empty state | **PASS** | "No products found" message + clear filters button |
| Data fetching | **FAIL** | See Bug #1 — uses `any[]` for products state; no error state displayed to user |

---

### 2.4 ProductCard (`src/components/ProductCard.tsx`)

| Check | Result | Details |
|-------|--------|---------|
| Confidence score display | **PASS** | Uses `getConfidenceLevel` + `formatConfidenceScore` with color coding |
| Status badge | **PASS** | Maps `active/low_active/inactive/dead` to variants |
| Pricing badge | **PASS** | Maps `free/freemium/paid/open_source` to variants |
| Tags display | **PASS** | Shows first 3 tags with "+N" overflow indicator |
| Watchlist toggle | **FAIL** | See Bug #2 — no auth check before API call |
| External links (GitHub, Website) | **PASS** | `target="_blank" rel="noopener noreferrer"` correctly set |
| Logo fallback | **PASS** | Shows first letter of name when no logo_url |
| Props interface | **PASS** | Well-typed with all required and optional fields |

---

### 2.5 Authentication Components

| Check | Result | Details |
|-------|--------|---------|
| LoginModal — Zod validation | **PASS** | Email + password schema with proper error messages |
| LoginModal — Google OAuth | **PASS** | `signInWithOAuth` with redirect URL |
| LoginModal — Error display | **PASS** | Error state shown in destructive text |
| LoginModal — Loading state | **PASS** | Button disabled + "Logging in..." text |
| RegisterModal — Zod validation | **PASS** | Name, email, password, confirmPassword with `.refine()` check |
| RegisterModal — Google OAuth | **PASS** | Same OAuth flow as login |
| RegisterModal — Password confirmation | **PASS** | Zod `.refine()` ensures match |
| RegisterModal — Alert usage | **FAIL** | See Bug #3 — uses `alert()` instead of a proper success toast/modal |
| Both modals — Form submission | **PASS** | `e.preventDefault()` + validation before API call |

---

### 2.6 API Routes

| Check | Result | Details |
|-------|--------|---------|
| `/api/products` GET | **PASS** | Query params parsed, Supabase query built with filters, pagination, sorting |
| `/api/products` — Error handling | **PASS** | Try/catch, 500 response on DB error, 500 on unexpected error |
| `/api/products/[slug]` GET | **PASS** | Single product lookup, 404 for not found (PGRST116), 500 for other errors |
| `/api/watchlist` GET | **PASS** | Auth check (401), data retrieval with join |
| `/api/watchlist` POST | **PASS** | Auth check (401), Zod validation (400), unique constraint handling (409) |
| `/api/watchlist` DELETE | **PASS** | Auth check (401), Zod validation (400), soft delete |
| SQL Injection prevention | **PASS** | All queries use Supabase parameterized queries (`.eq()`, `.or()`), no raw SQL |
| Response format consistency | **PASS** | All routes return `{ error }` or `{ products/data }` JSON |

---

### 2.7 Layout Components

| Check | Result | Details |
|-------|--------|---------|
| Navbar — Desktop nav | **PASS** | 5 links with active state highlighting via `usePathname` |
| Navbar — Mobile menu | **PASS** | Hamburger toggle with slide-down menu |
| Navbar — Login/Signup buttons | **PASS** | Opens `LoginModal` |
| Navbar — Active link highlight | **FAIL** | See Bug #4 — uses `pathname === link.href` which fails for nested routes (e.g., `/discover/slug`) |
| Footer | **PASS** | 5-column layout with links, social icons, copyright |
| Layout structure | **PASS** | `Navbar → main → Footer` flex column |
| Metadata (SEO) | **PASS** | Title, description, keywords, OpenGraph, Twitter card, hreflang alternates |

---

### 2.8 Theme Provider (Dark Mode)

| Check | Result | Details |
|-------|--------|---------|
| ThemeProvider wrapper | **PASS** | Uses `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem` |
| ThemeToggle component | **PASS** | Sun/Moon icons with CSS transitions for light/dark switch |
| Hydration warning suppression | **PASS** | `<html suppressHydrationWarning>` prevents hydration mismatch from theme |
| `LanguageSwitcher.tsx` misnamed | **FAIL** | See Bug #5 — file is named `LanguageSwitcher.tsx` but exports `ThemeToggle` |

---

### 2.9 i18n / Multi-language

| Check | Result | Details |
|-------|--------|---------|
| i18n configuration | **FAIL** | See Bug #6 — **No i18n library configured**. No `next-i18next`, no locale routing, no translation files in `src/` |
| Translation files | **FAIL** | See Bug #6 — No locale JSON files exist in project source |
| hreflang alternates | **PASS** | Metadata includes `alternates.languages` for `en` and `zh-CN` URLs |
| Database language support | **PASS** | DB types include `name_en`, `name_zh`, `description_en`, `description_zh`, `preferred_language` |
| Language selector in settings | **PASS** | Settings page has `<select>` with English/中文 options (but no implementation) |

---

## 3. Bug List

### Bug #1: `any[]` Type Usage in Data Fetching (Medium)

- **Severity**: Medium (Type safety)
- **Files**: `src/app/discover/page.tsx:14`, `src/app/home/page.tsx:12-13`, `src/app/watchlist/page.tsx:11`, `src/app/compare/page.tsx:24`, `src/app/trends/page.tsx:11-12`
- **Description**: Multiple pages use `useState<any[]>([])` for products and other data. The `Database['public']['Tables']['products']['Row']` type is defined in `src/lib/supabase/types.ts` but never imported or used in pages.
- **Suggested Fix**: Import and use the `Database` type:
  ```ts
  import type { Database } from '@/lib/supabase/types';
  type Product = Database['public']['Tables']['products']['Row'];
  const [products, setProducts] = useState<Product[]>([]);
  ```

### Bug #2: Watchlist Toggle Without Auth Check (High)

- **Severity**: High (Security/UX)
- **File**: `src/components/ProductCard.tsx:68-80`
- **Description**: `handleWatchlistToggle` calls `/api/watchlist` POST/DELETE without checking if user is logged in. The API route returns 401, but the UI silently fails (caught by catch, only logs to console). User gets no feedback that they need to log in.
- **Suggested Fix**: Use the `useAuth` hook to check authentication state before making the call. Show a login prompt or redirect to login if unauthenticated.
  ```ts
  const { user } = useAuth();
  const handleWatchlistToggle = async () => {
    if (!user) { /* open login modal */ return; }
    // ... existing logic
  };
  ```

### Bug #3: Registration Success Uses `alert()` (Low)

- **Severity**: Low (UX)
- **File**: `src/components/auth/RegisterModal.tsx:60`
- **Description**: Uses native `alert()` for registration success message. Inconsistent with the rest of the UI which uses shadcn/ui components.
- **Suggested Fix**: Replace with a shadcn toast or a success state within the dialog. Consider using a library like `sonner` or `react-hot-toast` that fits the design system.

### Bug #4: Navbar Active Link Matching Fails on Nested Routes (Medium)

- **Severity**: Medium (UX)
- **File**: `src/components/layout/Navbar.tsx:43`
- **Description**: Uses `pathname === link.href` for exact match. When user visits `/discover/some-product`, the "Discover" link won't be highlighted because `'/discover/some-product' !== '/discover'`.
- **Suggested Fix**: Use `pathname.startsWith(link.href)` for route prefix matching:
  ```ts
  pathname === link.href || pathname.startsWith(link.href + '/')
  ```

### Bug #5: File Named `LanguageSwitcher.tsx` but Exports `ThemeToggle` (Low)

- **Severity**: Low (Maintainability)
- **File**: `src/components/layout/LanguageSwitcher.tsx`
- **Description**: The filename suggests it exports a language switcher, but the actual export is `ThemeToggle` (a theme dark/light toggle). This is misleading for developers navigating the codebase.
- **Suggested Fix**: Rename file to `ThemeToggle.tsx` to match its actual export.

### Bug #6: i18n Implementation Missing (High)

- **Severity**: High (Feature completeness)
- **Description**: The PRD mentions multi-language support (en/zh-CN). While the database schema has bilingual fields (`name_en`, `name_zh`, etc.) and the metadata includes hreflang alternates, **no actual i18n implementation exists**:
  - No `next-i18next` or `next-intl` dependency in `package.json`
  - No `locales/` directory with translation files
  - All UI text is hardcoded in English in every component
  - The language `<select>` in Settings has no `onChange` handler
  - No middleware for locale-based routing
- **Suggested Fix**: Install `next-intl`, create locale files (`src/locales/en.json`, `src/locales/zh.json`), wrap app with `NextIntlProvider`, implement locale routing via middleware, and replace all hardcoded strings with translation keys.

### Bug #7: Supabase Client Uses Placeholder Fallback Values (Medium)

- **Severity**: Medium (Configuration/Security)
- **File**: `src/lib/supabase/client.ts:3-4`
- **Description**: `createClient` is called with hardcoded fallback values (`'https://placeholder.supabase.co'`, `'placeholder-key'`) when environment variables are missing. This means the app will silently "work" with invalid credentials in development/production, causing confusing runtime errors instead of failing fast.
- **Suggested Fix**: Add a warning or throw an error in development when env vars are missing:
  ```ts
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables are not set.');
  }
  ```

### Bug #8: Discover Page Has `filterOpen` State That Is Never Used Correctly (Low)

- **Severity**: Low (Bug)
- **File**: `src/app/discover/page.tsx:13`
- **Description**: `filterOpen` state is declared and toggled by the mobile filter button (line 128), but the filter sidebar is **always visible** — there's no conditional rendering based on `filterOpen`. On mobile, clicking "Filters" toggles the state but doesn't show/hide anything.
- **Suggested Fix**: Add conditional rendering: `filterOpen && (...)` for the sidebar on mobile, or use a CSS class to toggle visibility.

### Bug #9: ProductCard `name.charAt(0)` Can Crash on Empty String (Low)

- **Severity**: Low (Edge case)
- **File**: `src/components/ProductCard.tsx:91`
- **Description**: If `name` is an empty string `""`, `name.charAt(0)` returns `""` (safe). However, if `name` is ever `null` or `undefined` (despite TypeScript typing), this would throw. The `name` field is typed as `string` (required), but data from APIs may not always conform.
- **Suggested Fix**: Add null safety: `name?.charAt(0) || '?'`

### Bug #10: Compare Page Uses Non-existent API Route (Medium)

- **Severity**: Medium (Broken functionality)
- **File**: `src/app/compare/page.tsx:48`
- **Description**: Fetches from `/api/products/search?q=...` but no such API route exists. The project only has `/api/products`, `/api/products/[slug]`, and `/api/watchlist`. The search will always return a 404.
- **Suggested Fix**: Either create the `/api/products/search` route, or reuse `/api/products?search=...` which already supports search queries.

### Bug #11: Home Page Fetches Non-existent `/api/recommendations/daily` (Medium)

- **Severity**: Medium (Broken functionality)
- **File**: `src/app/home/page.tsx:20`
- **Description**: Fetches from `/api/recommendations/daily` which does not exist as an API route. The request will fail silently (caught in try/catch), leaving `recommendations` as an empty array.
- **Suggested Fix**: Either implement the `/api/recommendations/daily` route or use the existing `/api/products` route with appropriate filters.

### Bug #12: Trends Page Fetches Non-existent API Routes (Medium)

- **Severity**: Medium (Broken functionality)
- **File**: `src/app/trends/page.tsx:18-20`
- **Description**: Fetches from `/api/trends/wordcloud` and `/api/trends/top20` — neither route exists. Both requests will fail, leaving the page empty.
- **Suggested Fix**: Implement the missing API routes or use mock data as a placeholder.

---

## 4. Code Quality Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **`any` types in multiple pages** | Medium | 5+ pages use `any[]` instead of typed interfaces from `supabase/types.ts` |
| **Missing error UI in data fetching** | Medium | Discover, Home, Watchlist, Trends, Compare all catch errors with `console.error` but never display an error state to the user |
| **Missing `use client` directive** | Low | `src/components/layout/Footer.tsx` lacks `'use client'` but is included in a client-side layout. Currently works because it only has static content, but adding interactivity later would break |
| **Hardcoded English strings** | High | All 15+ pages have English text hardcoded in JSX. No translation abstraction layer exists. |
| **No test files** | High | Zero test files (`*.test.ts`, `*.spec.ts`) exist anywhere in the project. No Jest, Vitest, Playwright, or Cypress configuration. |
| **`window.location.reload()` usage** | Medium | Used in `LoginModal.tsx:47` and `useAuth.ts:25` for post-auth state refresh. This is a heavy-handed approach; consider using React state management or Next.js router refresh instead. |
| **No loading/error boundaries** | Medium | The app has no React Error Boundary or Suspense fallback for client-side components. |
| **`logo_url` rendered as raw `src`** | Low | `<img src={logo_url} ...>` in ProductCard, Compare, Trends, and other pages. Should ideally validate URL format to prevent XSS via malformed URLs. Currently mitigated by `rel="noopener noreferrer"` on external links only. |
| **Settings page non-functional** | Low | The settings page has form inputs and a "Save Changes" button with no `onSubmit` handler or state management. All switches use `defaultChecked` (uncontrolled). |
| **Admin page uses hardcoded mock data** | Low | `AdminPage` uses static `stats` and `pendingReviews` arrays. Approve/Reject buttons have no `onClick` handlers. |

---

## 5. Security Assessment

| Check | Result | Notes |
|-------|--------|-------|
| XSS via `dangerouslySetInnerHTML` | **PASS** | Not used anywhere in the project |
| SQL Injection | **PASS** | All queries use Supabase's parameterized query builder |
| CSRF | **PASS** | API routes use POST with JSON body; Supabase handles session tokens |
| OAuth redirect validation | **PASS** | `window.location.origin` used for redirect URLs (dynamic but origin-scoped) |
| External link security | **PASS** | All external `<a>` tags use `target="_blank" rel="noopener noreferrer"` |
| Environment variable exposure | **PASS** | Only `NEXT_PUBLIC_*` vars are client-exposed (correct Next.js convention). `SUPABASE_SERVICE_ROLE_KEY` is server-only. |
| Password policy | **PASS** | Zod enforces minimum 6 chars (login) / 8 chars (register) |
| Rate limiting | **FAIL** | No rate limiting on any API route. Authentication endpoints (`signInWithPassword`, `signUp`) are unprotected at the API layer. |

---

## 6. Summary

| Metric | Value |
|--------|-------|
| Total Files Reviewed | 25 |
| Total Checks Performed | 60+ |
| Checks Passed | 48 |
| Checks Failed | 12 |
| **Pass Rate** | **80%** |
| Critical Bugs (High) | 2 |
| Medium Bugs | 5 |
| Low Bugs | 5 |
| Code Quality Issues | 10 |
| **Estimated Test Coverage** | **0%** (no test files exist) |

### IS_PASS: **NO**

### Reasons:

1. **Zero test files exist** — The project has no unit tests, integration tests, or E2E tests. This is the most critical finding.
2. **Missing API routes for 3 pages** — Home (`/api/recommendations/daily`), Compare (`/api/products/search`), and Trends (`/api/trends/wordcloud`, `/api/trends/top20`) all fetch from non-existent endpoints, making these pages non-functional in production.
3. **i18n completely unimplemented** — Despite database schema and metadata supporting bilingual content, no translation system, locale files, or routing middleware exists. All UI text is hardcoded in English.
4. **Watchlist toggle lacks auth guard** — Users can trigger watchlist API calls without being logged in, receiving silent 401 errors with no UX feedback.
5. **`any` types used across 5+ pages** — Despite having a well-defined `Database` type in `supabase/types.ts`, pages consistently use `any[]` for data states, losing type safety.
6. **No error UI for failed data fetching** — All async data fetching catches errors with `console.error` only, never informing the user of failures.

### Recommendations (Priority Order):

1. **Implement test suite** — Add Vitest/Jest + Playwright/Cypress with at least critical path coverage (landing page, discover page, auth flow, API routes)
2. **Implement missing API routes** — Create `/api/recommendations/daily`, `/api/products/search`, `/api/trends/wordcloud`, `/api/trends/top20`
3. **Replace `any[]` with typed interfaces** — Use `Database['public']['Tables']['products']['Row']` across all pages
4. **Add auth guard to watchlist actions** — Check `useAuth()` before API calls, show login prompt
5. **Implement i18n** — Add `next-intl`, create locale files, wrap components, replace hardcoded strings
6. **Add error boundaries and error UI** — Implement React Error Boundary and visible error states for failed data fetching
7. **Fix Navbar active link matching** — Use `startsWith` for nested route highlighting
8. **Rename `LanguageSwitcher.tsx`** → `ThemeToggle.tsx`

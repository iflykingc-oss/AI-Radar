import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './i18n/config';

// Non-routing mode: middleware only reads locale from cookie, does NOT redirect
// Pages stay at root paths (/discover, /trends, etc.) without locale prefix
export default createMiddleware({
  defaultLocale,
  locales,
  localePrefix: 'as-needed',
});

export const config = {
  // Only match non-API, non-static-file routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

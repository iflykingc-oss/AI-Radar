import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  localePrefix: 'as-needed',
});

export { defaultLocale };
export type { Locale } from './config';

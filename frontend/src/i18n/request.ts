import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { locales, defaultLocale } from './config';
import type { Locale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || defaultLocale) as Locale;

  if (!locales.includes(locale)) {
    return { locale: defaultLocale, messages: (await import(`../../messages/${defaultLocale}.json`)).default };
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

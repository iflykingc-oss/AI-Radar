// i18n handled via cookie + NextIntlClientProvider in layout.tsx
// No middleware needed — locale switching works by setting NEXT_LOCALE cookie and reloading

import { NextResponse } from 'next/server';

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

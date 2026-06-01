// Temporarily disabled to test if middleware causes 404
// See middleware.ts.bak for original

import { NextResponse } from 'next/server';

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

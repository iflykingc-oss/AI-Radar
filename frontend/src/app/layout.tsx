import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageTransition } from '@/components/transitions/PageTransition';
import { ToastProvider } from '@/hooks/useToast';
import { ToastViewport } from '@/components/ui/Toast';
import ScrollToTop from '@/components/ScrollToTop';
import KeyboardShortcutsProvider from '@/components/KeyboardShortcutsProvider';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Radar - AI Startup Opportunity Validation Platform | Discover, Validate, Track AI Products',
  description: 'Discover the world\'s most innovative AI products. AI Radar automatically discovers, validates, and tracks real, active AI products across 10+ channels — so you never miss the next breakthrough.',
  keywords: 'AI startup, AI product validation, AI radar, AI tool discovery, AI competitor analysis',
  openGraph: {
    title: 'AI Radar - AI Startup Opportunity Validation Platform',
    description: 'Discover the world\'s most innovative AI products. AI Radar automatically discovers, validates, and tracks real, active AI products across 10+ channels — so you never miss the next breakthrough.',
    type: 'website',
    locale: 'en_US',
    siteName: 'AI Radar',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Radar - AI Startup Opportunity Validation Platform',
    description: 'Discover the world\'s most innovative AI products. AI Radar automatically discovers, validates, and tracks real, active AI products across 10+ channels — so you never miss the next breakthrough.',
  },
  alternates: {
    languages: {
      'en': 'https://airadar.ai/en',
      'zh-CN': 'https://airadar.ai/',
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <KeyboardShortcutsProvider>
              <ToastProvider>
                <ErrorBoundary>
                  <div className="flex min-h-screen flex-col">
                    <Navbar />
                    <main className="flex-1 pb-16 md:pb-0">
                      <PageTransition>{children}</PageTransition>
                    </main>
                    <Footer />
                    <MobileBottomNav />
                  </div>
                </ErrorBoundary>
                <ScrollToTop />
                <ToastViewport />
              </ToastProvider>
            </KeyboardShortcutsProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

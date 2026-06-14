'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/auth/LoginModal';
import { Menu, X, Radar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle, LanguageSwitcher } from './LanguageSwitcher';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const t = useTranslations('nav');

  const navLinks = [
    { href: '/discover', label: t('discover') },
    { href: '/news', label: 'News' },
    { href: '/trends', label: t('trends') },
    { href: '/watchlist', label: t('watchlist') },
    { href: '/compare', label: t('compare') },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <header className="sticky top-0 z-50 w-full glass border-b border-border/50">
        <div className="container-custom">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-600 text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow">
                <Radar className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">AI Radar</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
              <div className="w-px h-6 bg-border mx-1" />
              <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)}>
                {t('login')}
              </Button>
              <Button size="sm" onClick={() => setLoginOpen(true)}>
                {t('signup')}
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background">
            <div className="container-custom py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-border/50 space-y-2">
                <div className="flex items-center gap-2 px-3">
                  <ThemeToggle />
                  <LanguageSwitcher />
                </div>
                <Button variant="outline" className="w-full" onClick={() => { setLoginOpen(true); setMobileMenuOpen(false); }}>
                  {t('login')}
                </Button>
                <Button className="w-full" onClick={() => { setLoginOpen(true); setMobileMenuOpen(false); }}>
                  {t('signup')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}

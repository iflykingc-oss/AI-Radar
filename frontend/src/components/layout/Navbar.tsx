'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/auth/LoginModal';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle, LanguageSwitcher } from './LanguageSwitcher';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const t = useTranslations('nav');

  const navLinks = [
    { href: '/home', label: t('home') },
    { href: '/discover', label: t('discover') },
    { href: '/watchlist', label: t('watchlist') },
    { href: '/compare', label: t('compare') },
    { href: '/trends', label: t('trends') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            AI
          </div>
          <span className="text-xl font-bold tracking-tight">AI Radar</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === link.href || pathname.startsWith(link.href + '/') ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)}>
            {t('login')}
          </Button>
          <Button size="sm" onClick={() => setLoginOpen(true)}>
            {t('signup')}
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'block text-sm font-medium transition-colors hover:text-primary',
                pathname === link.href || pathname.startsWith(link.href + '/') ? 'text-foreground' : 'text-muted-foreground'
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col space-y-2 pt-4 border-t">
            <Button variant="outline" onClick={() => { setLoginOpen(true); setMobileMenuOpen(false); }}>
              {t('login')}
            </Button>
            <Button onClick={() => { setLoginOpen(true); setMobileMenuOpen(false); }}>
              {t('signup')}
            </Button>
          </div>
        </div>
      )}

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  );
}

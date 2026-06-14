import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Radar } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('common');

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-3 mb-6">
        <Radar className="h-12 w-12 text-primary" />
        <h1 className="text-6xl font-bold text-primary">404</h1>
      </div>
      <h2 className="text-2xl font-semibold mb-2">{t('not_found_title', { defaultValue: 'Page Not Found' })}</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        {t('not_found_desc', { defaultValue: "The page you're looking for doesn't exist or has been moved." })}
      </p>
      <Button asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back_home', { defaultValue: 'Back to Home' })}
        </Link>
      </Button>
    </div>
  );
}

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { supabase } from '@/lib/supabase/client';

interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  name_zh: string | null;
  description: string | null;
  description_en: string | null;
  description_zh: string | null;
  website_url: string | null;
  github_url: string | null;
  logo_url: string | null;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  tech_stack: string[];
  pricing_model: 'free' | 'freemium' | 'paid' | 'open_source' | null;
  availability_status: 'active' | 'low_active' | 'inactive' | 'dead';
  confidence_score: number;
  confidence_level: 'high' | 'medium' | 'low' | 'unverified';
  validation_signals: Record<string, any>;
  source_count: number;
  weekly_growth_rate: number;
  monthly_growth_rate: number;
  github_stars: number | null;
  launch_date: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !product) {
      return null;
    }
    return product;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await fetchProduct(params.slug);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://airadar.ai';

  if (!product) {
    return {
      title: 'Product Not Found - AI Radar | AI Product Intelligence',
      description: 'The product you are looking for could not be found.',
    };
  }

  const title = `${product.name} - AI Radar | AI Product Intelligence`;
  const description =
    product.description || `Discover ${product.name} on AI Radar`;
  const canonicalUrl = `${baseUrl}/discover/${params.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} - AI Radar`,
      description,
      type: 'website',
      url: canonicalUrl,
      images: [
        {
          url: product.logo_url || '/og-default.png',
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} - AI Radar`,
      description,
      images: [product.logo_url || '/og-default.png'],
    },
    keywords: [
      product.name,
      ...(product.tags || []),
      product.category,
      'AI',
      'AI Tools',
    ].filter(Boolean) as string[],
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await fetchProduct(params.slug);

  if (!product) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: product.description || '',
    url: product.website_url || undefined,
    applicationCategory: 'AI Application',
    operatingSystem: 'Web',
    offers: product.pricing_model
      ? {
          '@type': 'Offer',
          price: product.pricing_model === 'free' ? '0' : '0',
          priceCurrency: 'USD',
        }
      : undefined,
    aggregateRating: product.confidence_score
      ? {
          '@type': 'AggregateRating',
          ratingValue: Math.round(product.confidence_score * 100).toString(),
          bestRating: '100',
          worstRating: '0',
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}

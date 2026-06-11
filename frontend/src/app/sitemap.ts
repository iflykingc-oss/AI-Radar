import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://airadar.ai';

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/discover`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/compare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/trends`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];
}

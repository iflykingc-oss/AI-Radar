import { NextResponse } from 'next/server';
import type { ProductHuntPost, ProductHuntApiResponse } from '@/types/producthunt';

/**
 * Product Hunt RSS feed URL for the AI topic.
 * This feed is publicly accessible and requires no authentication.
 */
const PH_RSS_URL = 'https://www.producthunt.com/topics/artificial-intelligence.rss';

/**
 * Timeout in milliseconds for RSS feed requests.
 */
const RSS_TIMEOUT_MS = 10_000;

/**
 * Mock Product Hunt posts used as fallback when the RSS feed is unavailable.
 * Contains 10 realistic AI product launches.
 */
const MOCK_ITEMS: ProductHuntPost[] = [
  {
    id: 'ph-mock-1',
    title: 'Replit Agent — AI-powered autonomous coding agent',
    description: 'Replit Agent is an AI agent that builds, deploys, and iterates on full-stack applications from a natural language prompt. No coding experience required.',
    url: 'https://www.producthunt.com/posts/replit-agent',
    publishDate: '2025-01-15T08:00:00Z',
    upvotes: 1247,
    commentsCount: 89,
    source: 'mock',
    productMentions: ['Replit Agent'],
  },
  {
    id: 'ph-mock-2',
    title: 'Luma Dream Machine — Real-time AI video generation',
    description: 'Dream Machine by Luma AI generates high-quality 5-second videos from text or image prompts with realistic physics and motion.',
    url: 'https://www.producthunt.com/posts/luma-dream-machine',
    publishDate: '2025-01-14T10:30:00Z',
    upvotes: 980,
    commentsCount: 67,
    source: 'mock',
    productMentions: ['Luma Dream Machine', 'Luma AI'],
  },
  {
    id: 'ph-mock-3',
    title: 'Perplexity Pro — Autonomous multi-step research agent',
    description: 'Perplexity Pro Search autonomously plans and executes complex research tasks with source verification and citation.',
    url: 'https://www.producthunt.com/posts/perplexity-pro',
    publishDate: '2025-01-13T14:00:00Z',
    upvotes: 856,
    commentsCount: 54,
    source: 'mock',
    productMentions: ['Perplexity Pro'],
  },
  {
    id: 'ph-mock-4',
    title: 'v0 by Vercel — AI UI generator from text prompts',
    description: 'Generate React components and full UI pages from natural language descriptions using Vercel\'s AI-powered design-to-code tool.',
    url: 'https://www.producthunt.com/posts/v0-by-vercel',
    publishDate: '2025-01-12T09:00:00Z',
    upvotes: 723,
    commentsCount: 41,
    source: 'mock',
    productMentions: ['v0 by Vercel', 'Vercel'],
  },
  {
    id: 'ph-mock-5',
    title: 'ElevenLabs Voice Cloning API — Real-time voice synthesis',
    description: 'Industry-leading voice cloning API with 200ms latency, enabling real-time conversational AI with custom voices.',
    url: 'https://www.producthunt.com/posts/elevenlabs-voice-cloning-api',
    publishDate: '2025-01-11T12:00:00Z',
    upvotes: 645,
    commentsCount: 38,
    source: 'mock',
    productMentions: ['ElevenLabs'],
  },
  {
    id: 'ph-mock-6',
    title: 'Notion AI Workspace Agent — Autonomous task manager',
    description: 'Notion\'s AI agent that autonomously organizes workspace content, schedules meetings, and generates reports from project data.',
    url: 'https://www.producthunt.com/posts/notion-ai-workspace-agent',
    publishDate: '2025-01-10T16:00:00Z',
    upvotes: 512,
    commentsCount: 29,
    source: 'mock',
    productMentions: ['Notion AI'],
  },
  {
    id: 'ph-mock-7',
    title: 'Cursor AI Code Editor — AI-first IDE with multi-file editing',
    description: 'Cursor is an AI-powered code editor that understands your entire codebase, makes multi-file edits, and answers questions about your code.',
    url: 'https://www.producthunt.com/posts/cursor-ai-code-editor',
    publishDate: '2025-01-09T11:00:00Z',
    upvotes: 489,
    commentsCount: 33,
    source: 'mock',
    productMentions: ['Cursor AI'],
  },
  {
    id: 'ph-mock-8',
    title: 'Midjourney v7 — 3D scene generation from text',
    description: 'Midjourney v7 enables generating fully navigable 3D scenes from natural language descriptions, going beyond 2D image generation.',
    url: 'https://www.producthunt.com/posts/midjourney-v7',
    publishDate: '2025-01-08T07:00:00Z',
    upvotes: 467,
    commentsCount: 52,
    source: 'mock',
    productMentions: ['Midjourney v7'],
  },
  {
    id: 'ph-mock-9',
    title: 'Runway Gen-4 — Cinematic AI video editing',
    description: 'Runway Gen-4 delivers professional-grade video editing with AI-powered scene understanding, motion transfer, and real-time preview.',
    url: 'https://www.producthunt.com/posts/runway-gen-4',
    publishDate: '2025-01-07T13:30:00Z',
    upvotes: 398,
    commentsCount: 24,
    source: 'mock',
    productMentions: ['Runway Gen-4'],
  },
  {
    id: 'ph-mock-10',
    title: 'Cohere Command R+ — Enterprise RAG with 128K context',
    description: 'Cohere Command R+ is optimized for enterprise RAG workflows with native tool use, retrieval augmentation, and 128K context window.',
    url: 'https://www.producthunt.com/posts/cohere-command-r-plus',
    publishDate: '2025-01-06T10:00:00Z',
    upvotes: 356,
    commentsCount: 18,
    source: 'mock',
    productMentions: ['Cohere Command R+', 'Cohere'],
  },
];

/**
 * Extracts text content from an XML tag value, stripping HTML-like tags
 * that may appear in RSS descriptions.
 *
 * @param raw - Raw text from XML element.
 * @returns Cleaned text content.
 */
function cleanXmlText(raw: string): string {
  // Remove HTML tags.
  let cleaned = raw.replace(/<[^>]*>/g, '');
  // Decode common XML entities.
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim();
  return cleaned;
}

/**
 * Extracts product mentions from a Product Hunt post's title and description.
 *
 * @param title - The post title.
 * @param description - Optional post description.
 * @returns Array of detected product mention strings.
 */
function extractProductMentions(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const mentions: string[] = [];

  // Keywords that often precede product introductions.
  const launchKeywords = [
    'launches', 'launch', 'released', 'release', 'introduces',
    'unveils', 'debuts', 'announces', 'builds', 'creates',
  ];

  const hasKeyword = launchKeywords.some((kw) => text.includes(kw));
  if (!hasKeyword) return mentions;

  // Extract capitalized phrases from the original title.
  const titlePattern = /\b([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,3})\b/g;
  let match: RegExpExecArray | null;
  while ((match = titlePattern.exec(title)) !== null) {
    const mention = match[1].trim();
    // Filter out common non-product words.
    const stopWords = ['AI', 'New', 'The', 'With', 'From', 'For', 'And', 'That', 'This', 'Has', 'Into', 'An', 'A'];
    if (mention.length > 1 && !stopWords.includes(mention) && !mentions.includes(mention)) {
      mentions.push(mention);
    }
  }

  return mentions;
}

/**
 * Parses Product Hunt RSS XML and extracts post items.
 *
 * Product Hunt RSS items contain: title, description (HTML), link, pubDate, dc:creator.
 * Upvotes and comments are NOT available in the RSS feed.
 *
 * @param xmlText - Raw RSS XML string.
 * @returns Array of parsed ProductHuntPost objects.
 */
function parseProductHuntRSS(xmlText: string): ProductHuntPost[] {
  const items: ProductHuntPost[] = [];

  // Extract all <item>...</item> blocks.
  const itemPattern = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemPattern.exec(xmlText)) !== null) {
    const itemContent = itemMatch[1];

    // Extract title.
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(itemContent);
    const title = titleMatch ? cleanXmlText(titleMatch[1]) : 'Untitled';

    // Extract description (may contain HTML).
    const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemContent);
    const description = descMatch ? cleanXmlText(descMatch[1]) : '';

    // Extract link.
    const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(itemContent);
    const url = linkMatch ? cleanXmlText(linkMatch[1]) : '';

    // Extract pubDate.
    const dateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(itemContent);
    const pubDate = dateMatch ? cleanXmlText(dateMatch[1]) : new Date().toISOString();

    // Extract dc:creator.
    const creatorMatch = /<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i.exec(itemContent);
    const _creator = creatorMatch ? cleanXmlText(creatorMatch[1]) : '';

    // Try to extract a thumbnail from description HTML.
    let thumbnail: string | undefined;
    if (descMatch) {
      const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(descMatch[1]);
      if (imgMatch) {
        thumbnail = imgMatch[1];
      }
    }

    // Generate a stable ID from the URL.
    const urlHash = url ? url.split('/').pop() || url : '';
    const id = urlHash ? `ph-${urlHash.replace(/[^a-zA-Z0-9]/g, '_')}` : `ph-${Date.now()}`;

    const productMentions = extractProductMentions(title, description);

    items.push({
      id,
      title,
      description,
      url,
      publishDate: pubDate,
      source: 'producthunt',
      thumbnail,
      productMentions,
      // upvotes and commentsCount are not available in RSS feed.
    });
  }

  return items;
}

/**
 * Fetches and parses Product Hunt RSS feed for the AI topic.
 *
 * @returns Array of parsed ProductHuntPost objects.
 */
async function fetchProductHuntRSS(): Promise<ProductHuntPost[]> {
  const response = await fetch(PH_RSS_URL, {
    signal: AbortSignal.timeout(RSS_TIMEOUT_MS),
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Product Hunt RSS returned ${response.status}`);
  }

  const xmlText = await response.text();

  if (!xmlText || !xmlText.includes('<item')) {
    throw new Error('Product Hunt RSS returned no items');
  }

  return parseProductHuntRSS(xmlText);
}

/**
 * GET handler for /api/sources/producthunt
 *
 * Fetches the latest AI products from Product Hunt RSS feed.
 * Falls back to mock data if the feed is unavailable.
 *
 * Returns JSON: { items, total, fetchedAt, source }
 */
export async function GET(): Promise<NextResponse> {
  try {
    let items = await fetchProductHuntRSS();

    // If RSS returned no items, fall back to mock.
    if (items.length === 0) {
      console.warn('Product Hunt RSS returned no items; returning mock data.');
      const response: ProductHuntApiResponse = {
        items: MOCK_ITEMS,
        total: MOCK_ITEMS.length,
        fetchedAt: new Date().toISOString(),
        source: 'mock',
      };
      return NextResponse.json(response, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    const response: ProductHuntApiResponse = {
      items,
      total: items.length,
      fetchedAt: new Date().toISOString(),
      source: 'producthunt',
    };

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Product Hunt RSS fetch error:', error);

    // Final safety net: return mock data.
    const response: ProductHuntApiResponse = {
      items: MOCK_ITEMS,
      total: MOCK_ITEMS.length,
      fetchedAt: new Date().toISOString(),
      source: 'mock',
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}

/**
 * OPTIONS handler for CORS preflight requests.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * HackerNews post interface representing a normalized post from Algolia HN Search API.
 */
interface HNPost {
  objectID: string;
  title: string;
  author: string;
  points: number;
  numComments: number;
  url: string;
  createdAt: string;
  storyText?: string;
  isShowHN: boolean;
  isAskHN: boolean;
  productMentions?: string[];
}

/**
 * Raw hit structure returned by the Algolia HN Search API.
 */
interface AlgoliaHit {
  objectID: string;
  title?: string;
  author?: string;
  points?: number;
  num_comments?: number;
  url?: string;
  created_at?: string;
  created_at_i?: number;
  story_text?: string;
  _tags?: string[];
}

/**
 * Raw response structure from the Algolia HN Search API.
 */
interface AlgoliaResponse {
  hits: AlgoliaHit[];
  nbHits: number;
}

/**
 * Mock HN posts used as fallback when the Algolia API is unavailable.
 */
const MOCK_POSTS: HNPost[] = [
  {
    objectID: 'mock-1',
    title: 'Show HN: I built an AI coding assistant that runs locally',
    author: 'johndoe',
    points: 245,
    numComments: 89,
    url: 'https://news.ycombinator.com/item?id=mock1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isShowHN: true,
    isAskHN: false,
    productMentions: ['AI coding assistant'],
  },
  {
    objectID: 'mock-2',
    title: 'Show HN: Open-source alternative to ChatGPT for teams',
    author: 'alice_dev',
    points: 512,
    numComments: 134,
    url: 'https://news.ycombinator.com/item?id=mock2',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isShowHN: true,
    isAskHN: false,
    productMentions: ['ChatGPT alternative'],
  },
  {
    objectID: 'mock-3',
    title: 'Show HN: I created an AI image generator with one-click style transfer',
    author: 'pixelmaster',
    points: 378,
    numComments: 67,
    url: 'https://news.ycombinator.com/item?id=mock3',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    isShowHN: true,
    isAskHN: false,
    productMentions: ['AI image generator'],
  },
  {
    objectID: 'mock-4',
    title: 'Show HN: Launched a browser extension that summarizes any article with AI',
    author: 'summingup',
    points: 189,
    numComments: 45,
    url: 'https://news.ycombinator.com/item?id=mock4',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    isShowHN: true,
    isAskHN: false,
    productMentions: ['browser extension'],
  },
  {
    objectID: 'mock-5',
    title: 'Show HN: We built an AI voice cloning tool for podcasters',
    author: 'podcast_ai',
    points: 423,
    numComments: 112,
    url: 'https://news.ycombinator.com/item?id=mock5',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    isShowHN: true,
    isAskHN: false,
    productMentions: ['AI voice cloning tool'],
  },
  {
    objectID: 'mock-6',
    title: 'Show HN: Introducing AutoCode – self-healing codebase maintenance',
    author: 'maintainer_x',
    points: 298,
    numComments: 76,
    url: 'https://news.ycombinator.com/item?id=mock6',
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    isShowHN: true,
    isAskHN: false,
    productMentions: ['AutoCode'],
  },
  {
    objectID: 'mock-7',
    title: 'Show HN: I released an open-source LLM router for cost optimization',
    author: 'costcutter',
    points: 356,
    numComments: 98,
    url: 'https://news.ycombinator.com/item?id=mock7',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    isShowHN: true,
    isAskHN: false,
    productMentions: ['LLM router'],
  },
  {
    objectID: 'mock-8',
    title: 'Show HN: AI-powered CRM that writes follow-ups for you',
    author: 'sales_ai',
    points: 201,
    numComments: 54,
    url: 'https://news.ycombinator.com/item?id=mock8',
    createdAt: new Date(Date.now() - 691200000).toISOString(),
    isShowHN: true,
    isAskHN: false,
    productMentions: ['AI-powered CRM'],
  },
];

/**
 * Extracts potential product mentions from an HN post title.
 *
 * Detection strategy:
 * 1. "Show HN: " prefix indicates high-confidence product announcements.
 * 2. Keywords like "launched", "built", "created", "released", "introducing"
 *    signal product mentions.
 * 3. Product name is extracted from text after a colon, or the first
 *    capitalized phrase after keywords.
 *
 * @param title - The HN post title.
 * @returns Array of extracted product mention strings.
 */
function extractProductMentions(title: string): string[] {
  const mentions: string[] = [];
  const lowerTitle = title.toLowerCase();

  const productKeywords = ['launched', 'built', 'created', 'released', 'introducing'];
  const hasProductKeyword = productKeywords.some((kw) => lowerTitle.includes(kw));

  // Extract text after "Show HN:" colon as the primary product mention.
  const showHNMatch = title.match(/^Show HN:\s*(.+)/i);
  if (showHNMatch) {
    const productPart = showHNMatch[1].trim();
    // Use the full clause before any dash or em-dash.
    const cleaned = productPart.split(/\s+[-–—]\s+/)[0].trim();
    if (cleaned.length > 0) {
      mentions.push(cleaned);
    }
  }

  // If product keywords are present but no colon extract, try first capitalized phrase.
  if (mentions.length === 0 && hasProductKeyword) {
    const capitalizedMatch = title.match(/\b([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*)+)\b/);
    if (capitalizedMatch) {
      mentions.push(capitalizedMatch[1]);
    }
  }

  return mentions;
}

/**
 * Determines whether a post is a "Show HN" submission.
 *
 * @param title - The post title.
 * @param tags - Optional tags from Algolia.
 * @returns True if the post is a Show HN post.
 */
function detectShowHN(title: string, tags?: string[]): boolean {
  if (title.toLowerCase().startsWith('show hn:')) {
    return true;
  }
  if (tags?.includes('show_hn')) {
    return true;
  }
  return false;
}

/**
 * Determines whether a post is an "Ask HN" submission.
 *
 * @param title - The post title.
 * @param tags - Optional tags from Algolia.
 * @returns True if the post is an Ask HN post.
 */
function detectAskHN(title: string, tags?: string[]): boolean {
  if (title.toLowerCase().startsWith('ask hn:')) {
    return true;
  }
  if (tags?.includes('ask_hn')) {
    return true;
  }
  return false;
}

/**
 * Transforms a raw Algolia hit into a normalized HNPost.
 *
 * @param hit - Raw Algolia search hit.
 * @returns Normalized HNPost object.
 */
function transformHit(hit: AlgoliaHit): HNPost {
  const title = hit.title || 'Untitled';
  const isShowHN = detectShowHN(title, hit._tags);
  const isAskHN = detectAskHN(title, hit._tags);

  return {
    objectID: hit.objectID,
    title,
    author: hit.author || 'unknown',
    points: hit.points ?? 0,
    numComments: hit.num_comments ?? 0,
    url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    createdAt: hit.created_at
      ? new Date(hit.created_at).toISOString()
      : new Date().toISOString(),
    storyText: hit.story_text,
    isShowHN,
    isAskHN,
    productMentions: extractProductMentions(title),
  };
}

/**
 * GET /api/sources/hackernews
 *
 * Fetches AI-related posts from HackerNews via the Algolia Search API.
 *
 * Query Parameters:
 * - tag: Filter by tag — show_hn | story | ask_hn (default: show_hn)
 * - query: Search query string (default: "AI")
 * - limit: Number of posts to return (default: 25, max: 50)
 * - timeRange: Time filter in hours — 24 | 168 | 720 (default: 168)
 *
 * On Algolia API failure, returns mock data with source: 'mock'.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters.
    const tag = searchParams.get('tag') || 'show_hn';
    const query = searchParams.get('query') || 'AI';
    const rawLimit = parseInt(searchParams.get('limit') || '25', 10);
    const limit = Math.min(Math.max(rawLimit, 1), 50);
    const timeRange = parseInt(searchParams.get('timeRange') || '168', 10);

    // Compute timestamp filter (seconds since epoch).
    const nowSeconds = Math.floor(Date.now() / 1000);
    const timeFilterSeconds = nowSeconds - timeRange * 3600;

    // Build Algolia API URL.
    const algoliaUrl = new URL('https://hn.algolia.com/api/v1/search_by_date');
    algoliaUrl.searchParams.set('query', query);
    algoliaUrl.searchParams.set('tags', tag);
    algoliaUrl.searchParams.set('hitsPerPage', String(limit));
    algoliaUrl.searchParams.set('numericFilters', `created_at_i>${timeFilterSeconds}`);

    let posts: HNPost[] = [];
    let total = 0;
    let source = 'algolia';

    try {
      const response = await fetch(algoliaUrl.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        // Abort if Algolia takes longer than 8 seconds.
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        throw new Error(`Algolia API returned ${response.status}`);
      }

      const data: AlgoliaResponse = await response.json();
      posts = data.hits.map(transformHit);
      total = data.nbHits ?? posts.length;
    } catch (apiError) {
      console.error('Algolia HN API error, falling back to mock data:', apiError);
      posts = MOCK_POSTS.slice(0, limit);
      total = posts.length;
      source = 'mock';
    }

    const responseBody = {
      posts,
      total,
      query,
      tag,
      limit,
      timeRange,
      source,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('HackerNews API route error:', error);
    return NextResponse.json(
      {
        posts: MOCK_POSTS,
        total: MOCK_POSTS.length,
        query: 'AI',
        source: 'mock',
        fetchedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests.
 */
export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

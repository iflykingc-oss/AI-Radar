export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Normalized Bluesky post item returned by the route.
 */
interface BlueskyPost {
  id: string;
  text: string;
  author: string;
  authorHandle: string;
  url: string;
  likeCount: number;
  repostCount: number;
  publishDate: string;
  source: 'bluesky' | 'mock';
}

/**
 * Raw post record returned by the Bluesky search API.
 */
interface RawPost {
  uri: string;
  cid: string;
  record: {
    text: string;
    createdAt?: string;
  };
  author: {
    did: string;
    handle: string;
    displayName?: string;
  };
  indexedAt?: string;
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
}

/**
 * Raw response structure from the Bluesky search API.
 */
interface BlueskySearchResponse {
  posts: RawPost[];
  cursor?: string;
  hitsTotal?: number;
}

/**
 * Mock Bluesky posts used as fallback when the API is unavailable.
 */
const MOCK_POSTS: BlueskyPost[] = [
  {
    id: 'mock-bsky-1',
    text: 'Just launched our new AI-powered product analytics dashboard! Real-time insights for SaaS teams. Check it out 🚀',
    author: 'Sarah Chen',
    authorHandle: '@sarahchen.bsky.social',
    url: 'https://bsky.app/profile/sarahchen.bsky.social/post/mock-bsky-1',
    likeCount: 342,
    repostCount: 89,
    publishDate: new Date(Date.now() - 3600000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-bsky-2',
    text: 'AI product launch of the week: AutoGPT just released v0.5 with autonomous agent workflows. The pace of innovation is incredible.',
    author: 'Dev Kumar',
    authorHandle: '@devkumar.bsky.social',
    url: 'https://bsky.app/profile/devkumar.bsky.social/post/mock-bsky-2',
    likeCount: 521,
    repostCount: 156,
    publishDate: new Date(Date.now() - 7200000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-bsky-3',
    text: 'Our AI coding assistant just crossed 10K users! Built entirely on open-source models. Happy to share our learnings about product-market fit.',
    author: 'Alex Rivera',
    authorHandle: '@alexrivera.dev',
    url: 'https://bsky.app/profile/alexrivera.dev/post/mock-bsky-3',
    likeCount: 278,
    repostCount: 67,
    publishDate: new Date(Date.now() - 14400000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-bsky-4',
    text: 'Thread: Top 5 AI product launches this month that every developer should know about. Starting with Cursor IDE...',
    author: 'Lisa Park',
    authorHandle: '@lisapark.bsky.social',
    url: 'https://bsky.app/profile/lisapark.bsky.social/post/mock-bsky-4',
    likeCount: 445,
    repostCount: 123,
    publishDate: new Date(Date.now() - 28800000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-bsky-5',
    text: 'Just demoed our AI-powered customer support tool at Product Hunt. The response was amazing! People want smarter, more helpful support.',
    author: 'Marcus Johnson',
    authorHandle: '@marcusj.bsky.social',
    url: 'https://bsky.app/profile/marcusj.bsky.social/post/mock-bsky-5',
    likeCount: 189,
    repostCount: 45,
    publishDate: new Date(Date.now() - 43200000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-bsky-6',
    text: 'AI video generation tools are getting scary good. Ranway Gen-3 and Luma Dream Machine just dropped. The product landscape is wild.',
    author: 'Nina Patel',
    authorHandle: '@ninapatel.bsky.social',
    url: 'https://bsky.app/profile/ninapatel.bsky.social/post/mock-bsky-6',
    likeCount: 367,
    repostCount: 98,
    publishDate: new Date(Date.now() - 86400000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-bsky-7',
    text: 'Hot take: The best AI product isn\'t the one with the smartest model, it\'s the one that solves a real pain point. Looking at you, 50th ChatGPT wrapper.',
    author: 'Tom Baker',
    authorHandle: '@tombaker.bsky.social',
    url: 'https://bsky.app/profile/tombaker.bsky.social/post/mock-bsky-7',
    likeCount: 612,
    repostCount: 178,
    publishDate: new Date(Date.now() - 172800000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-bsky-8',
    text: 'Launched our open-source AI agent framework today. Built for developers who want to build reliable autonomous workflows without vendor lock-in.',
    author: 'Emily Watson',
    authorHandle: '@emilywatson.dev',
    url: 'https://bsky.app/profile/emilywatson.dev/post/mock-bsky-8',
    likeCount: 234,
    repostCount: 72,
    publishDate: new Date(Date.now() - 259200000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-bsky-9',
    text: 'AI product research: Users care less about "AI" as a feature and more about outcomes. The best products don\'t even mention AI in their marketing.',
    author: 'Jordan Lee',
    authorHandle: '@jordanlee.bsky.social',
    url: 'https://bsky.app/profile/jordanlee.bsky.social/post/mock-bsky-9',
    likeCount: 489,
    repostCount: 134,
    publishDate: new Date(Date.now() - 345600000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-bsky-10',
    text: 'New AI product launch tracker I built: tracks launches across PH, HN, Twitter, and Bluesky. Real-time filtering by category and hype level.',
    author: 'Riya Sharma',
    authorHandle: '@riyasharma.bsky.social',
    url: 'https://bsky.app/profile/riyasharma.bsky.social/post/mock-bsky-10',
    likeCount: 312,
    repostCount: 87,
    publishDate: new Date(Date.now() - 432000000).toISOString(),
    source: 'mock',
  },
];

/**
 * Transforms a raw Bluesky API post into a normalized BlueskyPost.
 *
 * @param raw - Raw post object from the Bluesky search API.
 * @returns Normalized BlueskyPost object.
 */
function transformPost(raw: RawPost): BlueskyPost {
  // Extract post ID from the URI (format: at://did/app.bsky.feed.post/record-key)
  const uriParts = raw.uri.split('/');
  const recordId = uriParts[uriParts.length - 1];
  const postId = raw.cid || recordId || `bsky-${Date.now()}`;

  // Author display name falls back to handle if not set.
  const authorName = raw.author.displayName || raw.author.handle;

  // Construct the Bluesky web URL from the author handle and post record ID.
  const postUrl = `https://bsky.app/profile/${raw.author.handle}/post/${recordId}`;

  // Use indexedAt as the publish timestamp (when the post was indexed by the API).
  const publishDate = raw.record.createdAt || raw.indexedAt || new Date().toISOString();

  return {
    id: postId,
    text: raw.record.text || '',
    author: authorName,
    authorHandle: raw.author.handle,
    url: postUrl,
    likeCount: raw.likeCount ?? 0,
    repostCount: raw.repostCount ?? 0,
    publishDate: new Date(publishDate).toISOString(),
    source: 'bluesky',
  };
}

/**
 * GET /api/sources/bluesky
 *
 * Fetches AI product launch discussions from Bluesky Social via the public API.
 *
 * Query Parameters:
 * - q: Search query string (default: "AI product launch").
 * - limit: Number of posts to return (default: 20, max: 50).
 *
 * On failure, returns mock data with source: 'mock'.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || 'AI product launch';
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(rawLimit, 1), 50);

    // Build Bluesky public API URL.
    const bskyUrl = new URL('https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts');
    bskyUrl.searchParams.set('q', query);
    bskyUrl.searchParams.set('limit', String(limit));

    let posts: BlueskyPost[] = [];
    let source: 'bluesky' | 'mock' = 'bluesky';

    try {
      const response = await fetch(bskyUrl.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Bluesky API returned ${response.status}`);
      }

      const data: BlueskySearchResponse = await response.json();
      posts = (data.posts || []).map(transformPost);
      source = posts.length > 0 ? 'bluesky' : 'mock';
    } catch (apiError) {
      console.error('Bluesky API error, falling back to mock data:', apiError);
      source = 'mock';
    }

    // If API returned no posts or failed, use mock data.
    if (posts.length === 0) {
      posts = MOCK_POSTS.slice(0, limit);
      source = 'mock';
    }

    // Sort by publish date descending.
    posts.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    const responseBody = {
      posts,
      total: posts.length,
      query,
      limit,
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
    console.error('Bluesky API route error:', error);
    return NextResponse.json(
      {
        posts: MOCK_POSTS,
        total: MOCK_POSTS.length,
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

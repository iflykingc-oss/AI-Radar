import { NextResponse } from 'next/server';
import type { RedditPost, RedditApiResponse } from '@/types/reddit';

/**
 * Default subreddits to query for AI product discovery.
 */
const DEFAULT_SUBREDDITS = [
  'artificial',
  'AI_Agents',
  'SideProject',
  'startups',
  'LocalLLaMA',
];

/**
 * Valid time filters for Reddit's API.
 */
type TimeFilter = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

/**
 * Mock data used as fallback when Reddit API is unreachable.
 */
const MOCK_POSTS: RedditPost[] = [
  {
    id: 'mock_1',
    title: 'I built an AI agent that autonomously manages my calendar',
    subreddit: 'AI_Agents',
    author: 'dev_ai',
    upvotes: 1240,
    commentCount: 89,
    url: 'https://example.com/ai-calendar-agent',
    permalink: '/r/AI_Agents/comments/mock_1/',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isSelfPost: true,
    selftext:
      'After months of work, I finally released my AI calendar agent. It uses GPT-4 to schedule meetings, resolve conflicts, and even suggest optimal meeting times.',
    productMentions: ['AI Calendar Agent'],
  },
  {
    id: 'mock_2',
    title: 'Show HN: My open-source LLM fine-tuning toolkit',
    subreddit: 'LocalLLaMA',
    author: 'oss_hero',
    upvotes: 890,
    commentCount: 45,
    url: 'https://github.com/example/llm-toolkit',
    permalink: '/r/LocalLLaMA/comments/mock_2/',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isSelfPost: false,
    productMentions: ['LLM Fine-Tuning Toolkit'],
  },
  {
    id: 'mock_3',
    title: 'Launched my AI-powered code review tool today',
    subreddit: 'SideProject',
    author: 'indie_dev_99',
    upvotes: 567,
    commentCount: 32,
    url: 'https://example.com/code-review-ai',
    permalink: '/r/SideProject/comments/mock_3/',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    isSelfPost: true,
    selftext:
      'It integrates with GitHub and GitLab, uses static analysis + LLM to catch bugs before they hit production.',
    productMentions: ['AI-Powered Code Review Tool'],
  },
  {
    id: 'mock_4',
    title: 'Introducing ClaudeCraft: An AI assistant for Minecraft',
    subreddit: 'artificial',
    author: 'gamer_ai',
    upvotes: 2100,
    commentCount: 156,
    url: 'https://example.com/claudecraft',
    permalink: '/r/artificial/comments/mock_4/',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    isSelfPost: false,
    productMentions: ['ClaudeCraft'],
  },
  {
    id: 'mock_5',
    title: 'We just released our startup: AI-driven customer support',
    subreddit: 'startups',
    author: 'founder_jane',
    upvotes: 430,
    commentCount: 28,
    url: 'https://example.com/ai-support',
    permalink: '/r/startups/comments/mock_5/',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    isSelfPost: true,
    selftext:
      'Our platform replaces tier-1 support with an LLM trained on your docs. 10x faster resolution times.',
    productMentions: ['AI-Driven Customer Support'],
  },
  {
    id: 'mock_6',
    title: 'Created a local RAG chatbot that runs on CPU',
    subreddit: 'LocalLLaMA',
    author: 'cpu_warrior',
    upvotes: 1500,
    commentCount: 112,
    url: 'https://example.com/local-rag',
    permalink: '/r/LocalLLaMA/comments/mock_6/',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    isSelfPost: true,
    selftext:
      'No GPU required. Uses quantized Mistral 7B and runs at 15 tok/s on an M2 MacBook Air.',
    productMentions: ['Local RAG Chatbot'],
  },
  {
    id: 'mock_7',
    title: 'My app uses GPT-4 to generate marketing copy for indie founders',
    subreddit: 'SideProject',
    author: 'copy_ai_dev',
    upvotes: 320,
    commentCount: 19,
    url: 'https://example.com/marketing-copy-ai',
    permalink: '/r/SideProject/comments/mock_7/',
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    isSelfPost: false,
    productMentions: ['Marketing Copy AI'],
  },
  {
    id: 'mock_8',
    title: 'Show HN: Built an autonomous research agent with LangChain',
    subreddit: 'artificial',
    author: 'research_ai',
    upvotes: 780,
    commentCount: 64,
    url: 'https://example.com/research-agent',
    permalink: '/r/artificial/comments/mock_8/',
    createdAt: new Date(Date.now() - 691200000).toISOString(),
    isSelfPost: true,
    selftext:
      'It reads papers, summarizes them, and answers questions with citations. Built with LangChain and OpenAI.',
    productMentions: ['Autonomous Research Agent', 'LangChain'],
  },
];

/**
 * Extracts potential product mentions from a Reddit post title and selftext.
 *
 * Looks for launch-related keywords followed by capitalized phrases that
 * likely represent product or project names.
 *
 * @param title - The post title.
 * @param selftext - Optional self-post body.
 * @returns Array of detected product mention strings.
 */
function extractProductMentions(title: string, selftext?: string): string[] {
  const text = `${title} ${selftext || ''}`;
  const mentions: string[] = [];

  // Keywords that often precede product introductions.
  const launchKeywords = [
    'launched',
    'built',
    'created',
    'released',
    'introducing',
    'show hn',
    'my app',
    'my tool',
    'my project',
    'my startup',
  ];

  // AI-related keywords.
  const aiKeywords = ['AI', 'LLM', 'GPT', 'agent', 'model', 'chatbot'];

  // Combined pattern: look for launch keyword + capitalized words.
  const combinedPattern = new RegExp(
    `(?:${launchKeywords.join('|')})\\s+(?:(?:an?|the|our|my)\\s+)?([A-Z][A-Za-z0-9]*(?:\\s+[A-Z][A-Za-z0-9]+){0,5})`,
    'gi'
  );

  let match: RegExpExecArray | null;
  while ((match = combinedPattern.exec(text)) !== null) {
    const mention = match[1].trim();
    if (mention.length > 1 && !mentions.includes(mention)) {
      mentions.push(mention);
    }
  }

  // Also look for "ProductName: description" or quoted names.
  const quotedPattern = /"([^"]{2,40})"|'([^']{2,40})'/g;
  while ((match = quotedPattern.exec(text)) !== null) {
    const mention = (match[1] || match[2]).trim();
    if (
      mention.length > 1 &&
      !mentions.includes(mention) &&
      aiKeywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))
    ) {
      mentions.push(mention);
    }
  }

  return mentions;
}

/**
 * Fetches posts from a single subreddit using Reddit's public JSON API.
 *
 * NOTE: Reddit's public API has rate limits. Unauthenticated requests are
 * limited to roughly 30 requests per minute per IP. For production use,
 * consider adding caching (Redis, etc.) or OAuth authentication for
 * higher limits.
 *
 * @param subreddit - Name of the subreddit (without r/ prefix).
 * @param limit - Number of posts to fetch.
 * @param time - Time filter for sorting.
 * @returns Array of normalized RedditPost objects.
 */
async function fetchSubredditPosts(
  subreddit: string,
  limit: number,
  time: TimeFilter
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=${time}&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AI-Radar-App/1.0 (Product Discovery)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Reddit API returned ${response.status} for r/${subreddit}`
    );
  }

  const data = await response.json();
  const children = data?.data?.children || [];

  return children.map((child: any): RedditPost => {
    const post = child.data;
    const title: string = post.title || '';
    const selftext: string = post.selftext || '';

    return {
      id: post.id || `${subreddit}_${child.kind}`,
      title,
      subreddit: post.subreddit || subreddit,
      author: post.author || 'unknown',
      upvotes: post.ups || 0,
      commentCount: post.num_comments || 0,
      url: post.url || `https://reddit.com${post.permalink}`,
      permalink: `https://reddit.com${post.permalink}`,
      createdAt: new Date((post.created_utc || 0) * 1000).toISOString(),
      thumbnail:
        post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default'
          ? post.thumbnail
          : undefined,
      isSelfPost: post.is_self ?? false,
      selftext: post.is_self ? selftext : undefined,
      productMentions: extractProductMentions(title, selftext),
    };
  });
}

/**
 * GET handler for /api/sources/reddit
 *
 * Query parameters:
 * - subreddit: specific subreddit to query (default: all configured)
 * - limit: number of posts per subreddit (default: 25, max: 100)
 * - time: time filter - hour, day, week, month, year, all (default: week)
 *
 * Returns recent top posts from AI-related subreddits with product mention
 * extraction. Falls back to mock data if Reddit API is unavailable.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const subredditParam = searchParams.get('subreddit');
  const limitParam = parseInt(searchParams.get('limit') || '25', 10);
  const timeParam = (searchParams.get('time') || 'week') as TimeFilter;

  // Clamp limit to valid range.
  const limit = Math.min(Math.max(limitParam, 1), 100);

  // Validate time filter.
  const validTimes: TimeFilter[] = ['hour', 'day', 'week', 'month', 'year', 'all'];
  const time = validTimes.includes(timeParam) ? timeParam : 'week';

  // Determine which subreddits to query.
  const subreddits = subredditParam
    ? [subredditParam.replace(/^r\//, '')]
    : DEFAULT_SUBREDDITS;

  try {
    // Fetch posts from all target subreddits in parallel.
    const results = await Promise.allSettled(
      subreddits.map((sr) => fetchSubredditPosts(sr, limit, time))
    );

    let allPosts: RedditPost[] = [];
    let anySuccess = false;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allPosts = allPosts.concat(result.value);
        anySuccess = true;
      } else {
        console.warn('Reddit fetch failed:', result.reason);
      }
    }

    // If every request failed, fall back to mock data.
    if (!anySuccess) {
      console.warn('All Reddit API requests failed; returning mock data.');
      const response: RedditApiResponse = {
        posts: MOCK_POSTS,
        total: MOCK_POSTS.length,
        fetchedAt: new Date().toISOString(),
        source: 'mock',
      };
      return NextResponse.json(response, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      });
    }

    // Deduplicate by id and sort by upvotes descending.
    const seen = new Set<string>();
    const uniquePosts = allPosts.filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });

    uniquePosts.sort((a, b) => b.upvotes - a.upvotes);

    const response: RedditApiResponse = {
      posts: uniquePosts,
      total: uniquePosts.length,
      fetchedAt: new Date().toISOString(),
      source: 'reddit',
    };

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  } catch (error) {
    console.error('Reddit API unexpected error:', error);

    // Final safety net: return mock data on any unexpected error.
    const response: RedditApiResponse = {
      posts: MOCK_POSTS,
      total: MOCK_POSTS.length,
      fetchedAt: new Date().toISOString(),
      source: 'mock',
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }
}

/**
 * OPTIONS handler for CORS preflight requests.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

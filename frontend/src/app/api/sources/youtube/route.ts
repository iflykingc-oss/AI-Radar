import { NextRequest, NextResponse } from 'next/server';

/**
 * Normalized YouTube video item returned by the route.
 */
interface YouTubeVideo {
  id: string;
  title: string;
  channelName: string;
  url: string;
  publishDate: string;
  thumbnail: string;
  source: 'youtube' | 'mock';
}

/**
 * YouTube channel RSS feed URLs to aggregate AI video content from.
 */
const CHANNEL_FEEDS: { channelId: string; channelName: string }[] = [
  {
    channelId: 'UCbfYPyITQ-7l4upoX8_zctg',
    channelName: 'Two Minute Papers',
  },
  {
    channelId: 'UCZ9qFEC82qM6Pk-54Q4TVWA',
    channelName: 'AI Explained',
  },
];

/**
 * YouTube Atom feed entry element regex pattern.
 * Matches the <entry>...</entry> block to extract per-video fields.
 */
const ENTRY_REGEX =
  /<entry>([\s\S]*?)<\/entry>/gi;

/**
 * Regex patterns for extracting individual fields from an entry block.
 */
const FIELD_PATTERNS = {
  videoId: /<yt:videoId>([^<]+)<\/yt:videoId>/,
  title: /<title>([^<]+)<\/title>/,
  published: /<published>([^<]+)<\/published>/,
};

/**
 * Mock YouTube videos used as fallback when all RSS feeds fail.
 */
const MOCK_VIDEOS: YouTubeVideo[] = [
  {
    id: 'mock-yt-1',
    title: 'GPT-4o: Multimodal AI Breakthrough Explained',
    channelName: 'Two Minute Papers',
    url: 'https://www.youtube.com/watch?v=mock-yt-1',
    publishDate: new Date(Date.now() - 86400000).toISOString(),
    thumbnail: 'https://img.youtube.com/vi/mock-yt-1/maxresdefault.jpg',
    source: 'mock',
  },
  {
    id: 'mock-yt-2',
    title: 'The Race to AGI: OpenAI vs Google vs Anthropic',
    channelName: 'AI Explained',
    url: 'https://www.youtube.com/watch?v=mock-yt-2',
    publishDate: new Date(Date.now() - 172800000).toISOString(),
    thumbnail: 'https://img.youtube.com/vi/mock-yt-2/maxresdefault.jpg',
    source: 'mock',
  },
  {
    id: 'mock-yt-3',
    title: 'Diffusion Models: How AI Creates Realistic Images',
    channelName: 'Two Minute Papers',
    url: 'https://www.youtube.com/watch?v=mock-yt-3',
    publishDate: new Date(Date.now() - 259200000).toISOString(),
    thumbnail: 'https://img.youtube.com/vi/mock-yt-3/maxresdefault.jpg',
    source: 'mock',
  },
  {
    id: 'mock-yt-4',
    title: 'Claude 3 Opus: Deep Dive into the Latest AI Model',
    channelName: 'AI Explained',
    url: 'https://www.youtube.com/watch?v=mock-yt-4',
    publishDate: new Date(Date.now() - 345600000).toISOString(),
    thumbnail: 'https://img.youtube.com/vi/mock-yt-4/maxresdefault.jpg',
    source: 'mock',
  },
  {
    id: 'mock-yt-5',
    title: 'Neural Radiance Fields: 3D Scenes from 2D Images',
    channelName: 'Two Minute Papers',
    url: 'https://www.youtube.com/watch?v=mock-yt-5',
    publishDate: new Date(Date.now() - 432000000).toISOString(),
    thumbnail: 'https://img.youtube.com/vi/mock-yt-5/maxresdefault.jpg',
    source: 'mock',
  },
  {
    id: 'mock-yt-6',
    title: 'Meta LLaMA 3: Open Source AI Competing with GPT-4',
    channelName: 'AI Explained',
    url: 'https://www.youtube.com/watch?v=mock-yt-6',
    publishDate: new Date(Date.now() - 518400000).toISOString(),
    thumbnail: 'https://img.youtube.com/vi/mock-yt-6/maxresdefault.jpg',
    source: 'mock',
  },
  {
    id: 'mock-yt-7',
    title: 'AI Agents: The Future of Autonomous Software',
    channelName: 'Two Minute Papers',
    url: 'https://www.youtube.com/watch?v=mock-yt-7',
    publishDate: new Date(Date.now() - 604800000).toISOString(),
    thumbnail: 'https://img.youtube.com/vi/mock-yt-7/maxresdefault.jpg',
    source: 'mock',
  },
  {
    id: 'mock-yt-8',
    title: 'Gemini Ultra: Google Multimodal AI Model Review',
    channelName: 'AI Explained',
    url: 'https://www.youtube.com/watch?v=mock-yt-8',
    publishDate: new Date(Date.now() - 691200000).toISOString(),
    thumbnail: 'https://img.youtube.com/vi/mock-yt-8/maxresdefault.jpg',
    source: 'mock',
  },
  {
    id: 'mock-yt-9',
    title: 'Reinforcement Learning in Large Language Models',
    channelName: 'Two Minute Papers',
    url: 'https://www.youtube.com/watch?v=mock-yt-9',
    publishDate: new Date(Date.now() - 777600000).toISOString(),
    thumbnail: 'https://img.youtube.com/vi/mock-yt-9/maxresdefault.jpg',
    source: 'mock',
  },
  {
    id: 'mock-yt-10',
    title: 'Stable Diffusion XL: Next-Gen Image Generation',
    channelName: 'AI Explained',
    url: 'https://www.youtube.com/watch?v=mock-yt-10',
    publishDate: new Date(Date.now() - 864000000).toISOString(),
    thumbnail: 'https://img.youtube.com/vi/mock-yt-10/maxresdefault.jpg',
    source: 'mock',
  },
];

/**
 * Parses an Atom XML feed entry block to extract video metadata.
 *
 * Uses regex-based extraction to avoid external XML parsing dependencies.
 *
 * @param entryBlock - The raw XML string between <entry> and </entry>.
 * @param channelName - The known channel display name for this feed.
 * @returns A normalized YouTubeVideo object, or null if parsing failed.
 */
function parseEntry(entryBlock: string, channelName: string): YouTubeVideo | null {
  const videoIdMatch = entryBlock.match(FIELD_PATTERNS.videoId);
  const titleMatch = entryBlock.match(FIELD_PATTERNS.title);
  const publishedMatch = entryBlock.match(FIELD_PATTERNS.published);

  if (!videoIdMatch || !titleMatch) {
    return null;
  }

  const videoId = videoIdMatch[1].trim();
  const title = titleMatch[1].trim();
  const publishDate = publishedMatch ? new Date(publishedMatch[1].trim()).toISOString() : new Date().toISOString();

  return {
    id: videoId,
    title,
    channelName,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    publishDate,
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    source: 'youtube',
  };
}

/**
 * Fetches and parses a single YouTube channel RSS feed.
 *
 * @param channelId - The YouTube channel ID.
 * @param channelName - The display name for the channel.
 * @returns Array of parsed YouTubeVideo items from this channel.
 */
async function fetchChannelFeed(channelId: string, channelName: string): Promise<YouTubeVideo[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  const response = await fetch(feedUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/xml, text/xml',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`YouTube RSS feed returned ${response.status} for channel ${channelId}`);
  }

  const xmlText = await response.text();

  const videos: YouTubeVideo[] = [];
  let match;

  while ((match = ENTRY_REGEX.exec(xmlText)) !== null) {
    const entryBlock = match[1];
    const video = parseEntry(entryBlock, channelName);
    if (video) {
      videos.push(video);
    }
  }

  return videos;
}

/**
 * GET /api/sources/youtube
 *
 * Fetches recent videos from multiple AI-focused YouTube channels via RSS feeds.
 * Combines results from all configured channels and sorts by publish date.
 *
 * Query Parameters:
 * - limit: Maximum number of videos to return (default: 20, max: 50).
 *
 * On failure, returns mock data with source: 'mock'.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(rawLimit, 1), 50);

    // Fetch all channel feeds in parallel.
    const feedPromises = CHANNEL_FEEDS.map(({ channelId, channelName }) =>
      fetchChannelFeed(channelId, channelName).catch((err) => {
        console.error(`Failed to fetch YouTube feed for ${channelName}:`, err);
        return [] as YouTubeVideo[];
      })
    );

    const feedResults = await Promise.allSettled(feedPromises);

    // Combine all videos from all channels.
    const allVideos: YouTubeVideo[] = [];
    for (const result of feedResults) {
      if (result.status === 'fulfilled') {
        allVideos.push(...result.value);
      }
    }

    // Sort by publish date descending, deduplicate by video ID.
    const seen = new Set<string>();
    const uniqueVideos = allVideos
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .filter((v) => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });

    const videos = uniqueVideos.slice(0, limit);
    const source: 'youtube' | 'mock' = videos.length > 0 ? 'youtube' : 'mock';
    const finalVideos = source === 'mock' ? MOCK_VIDEOS.slice(0, limit) : videos;

    const responseBody = {
      videos: finalVideos,
      total: finalVideos.length,
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
    console.error('YouTube API route error:', error);
    return NextResponse.json(
      {
        videos: MOCK_VIDEOS,
        total: MOCK_VIDEOS.length,
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

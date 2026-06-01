import { NextRequest, NextResponse } from 'next/server';
import type { SourceItem, SourceApiResponse, TechCrunchArticle } from '@/types/sources';

/**
 * TechCrunch AI RSS feed URL.
 */
const TECHCRUNCH_RSS_URL = 'https://techcrunch.com/category/artificial-intelligence/feed/';

/**
 * Timeout in milliseconds for TechCrunch RSS requests.
 */
const API_TIMEOUT_MS = 10_000;

/**
 * Mock TechCrunch articles used as fallback when the RSS feed is unavailable.
 */
const MOCK_ARTICLES: SourceItem[] = [
  {
    id: 'tc-mock-1',
    title: 'OpenAI launches GPT-5 with multimodal reasoning and 1M context window',
    description: 'OpenAI unveils its next-generation model GPT-5, featuring native multimodal reasoning, a 1 million token context window, and significant improvements across benchmark tasks.',
    url: 'https://techcrunch.com/2025/01/15/openai-gpt-5-launch/',
    source: 'techcrunch',
    publishDate: '2025-01-15T08:00:00Z',
    author: 'Sarah Perez',
    score: 1240,
    tags: ['OpenAI', 'GPT-5', 'LLM', 'Multimodal'],
  },
  {
    id: 'tc-mock-2',
    title: 'Anthropic raises $8B at $60B valuation to build Claude ecosystem',
    description: 'Anthropic secures massive funding round led by Amazon and Google to scale Claude AI assistant and expand its enterprise AI platform capabilities.',
    url: 'https://techcrunch.com/2025/01/14/anthropic-funding-claude/',
    source: 'techcrunch',
    publishDate: '2025-01-14T10:30:00Z',
    author: 'Kyle Wiggers',
    score: 890,
    tags: ['Anthropic', 'Claude', 'Funding', 'AI Safety'],
  },
  {
    id: 'tc-mock-3',
    title: 'Cursor AI raises $300M Series C at $10B valuation for AI code editor',
    description: 'AI-first code editor Cursor secures funding led by Sequoia, signaling strong investor confidence in AI developer tools market growth.',
    url: 'https://techcrunch.com/2025/01/12/cursor-ai-funding/',
    source: 'techcrunch',
    publishDate: '2025-01-12T09:00:00Z',
    author: 'Frederic Lardinois',
    score: 756,
    tags: ['Cursor', 'Developer Tools', 'AI Coding', 'Funding'],
  },
  {
    id: 'tc-mock-4',
    title: 'Google DeepMind unveils Gemini 2.0 with real-time video understanding',
    description: 'Gemini 2.0 introduces native real-time video understanding with sub-second latency, enabling live video analysis and response for enterprise applications.',
    url: 'https://techcrunch.com/2025/01/13/google-gemini-2-video/',
    source: 'techcrunch',
    publishDate: '2025-01-13T14:00:00Z',
    author: 'Benj Edwards',
    score: 1100,
    tags: ['Google', 'Gemini', 'Video AI', 'DeepMind'],
  },
  {
    id: 'tc-mock-5',
    title: 'EU AI Act enforcement begins with compliance requirements for major models',
    description: 'The EU AI Act officially enters enforcement phase, requiring transparency reports and risk assessments from foundation model providers operating in Europe.',
    url: 'https://techcrunch.com/2025/01/08/eu-ai-act-enforcement/',
    source: 'techcrunch',
    publishDate: '2025-01-08T07:00:00Z',
    author: 'Romain Dillet',
    score: 620,
    tags: ['EU', 'Regulation', 'AI Act', 'Compliance'],
  },
  {
    id: 'tc-mock-6',
    title: 'Perplexity AI launches Pro Search with autonomous multi-step research',
    description: 'Perplexity introduces Pro Search, an autonomous agent that plans and executes multi-step research tasks with source verification and citation tracking.',
    url: 'https://techcrunch.com/2025/01/10/perplexity-pro-search/',
    source: 'techcrunch',
    publishDate: '2025-01-10T16:00:00Z',
    author: 'Sarah Perez',
    score: 530,
    tags: ['Perplexity', 'Search', 'AI Agent', 'Research'],
  },
  {
    id: 'tc-mock-7',
    title: 'Meta open-sources Llama 4 with 400B parameters and MoE architecture',
    description: 'Meta releases Llama 4, its largest open model yet, featuring Mixture-of-Experts architecture for efficient inference at massive scale across enterprise workloads.',
    url: 'https://techcrunch.com/2025/01/11/meta-llama-4/',
    source: 'techcrunch',
    publishDate: '2025-01-11T12:00:00Z',
    author: 'Kyle Wiggers',
    score: 980,
    tags: ['Meta', 'Llama', 'Open Source', 'MoE'],
  },
  {
    id: 'tc-mock-8',
    title: 'ElevenLabs launches real-time voice cloning API with 200ms latency',
    description: 'ElevenLabs introduces a new voice cloning API enabling real-time voice synthesis with industry-leading 200ms latency for conversational AI applications.',
    url: 'https://techcrunch.com/2025/01/01/elevenlabs-voice-api/',
    source: 'techcrunch',
    publishDate: '2025-01-01T14:00:00Z',
    author: 'Aisha Malik',
    score: 445,
    tags: ['ElevenLabs', 'Voice AI', 'Real-time', 'API'],
  },
];

/**
 * Simple XML element extractor for RSS parsing.
 *
 * Extracts the first occurrence of a tag within the given XML text.
 * Handles both self-closing and standard XML tags.
 *
 * @param xml - The XML string to search within.
 * @param tag - The tag name to extract.
 * @returns The text content of the first matching tag, or empty string.
 */
function extractXmlTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, 's');
  const match = xml.match(regex);
  if (match) {
    // Strip CDATA wrapper if present.
    return match[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
  }
  return '';
}

/**
 * Extracts all occurrences of a repeating tag within XML.
 *
 * @param xml - The XML string to search within.
 * @param tag - The tag name to extract.
 * @returns Array of text contents from all matching tags.
 */
function extractXmlTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, 'gs');
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    const value = match[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
    if (value) results.push(value);
  }
  return results;
}

/**
 * Extracts the value of an attribute from an XML tag.
 *
 * @param xml - The XML string to search within.
 * @param tag - The tag name containing the attribute.
 * @param attr - The attribute name to extract.
 * @returns The attribute value, or empty string if not found.
 */
function extractXmlAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

/**
 * Parses a TechCrunch RSS item XML string into a SourceItem.
 *
 * @param itemXml - The XML string for a single RSS item.
 * @param index - Position index for generating a unique ID.
 * @returns Parsed SourceItem object.
 */
function parseTechCrunchItem(itemXml: string, index: number): SourceItem {
  const title = extractXmlTag(itemXml, 'title');
  const link = extractXmlTag(itemXml, 'link');
  const description = extractXmlTag(itemXml, 'description');
  const pubDate = extractXmlTag(itemXml, 'pubDate');
  const author = extractXmlTag(itemXml, 'dc:creator') || extractXmlTag(itemXml, 'author');
  const categories = extractXmlTags(itemXml, 'category');
  const guid = extractXmlTag(itemXml, 'guid');

  // Generate a deterministic ID from guid or link.
  const id = guid || link || `tc-${index}-${Date.now()}`;

  return {
    id,
    title: title || 'Untitled',
    description: description || '',
    url: link || '',
    source: 'techcrunch',
    publishDate: pubDate || new Date().toISOString(),
    author: author || undefined,
    score: undefined,
    tags: categories.length > 0 ? categories : undefined,
  };
}

/**
 * Fetches and parses the TechCrunch AI RSS feed.
 *
 * @returns Array of SourceItem objects from the feed.
 */
async function fetchTechCrunchFeed(): Promise<SourceItem[]> {
  const response = await fetch(TECHCRUNCH_RSS_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`TechCrunch RSS returned ${response.status}`);
  }

  const xmlText = await response.text();

  // Extract individual <item> blocks from the RSS feed.
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
  const items: SourceItem[] = [];
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    const sourceItem = parseTechCrunchItem(itemXml, index);
    items.push(sourceItem);
    index++;
  }

  return items;
}

/**
 * GET handler for /api/sources/techcrunch
 *
 * Fetches AI-related articles from TechCrunch RSS feed.
 * Falls back to mock data if the feed is unavailable.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(limitParam, 1), 50);

    let items: SourceItem[] = [];
    let source = 'techcrunch';

    try {
      items = await fetchTechCrunchFeed();
      // Sort by publish date descending.
      items.sort((a, b) => b.publishDate.localeCompare(a.publishDate));
      items = items.slice(0, limit);
    } catch (apiError) {
      console.error('TechCrunch RSS error, falling back to mock data:', apiError);
      items = MOCK_ARTICLES.slice(0, limit);
      source = 'mock';
    }

    const responseBody: SourceApiResponse = {
      items,
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
    console.error('TechCrunch API route error:', error);

    // Final safety net: return mock data.
    const responseBody: SourceApiResponse = {
      items: MOCK_ARTICLES,
      source: 'mock',
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(responseBody, {
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

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { SourceItem, SourceApiResponse } from '@/types/sources';

/**
 * Medium AI topic RSS feed URL.
 */
const MEDIUM_RSS_URL = 'https://medium.com/feed/topic/artificial-intelligence';

/**
 * Timeout in milliseconds for Medium RSS requests.
 */
const API_TIMEOUT_MS = 10_000;

/**
 * Mock Medium articles used as fallback when the RSS feed is unavailable.
 */
const MOCK_ARTICLES: SourceItem[] = [
  {
    id: 'med-mock-1',
    title: 'The Complete Guide to Building Production-Ready AI Agents in 2025',
    description: 'A comprehensive guide covering architecture patterns, tool selection, and deployment strategies for building reliable AI agents that work in production environments.',
    url: 'https://medium.com/@ai_engineer/complete-guide-ai-agents-2025',
    source: 'medium',
    publishDate: '2025-01-15T06:00:00Z',
    author: 'AI Engineering',
    score: 2340,
    tags: ['AI Agents', 'Architecture', 'Production'],
  },
  {
    id: 'med-mock-2',
    title: 'Why RAG is not enough: The next evolution of AI knowledge systems',
    description: 'Exploring the limitations of Retrieval-Augmented Generation and introducing graph-based knowledge retrieval as the next paradigm for enterprise AI applications.',
    url: 'https://medium.com/@ml_research/rag-not-enough-graph-knowledge',
    source: 'medium',
    publishDate: '2025-01-14T08:30:00Z',
    author: 'ML Research Today',
    score: 1890,
    tags: ['RAG', 'Knowledge Graph', 'AI'],
  },
  {
    id: 'med-mock-3',
    title: 'Building a $10M ARR AI startup: lessons from the trenches',
    description: 'A candid look at what it takes to build a successful AI startup, from product-market fit to scaling infrastructure and managing investor expectations.',
    url: 'https://medium.com/@founder_stories/10m-arr-ai-startup',
    source: 'medium',
    publishDate: '2025-01-13T10:00:00Z',
    author: 'Startup Insights',
    score: 1560,
    tags: ['Startup', 'AI Business', 'Entrepreneurship'],
  },
  {
    id: 'med-mock-4',
    title: 'Deep dive into Mixture of Experts: why every major model is adopting MoE',
    description: 'Technical analysis of Mixture of Experts architecture, its computational advantages, and why Meta, Google, and Mistral are betting big on this approach.',
    url: 'https://medium.com/@deep_learning/moe-deep-dive',
    source: 'medium',
    publishDate: '2025-01-12T14:00:00Z',
    author: 'Deep Learning Explained',
    score: 1230,
    tags: ['MoE', 'Architecture', 'LLM'],
  },
  {
    id: 'med-mock-5',
    title: 'How we reduced LLM inference costs by 80% with smart caching',
    description: 'Practical strategies for reducing AI API costs including semantic caching, response deduplication, and intelligent prompt routing across model tiers.',
    url: 'https://medium.com/@ai_ops/llm-cost-reduction-caching',
    source: 'medium',
    publishDate: '2025-01-11T09:00:00Z',
    author: 'AI Ops Weekly',
    score: 980,
    tags: ['Cost Optimization', 'LLM', 'Caching'],
  },
  {
    id: 'med-mock-6',
    title: 'The rise of AI-native databases: when your database thinks',
    description: 'Exploring the emerging category of AI-native databases that go beyond vector similarity to include natural language querying, auto-indexing, and intelligent data modeling.',
    url: 'https://medium.com/@data_future/ai-native-databases',
    source: 'medium',
    publishDate: '2025-01-10T11:30:00Z',
    author: 'Data Future',
    score: 870,
    tags: ['Database', 'AI Native', 'Vector DB'],
  },
  {
    id: 'med-mock-7',
    title: 'Fine-tuning vs RAG vs Prompt Engineering: when to use what',
    description: 'A decision framework for choosing the right AI customization approach based on your use case, data availability, budget, and performance requirements.',
    url: 'https://medium.com/@ai_decisions/fine-tuning-vs-rag-vs-prompt',
    source: 'medium',
    publishDate: '2025-01-09T07:00:00Z',
    author: 'AI Decision Guide',
    score: 1450,
    tags: ['Fine-tuning', 'RAG', 'Prompt Engineering'],
  },
  {
    id: 'med-mock-8',
    title: 'Multi-modal AI in production: combining text, image, and audio understanding',
    description: 'Real-world patterns for building applications that process multiple modalities simultaneously, with examples from customer service, content creation, and accessibility.',
    url: 'https://medium.com/@multimodal_ai/multimodal-production',
    source: 'medium',
    publishDate: '2025-01-08T13:00:00Z',
    author: 'Multimodal AI',
    score: 760,
    tags: ['Multimodal', 'Production', 'AI'],
  },
];

/**
 * Simple XML element extractor for RSS parsing.
 *
 * Extracts the first occurrence of a tag within the given XML text.
 *
 * @param xml - The XML string to search within.
 * @param tag - The tag name to extract.
 * @returns The text content of the first matching tag, or empty string.
 */
function extractXmlTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\\/${tag}>`, 's');
  const match = xml.match(regex);
  if (match) {
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
 * Strips HTML tags from a string, leaving plain text.
 *
 * @param html - String potentially containing HTML tags.
 * @returns Plain text with HTML tags removed.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/**
 * Parses a Medium RSS item XML string into a SourceItem.
 *
 * Medium RSS feeds use standard RSS 2.0 with some Dublin Core extensions.
 *
 * @param itemXml - The XML string for a single RSS item.
 * @param index - Position index for generating a unique ID.
 * @returns Parsed SourceItem object.
 */
function parseMediumItem(itemXml: string, index: number): SourceItem {
  const title = extractXmlTag(itemXml, 'title');
  const link = extractXmlTag(itemXml, 'link');
  const description = extractXmlTag(itemXml, 'description');
  const pubDate = extractXmlTag(itemXml, 'pubDate');
  const author = extractXmlTag(itemXml, 'dc:creator') || extractXmlTag(itemXml, 'author');
  const categories = extractXmlTags(itemXml, 'category');
  const guid = extractXmlTag(itemXml, 'guid');

  // Medium descriptions often contain HTML; strip it for clean text.
  const cleanDescription = stripHtml(description);

  // Extract content from content:encoded if description is too short.
  if (cleanDescription.length < 50) {
    const contentEncoded = extractXmlTag(itemXml, 'content:encoded');
    if (contentEncoded) {
      const cleanContent = stripHtml(contentEncoded);
      // Use first 300 chars as description.
      return {
        id: guid || link || `med-${index}-${Date.now()}`,
        title: title || 'Untitled',
        description: cleanContent.substring(0, 300),
        url: link || '',
        source: 'medium',
        publishDate: pubDate || new Date().toISOString(),
        author: author || undefined,
        score: undefined,
        tags: categories.length > 0 ? categories : undefined,
      };
    }
  }

  return {
    id: guid || link || `med-${index}-${Date.now()}`,
    title: title || 'Untitled',
    description: cleanDescription.substring(0, 300),
    url: link || '',
    source: 'medium',
    publishDate: pubDate || new Date().toISOString(),
    author: author || undefined,
    score: undefined,
    tags: categories.length > 0 ? categories : undefined,
  };
}

/**
 * Fetches and parses the Medium AI RSS feed.
 *
 * @returns Array of SourceItem objects from the feed.
 */
async function fetchMediumFeed(): Promise<SourceItem[]> {
  const response = await fetch(MEDIUM_RSS_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Medium RSS returned ${response.status}`);
  }

  const xmlText = await response.text();

  // Extract individual <item> blocks from the RSS feed.
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
  const items: SourceItem[] = [];
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    const sourceItem = parseMediumItem(itemXml, index);
    // Filter out items without meaningful titles.
    if (sourceItem.title && sourceItem.title !== 'Untitled') {
      items.push(sourceItem);
    }
    index++;
  }

  return items;
}

/**
 * GET handler for /api/sources/medium
 *
 * Fetches AI-related articles from Medium RSS feed.
 * Falls back to mock data if the feed is unavailable.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(limitParam, 1), 50);

    let items: SourceItem[] = [];
    let source = 'medium';

    try {
      items = await fetchMediumFeed();
      // Sort by publish date descending.
      items.sort((a, b) => b.publishDate.localeCompare(a.publishDate));
      items = items.slice(0, limit);
    } catch (apiError) {
      console.error('Medium RSS error, falling back to mock data:', apiError);
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
    console.error('Medium API route error:', error);

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

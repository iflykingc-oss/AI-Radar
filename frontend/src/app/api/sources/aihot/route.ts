export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { AIHotItem, AIHotApiResponse } from '@/types/aihot';

/**
 * Base URL for the AIhot public API.
 */
const AIHOT_BASE_URL = 'https://aihot.virxact.com';

/**
 * Timeout in milliseconds for AIhot API requests.
 */
const API_TIMEOUT_MS = 10_000;

/**
 * Mock AIhot items used as fallback when the AIhot API is unavailable.
 * Contains 15 realistic AI hot topics covering product launches, model releases, and industry news.
 */
const MOCK_ITEMS: AIHotItem[] = [
  {
    id: 'aihot-mock-1',
    title: 'OpenAI launches GPT-5 with multimodal reasoning and 1M context window',
    description: 'OpenAI unveils its next-generation model GPT-5, featuring native multimodal reasoning, a 1 million token context window, and 40% improvement on benchmark tasks.',
    url: 'https://aihot.virxact.com/item/gpt-5-launch',
    category: 'Model Release',
    tags: ['OpenAI', 'GPT-5', 'LLM', 'Multimodal'],
    publish_date: '2025-01-15T08:00:00Z',
    source: 'OpenAI Blog',
    createdAt: '2025-01-15T08:00:00Z',
    productMentions: ['GPT-5'],
  },
  {
    id: 'aihot-mock-2',
    title: 'Anthropic releases Claude 4 with industry-leading coding benchmarks',
    description: 'Claude 4 achieves 92% pass@1 on HumanEval, setting a new state-of-the-art for code generation tasks.',
    url: 'https://aihot.virxact.com/item/claude-4-release',
    category: 'Model Release',
    tags: ['Anthropic', 'Claude', 'Coding'],
    publish_date: '2025-01-14T10:30:00Z',
    source: 'Anthropic',
    createdAt: '2025-01-14T10:30:00Z',
    productMentions: ['Claude 4'],
  },
  {
    id: 'aihot-mock-3',
    title: 'Google DeepMind unveils Gemini 2.0 with real-time video understanding',
    description: 'Gemini 2.0 introduces native real-time video understanding with sub-second latency, enabling live video analysis and response.',
    url: 'https://aihot.virxact.com/item/gemini-2-video',
    category: 'Model Release',
    tags: ['Google', 'Gemini', 'Video Understanding'],
    publish_date: '2025-01-13T14:00:00Z',
    source: 'Google DeepMind',
    createdAt: '2025-01-13T14:00:00Z',
    productMentions: ['Gemini 2.0'],
  },
  {
    id: 'aihot-mock-4',
    title: 'Cursor AI raises $300M Series C at $10B valuation',
    description: 'AI-first code editor Cursor secures massive funding round led by Sequoia, signaling strong investor confidence in AI developer tools.',
    url: 'https://aihot.virxact.com/item/cursor-funding',
    category: 'Funding',
    tags: ['Cursor', 'Funding', 'Developer Tools'],
    publish_date: '2025-01-12T09:00:00Z',
    source: 'TechCrunch',
    createdAt: '2025-01-12T09:00:00Z',
    productMentions: ['Cursor AI'],
  },
  {
    id: 'aihot-mock-5',
    title: 'Meta open-sources Llama 4 with 400B parameters and MoE architecture',
    description: 'Meta releases Llama 4, its largest open model yet, featuring Mixture-of-Experts architecture for efficient inference at massive scale.',
    url: 'https://aihot.virxact.com/item/llama-4-open-source',
    category: 'Open Source',
    tags: ['Meta', 'Llama', 'Open Source', 'MoE'],
    publish_date: '2025-01-11T12:00:00Z',
    source: 'Meta AI',
    createdAt: '2025-01-11T12:00:00Z',
    productMentions: ['Llama 4'],
  },
  {
    id: 'aihot-mock-6',
    title: 'Perplexity AI launches Pro Search with autonomous multi-step research',
    description: 'Perplexity introduces Pro Search, an autonomous agent that plans and executes multi-step research tasks with source verification.',
    url: 'https://aihot.virxact.com/item/perplexity-pro-search',
    category: 'Product Launch',
    tags: ['Perplexity', 'Search', 'AI Agent'],
    publish_date: '2025-01-10T16:00:00Z',
    source: 'Perplexity',
    createdAt: '2025-01-10T16:00:00Z',
    productMentions: ['Perplexity AI', 'Pro Search'],
  },
  {
    id: 'aihot-mock-7',
    title: 'Midjourney v7 introduces 3D scene generation from text prompts',
    description: 'Midjourney v7 enables users to generate fully navigable 3D scenes from natural language descriptions, marking a leap beyond 2D image generation.',
    url: 'https://aihot.virxact.com/item/midjourney-v7-3d',
    category: 'Product Launch',
    tags: ['Midjourney', '3D', 'Image Generation'],
    publish_date: '2025-01-09T11:00:00Z',
    source: 'Midjourney Blog',
    createdAt: '2025-01-09T11:00:00Z',
    productMentions: ['Midjourney v7'],
  },
  {
    id: 'aihot-mock-8',
    title: 'EU AI Act enforcement begins with compliance requirements for major models',
    description: 'The EU AI Act officially enters enforcement phase, requiring transparency reports and risk assessments from foundation model providers.',
    url: 'https://aihot.virxact.com/item/eu-ai-act-enforcement',
    category: 'Regulation',
    tags: ['EU', 'Regulation', 'AI Act', 'Compliance'],
    publish_date: '2025-01-08T07:00:00Z',
    source: 'European Commission',
    createdAt: '2025-01-08T07:00:00Z',
    productMentions: ['EU AI Act'],
  },
  {
    id: 'aihot-mock-9',
    title: 'Runway launches Gen-4 with cinematic video editing capabilities',
    description: 'Runway Gen-4 introduces professional-grade video editing with AI-powered scene understanding, motion transfer, and real-time preview.',
    url: 'https://aihot.virxact.com/item/runway-gen4',
    category: 'Product Launch',
    tags: ['Runway', 'Video', 'Generative AI'],
    publish_date: '2025-01-07T13:30:00Z',
    source: 'Runway',
    createdAt: '2025-01-07T13:30:00Z',
    productMentions: ['Runway Gen-4'],
  },
  {
    id: 'aihot-mock-10',
    title: 'Notion AI launches autonomous workspace agent that manages tasks and docs',
    description: 'Notion introduces an AI agent that autonomously organizes workspace content, schedules meetings, and generates reports from project data.',
    url: 'https://aihot.virxact.com/item/notion-ai-agent',
    category: 'Product Launch',
    tags: ['Notion', 'AI Agent', 'Productivity'],
    publish_date: '2025-01-06T10:00:00Z',
    source: 'Notion Blog',
    createdAt: '2025-01-06T10:00:00Z',
    productMentions: ['Notion AI'],
  },
  {
    id: 'aihot-mock-11',
    title: 'Stability AI releases Stable Video Diffusion 2.0 with 1080p output',
    description: 'Stable Video Diffusion 2.0 delivers 1080p video generation with improved temporal consistency and physics-aware motion modeling.',
    url: 'https://aihot.virxact.com/item/stable-video-2',
    category: 'Open Source',
    tags: ['Stability AI', 'Video Generation', 'Open Source'],
    publish_date: '2025-01-05T15:00:00Z',
    source: 'Stability AI',
    createdAt: '2025-01-05T15:00:00Z',
    productMentions: ['Stable Video Diffusion 2.0'],
  },
  {
    id: 'aihot-mock-12',
    title: 'Cohere launches Command R+ with 128K context and tool-use optimization',
    description: 'Cohere Command R+ is optimized for enterprise RAG workflows with native tool use, retrieval augmentation, and 128K context window.',
    url: 'https://aihot.virxact.com/item/cohere-command-r-plus',
    category: 'Model Release',
    tags: ['Cohere', 'RAG', 'Enterprise', 'Tool Use'],
    publish_date: '2025-01-04T09:30:00Z',
    source: 'Cohere',
    createdAt: '2025-01-04T09:30:00Z',
    productMentions: ['Command R+'],
  },
  {
    id: 'aihot-mock-13',
    title: 'Apple Intelligence integrates with third-party apps via new AI framework',
    description: 'Apple announces a new framework allowing third-party apps to integrate with Apple Intelligence, bringing on-device AI to the broader ecosystem.',
    url: 'https://aihot.virxact.com/item/apple-intelligence-framework',
    category: 'Platform',
    tags: ['Apple', 'Apple Intelligence', 'On-device AI'],
    publish_date: '2025-01-03T11:00:00Z',
    source: 'Apple Developer',
    createdAt: '2025-01-03T11:00:00Z',
    productMentions: ['Apple Intelligence'],
  },
  {
    id: 'aihot-mock-14',
    title: 'Databricks acquires MosaicML competitor for $1.2B to boost ML platform',
    description: 'Databricks announces a major acquisition to strengthen its machine learning platform capabilities and compete with cloud-native AI services.',
    url: 'https://aihot.virxact.com/item/databricks-acquisition',
    category: 'Acquisition',
    tags: ['Databricks', 'M&A', 'ML Platform'],
    publish_date: '2025-01-02T08:00:00Z',
    source: 'Reuters',
    createdAt: '2025-01-02T08:00:00Z',
    productMentions: ['Databricks', 'MosaicML'],
  },
  {
    id: 'aihot-mock-15',
    title: 'ElevenLabs launches real-time voice cloning API with 200ms latency',
    description: 'ElevenLabs introduces a new voice cloning API enabling real-time voice synthesis with industry-leading 200ms latency for conversational AI.',
    url: 'https://aihot.virxact.com/item/elevenlabs-voice-api',
    category: 'Product Launch',
    tags: ['ElevenLabs', 'Voice', 'Real-time', 'API'],
    publish_date: '2025-01-01T14:00:00Z',
    source: 'ElevenLabs',
    createdAt: '2025-01-01T14:00:00Z',
    productMentions: ['ElevenLabs'],
  },
];

/**
 * Extracts potential product mentions from an AIhot item's title and description.
 *
 * @param title - The item title.
 * @param description - Optional item description.
 * @returns Array of detected product mention strings.
 */
function extractProductMentions(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const mentions: string[] = [];

  // Keywords that often precede product introductions.
  const productKeywords = [
    'launches', 'launch', 'released', 'release', 'introduces',
    'unveils', 'debuts', 'acquires', 'raises', 'announces',
  ];

  // Check if text contains a product keyword.
  const hasKeyword = productKeywords.some((kw) => text.includes(kw));
  if (!hasKeyword) return mentions;

  // Extract capitalized phrases from the original title that likely represent product names.
  const titlePattern = /\b([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+){0,3})\b/g;
  let match: RegExpExecArray | null;
  while ((match = titlePattern.exec(title)) !== null) {
    const mention = match[1].trim();
    // Filter out common non-product words.
    const stopWords = ['AI', 'New', 'The', 'With', 'From', 'For', 'And', 'That', 'This', 'Has', 'Into'];
    if (mention.length > 1 && !stopWords.includes(mention) && !mentions.includes(mention)) {
      mentions.push(mention);
    }
  }

  return mentions;
}

/**
 * Fetches items from a specific AIhot endpoint with timeout.
 *
 * @param endpoint - API endpoint path (e.g., '/api/public/items?mode=selected').
 * @returns Array of AIhotItem objects.
 */
async function fetchAIhotEndpoint(endpoint: string): Promise<AIHotItem[]> {
  const url = `${AIHOT_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`AIhot API returned ${response.status} for ${endpoint}`);
  }

  const data = await response.json();

  // Handle various response shapes: { items: [...] } or direct array.
  const rawItems = Array.isArray(data) ? data : (data.items || []);

  return rawItems.map((item: any): AIHotItem => {
    const title: string = item.title || 'Untitled';
    const description: string | undefined = item.description;

    return {
      id: item.id || `${endpoint}_${Math.random().toString(36).slice(2, 9)}`,
      title,
      description,
      url: item.url || '',
      category: item.category || undefined,
      tags: Array.isArray(item.tags) ? item.tags : undefined,
      publish_date: item.publish_date || undefined,
      source: item.source || undefined,
      createdAt: item.publish_date || undefined,
      productMentions: extractProductMentions(title, description),
    };
  });
}

/**
 * GET handler for /api/sources/aihot
 *
 * Query parameters:
 * - mode: 'selected' or 'all' (default: 'selected')
 * - q: keyword search query
 * - category: filter by category
 *
 * Fetches from AIhot API with mock fallback. Uses Promise.allSettled
 * to fetch both selected and all modes when no specific filters are applied.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters.
    const mode = searchParams.get('mode') || 'selected';
    const query = searchParams.get('q');
    const category = searchParams.get('category');

    // Build endpoint list based on query parameters.
    const endpoints: string[] = [];

    if (query) {
      // Keyword search uses a single endpoint.
      endpoints.push(`/api/public/items?q=${encodeURIComponent(query)}`);
    } else if (category) {
      // Category filter uses selected mode with category param.
      endpoints.push(`/api/public/items?mode=selected&category=${encodeURIComponent(category)}`);
    } else {
      // Default: fetch both selected and all modes for broader coverage.
      endpoints.push(`/api/public/items?mode=selected`);
      if (mode === 'all') {
        endpoints.push(`/api/public/items?mode=all`);
      }
    }

    let allItems: AIHotItem[] = [];
    let anySuccess = false;

    // Fetch from all target endpoints in parallel.
    const results = await Promise.allSettled(
      endpoints.map((ep) => fetchAIhotEndpoint(ep))
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems = allItems.concat(result.value);
        anySuccess = true;
      } else {
        console.warn('AIhot fetch failed:', result.reason);
      }
    }

    // If all requests failed, fall back to mock data.
    if (!anySuccess) {
      console.warn('All AIhot API requests failed; returning mock data.');
      const response: AIHotApiResponse = {
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
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // Deduplicate by id and sort by publish_date descending.
    const seen = new Set<string>();
    const uniqueItems = allItems.filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    uniqueItems.sort((a, b) => {
      const dateA = a.publish_date || a.createdAt || '';
      const dateB = b.publish_date || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });

    const response: AIHotApiResponse = {
      items: uniqueItems,
      total: uniqueItems.length,
      fetchedAt: new Date().toISOString(),
      source: 'aihot',
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('AIhot API route unexpected error:', error);

    // Final safety net: return mock data.
    const response: AIHotApiResponse = {
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

import { NextResponse } from 'next/server';
import type { DevToArticle, DevToApiResponse } from '@/types/devto';

/**
 * Dev.to API tags to fetch AI-related articles from.
 */
const TAGS = ['artificial-intelligence', 'machine-learning'];

/**
 * Mock data used as fallback when Dev.to API is unreachable.
 */
const MOCK_ARTICLES: DevToArticle[] = [
  {
    id: 'mock_devto_1',
    title: 'Building AI-Powered Code Review Agents with LangChain',
    description:
      'A deep dive into creating autonomous code review agents that can analyze pull requests, detect anti-patterns, and suggest improvements using LLMs.',
    url: 'https://dev.to/mock/ai-code-review-agents',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    reactions: 234,
    comments: 45,
    author: 'ai_dev_builder',
    tags: ['ai', 'langchain', 'codereview'],
    source: 'mock',
  },
  {
    id: 'mock_devto_2',
    title: 'Fine-Tuning Open-Source LLMs on Custom Datasets',
    description:
      'Step-by-step guide to fine-tuning LLaMA 3 and Mistral models on domain-specific data using LoRA and QLoRA techniques.',
    url: 'https://dev.to/mock/llm-finetuning-guide',
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    reactions: 567,
    comments: 89,
    author: 'ml_engineer_pro',
    tags: ['machinelearning', 'llm', 'pytorch'],
    coverImage: 'https://example.com/llm-finetune.jpg',
    source: 'mock',
  },
  {
    id: 'mock_devto_3',
    title: 'RAG Architecture: Building Production-Ready AI Search',
    description:
      'How to build a Retrieval-Augmented Generation system that scales, with vector databases, embedding models, and caching strategies.',
    url: 'https://dev.to/mock/rag-production',
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    reactions: 890,
    comments: 123,
    author: 'search_architect',
    tags: ['rag', 'ai', 'search'],
    source: 'mock',
  },
  {
    id: 'mock_devto_4',
    title: 'Multi-Agent AI Systems: From Theory to Implementation',
    description:
      'Exploring multi-agent patterns, coordination protocols, and practical implementations for complex AI workflows.',
    url: 'https://dev.to/mock/multi-agent-systems',
    publishedAt: new Date(Date.now() - 345600000).toISOString(),
    reactions: 445,
    comments: 67,
    author: 'agent_researcher',
    tags: ['ai', 'multiagent', 'architecture'],
    coverImage: 'https://example.com/multi-agent.jpg',
    source: 'mock',
  },
  {
    id: 'mock_devto_5',
    title: 'Deploying LLMs on Edge Devices: A Practical Guide',
    description:
      'Running quantized models on Raspberry Pi and mobile devices using ONNX Runtime and TensorFlow Lite.',
    url: 'https://dev.to/mock/edge-llm-deployment',
    publishedAt: new Date(Date.now() - 432000000).toISOString(),
    reactions: 312,
    comments: 34,
    author: 'edge_ai_dev',
    tags: ['edge', 'llm', 'deployment'],
    source: 'mock',
  },
  {
    id: 'mock_devto_6',
    title: 'Prompt Engineering Best Practices for Production Apps',
    description:
      'Lessons learned from shipping AI features to millions of users: prompt templates, evaluation frameworks, and guardrails.',
    url: 'https://dev.to/mock/prompt-engineering-production',
    publishedAt: new Date(Date.now() - 518400000).toISOString(),
    reactions: 678,
    comments: 91,
    author: 'prompt_crafter',
    tags: ['promptengineering', 'ai', 'bestpractices'],
    source: 'mock',
  },
  {
    id: 'mock_devto_7',
    title: 'Building an AI-Powered Data Pipeline with Apache Airflow',
    description:
      'Integrating LLM inference steps into production data pipelines, with error handling, retry logic, and monitoring.',
    url: 'https://dev.to/mock/ai-data-pipeline',
    publishedAt: new Date(Date.now() - 604800000).toISOString(),
    reactions: 234,
    comments: 28,
    author: 'data_engineer_ai',
    tags: ['data', 'ai', 'airflow'],
    source: 'mock',
  },
  {
    id: 'mock_devto_8',
    title: 'Computer Vision with Transformers: From Zero to Hero',
    description:
      'Using Vision Transformers (ViT) for image classification, object detection, and segmentation tasks.',
    url: 'https://dev.to/mock/vision-transformers',
    publishedAt: new Date(Date.now() - 691200000).toISOString(),
    reactions: 456,
    comments: 56,
    author: 'cv_researcher',
    tags: ['computervision', 'transformers', 'ai'],
    coverImage: 'https://example.com/vision-transformers.jpg',
    source: 'mock',
  },
  {
    id: 'mock_devto_9',
    title: 'AI Safety and Alignment: What Every Developer Should Know',
    description:
      'Understanding AI alignment, reward hacking, and safety measures when building AI-powered applications.',
    url: 'https://dev.to/mock/ai-safety-alignment',
    publishedAt: new Date(Date.now() - 777600000).toISOString(),
    reactions: 789,
    comments: 145,
    author: 'ai_ethics_dev',
    tags: ['ai', 'safety', 'ethics'],
    source: 'mock',
  },
  {
    id: 'mock_devto_10',
    title: 'Open-Source AI Tools Worth Knowing in 2024',
    description:
      'A curated list of the best open-source AI libraries, frameworks, and tools for developers.',
    url: 'https://dev.to/mock/opensource-ai-tools-2024',
    publishedAt: new Date(Date.now() - 864000000).toISOString(),
    reactions: 1023,
    comments: 201,
    author: 'oss_curator',
    tags: ['opensource', 'ai', 'tools'],
    source: 'mock',
  },
];

/**
 * Fetches top articles from a single Dev.to tag.
 *
 * @param tag - Dev.to tag to query (e.g., 'artificial-intelligence').
 * @param perPage - Number of articles to fetch.
 * @returns Array of normalized DevToArticle objects.
 */
async function fetchDevToArticles(
  tag: string,
  perPage: number
): Promise<DevToArticle[]> {
  const url = `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&top=1&per_page=${perPage}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Dev.to API returned ${response.status} for tag: ${tag}`
    );
  }

  const data: any[] = await response.json();

  return data.map((article: any): DevToArticle => ({
    id: String(article.id || `devto_${Math.random().toString(36).slice(2)}`),
    title: article.title || 'Untitled',
    description: article.description || article.body_markdown?.slice(0, 300) || '',
    url: article.url || `https://dev.to/${article.user?.username || 'unknown'}/${article.slug || ''}`,
    publishedAt: article.published_at
      ? new Date(article.published_at).toISOString()
      : new Date().toISOString(),
    reactions: article.public_reactions_count ?? article.positive_reactions_count ?? 0,
    comments: article.comments_count ?? 0,
    author: article.user?.name || article.user?.username || 'anonymous',
    tags: Array.isArray(article.tag_list) ? article.tag_list : [],
    coverImage: article.cover_image || undefined,
    source: 'devto',
  }));
}

/**
 * GET handler for /api/sources/devto
 *
 * Query parameters:
 * - tag: specific tag to query (default: all configured tags)
 * - per_page: number of articles per tag (default: 15, max: 30)
 *
 * Returns top AI/ML articles from Dev.to. Falls back to mock data if
 * Dev.to API is unavailable.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const tagParam = searchParams.get('tag');
  const perPageParam = parseInt(searchParams.get('per_page') || '15', 10);

  // Clamp per_page to valid range.
  const perPage = Math.min(Math.max(perPageParam, 1), 30);

  // Determine which tags to query.
  const tags = tagParam ? [tagParam] : TAGS;

  try {
    // Fetch articles from all tags in parallel.
    const results = await Promise.allSettled(
      tags.map((tag) => fetchDevToArticles(tag, perPage))
    );

    let allArticles: DevToArticle[] = [];
    let anySuccess = false;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allArticles = allArticles.concat(result.value);
        anySuccess = true;
      } else {
        console.warn('Dev.to fetch failed:', result.reason);
      }
    }

    // If every request failed, fall back to mock data.
    if (!anySuccess) {
      console.warn('All Dev.to API requests failed; returning mock data.');
      const response: DevToApiResponse = {
        articles: MOCK_ARTICLES,
        source: 'mock',
        fetchedAt: new Date().toISOString(),
      };
      return NextResponse.json(response, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      });
    }

    // Deduplicate by id and sort by reactions descending.
    const seen = new Set<string>();
    const uniqueArticles = allArticles.filter((article) => {
      if (seen.has(article.id)) return false;
      seen.add(article.id);
      return true;
    });

    uniqueArticles.sort((a, b) => b.reactions - a.reactions);

    const response: DevToApiResponse = {
      articles: uniqueArticles,
      source: 'devto',
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  } catch (error) {
    console.error('Dev.to API unexpected error:', error);

    // Final safety net: return mock data on any unexpected error.
    const response: DevToApiResponse = {
      articles: MOCK_ARTICLES,
      source: 'mock',
      fetchedAt: new Date().toISOString(),
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

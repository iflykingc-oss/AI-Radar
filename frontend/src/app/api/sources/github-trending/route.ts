export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type {
  GitHubTrendingRepo,
  GitHubTrendingApiResponse,
} from '@/types/github-trending';

/**
 * GitHub Search API URL for trending AI repositories.
 * Queries repositories with AI/LLM/ML topics and >500 stars.
 */
const GITHUB_SEARCH_URL =
  'https://api.github.com/search/repositories?q=topic:ai+OR+topic:llm+OR+topic:machine-learning+stars:>500&sort=stars&order=desc&per_page=30';

/**
 * Timeout in milliseconds for GitHub API requests.
 */
const API_TIMEOUT_MS = 10_000;

/**
 * Mock trending AI repos used as fallback when the GitHub API is unavailable.
 */
const MOCK_REPOS: GitHubTrendingRepo[] = [
  {
    id: 'mock-gt-1',
    name: 'openai/openai-agents',
    description:
      'OpenAI Agents SDK — a lightweight framework for building AI agents with tool use, handoffs, and guardrails.',
    url: 'https://github.com/openai/openai-agents',
    stars: 8200,
    forks: 1100,
    language: 'Python',
    topics: ['ai', 'agents', 'openai', 'tool-use'],
    lastUpdated: new Date(Date.now() - 3600000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-gt-2',
    name: 'langchain-ai/langchain',
    description:
      'LangChain is a framework for developing applications powered by large language models with composable components.',
    url: 'https://github.com/langchain-ai/langchain',
    stars: 92000,
    forks: 15000,
    language: 'Python',
    topics: ['llm', 'langchain', 'ai-agents', 'rag'],
    lastUpdated: new Date(Date.now() - 7200000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-gt-3',
    name: 'microsoft/autogen',
    description:
      'AutoGen: Enabling next-generation LLM applications via multi-agent conversation framework.',
    url: 'https://github.com/microsoft/autogen',
    stars: 35000,
    forks: 4800,
    language: 'Python',
    topics: ['ai', 'multi-agent', 'llm', 'microsoft'],
    lastUpdated: new Date(Date.now() - 14400000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-gt-4',
    name: 'run-llama/llama_index',
    description:
      'LlamaIndex is a data framework for building LLM-powered applications with custom data sources.',
    url: 'https://github.com/run-llama/llama_index',
    stars: 34000,
    forks: 5200,
    language: 'Python',
    topics: ['llm', 'rag', 'indexing', 'retrieval'],
    lastUpdated: new Date(Date.now() - 28800000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-gt-5',
    name: 'vllm-project/vllm',
    description:
      'vLLM is a fast and easy-to-use library for LLM inference and serving with PagedAttention.',
    url: 'https://github.com/vllm-project/vllm',
    stars: 27000,
    forks: 3800,
    language: 'Python',
    topics: ['llm', 'inference', 'serving', 'gpu'],
    lastUpdated: new Date(Date.now() - 43200000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-gt-6',
    name: 'ollama/ollama',
    description:
      'Get up and running with Llama 3, Mistral, Gemma, and other large language models locally.',
    url: 'https://github.com/ollama/ollama',
    stars: 120000,
    forks: 8500,
    language: 'Go',
    topics: ['llm', 'local-ai', 'inference', 'open-source'],
    lastUpdated: new Date(Date.now() - 57600000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-gt-7',
    name: 'anthropics/anthropic-sdk-typescript',
    description:
      'TypeScript SDK for the Anthropic Claude API, supporting Messages API, tool use, and streaming.',
    url: 'https://github.com/anthropics/anthropic-sdk-typescript',
    stars: 5600,
    forks: 890,
    language: 'TypeScript',
    topics: ['ai', 'claude', 'anthropic', 'sdk'],
    lastUpdated: new Date(Date.now() - 86400000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-gt-8',
    name: 'pytorch/pytorch',
    description:
      'PyTorch is an open source machine learning framework that accelerates the path from research prototyping to production deployment.',
    url: 'https://github.com/pytorch/pytorch',
    stars: 82000,
    forks: 24000,
    language: 'Python',
    topics: ['machine-learning', 'deep-learning', 'pytorch', 'ai'],
    lastUpdated: new Date(Date.now() - 10800000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-gt-9',
    name: 'huggingface/transformers',
    description:
      'Transformers: state-of-the-art machine learning models for PyTorch, TensorFlow, and JAX.',
    url: 'https://github.com/huggingface/transformers',
    stars: 130000,
    forks: 28000,
    language: 'Python',
    topics: ['machine-learning', 'nlp', 'transformers', 'huggingface'],
    lastUpdated: new Date(Date.now() - 21600000).toISOString(),
    source: 'mock',
  },
  {
    id: 'mock-gt-10',
    name: 'crewaiInc/crewAI',
    description:
      'CrewAI — a cutting-edge framework for orchestrating role-playing autonomous AI agents.',
    url: 'https://github.com/crewaiInc/crewAI',
    stars: 23000,
    forks: 3200,
    language: 'Python',
    topics: ['ai', 'agents', 'crew', 'automation'],
    lastUpdated: new Date(Date.now() - 36000000).toISOString(),
    source: 'mock',
  },
];

/**
 * Fetches trending AI repositories from GitHub Search API with timeout.
 *
 * @returns Array of GitHubTrendingRepo objects.
 */
async function fetchGitHubTrending(): Promise<GitHubTrendingRepo[]> {
  const response = await fetch(GITHUB_SEARCH_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'AI-Radar-App/1.0 (Trending Discovery)',
    },
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`GitHub Search API returned ${response.status}`);
  }

  const data = await response.json();
  const items = data?.items || [];

  if (!Array.isArray(items)) {
    throw new Error('GitHub Search API response items is not an array');
  }

  return items.map((repo: any): GitHubTrendingRepo => {
    const fullName: string = repo.full_name || 'unknown/repo';
    const description: string = repo.description || '';
    const topics: string[] = Array.isArray(repo.topics) ? repo.topics : [];

    return {
      id: `gh-${repo.id || fullName}`,
      name: fullName,
      description,
      url: repo.html_url || `https://github.com/${fullName}`,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      language: repo.language || 'Unknown',
      topics,
      lastUpdated: repo.pushed_at || new Date().toISOString(),
      source: 'github',
    };
  });
}

/**
 * GET handler for /api/sources/github-trending
 *
 * Fetches trending AI/ML repositories from GitHub Search API.
 * Falls back to mock data if the API is unavailable.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '30', 10);
    const limit = Math.min(Math.max(limitParam, 1), 100);

    let items: GitHubTrendingRepo[] = [];
    let source = 'github';

    try {
      items = await fetchGitHubTrending();
      // Sort by stars descending (should already be sorted by API).
      items.sort((a, b) => b.stars - a.stars);
      items = items.slice(0, limit);
    } catch (apiError) {
      console.error('GitHub Trending API error, falling back to mock data:', apiError);
      items = MOCK_REPOS.slice(0, limit);
      source = 'mock';
    }

    const responseBody: GitHubTrendingApiResponse = {
      items,
      total: items.length,
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
    console.error('GitHub Trending API route error:', error);

    // Final safety net: return mock data.
    const responseBody: GitHubTrendingApiResponse = {
      items: MOCK_REPOS,
      total: MOCK_REPOS.length,
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

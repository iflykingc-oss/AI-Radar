export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { NpmPackage, NpmApiPackage, NpmApiResponse, NpmApiEndpointResponse } from '@/types/npm';

/**
 * Timeout in milliseconds for npms.io API requests.
 */
const NPM_TIMEOUT_MS = 10_000;

/**
 * npms.io API URL for searching AI/ML packages.
 */
const NPM_API_URL = 'https://api.npms.io/v2/search';

/**
 * Mock npm AI packages used as fallback when the API is unavailable.
 * Contains 10 realistic AI/ML packages.
 */
const MOCK_PACKAGES: NpmPackage[] = [
  {
    id: 'npm-mock-1',
    name: 'langchain',
    description: 'Building applications with large language models (LLMs) — chains, agents, vector stores, and more.',
    url: 'https://www.npmjs.com/package/langchain',
    version: '0.3.0',
    score: 0.92,
    downloads: 2500000,
    author: 'LangChain',
    source: 'mock',
  },
  {
    id: 'npm-mock-2',
    name: '@anthropic-ai/sdk',
    description: 'Official Node.js SDK for Anthropic Claude API — streaming, tool use, and multi-modal support.',
    url: 'https://www.npmjs.com/package/@anthropic-ai/sdk',
    version: '0.32.0',
    score: 0.88,
    downloads: 1800000,
    author: 'Anthropic',
    source: 'mock',
  },
  {
    id: 'npm-mock-3',
    name: 'openai',
    description: 'Official Node.js library for the OpenAI API — ChatGPT, GPT-4, DALL·E, Whisper, and more.',
    url: 'https://www.npmjs.com/package/openai',
    version: '4.73.0',
    score: 0.91,
    downloads: 5200000,
    author: 'OpenAI',
    source: 'mock',
  },
  {
    id: 'npm-mock-4',
    name: 'ollama',
    description: 'Node.js client for Ollama — run LLMs locally with support for Llama, Mistral, Gemma, and more.',
    url: 'https://www.npmjs.com/package/ollama',
    version: '0.5.9',
    score: 0.85,
    downloads: 980000,
    author: 'Ollama',
    source: 'mock',
  },
  {
    id: 'npm-mock-5',
    name: '@huggingface/inference',
    description: 'Client library for Hugging Face Inference API — access 100k+ models for NLP, vision, and audio tasks.',
    url: 'https://www.npmjs.com/package/@huggingface/inference',
    version: '3.1.0',
    score: 0.83,
    downloads: 720000,
    author: 'Hugging Face',
    source: 'mock',
  },
  {
    id: 'npm-mock-6',
    name: 'transformers.js',
    description: 'Run transformer models directly in the browser — text classification, generation, image recognition, and more.',
    url: 'https://www.npmjs.com/package/@xenova/transformers',
    version: '3.0.0',
    score: 0.87,
    downloads: 650000,
    author: 'Xenova',
    source: 'mock',
  },
  {
    id: 'npm-mock-7',
    name: 'llamaindex',
    description: 'Data framework for LLM applications — connect custom data sources to large language models with RAG pipelines.',
    url: 'https://www.npmjs.com/package/llamaindex',
    version: '0.8.0',
    score: 0.80,
    downloads: 420000,
    author: 'LlamaIndex',
    source: 'mock',
  },
  {
    id: 'npm-mock-8',
    name: '@google/generative-ai',
    description: 'Official Google Generative AI SDK for Node.js — Gemini models with multi-modal capabilities.',
    url: 'https://www.npmjs.com/package/@google/generative-ai',
    version: '0.21.0',
    score: 0.86,
    downloads: 3100000,
    author: 'Google',
    source: 'mock',
  },
  {
    id: 'npm-mock-9',
    name: 'ai',
    description: 'AI SDK by Vercel — unified interface for building AI-powered applications with streaming, tool calls, and more.',
    url: 'https://www.npmjs.com/package/ai',
    version: '4.0.0',
    score: 0.89,
    downloads: 1900000,
    author: 'Vercel',
    source: 'mock',
  },
  {
    id: 'npm-mock-10',
    name: 'chromadb',
    description: 'JavaScript client for Chroma — open-source embedding database for AI applications and vector search.',
    url: 'https://www.npmjs.com/package/chromadb',
    version: '1.9.0',
    score: 0.78,
    downloads: 560000,
    author: 'Chroma',
    source: 'mock',
  },
];

/**
 * Extracts the author name from a package's author field.
 * The author field may be a string or an object with name/email/username.
 *
 * @param pkg - Raw package object from npms.io.
 * @returns Author name string.
 */
function extractAuthor(pkg: NpmApiPackage): string {
  const author = pkg.package.author;
  if (typeof author === 'string') {
    return author;
  }
  if (author && typeof author === 'object') {
    return author.name || author.username || 'unknown';
  }
  if (pkg.package.maintainers && pkg.package.maintainers.length > 0) {
    return pkg.package.maintainers[0].username;
  }
  if (pkg.package.publisher) {
    return pkg.package.publisher.username;
  }
  return 'unknown';
}

/**
 * Transforms a raw npms.io API package into a normalized NpmPackage.
 *
 * @param result - Raw API result object.
 * @returns Normalized NpmPackage object.
 */
function transformPackage(result: NpmApiPackage): NpmPackage {
  const pkg = result.package;
  const name = pkg.name || 'unknown';
  const version = pkg.version || '0.0.0';
  const description = pkg.description || `${name} — AI/ML package on npm`;
  const url = pkg.links?.npm || `https://www.npmjs.com/package/${name}`;
  const author = extractAuthor(result);

  return {
    id: `npm-${name.replace(/[^a-zA-Z0-9-_]/g, '_')}`,
    name,
    description,
    url,
    version,
    score: Math.round((result.score?.final ?? 0) * 100) / 100,
    downloads: 0,
    author,
    source: 'npm',
  };
}

/**
 * GET /api/sources/npm
 *
 * Fetches trending AI/ML packages from npm via the npms.io search API.
 *
 * Query Parameters:
 * - limit: Number of packages to return (default: 20, max: 50)
 * - query: Additional search query appended to the AI keywords (optional)
 * - sort: Sort order — relevance | stars | downloads (default: relevance)
 *
 * On API failure, returns mock data with source: 'mock'.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters.
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(rawLimit, 1), 50);
    const extraQuery = searchParams.get('query') || '';
    const sort = searchParams.get('sort') || 'relevance';

    // Build base search query for AI/ML packages.
    let searchQuery = 'keywords:ai keywords:machine-learning keywords:llm';
    if (extraQuery) {
      searchQuery += ` ${extraQuery}`;
    }

    // Build npms.io API URL.
    const npmUrl = new URL(NPM_API_URL);
    npmUrl.searchParams.set('q', searchQuery);
    npmUrl.searchParams.set('size', String(limit));
    npmUrl.searchParams.set('score', sort === 'stars' ? 'quality' : 'final');

    let packages: NpmPackage[] = [];
    let total = 0;
    let source = 'npm';

    try {
      const response = await fetch(npmUrl.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(NPM_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`npms.io API returned ${response.status}`);
      }

      const data: NpmApiResponse = await response.json();
      packages = data.results.map(transformPackage);
      total = data.total ?? packages.length;
    } catch (apiError) {
      console.error('npm API error, falling back to mock data:', apiError);
      packages = MOCK_PACKAGES.slice(0, limit);
      total = packages.length;
      source = 'mock';
    }

    const responseBody: NpmApiEndpointResponse = {
      packages,
      total,
      fetchedAt: new Date().toISOString(),
      source: source as 'npm' | 'mock',
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
    console.error('npm API route error:', error);
    return NextResponse.json(
      {
        packages: MOCK_PACKAGES,
        total: MOCK_PACKAGES.length,
        fetchedAt: new Date().toISOString(),
        source: 'mock',
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

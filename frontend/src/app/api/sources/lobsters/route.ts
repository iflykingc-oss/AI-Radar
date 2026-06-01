import { NextRequest, NextResponse } from 'next/server';
import type { SourceItem, SourceApiResponse } from '@/types/sources';

/**
 * Lobsters ML/AI tag JSON endpoint URL.
 */
const LOBSTERS_JSON_URL = 'https://lobste.rs/t/machine_learning.json';

/**
 * Lobsters RSS feed URL (fallback).
 */
const LOBSTERS_RSS_URL = 'https://lobste.rs/t/ai/rss';

/**
 * Timeout in milliseconds for Lobsters API requests.
 */
const API_TIMEOUT_MS = 10_000;

/**
 * Mock Lobsters posts used as fallback when the API is unavailable.
 */
const MOCK_POSTS: SourceItem[] = [
  {
    id: 'lob-mock-1',
    title: 'Building a production RAG system: lessons from 6 months in production',
    description: 'After running a RAG-based AI system in production for 6 months, here are the hard-learned lessons about chunking strategies, embedding models, and retrieval optimization.',
    url: 'https://lobste.rs/s/mock1/building_production_rag_system',
    source: 'lobsters',
    publishDate: '2025-01-15T12:00:00Z',
    author: 'rag_engineer',
    score: 142,
    tags: ['rag', 'machine_learning', 'production'],
  },
  {
    id: 'lob-mock-2',
    title: 'Why we switched from PyTorch to JAX for our ML training pipeline',
    description: 'A detailed comparison of PyTorch vs JAX for large-scale model training, including benchmarks, developer experience, and ecosystem maturity.',
    url: 'https://lobste.rs/s/mock2/pytorch_jax_comparison',
    source: 'lobsters',
    publishDate: '2025-01-14T09:30:00Z',
    author: 'jax_fan',
    score: 98,
    tags: ['jax', 'pytorch', 'machine_learning'],
  },
  {
    id: 'lob-mock-3',
    title: 'Open-source alternative to OpenAI embeddings: BGE-M3 benchmarks',
    description: 'Comprehensive benchmarks of BGE-M3 embedding model across multiple languages and tasks, showing competitive performance with OpenAI text-embedding models.',
    url: 'https://lobste.rs/s/mock3/bge_m3_benchmarks',
    source: 'lobsters',
    publishDate: '2025-01-13T15:00:00Z',
    author: 'embeddings_dev',
    score: 76,
    tags: ['embeddings', 'open_source', 'nlp'],
  },
  {
    id: 'lob-mock-4',
    title: 'How we deployed a 70B parameter model on consumer hardware',
    description: 'Step-by-step guide to quantizing and serving a 70B parameter language model using llama.cpp and vLLM on dual RTX 4090 setup.',
    url: 'https://lobste.rs/s/mock4/70b_consumer_deploy',
    source: 'lobsters',
    publishDate: '2025-01-12T11:00:00Z',
    author: 'quant_master',
    score: 210,
    tags: ['llm', 'deployment', 'quantization'],
  },
  {
    id: 'lob-mock-5',
    title: 'The hidden cost of AI APIs: a billing analysis of 10M requests',
    description: 'Detailed cost analysis comparing OpenAI, Anthropic, and self-hosted LLM inference for high-volume production workloads over 6 months.',
    url: 'https://lobste.rs/s/mock5/ai_api_costs',
    source: 'lobsters',
    publishDate: '2025-01-11T08:00:00Z',
    author: 'cost_analyst',
    score: 185,
    tags: ['cost_analysis', 'api', 'llm'],
  },
  {
    id: 'lob-mock-6',
    title: 'Implementing retrieval-augmented generation with vector databases',
    description: 'A practical guide to building RAG systems with Pinecone, Weaviate, and Milvus, including performance comparisons and best practices.',
    url: 'https://lobste.rs/s/mock6/rag_vector_dbs',
    source: 'lobsters',
    publishDate: '2025-01-10T14:30:00Z',
    author: 'vector_db_expert',
    score: 67,
    tags: ['rag', 'vector_database', 'machine_learning'],
  },
  {
    id: 'lob-mock-7',
    title: 'Fine-tuning LLaMA 3 on custom data: a complete walkthrough',
    description: 'End-to-end tutorial on fine-tuning LLaMA 3 using LoRA and QLoRA techniques with custom domain-specific datasets for enterprise applications.',
    url: 'https://lobste.rs/s/mock7/llama3_finetune',
    source: 'lobsters',
    publishDate: '2025-01-09T10:00:00Z',
    author: 'finetune_guru',
    score: 134,
    tags: ['llama', 'fine_tuning', 'lora'],
  },
  {
    id: 'lob-mock-8',
    title: 'Why AI startups are moving from cloud to on-prem GPU clusters',
    description: 'Analysis of the economic and technical reasons behind AI startups building their own GPU infrastructure instead of relying on cloud providers.',
    url: 'https://lobste.rs/s/mock8/on_prem_gpu',
    source: 'lobsters',
    publishDate: '2025-01-08T16:00:00Z',
    author: 'infra_lead',
    score: 89,
    tags: ['infrastructure', 'gpu', 'cloud'],
  },
];

/**
 * Parses a Lobsters JSON response into SourceItem objects.
 *
 * @param stories - Array of raw story objects from Lobsters API.
 * @returns Array of normalized SourceItem objects.
 */
function parseLobstersJson(stories: any[]): SourceItem[] {
  return stories.map((story, index): SourceItem => {
    const title: string = story.title || 'Untitled';
    const url: string = story.url || '';
    const description: string = story.description || story.short_description || '';
    const author: string = story.submitter_user || story.submitter || 'unknown';
    const createdAt: string = story.created_at || new Date().toISOString();
    const score: number = story.score || story.points || 0;
    const commentCount: number = story.comment_count || 0;
    const tags: string[] = Array.isArray(story.tags) ? story.tags : [];
    const lobstersUrl: string = story.url || `https://lobste.rs/s/${story.id || index}`;

    return {
      id: `lob-${story.id || index}`,
      title,
      description,
      url: url || lobstersUrl,
      source: 'lobsters',
      publishDate: createdAt,
      author,
      score,
      tags: tags.length > 0 ? tags : undefined,
    };
  });
}

/**
 * Fetches stories from Lobsters JSON API with timeout.
 *
 * @returns Array of SourceItem objects.
 */
async function fetchLobstersJson(): Promise<SourceItem[]> {
  const response = await fetch(LOBSTERS_JSON_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Lobsters JSON API returned ${response.status}`);
  }

  const stories = await response.json();
  if (!Array.isArray(stories)) {
    throw new Error('Lobsters JSON response is not an array');
  }

  return parseLobstersJson(stories);
}

/**
 * GET handler for /api/sources/lobsters
 *
 * Fetches AI/ML-related posts from Lobsters community.
 * Falls back to mock data if the API is unavailable.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(limitParam, 1), 50);

    let items: SourceItem[] = [];
    let source = 'lobsters';

    try {
      items = await fetchLobstersJson();
      // Sort by score descending.
      items.sort((a, b) => (b.score || 0) - (a.score || 0));
      items = items.slice(0, limit);
    } catch (apiError) {
      console.error('Lobsters API error, falling back to mock data:', apiError);
      items = MOCK_POSTS.slice(0, limit);
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
    console.error('Lobsters API route error:', error);

    // Final safety net: return mock data.
    const responseBody: SourceApiResponse = {
      items: MOCK_POSTS,
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

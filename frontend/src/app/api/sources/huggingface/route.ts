export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { HuggingFaceModel, HuggingFaceApiModel, HuggingFaceApiResponse } from '@/types/huggingface';

/**
 * Timeout in milliseconds for Hugging Face API requests.
 */
const HF_TIMEOUT_MS = 10_000;

/**
 * Hugging Face API URL for fetching trending models.
 */
const HF_API_URL = 'https://huggingface.co/api/models';

/**
 * Mock Hugging Face models used as fallback when the API is unavailable.
 * Contains 10 realistic trending AI models.
 */
const MOCK_MODELS: HuggingFaceModel[] = [
  {
    id: 'mock-hf-1',
    name: 'meta-llama/Llama-3.1-70B-Instruct',
    author: 'meta-llama',
    description: 'Llama 3.1 70B Instruct — Open-source large language model optimized for dialogue use cases with advanced reasoning capabilities.',
    url: 'https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct',
    likes: 12450,
    trendingScore: 98.5,
    tags: ['transformers', 'pytorch', 'safetensors', 'text-generation', 'llama'],
    lastModified: '2025-01-15T08:00:00.000Z',
    source: 'mock',
  },
  {
    id: 'mock-hf-2',
    name: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
    author: 'mistralai',
    description: 'Mixtral 8x22B Instruct — Sparse mixture of experts model with 141B total parameters, delivering strong performance with efficient inference.',
    url: 'https://huggingface.co/mistralai/Mixtral-8x22B-Instruct-v0.1',
    likes: 8920,
    trendingScore: 95.2,
    tags: ['transformers', 'pytorch', 'safetensors', 'text-generation', 'moe'],
    lastModified: '2025-01-14T12:30:00.000Z',
    source: 'mock',
  },
  {
    id: 'mock-hf-3',
    name: 'stabilityai/stable-diffusion-xl-base-1.0',
    author: 'stabilityai',
    description: 'Stable Diffusion XL — State-of-the-art image generation model producing high-resolution images from text prompts.',
    url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0',
    likes: 15230,
    trendingScore: 92.8,
    tags: ['diffusers', 'stable-diffusion', 'stable-diffusion-diffusers', 'text-to-image'],
    lastModified: '2025-01-13T09:15:00.000Z',
    source: 'mock',
  },
  {
    id: 'mock-hf-4',
    name: 'Qwen/Qwen2.5-72B-Instruct',
    author: 'Qwen',
    description: 'Qwen 2.5 72B Instruct — Advanced multilingual LLM with strong performance on math, coding, and reasoning benchmarks.',
    url: 'https://huggingface.co/Qwen/Qwen2.5-72B-Instruct',
    likes: 7650,
    trendingScore: 90.1,
    tags: ['transformers', 'pytorch', 'safetensors', 'text-generation', 'qwen'],
    lastModified: '2025-01-12T14:00:00.000Z',
    source: 'mock',
  },
  {
    id: 'mock-hf-5',
    name: 'deepseek-ai/DeepSeek-V3',
    author: 'deepseek-ai',
    description: 'DeepSeek V3 — 671B parameter Mixture-of-Experts model with 37B active parameters, delivering competitive performance at low inference cost.',
    url: 'https://huggingface.co/deepseek-ai/DeepSeek-V3',
    likes: 11200,
    trendingScore: 88.7,
    tags: ['transformers', 'pytorch', 'safetensors', 'text-generation', 'moe'],
    lastModified: '2025-01-11T10:45:00.000Z',
    source: 'mock',
  },
  {
    id: 'mock-hf-6',
    name: 'google/gemma-2-27b-it',
    author: 'google',
    description: 'Gemma 2 27B IT — Open-weight instruction-tuned model based on Google Gemini research, optimized for helpful and safe interactions.',
    url: 'https://huggingface.co/google/gemma-2-27b-it',
    likes: 6340,
    trendingScore: 85.3,
    tags: ['transformers', 'pytorch', 'safetensors', 'text-generation', 'gemma'],
    lastModified: '2025-01-10T16:20:00.000Z',
    source: 'mock',
  },
  {
    id: 'mock-hf-7',
    name: 'black-forest-labs/FLUX.1-dev',
    author: 'black-forest-labs',
    description: 'FLUX.1 dev — Advanced text-to-image diffusion model with exceptional prompt adherence and image quality.',
    url: 'https://huggingface.co/black-forest-labs/FLUX.1-dev',
    likes: 9870,
    trendingScore: 83.9,
    tags: ['diffusers', 'text-to-image', 'flux', 'safetensors'],
    lastModified: '2025-01-09T08:00:00.000Z',
    source: 'mock',
  },
  {
    id: 'mock-hf-8',
    name: 'anthropic/claude-3-5-sonnet',
    author: 'anthropic',
    description: 'Claude 3.5 Sonnet — Anthropic model with industry-leading vision and coding capabilities.',
    url: 'https://huggingface.co/anthropic/claude-3-5-sonnet',
    likes: 5430,
    trendingScore: 81.2,
    tags: ['text-generation', 'claude', 'vision'],
    lastModified: '2025-01-08T11:30:00.000Z',
    source: 'mock',
  },
  {
    id: 'mock-hf-9',
    name: 'openai/whisper-large-v3',
    author: 'openai',
    description: 'Whisper Large V3 — Robust speech recognition model supporting multilingual transcription and translation.',
    url: 'https://huggingface.co/openai/whisper-large-v3',
    likes: 13560,
    trendingScore: 78.6,
    tags: ['transformers', 'pytorch', 'automatic-speech-recognition', 'whisper'],
    lastModified: '2025-01-07T13:00:00.000Z',
    source: 'mock',
  },
  {
    id: 'mock-hf-10',
    name: 'NousResearch/Hermes-3-Llama-3.1-70B',
    author: 'NousResearch',
    description: 'Hermes 3 — Open-source instruction-tuned model based on Llama 3.1, optimized for agentic workflows and tool use.',
    url: 'https://huggingface.co/NousResearch/Hermes-3-Llama-3.1-70B',
    likes: 4210,
    trendingScore: 75.4,
    tags: ['transformers', 'pytorch', 'safetensors', 'text-generation', 'hermes'],
    lastModified: '2025-01-06T10:00:00.000Z',
    source: 'mock',
  },
];

/**
 * Transforms a raw Hugging Face API model into a normalized HuggingFaceModel.
 *
 * @param apiModel - Raw API model object.
 * @returns Normalized HuggingFaceModel object.
 */
function transformModel(apiModel: HuggingFaceApiModel): HuggingFaceModel {
  const modelId = apiModel.id || apiModel._id || 'unknown';
  const nameParts = modelId.split('/');
  const author = apiModel.author || nameParts[0] || 'unknown';
  const name = nameParts.length > 1 ? nameParts.slice(1).join('/') : modelId;

  return {
    id: `hf-${modelId.replace(/[^a-zA-Z0-9-_]/g, '_')}`,
    name: modelId,
    author,
    description: apiModel.description || `${modelId} — AI model on Hugging Face`,
    url: `https://huggingface.co/${modelId}`,
    likes: apiModel.likes ?? 0,
    trendingScore: apiModel.trendingScore ?? 0,
    tags: apiModel.tags || [],
    lastModified: apiModel.lastModified
      ? new Date(apiModel.lastModified).toISOString()
      : new Date().toISOString(),
    source: 'huggingface',
  };
}

/**
 * GET /api/sources/huggingface
 *
 * Fetches trending AI models from Hugging Face API.
 *
 * Query Parameters:
 * - limit: Number of models to return (default: 20, max: 50)
 * - pipelineTag: Filter by pipeline tag (e.g., text-generation, text-to-image)
 *
 * On API failure, returns mock data with source: 'mock'.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters.
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(rawLimit, 1), 50);
    const pipelineTag = searchParams.get('pipelineTag');

    // Build Hugging Face API URL.
    const hfUrl = new URL(HF_API_URL);
    hfUrl.searchParams.set('sort', 'trending');
    hfUrl.searchParams.set('limit', String(limit));
    hfUrl.searchParams.set('direction', '-1');

    if (pipelineTag) {
      hfUrl.searchParams.set('filter', pipelineTag);
    }

    let models: HuggingFaceModel[] = [];
    let total = 0;
    let source = 'huggingface';

    try {
      const response = await fetch(hfUrl.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(HF_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API returned ${response.status}`);
      }

      const data: HuggingFaceApiModel[] = await response.json();
      models = data.map(transformModel);
      total = models.length;
    } catch (apiError) {
      console.error('Hugging Face API error, falling back to mock data:', apiError);
      models = MOCK_MODELS.slice(0, limit);
      total = models.length;
      source = 'mock';
    }

    const responseBody: HuggingFaceApiResponse = {
      models,
      total,
      fetchedAt: new Date().toISOString(),
      source: source as 'huggingface' | 'mock',
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
    console.error('Hugging Face API route error:', error);
    return NextResponse.json(
      {
        models: MOCK_MODELS,
        total: MOCK_MODELS.length,
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

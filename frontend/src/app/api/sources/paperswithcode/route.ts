export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Normalized Papers With Code paper shape.
 */
interface PwcPaper {
  id: string;
  title: string;
  abstract: string;
  url: string;
  repoUrl: string | null;
  publishDate: string;
  source: 'paperswithcode' | 'mock';
}

/**
 * Raw paper structure from the Papers With Code API.
 */
interface PwcApiResult {
  id?: string;
  title?: string;
  abstract?: string | null;
  url_path?: string;
  publication_date?: string | null;
  repository?: { url?: string } | null;
}

/**
 * Raw response structure from the Papers With Code API.
 */
interface PwcApiResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: PwcApiResult[];
}

/**
 * Mock PWC papers used as fallback when the API is unavailable.
 */
const MOCK_PAPERS: PwcPaper[] = [
  {
    id: 'pwc-mock-1',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models',
    abstract: 'We propose Low-Rank Adaptation (LoRA), which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture.',
    url: 'https://paperswithcode.com/paper/lora-low-rank-adaptation',
    repoUrl: 'https://github.com/microsoft/LoRA',
    publishDate: new Date(Date.now() - 86400000).toISOString(),
    source: 'mock',
  },
  {
    id: 'pwc-mock-2',
    title: 'Attention Is All You Need',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.',
    url: 'https://paperswithcode.com/paper/attention-is-all-you-need',
    repoUrl: 'https://github.com/tensorflow/tensor2tensor',
    publishDate: new Date(Date.now() - 172800000).toISOString(),
    source: 'mock',
  },
  {
    id: 'pwc-mock-3',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    abstract: 'We introduce BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations.',
    url: 'https://paperswithcode.com/paper/bert-pre-training-of-deep',
    repoUrl: 'https://github.com/google-research/bert',
    publishDate: new Date(Date.now() - 259200000).toISOString(),
    source: 'mock',
  },
  {
    id: 'pwc-mock-4',
    title: 'DALL-E 2: Hierarchical Text-Conditional Image Generation',
    abstract: 'We present a system that uses natural language descriptions to generate novel images. Our approach leverages a CLIP model to learn text-image correspondence and a diffusion model for high-fidelity generation.',
    url: 'https://paperswithcode.com/paper/dall-e-2-hierarchical',
    repoUrl: null,
    publishDate: new Date(Date.now() - 345600000).toISOString(),
    source: 'mock',
  },
  {
    id: 'pwc-mock-5',
    title: 'Chain-of-Thought Prompting Elicits Reasoning in LLMs',
    abstract: 'We explore how generating a chain of thought — a series of intermediate reasoning steps — significantly improves the ability of large language models to perform complex reasoning tasks.',
    url: 'https://paperswithcode.com/paper/chain-of-thought-prompting',
    repoUrl: 'https://github.com/google-research/chain-of-thought',
    publishDate: new Date(Date.now() - 432000000).toISOString(),
    source: 'mock',
  },
  {
    id: 'pwc-mock-6',
    title: 'Stable Diffusion: High-Resolution Image Synthesis with Latent Diffusion Models',
    abstract: 'We introduce latent diffusion models, which learn to generate images by progressively denoising a latent representation, enabling high-quality image synthesis with significantly reduced compute requirements.',
    url: 'https://paperswithcode.com/paper/stable-diffusion',
    repoUrl: 'https://github.com/CompVis/stable-diffusion',
    publishDate: new Date(Date.now() - 518400000).toISOString(),
    source: 'mock',
  },
  {
    id: 'pwc-mock-7',
    title: 'Vision Transformers (ViT): An Image is Worth 16x16 Words',
    abstract: 'We show that a pure transformer model can achieve excellent results when pre-trained on large datasets and applied to image recognition tasks, outperforming state-of-the-art convolutional networks.',
    url: 'https://paperswithcode.com/paper/vision-transformer',
    repoUrl: 'https://github.com/google-research/vision_transformer',
    publishDate: new Date(Date.now() - 604800000).toISOString(),
    source: 'mock',
  },
  {
    id: 'pwc-mock-8',
    title: 'GPT-4 Technical Report',
    abstract: 'We report the development and evaluation of GPT-4, a large-scale multimodal model capable of accepting image and text inputs and producing text outputs with human-level performance on many benchmarks.',
    url: 'https://paperswithcode.com/paper/gpt-4-technical-report',
    repoUrl: null,
    publishDate: new Date(Date.now() - 691200000).toISOString(),
    source: 'mock',
  },
  {
    id: 'pwc-mock-9',
    title: 'RLHF: Training Language Models with Human Feedback',
    abstract: 'We demonstrate that fine-tuning language models with human feedback using reinforcement learning from human feedback (RLHF) significantly improves alignment with human preferences.',
    url: 'https://paperswithcode.com/paper/training-language-models-human-feedback',
    repoUrl: 'https://github.com/openai/lm-human-preferences',
    publishDate: new Date(Date.now() - 777600000).toISOString(),
    source: 'mock',
  },
  {
    id: 'pwc-mock-10',
    title: 'Segment Anything Model (SAM)',
    abstract: 'We introduce the Segment Anything (SA) project: a new task, model, and dataset for promptable image segmentation. Our model can produce valid segmentation masks for any object in any image.',
    url: 'https://paperswithcode.com/paper/segment-anything',
    repoUrl: 'https://github.com/facebookresearch/segment-anything',
    publishDate: new Date(Date.now() - 864000000).toISOString(),
    source: 'mock',
  },
];

/**
 * Transforms a raw PWC API result into a normalized PwcPaper.
 *
 * @param result - Raw API result object.
 * @param index - Array index for fallback ID generation.
 * @returns Normalized PwcPaper object.
 */
function transformResult(result: PwcApiResult, index: number): PwcPaper {
  const title = result.title || 'Untitled Paper';
  const abstract = result.abstract || '';
  const urlPath = result.url_path || '';
  const url = urlPath.startsWith('http')
    ? urlPath
    : `https://paperswithcode.com${urlPath.startsWith('/') ? urlPath : `/${urlPath}`}`;

  return {
    id: result.id || `pwc-${index}`,
    title,
    abstract,
    url,
    repoUrl: result.repository?.url || null,
    publishDate: result.publication_date
      ? new Date(result.publication_date).toISOString()
      : new Date().toISOString(),
    source: 'paperswithcode',
  };
}

/**
 * GET /api/sources/paperswithcode
 *
 * Fetches papers from the Papers With Code API.
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Number of papers per page (default: 20, max: 50)
 *
 * On API failure, returns mock data with source: 'mock'.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters.
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const page = Math.max(rawPage, 1);
    const rawPageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const pageSize = Math.min(Math.max(rawPageSize, 1), 50);

    // Build Papers With Code API URL.
    const pwcUrl = new URL('https://paperswithcode.com/api/v1/papers/');
    pwcUrl.searchParams.set('page', String(page));
    pwcUrl.searchParams.set('page_size', String(pageSize));

    let papers: PwcPaper[] = [];
    let total = 0;
    let source: 'paperswithcode' | 'mock' = 'paperswithcode';

    try {
      const response = await fetch(pwcUrl.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        // Abort if PWC takes longer than 10 seconds.
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Papers With Code API returned ${response.status}`);
      }

      const data: PwcApiResponse = await response.json();
      const results = data.results || [];
      papers = results.map((result, index) => transformResult(result, index));
      total = data.count ?? papers.length;
    } catch (apiError) {
      console.error('Papers With Code API error, falling back to mock data:', apiError);
      papers = MOCK_PAPERS.slice(0, pageSize);
      total = papers.length;
      source = 'mock';
    }

    const responseBody = {
      papers,
      total,
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
    console.error('Papers With Code API route error:', error);
    return NextResponse.json(
      {
        papers: MOCK_PAPERS,
        total: MOCK_PAPERS.length,
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

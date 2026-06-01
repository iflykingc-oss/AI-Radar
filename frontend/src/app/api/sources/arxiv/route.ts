import { NextRequest, NextResponse } from 'next/server';

/**
 * Normalized arXiv paper shape.
 */
interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  url: string;
  authors: string[];
  publishDate: string;
  categories: string[];
  source: 'arxiv' | 'mock';
}

/**
 * Mock arXiv papers used as fallback when the arXiv API is unavailable.
 */
const MOCK_PAPERS: ArxivPaper[] = [
  {
    id: '2401.00001',
    title: 'Large Language Models for Code Generation: A Survey',
    summary: 'A comprehensive survey of large language models applied to code generation tasks, covering architectures, training strategies, and evaluation benchmarks.',
    url: 'https://arxiv.org/abs/2401.00001',
    authors: ['Zhang, Wei', 'Li, Ming', 'Wang, Hao'],
    publishDate: new Date(Date.now() - 86400000).toISOString(),
    categories: ['cs.AI', 'cs.SE'],
    source: 'mock',
  },
  {
    id: '2401.00002',
    title: 'Scaling Laws for Multimodal Foundation Models',
    summary: 'This paper investigates scaling laws for multimodal foundation models that jointly process text, images, and audio inputs.',
    url: 'https://arxiv.org/abs/2401.00002',
    authors: ['Chen, Yuxuan', 'Patel, Priya'],
    publishDate: new Date(Date.now() - 172800000).toISOString(),
    categories: ['cs.LG', 'cs.CV'],
    source: 'mock',
  },
  {
    id: '2401.00003',
    title: 'Efficient Fine-Tuning Strategies for LLMs',
    summary: 'We propose parameter-efficient fine-tuning strategies that achieve comparable performance to full fine-tuning with less than 1% of trainable parameters.',
    url: 'https://arxiv.org/abs/2401.00003',
    authors: ['Kim, Joon', 'Smith, Alice'],
    publishDate: new Date(Date.now() - 259200000).toISOString(),
    categories: ['cs.CL', 'cs.LG'],
    source: 'mock',
  },
  {
    id: '2401.00004',
    title: 'Retrieval-Augmented Generation: A Comprehensive Review',
    summary: 'A systematic review of retrieval-augmented generation methods for improving factual accuracy in large language model outputs.',
    url: 'https://arxiv.org/abs/2401.00004',
    authors: ['Liu, Yang', 'Garcia, Maria', 'Tanaka, Kenji'],
    publishDate: new Date(Date.now() - 345600000).toISOString(),
    categories: ['cs.AI', 'cs.IR'],
    source: 'mock',
  },
  {
    id: '2401.00005',
    title: 'Self-Play Reinforcement Learning for Multi-Agent Systems',
    summary: 'We introduce a self-play reinforcement learning framework that enables multi-agent systems to develop cooperative and competitive strategies.',
    url: 'https://arxiv.org/abs/2401.00005',
    authors: ['Anderson, Robert'],
    publishDate: new Date(Date.now() - 432000000).toISOString(),
    categories: ['cs.AI', 'cs.MA'],
    source: 'mock',
  },
  {
    id: '2401.00006',
    title: 'Vision-Language Pretraining with Contrastive Learning',
    summary: 'A novel contrastive learning approach for vision-language pretraining that achieves state-of-the-art results on downstream multimodal tasks.',
    url: 'https://arxiv.org/abs/2401.00006',
    authors: ['Zhao, Lin', 'Brown, Sarah'],
    publishDate: new Date(Date.now() - 518400000).toISOString(),
    categories: ['cs.CV', 'cs.CL'],
    source: 'mock',
  },
  {
    id: '2401.00007',
    title: 'Transformer Architecture Variants: A Taxonomy',
    summary: 'This paper provides a comprehensive taxonomy of transformer architecture variants, analyzing their computational complexity and practical performance.',
    url: 'https://arxiv.org/abs/2401.00007',
    authors: ['Mueller, Hans', 'Dubois, Claire'],
    publishDate: new Date(Date.now() - 604800000).toISOString(),
    categories: ['cs.LG', 'cs.AI'],
    source: 'mock',
  },
  {
    id: '2401.00008',
    title: 'Prompt Engineering Best Practices for LLM Applications',
    summary: 'A practical guide to prompt engineering techniques that maximize the effectiveness of large language model applications in real-world scenarios.',
    url: 'https://arxiv.org/abs/2401.00008',
    authors: ['Thompson, Emily'],
    publishDate: new Date(Date.now() - 691200000).toISOString(),
    categories: ['cs.CL', 'cs.HC'],
    source: 'mock',
  },
  {
    id: '2401.00009',
    title: 'Adversarial Robustness in Deep Learning: Recent Advances',
    summary: 'We survey recent advances in adversarial robustness for deep learning models, covering defense mechanisms and attack strategies.',
    url: 'https://arxiv.org/abs/2401.00009',
    authors: ['Nakamura, Yuki', 'Rossi, Marco'],
    publishDate: new Date(Date.now() - 777600000).toISOString(),
    categories: ['cs.LG', 'cs.CR'],
    source: 'mock',
  },
  {
    id: '2401.00010',
    title: 'Graph Neural Networks for Knowledge Graph Completion',
    summary: 'A novel graph neural network architecture for knowledge graph completion that leverages structural and semantic information.',
    url: 'https://arxiv.org/abs/2401.00010',
    authors: ['Ivanov, Dmitri', 'Park, Soo-Yeon'],
    publishDate: new Date(Date.now() - 864000000).toISOString(),
    categories: ['cs.AI', 'cs.LG'],
    source: 'mock',
  },
];

/**
 * Parses an arXiv Atom XML response using regex-based extraction.
 *
 * Extracts title, summary, authors, published date, URL, and categories
 * from each <entry> element without external XML parsing dependencies.
 *
 * @param xmlText - Raw Atom XML response string from arXiv API.
 * @returns Array of normalized ArxivPaper objects.
 */
function parseArxivXml(xmlText: string): ArxivPaper[] {
  const papers: ArxivPaper[] = [];

  // Extract individual <entry> blocks.
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let entryMatch: RegExpExecArray | null;

  while ((entryMatch = entryRegex.exec(xmlText)) !== null) {
    const entryContent = entryMatch[1];

    // Extract arXiv ID from the id element.
    const idMatch = entryContent.match(/<id>(.*?)<\/id>/);
    const fullId = idMatch ? idMatch[1] : '';
    // Extract the numeric part (e.g., "2401.12345v1" -> "2401.12345v1").
    const arxivId = fullId.split('/abs/')[1] || fullId;

    // Extract title (strip whitespace and newlines).
    const titleMatch = entryContent.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const title = titleMatch
      ? titleMatch[1].replace(/\s+/g, ' ').trim()
      : 'Untitled';

    // Extract summary.
    const summaryMatch = entryContent.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    const summary = summaryMatch
      ? summaryMatch[1].replace(/\s+/g, ' ').trim()
      : '';

    // Extract published date.
    const publishedMatch = entryContent.match(/<published>(.*?)<\/published>/);
    const publishDate = publishedMatch
      ? new Date(publishedMatch[1]).toISOString()
      : new Date().toISOString();

    // Extract authors.
    const authors: string[] = [];
    const authorRegex = /<author>\s*<name>(.*?)<\/name>\s*<\/author>/g;
    let authorMatch: RegExpExecArray | null;
    while ((authorMatch = authorRegex.exec(entryContent)) !== null) {
      authors.push(authorMatch[1].trim());
    }

    // Extract categories (arXiv tags).
    const categories: string[] = [];
    const categoryRegex = /<category\s+term="([^"]+)"/g;
    let categoryMatch: RegExpExecArray | null;
    while ((categoryMatch = categoryRegex.exec(entryContent)) !== null) {
      categories.push(categoryMatch[1]);
    }

    // Build arXiv URL.
    const url = fullId.startsWith('http') ? fullId : `https://arxiv.org/abs/${arxivId}`;

    papers.push({
      id: arxivId || `arxiv-${papers.length}`,
      title,
      summary,
      url,
      authors,
      publishDate,
      categories,
      source: 'arxiv',
    });
  }

  return papers;
}

/**
 * GET /api/sources/arxiv
 *
 * Fetches AI/ML papers from the arXiv API (Atom XML format).
 *
 * Query Parameters:
 * - query: Search query string (default: "all:ai AND all:llm")
 * - maxResults: Number of papers to return (default: 20, max: 50)
 * - sortBy: Sort field — submittedDate | lastUpdatedDate | relevance (default: submittedDate)
 * - sortOrder: Sort direction — ascending | descending (default: descending)
 *
 * Uses regex-based XML parsing (no external deps). Falls back to mock data on failure.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters.
    const query = searchParams.get('query') || 'all:ai AND all:llm';
    const rawMaxResults = parseInt(searchParams.get('maxResults') || '20', 10);
    const maxResults = Math.min(Math.max(rawMaxResults, 1), 50);
    const sortBy = searchParams.get('sortBy') || 'submittedDate';
    const sortOrder = searchParams.get('sortOrder') || 'descending';

    // Build arXiv API URL.
    const arxivUrl = new URL('http://export.arxiv.org/api/query');
    arxivUrl.searchParams.set('search_query', query);
    arxivUrl.searchParams.set('sortBy', sortBy);
    arxivUrl.searchParams.set('sortOrder', sortOrder);
    arxivUrl.searchParams.set('max_results', String(maxResults));

    let papers: ArxivPaper[] = [];
    let source: 'arxiv' | 'mock' = 'arxiv';

    try {
      const response = await fetch(arxivUrl.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/xml',
        },
        // Abort if arXiv takes longer than 10 seconds.
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`arXiv API returned ${response.status}`);
      }

      const xmlText = await response.text();
      papers = parseArxivXml(xmlText);

      if (papers.length === 0) {
        throw new Error('No entries parsed from arXiv XML');
      }
    } catch (apiError) {
      console.error('arXiv API error, falling back to mock data:', apiError);
      papers = MOCK_PAPERS.slice(0, maxResults);
      source = 'mock';
    }

    const responseBody = {
      papers,
      total: papers.length,
      query,
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
    console.error('arXiv API route error:', error);
    return NextResponse.json(
      {
        papers: MOCK_PAPERS,
        total: MOCK_PAPERS.length,
        query: 'all:ai AND all:llm',
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

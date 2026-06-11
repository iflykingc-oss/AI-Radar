import type {
  CategoriesData,
  CategoryItem,
  LaunchItem,
  LaunchRange,
  PaginatedData,
  TrendItem,
  TrendRange,
} from './types';

export async function withSupabaseFallbackTimeout<T>(
  promise: PromiseLike<T>,
  label: string,
  timeoutMs: number = Number(process.env.AI_RADAR_SUPABASE_TIMEOUT_MS ?? 2500),
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve({
          data: null,
          error: { message: `${label} timed out after ${timeoutMs}ms; using fallback` },
          count: null,
        } as T);
      }, timeoutMs);
    }),
  ]);
}

const nowIso = () => new Date().toISOString();
const daysAgoIso = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};
const hoursAgoIso = (hours: number) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

export const FALLBACK_CATEGORIES: CategoryItem[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'ai-agents',
    name_en: 'AI Agents',
    name_zh: 'AI 智能体',
    description: 'Agent frameworks, autonomous workflows, and AI employees for operational teams.',
    parent_id: null,
    product_count: 38,
    hot_score: 94,
    display_order: 1,
    icon: 'chat',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'developer-tools',
    name_en: 'Developer Tools',
    name_zh: '开发者工具',
    description: 'Coding copilots, evaluation tools, API platforms, and model operations.',
    parent_id: null,
    product_count: 46,
    hot_score: 91,
    display_order: 2,
    icon: 'code',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    slug: 'ai-video',
    name_en: 'AI Video',
    name_zh: 'AI 视频',
    description: 'Text-to-video, avatar generation, editing assistants, and short-form production.',
    parent_id: null,
    product_count: 29,
    hot_score: 86,
    display_order: 3,
    icon: 'video',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    slug: 'enterprise-search',
    name_en: 'Enterprise Search',
    name_zh: '企业知识搜索',
    description: 'RAG, internal knowledge assistants, data connectors, and secure retrieval platforms.',
    parent_id: null,
    product_count: 24,
    hot_score: 82,
    display_order: 4,
    icon: 'text',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    slug: 'multimodal-creation',
    name_en: 'Multimodal Creation',
    name_zh: '多模态创作',
    description: 'Image, audio, 3D, and mixed-media creation tools for product and marketing teams.',
    parent_id: null,
    product_count: 31,
    hot_score: 79,
    display_order: 5,
    icon: 'image',
  },
];

export function getFallbackCategories(params: {
  parentId?: string | null;
  includeEmpty?: boolean;
  orderBy?: 'display_order' | 'hot_score' | 'product_count';
  lang?: 'en' | 'zh';
} = {}): CategoriesData {
  const { parentId, includeEmpty = false, orderBy = 'display_order', lang = 'en' } = params;
  let items = FALLBACK_CATEGORIES.filter((item) => {
    if (parentId) return item.parent_id === parentId;
    if (!includeEmpty && item.product_count <= 0) return false;
    return true;
  });

  items = [...items].sort((a, b) => {
    if (orderBy === 'display_order') return a.display_order - b.display_order;
    return b[orderBy] - a[orderBy] || a.display_order - b.display_order;
  });

  return {
    items: items.map((item) => ({
      ...item,
      name_zh: lang === 'zh' ? item.name_zh : item.name_zh,
    })),
    total: items.length,
  };
}

function makeFallbackLaunches(): LaunchItem[] {
  return [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      product_id: '90000000-0000-4000-8000-000000000001',
      product_slug: 'cursor-agents',
      product_name: 'Cursor Agents',
      product_logo_url: null,
      source: 'github',
      source_url: 'https://github.com',
      event_type: 'major_update',
      title: 'Cursor-style agent workflows move from autocomplete to task execution',
      body: 'Developer tooling is shifting toward repo-aware agents that can plan, edit, test, and summarize changes end-to-end.',
      author: 'AI Radar fallback feed',
      engagement: { stars: 1840, comments: 126 },
      detected_at: hoursAgoIso(3),
      event_at: hoursAgoIso(4),
      confidence: 0.92,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      product_id: '90000000-0000-4000-8000-000000000002',
      product_slug: 'runway-gen-video',
      product_name: 'Runway Gen Video',
      product_logo_url: null,
      source: 'producthunt',
      source_url: 'https://www.producthunt.com',
      event_type: 'launch',
      title: 'AI video tools push toward controllable product demos',
      body: 'New launches emphasize storyboard control, brand-safe outputs, and faster iteration for growth teams.',
      author: 'AI Radar fallback feed',
      engagement: { upvotes: 642, comments: 88 },
      detected_at: hoursAgoIso(9),
      event_at: hoursAgoIso(10),
      confidence: 0.88,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      product_id: '90000000-0000-4000-8000-000000000003',
      product_slug: 'ragstack-cloud',
      product_name: 'RAGStack Cloud',
      product_logo_url: null,
      source: 'hackernews',
      source_url: 'https://news.ycombinator.com',
      event_type: 'open_source',
      title: 'Enterprise RAG stacks converge on evaluation and governance',
      body: 'Teams are asking less for demos and more for traceability, access control, regression tests, and measurable answer quality.',
      author: 'AI Radar fallback feed',
      engagement: { comments: 74 },
      detected_at: hoursAgoIso(18),
      event_at: hoursAgoIso(19),
      confidence: 0.84,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      product_id: '90000000-0000-4000-8000-000000000004',
      product_slug: 'hf-small-models',
      product_name: 'HF Small Models',
      product_logo_url: null,
      source: 'huggingface',
      source_url: 'https://huggingface.co/models',
      event_type: 'milestone',
      title: 'Small open models gain traction for edge and private deployments',
      body: 'Quantized multimodal and coding models are increasingly positioned as cost and privacy alternatives to large hosted APIs.',
      author: 'AI Radar fallback feed',
      engagement: { likes: 310 },
      detected_at: daysAgoIso(2),
      event_at: daysAgoIso(2),
      confidence: 0.81,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
      product_id: '90000000-0000-4000-8000-000000000005',
      product_slug: 'arxiv-agent-benchmark',
      product_name: 'Agent Benchmark Suite',
      product_logo_url: null,
      source: 'arxiv',
      source_url: 'https://arxiv.org',
      event_type: 'milestone',
      title: 'Agent benchmarks focus on long-horizon reliability',
      body: 'Research signals show stronger emphasis on multi-step task completion, tool failures, and reproducible evaluation.',
      author: 'AI Radar fallback feed',
      engagement: { comments: 21 },
      detected_at: daysAgoIso(5),
      event_at: daysAgoIso(5),
      confidence: 0.78,
    },
  ];
}

function isWithinRange(eventAt: string, range: LaunchRange): boolean {
  if (range === 'all') return true;
  const hoursByRange: Record<Exclude<LaunchRange, 'all'>, number> = {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
    '90d': 24 * 90,
  };
  const cutoff = Date.now() - hoursByRange[range] * 60 * 60 * 1000;
  return new Date(eventAt).getTime() >= cutoff;
}

export function getFallbackLaunches(params: {
  range?: LaunchRange;
  source?: string | null;
  eventType?: string | null;
  category?: string | null;
  minConfidence?: number;
  page?: number;
  limit?: number;
} = {}): PaginatedData<LaunchItem> {
  const {
    range = '24h',
    source,
    eventType,
    category,
    minConfidence = 0,
    page = 1,
    limit = 20,
  } = params;

  let items = makeFallbackLaunches().filter((item) => isWithinRange(item.event_at, range));
  if (source) items = items.filter((item) => item.source === source);
  if (eventType) items = items.filter((item) => item.event_type === eventType);
  if (category) items = items.filter((item) => item.product_slug.includes(category) || item.title.toLowerCase().includes(category.toLowerCase()));
  if (minConfidence > 0) items = items.filter((item) => item.confidence >= minConfidence);

  const total = items.length;
  const from = (page - 1) * limit;
  const paged = items.slice(from, from + limit);

  return {
    items: paged,
    pagination: {
      page,
      page_size: limit,
      total,
      total_pages: total === 0 ? 0 : Math.ceil(total / limit),
      has_next: page * limit < total,
    },
  };
}

function makeFallbackTrends(): TrendItem[] {
  return [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      signal_type: 'tag_emerging',
      scope: 'tag:agentic-devtools',
      title: 'Agentic developer tools are becoming the default workflow',
      description: 'Coding assistants are shifting from inline suggestions to repo-level planning, edits, testing, and pull request preparation.',
      evidence: {
        products: ['Cursor Agents', 'Devin-like copilots', 'Open-source coding agents'],
        metrics: { weekly_growth: 42, monthly_launches: 18 },
        sources: ['GitHub', 'HackerNews', 'ProductHunt'],
      },
      strength: 91,
      velocity: 42,
      novelty: 0.72,
      first_seen: daysAgoIso(6),
      last_updated: nowIso(),
      status: 'emerging',
      product_count: 18,
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      signal_type: 'category_growing',
      scope: 'category:ai-video',
      title: 'AI video moves from generation demos to controllable production',
      description: 'The market is prioritizing editable scenes, brand consistency, product demo workflows, and team review loops.',
      evidence: {
        products: ['Runway Gen Video', 'Pika-style editors', 'Avatar demo tools'],
        metrics: { weekly_growth: 35, monthly_launches: 14 },
        sources: ['ProductHunt', 'YouTube', 'RSS'],
      },
      strength: 86,
      velocity: 35,
      novelty: 0.66,
      first_seen: daysAgoIso(9),
      last_updated: nowIso(),
      status: 'peaking',
      product_count: 14,
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
      signal_type: 'tech_stack_shift',
      scope: 'stack:enterprise-rag-eval',
      title: 'Enterprise RAG buyers now ask for evaluation before chat UI',
      description: 'Procurement conversations are moving toward answer quality, access policy, audit logs, and regression testing.',
      evidence: {
        products: ['RAGStack Cloud', 'Knowledge copilots', 'Vector evaluation tools'],
        metrics: { weekly_growth: 27, monthly_launches: 11 },
        sources: ['GitHub', 'RSS', 'HackerNews'],
      },
      strength: 82,
      velocity: 27,
      novelty: 0.58,
      first_seen: daysAgoIso(12),
      last_updated: nowIso(),
      status: 'emerging',
      product_count: 11,
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
      signal_type: 'funding_pattern',
      scope: 'funding:workflow-automation',
      title: 'AI workflow automation remains hot but differentiation is harder',
      description: 'Many products converge on similar chat-to-workflow patterns; durable traction depends on integrations and vertical data.',
      evidence: {
        products: ['Ops agents', 'Sales workflow copilots', 'Research automation tools'],
        metrics: { weekly_growth: 8, monthly_launches: 21 },
        sources: ['ProductHunt', 'RSS'],
      },
      strength: 68,
      velocity: 8,
      novelty: 0.41,
      first_seen: daysAgoIso(20),
      last_updated: nowIso(),
      status: 'peaking',
      product_count: 21,
    },
  ];
}

export function getFallbackTrends(params: {
  range?: TrendRange;
  signalType?: string | null;
  status?: string | null;
  scopePrefix?: string | null;
  minStrength?: number;
  page?: number;
  limit?: number;
} = {}): PaginatedData<TrendItem> {
  const {
    signalType,
    status,
    scopePrefix,
    minStrength = 0,
    page = 1,
    limit = 20,
  } = params;

  let items = makeFallbackTrends();
  if (signalType) items = items.filter((item) => item.signal_type === signalType);
  if (status) items = items.filter((item) => item.status === status);
  if (!status) items = items.filter((item) => item.status !== 'expired');
  if (scopePrefix) items = items.filter((item) => item.scope.startsWith(scopePrefix));
  if (minStrength > 0) items = items.filter((item) => item.strength >= minStrength);
  items = items.sort((a, b) => b.strength - a.strength);

  const total = items.length;
  const from = (page - 1) * limit;
  const paged = items.slice(from, from + limit);

  return {
    items: paged,
    pagination: {
      page,
      page_size: limit,
      total,
      total_pages: total === 0 ? 0 : Math.ceil(total / limit),
      has_next: page * limit < total,
    },
  };
}

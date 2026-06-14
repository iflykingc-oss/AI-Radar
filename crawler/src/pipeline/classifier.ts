/**
 * Content Classifier - 智能区分产品和新闻
 *
 * 使用多维度信号综合判断，而非简单关键词匹配：
 * 1. 源特性权重（Product Hunt = 100% 产品，TechCrunch = 70% 新闻）
 * 2. 标题结构分析（"X launches Y" vs "X raises $Y"）
 * 3. 内容实体识别（是否有产品名、版本号、价格）
 * 4. URL 特征（github.com/npmjs = 产品，新闻站 = 新闻）
 * 5. 时间动词分析（"released/launched" vs "announced/said"）
 */
import { CrawledProduct } from '../types.js';

export type ContentType = 'product' | 'news';

interface ClassificationSignals {
  sourceWeight: number;      // -1 (纯新闻) 到 1 (纯产品)
  titleScore: number;        // 标题分析得分
  entityScore: number;       // 实体识别得分
  urlScore: number;          // URL 特征得分
  verbScore: number;         // 动词分析得分
  confidence: number;        // 分类置信度 0-1
}

/**
 * 源的默认内容类型倾向
 * 值范围: -1 (纯新闻源) 到 1 (纯产品源)
 */
const SOURCE_WEIGHTS: Record<string, number> = {
  // 产品源
  producthunt: 1.0,
  github: 0.9,
  npm: 0.95,
  huggingface: 0.9,
  ossinsight: 0.8,

  // 混合源（需要进一步判断）
  hackernews: 0.3,
  reddit: 0.2,
  lobsters: 0.3,
  devto: 0.4,
  telegram: 0.2,
  twitter: 0.1,
  bluesky: 0.1,
  aihot: 0.0,  // AIhot 混合内容，完全依赖内容分析

  // 新闻源
  rss: -0.2,   // RSS 取决于具体 feed，给默认值
  arxiv: 0.7,  // 学术论文更像产品/研究
};

/**
 * RSS feed 的内容类型倾向
 */
const RSS_FEED_WEIGHTS: Record<string, number> = {
  // 新闻媒体 = -1 到 -0.5
  'TechCrunch AI': -0.8,
  'VentureBeat AI': -0.7,
  'The Verge AI': -0.8,
  'MIT Tech Review': -0.7,
  'Wired AI': -0.8,
  'Ars Technica': -0.7,
  'AI News': -0.6,
  'The Decoder': -0.5,
  'AI Business': -0.6,
  'Last Week in AI': -0.7,
  'SemiAnalysis': -0.5,
  'New Scientist AI': -0.7,
  'IEEE Spectrum AI': -0.6,
  'Nature ML': -0.4,
  'Nature Machine Intelligence': -0.4,
  'Science Magazine': -0.6,
  '36氪': -0.7,
  '雷锋网': -0.5,
  '品玩': -0.6,
  '极客公园': -0.6,
  '钛媒体': -0.7,
  '爱范儿': -0.5,
  '鸟哥笔记': -0.6,
  '人人都是产品经理': -0.4,
  '机器之心': -0.4,
  '量子位': -0.4,
  '少数派': -0.3,
  'InfoQ中文': -0.3,

  // 公司博客 = 0.5 到 0.9（大部分是产品/技术）
  'HuggingFace Blog': 0.8,
  'Google Research': 0.6,
  'Google DeepMind': 0.6,
  'MS Research AI': 0.6,
  'Amazon Science': 0.5,
  'Apple ML': 0.7,
  'Mistral AI': 0.8,
  'Cohere': 0.8,
  'Ollama Blog': 0.9,
  'vLLM Blog': 0.9,
  'LangChain Blog': 0.9,
  'LlamaIndex Blog': 0.9,
  'OpenAI Blog': 0.7,
  'Anthropic Blog': 0.7,
  'Meta AI Blog': 0.6,
  'Microsoft AI Blog': 0.6,
  'Stability AI Blog': 0.8,
  'Cursor Blog': 0.9,
  'Replit Blog': 0.9,
  'Perplexity Hub': 0.8,
  'Replicate Blog': 0.8,
  'Together AI Blog': 0.8,

  // AI 工具目录 = 0.8 到 1.0
  "There's An AI For That": 0.9,
  'Futurepedia': 0.9,
  'Toolify': 0.9,
  'TopAI Tools': 0.9,
  'AI Tools FYI': 0.9,
  'Aixploria': 0.9,
  'Dang.ai': 0.9,
  'FutureTools': 0.9,
  'AI Tools Club': 0.9,
  'Product Hunt': 1.0,

  // 研究/博客 = 0.3 到 0.7
  'BAIR Blog': 0.5,
  'The Gradient': 0.4,
  'CMU ML Blog': 0.5,
  'Allen AI': 0.5,
  'LessWrong': 0.2,
  'Alignment Forum': 0.2,
  'Simon Willison': 0.6,
  'Lilian Weng': 0.5,
  'Andrej Karpathy': 0.5,
  'The Batch (Andrew Ng)': 0.4,
  'Import AI': 0.3,
  'Latent Space': 0.4,
  'Interconnects': 0.3,
  'Huyen Chip': 0.4,
  'Eugene Yan': 0.4,
  'Sebastian Raschka': 0.5,
  'Weights & Biases': 0.7,
  "Ben's Bites": 0.3,
  'Chain of Thought': 0.3,
  'Emergent Mind': 0.4,

  // 学术 = 0.5 到 0.8
  'arXiv CS.AI': 0.7,
  'arXiv CS.CL (NLP)': 0.7,
  'arXiv CS.LG (ML)': 0.7,
  '阮一峰周刊': 0.3,
};

/**
 * 产品发布相关动词（现在时/过去时）
 */
const PRODUCT_VERBS = [
  'launch', 'launches', 'launched', 'launching',
  'release', 'released', 'releases', 'releasing',
  'introduce', 'introduces', 'introduced', 'introducing',
  'unveil', 'unveils', 'unveiled', 'unveiling',
  'debut', 'debuts', 'debuted',
  'ship', 'ships', 'shipped', 'shipping',
  'publish', 'publishes', 'published',
  'open-source', 'open source',
  'available', 'accessible',
  'deploy', 'deploys', 'deployed',
  'install', 'download', 'try',
];

/**
 * 新闻相关动词
 */
const NEWS_VERBS = [
  'announce', 'announces', 'announced', 'announcing',
  'say', 'says', 'said', 'told',
  'report', 'reports', 'reported',
  'reveal', 'reveals', 'revealed',
  'confirm', 'confirms', 'confirmed',
  'deny', 'denies', 'denied',
  'plan', 'plans', 'planned',
  'consider', 'considers', 'considered',
  'expect', 'expects', 'expected',
  'invest', 'invests', 'invested',
  'acquire', 'acquires', 'acquired',
  'merge', 'merges', 'merged',
  'sue', 'sues', 'sued',
  'lay off', 'layoff', 'layoffs',
  'resign', 'resigns', 'resigned',
  'hire', 'hires', 'hired',
  'appoint', 'appoints', 'appointed',
  'valued', 'valuation',
  'raise', 'raises', 'raised',
];

/**
 * 产品实体特征
 */
const PRODUCT_ENTITIES = [
  // 版本号
  /v\d+(\.\d+)?/i,
  /version\s+\d+/i,
  /\d+\.\d+\.\d+/,

  // 价格
  /\$\d+/,
  /free|paid|premium|pro|enterprise/i,
  /per month|per year|\/mo|\/yr/i,

  // 技术规格
  /\d+[kmb]?\s*(param|token|context|benchmark)/i,
  /API|SDK|CLI|SDK/i,
  /\b(GPT|Claude|Gemini|Llama|Mistral|DeepSeek)\s*[-]?\s*\d/i,

  // 产品链接
  /github\.com\/[\w-]+\/[\w-]+/,
  /npmjs\.com\/package\//,
  /pypi\.org\/project\//,
  /huggingface\.co\/[\w-]+\/[\w-]+/,
];

/**
 * 新闻实体特征
 */
const NEWS_ENTITIES = [
  // 金额
  /\$\d+[MBK]\s*(million|billion|thousand)?/i,
  /series\s+[a-d]/i,
  /pre-seed|seed|series/i,
  /valuation/i,

  // 公司/人物
  /\b(CEO|CTO|CFO|VP|director|founder|co-founder)\b/i,
  /\b(said|told|according to|sources?)\b/i,

  // 时间框架
  /\b(this week|last week|today|yesterday|monday|tuesday|wednesday|thursday|friday)\b/i,
  /\b(q[1-4]|quarter|fiscal|annual)\b/i,

  // 事件
  /\b(conference|summit|event|keynote|demo day)\b/i,
  /\b(hearing|trial|verdict|ruling|regulation)\b/i,
];

/**
 * Classify a crawled product as 'product' or 'news'.
 */
export function classify(product: CrawledProduct): ContentType {
  const signals = analyzeSignals(product);
  return decide(signals);
}

/**
 * Analyze all classification signals.
 */
function analyzeSignals(product: CrawledProduct): ClassificationSignals {
  const text = `${product.name} ${product.description}`;
  const lower = text.toLowerCase();

  // 1. Source weight
  const sourceWeight = getSourceWeight(product);

  // 2. Title structure analysis
  const titleScore = analyzeTitle(product.name);

  // 3. Entity recognition
  const entityScore = analyzeEntities(text);

  // 4. URL features
  const urlScore = analyzeUrls(product);

  // 5. Verb analysis
  const verbScore = analyzeVerbs(lower);

  // Calculate overall confidence
  const scores = [sourceWeight, titleScore, entityScore, urlScore, verbScore];
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + (b - avgScore) ** 2, 0) / scores.length;
  const confidence = Math.min(1, 0.5 + (1 - variance));

  return {
    sourceWeight,
    titleScore,
    entityScore,
    urlScore,
    verbScore,
    confidence,
  };
}

/**
 * Get source weight, considering RSS feed name.
 */
function getSourceWeight(product: CrawledProduct): number {
  // Check specific RSS feed weight first
  if (product.source === 'rss' && product.source_url) {
    // Try to find feed name from source_url or tags
    for (const [feedName, weight] of Object.entries(RSS_FEED_WEIGHTS)) {
      if (product.source_url.includes(feedName.toLowerCase().replace(/\s+/g, '-'))) {
        return weight;
      }
    }
  }

  return SOURCE_WEIGHTS[product.source] ?? 0;
}

/**
 * Analyze title structure for product vs news patterns.
 */
function analyzeTitle(title: string): number {
  const lower = title.toLowerCase();
  let score = 0;

  // Product patterns
  const productPatterns = [
    { pattern: /^(introducing|announcing|meet)\s+/i, weight: 0.8 },
    { pattern: /\b(launch|launches|launched|release|released)\b/i, weight: 0.7 },
    { pattern: /\bnow\s+(available|live|open)\b/i, weight: 0.9 },
    { pattern: /\bnew\s+(tool|app|platform|API|model|framework)\b/i, weight: 0.7 },
    { pattern: /\bv\d+(\.\d+)?\b/i, weight: 0.6 },
    { pattern: /\bfree\b.*\b(open.?source)\b/i, weight: 0.8 },
    { pattern: /\b(open.?source)\b.*\b(free|MIT|Apache)\b/i, weight: 0.8 },
  ];

  // News patterns
  const newsPatterns = [
    { pattern: /\b(raises?|raised|funding|investment)\b/i, weight: -0.9 },
    { pattern: /\b(acquire|acquisition|merger|buyout)\b/i, weight: -0.9 },
    { pattern: /\b(layoff|layoffs|firing|resign)\b/i, weight: -0.9 },
    { pattern: /\b(sues?|lawsuit|legal|court)\b/i, weight: -0.8 },
    { pattern: /\b(regulation|regulatory|ban|policy)\b/i, weight: -0.7 },
    { pattern: /\b(says?|said|told|according to)\b/i, weight: -0.6 },
    { pattern: /\b(report|analysis|study|survey)\b/i, weight: -0.5 },
    { pattern: /\b(interview|profile|story)\b/i, weight: -0.6 },
    { pattern: /\b(conference|summit|event)\b.*\b(recap|highlights?|day)\b/i, weight: -0.7 },
    { pattern: /\b(valued?|valuation)\b.*\$\d+/i, weight: -0.8 },
    { pattern: /\$\d+\s*[MBK]\b/i, weight: -0.7 },
  ];

  for (const { pattern, weight } of productPatterns) {
    if (pattern.test(title)) score += weight;
  }

  for (const { pattern, weight } of newsPatterns) {
    if (pattern.test(title)) score += weight;
  }

  // Clamp to -1 to 1
  return Math.max(-1, Math.min(1, score));
}

/**
 * Analyze entities in text.
 */
function analyzeEntities(text: string): number {
  let score = 0;

  for (const pattern of PRODUCT_ENTITIES) {
    if (pattern.test(text)) score += 0.3;
  }

  for (const pattern of NEWS_ENTITIES) {
    if (pattern.test(text)) score -= 0.3;
  }

  return Math.max(-1, Math.min(1, score));
}

/**
 * Analyze URL features.
 */
function analyzeUrls(product: CrawledProduct): number {
  const urls = [product.website_url, product.github_url].filter(Boolean).join(' ');
  const lower = urls.toLowerCase();

  // Product URLs
  const productDomains = [
    'github.com', 'npmjs.com', 'pypi.org', 'huggingface.co',
    'producthunt.com', 'vercel.app', 'netlify.app', 'railway.app',
    'replicate.com', 'openai.com', 'anthropic.com',
  ];

  // News URLs
  const newsDomains = [
    'techcrunch.com', 'theverge.com', 'arstechnica.com', 'wired.com',
    'bloomberg.com', 'reuters.com', 'nytimes.com', 'wsj.com',
    'venturebeat.com', 'thenextweb.com', 'engadget.com',
    '36kr.com', 'jiqizhixin.com', 'leiphone.com',
  ];

  let score = 0;

  for (const domain of productDomains) {
    if (lower.includes(domain)) score += 0.5;
  }

  for (const domain of newsDomains) {
    if (lower.includes(domain)) score -= 0.5;
  }

  return Math.max(-1, Math.min(1, score));
}

/**
 * Analyze verbs in text.
 */
function analyzeVerbs(text: string): number {
  let score = 0;

  for (const verb of PRODUCT_VERBS) {
    if (text.includes(verb)) score += 0.2;
  }

  for (const verb of NEWS_VERBS) {
    if (text.includes(verb)) score -= 0.2;
  }

  return Math.max(-1, Math.min(1, score));
}

/**
 * Make final decision based on signals.
 */
function decide(signals: ClassificationSignals): ContentType {
  // Weighted average of all signals
  const weights = {
    sourceWeight: 0.25,
    titleScore: 0.30,
    entityScore: 0.15,
    urlScore: 0.15,
    verbScore: 0.15,
  };

  const weightedScore =
    signals.sourceWeight * weights.sourceWeight +
    signals.titleScore * weights.titleScore +
    signals.entityScore * weights.entityScore +
    signals.urlScore * weights.urlScore +
    signals.verbScore * weights.verbScore;

  // Positive = product, negative = news
  return weightedScore >= 0 ? 'product' : 'news';
}

/**
 * Classify a batch of products.
 */
export function classifyBatch(products: CrawledProduct[]): CrawledProduct[] {
  for (const product of products) {
    if (!product.content_type) {
      product.content_type = classify(product);
    }
  }
  return products;
}

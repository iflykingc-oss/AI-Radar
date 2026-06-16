/**
 * AI产品发现算法 v2 - 五层漏斗式判定架构
 *
 * 基于实体核心度 + 四维度打分 + 边界修正
 * 纯规则，零API调用，毫秒级处理
 *
 * 目标：85%+ 产品识别准确率
 */

// ===================== 基础数据模型 =====================

export interface RawInput {
  title: string;
  content: string;
  source: string;
  url: string;
  publish_time?: string;
  author_type?: 'official' | 'normal' | 'media';
  external_links?: string[];
}

export interface ProductEntity {
  name: string;
  standardized_name: string;
  official_url: string;
  confidence: number;
  importance: number;
  category: string;
}

export interface PipelineResult {
  is_product: boolean;
  product_entity: ProductEntity | null;
  content_type: 'product' | 'news' | 'article' | 'discussion';
  final_score: number;
  level: 'high' | 'mid' | 'low' | 'discard' | 'update' | 'keep';
  filter_reason: string;
}

// ===================== 规则配置常量 =====================

// 1. 渠道基础配置
const CHANNEL_CONFIG: Record<string, {
  base_score: number;
  block_patterns: string[];
  pass_prefix?: Record<string, number>;
  default_type: 'product' | 'news' | 'article' | 'discussion';
}> = {
  producthunt: { base_score: 15, block_patterns: [], default_type: 'product' },
  github: { base_score: 12, block_patterns: [], default_type: 'product' },
  npm: { base_score: 12, block_patterns: [], default_type: 'product' },
  pypi: { base_score: 12, block_patterns: [], default_type: 'product' },
  huggingface: { base_score: 12, block_patterns: [], default_type: 'product' },
  hackernews: {
    base_score: 3,
    block_patterns: ['^Ask HN', '^Who is hiring', '^Who wants to be hired', '^Freelancer', '^Poll:', '^\\[.*\\]\\s*$'],
    pass_prefix: { '^Show HN': 12, '^Launch HN': 12 },
    default_type: 'article',
  },
  reddit: {
    base_score: 3,
    block_patterns: ['^\\[H\\]', '^\\[W\\]', 'Megathread', 'Weekly.*Thread', 'Daily.*Thread'],
    default_type: 'article',
  },
  rss: {
    base_score: 5,
    block_patterns: ['\\b(IPO|earnings|revenue|quarterly|fiscal)\\b', '\\b(stock price|market cap|celebrity|sports)\\b', '\\b(politics|election|government)\\b'],
    default_type: 'news',
  },
  aihot: { base_score: 5, block_patterns: [], default_type: 'news' },
  twitter: { base_score: 3, block_patterns: ['^(any recommendation|what\'s the best).*\\?', '^RT @'], default_type: 'discussion' },
  bluesky: { base_score: 3, block_patterns: [], default_type: 'discussion' },
  arxiv: { base_score: 8, block_patterns: [], default_type: 'article' },
};

// 2. 全局强否定拦截
const GLOBAL_NEGATIVE_PATTERNS = [
  '\\b(how to|tutorial|step by step|walkthrough)\\b.*\\?',
  '\\b(top \\d+|best of|list of|roundup|ranking|盘点|合集|排行榜)\\b',
  '\\b(raises? \\$|funding round|series [a-d]|acquir(es|ed)|merger|valuation \\$)\\b',
  '\\b(layoff|ceo resign|regulation|ban|policy|裁员|辞职|监管|政策)\\b',
];

// 3. 无效实体词库
const INVALID_ENTITY_SET = new Set([
  'ai tool', 'ai assistant', 'chatbot', 'copilot', 'ai agent', 'llm',
  'ai model', '大语言模型', '人工智能', 'ai工具', 'ai助手', '聊天机器人',
  'tool', 'app', 'software', 'platform', 'library', 'framework',
  'openai', 'google', 'microsoft', 'anthropic', 'meta', 'apple',
  'transformer', 'rag', 'ai', 'ml', 'python', 'javascript', 'gpt',
]);

// 4. 实体提取正则（按优先级排序）
const ENTITY_EXTRACT_PATTERNS: Array<[RegExp, number]> = [
  // 优先级1：发布句式（最可靠）
  [/(?:launch|releas|introduc|unveil)[esd]?\s+["']?([^"',.\n]{2,50})["']?/i, 0.85],
  [/(?:发布|推出|上线|开源)[了]?\s+["']?([^"'：，。\n]{2,30})["']?/, 0.85],

  // 优先级2：定义句式
  [/([^,.\n:]{2,50})\s+(?:is|是|：|:)\s+(?:an?|一款|一个)\s+(?:AI|人工智能|大模型)\s+(?:tool|助手|工具|agent|app|模型)/i, 0.80],

  // 优先级3：版本绑定
  [/([\w一-龥\s]{2,30})\s+v?\d+\.\d+(\.\d+)?/, 0.70],

  // 优先级4：带 AI/ML 后缀的词（最宽松）
  // 匹配 "CrankGPT", "LangChain", "Claude4" 等
  [/([A-Za-z][\w]{1,20}(?:AI|GPT|LM|ML|Bot|Agent|Copilot|Chain|Flow|Mind|Lab|Hub|Kit))/i, 0.6],

  // 优先级5：专有名词（首字母大写，2-30字符）
  // 匹配 "CrankGPT", "LangChain", "Claude 4" 等
  [/([A-Z][a-z][\w]{1,29}(?:\s+[A-Z][a-z][\w]{1,29}){0,2})/, 0.5],

  // 优先级6：中文产品名
  [/([一-龥]{2,10}(?:AI|助手|工具|平台|模型))/, 0.5],

  // 优先级7：任何看起来像产品名的词（2-20字符，包含字母）
  [/^([A-Za-z][\w]{1,19})$/, 0.4],

  // 优先级8：从 "Show HN: xxx" 或 "Launch HN: xxx" 中提取
  [/^(?:Show|Launch)\s+HN:\s+(.+)$/i, 0.8],
];

// 5. 产品交付形态特征
const DELIVERY_FEATURES: Array<[RegExp, number]> = [
  [/github\.com\/[\w-]+\/[\w-]+/i, 35],
  [/(npmjs\.com\/package|pypi\.org\/project|huggingface\.co)/i, 35],
  [/\b(pip install|npm install|docker run|brew install)\b/i, 20],
  [/\b(try it now|free trial|sign up|download|在线体验|立即试用)\b/i, 15],
  [/\b(pricing|price|付费|定价|订阅)\b/i, 15],
];

// 6. 发布属性特征
const RELEASE_FEATURES: Array<[RegExp, number]> = [
  [/\b(launch|release|introduce|unveil|debut)\b/i, 20],
  [/\b(发布|推出|上线|开源|首发)\b/, 20],
  [/\bv\d+\.\d+(\.\d+)?\b/, 12],
  [/\b(new|latest|brand new|全新|首次)\b/i, 10],
];

// 7. 负向扣分特征
const NEGATIVE_FEATURES: Array<[RegExp, number]> = [
  [/\b(how to|tutorial|guide|build|create|develop)\b/i, 15],
  [/\b(top \d+|best of|list|roundup|盘点|合集)\b/i, 15],
  [/\b(funding|acquisition|raises? \$|融资|收购)\b/i, 10],
  [/\b(review|experience|opinion|评测|体验|测评)\b/i, 10],
  [/\b(ask|discuss|question|讨论|提问|求助)\b/i, 10],
];

// 8. 判定阈值（降低以保留更多内容）
const THRESHOLD = { high: 60, mid: 40 };

// 9. 知名通用软件（不视为独立新产品）
const WELL_KNOWN_SOFTWARE = new Set([
  'chrome', 'python', 'nodejs', 'office', 'windows', 'macos',
  'linux', 'docker', 'vscode', 'photoshop', 'excel', 'word',
  'chatgpt', 'claude', 'gemini', 'llama', 'mistral',
]);

// ===================== 工具函数 =====================

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    let domain = parsed.hostname.toLowerCase();
    if (domain.startsWith('www.')) domain = domain.slice(4);
    return domain;
  } catch { return ''; }
}

function standardizeEntityName(name: string): string {
  let s = name.toLowerCase().trim();
  s = s.replace(/^["'「」\s]+|["'「」\s]+$/g, '');
  s = s.replace(/\s*(ai|agent|tool|app|bot)$/i, '');
  s = s.replace(/\s+/g, '');
  return s;
}

function matchPatternList(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some(p => new RegExp(p, 'i').test(lower));
}

// ===================== 第一层：前置硬拦截 =====================

function preFilter(raw: RawInput): { pass: boolean; reason: string } {
  const channelConf = CHANNEL_CONFIG[raw.source] || CHANNEL_CONFIG.rss;

  // 渠道专属硬拦截
  if (channelConf.block_patterns.length > 0) {
    if (matchPatternList(raw.title, channelConf.block_patterns)) {
      return { pass: false, reason: 'channel_block_pattern_hit' };
    }
  }

  // 全局强否定拦截（例外：有GitHub仓库链接）
  if (matchPatternList(`${raw.title} ${raw.content}`, GLOBAL_NEGATIVE_PATTERNS)) {
    if (!/github\.com\/[\w-]+\/[\w-]+/i.test(raw.url)) {
      return { pass: false, reason: 'global_negative_pattern_hit' };
    }
  }

  // 空内容
  if (!raw.title.trim() && !raw.content.trim()) {
    return { pass: false, reason: 'empty_content' };
  }

  return { pass: true, reason: 'pass' };
}

// ===================== 第二层：实体提取与校验 =====================

function extractFromUrl(url: string): ProductEntity | null {
  // GitHub
  const ghMatch = url.match(/github\.com\/([\w-]+)\/([\w-]+)/i);
  if (ghMatch) {
    return {
      name: ghMatch[2],
      standardized_name: standardizeEntityName(ghMatch[2]),
      official_url: url,
      confidence: 0.95,
      importance: 0,
      category: 'unknown',
    };
  }

  // npm/PyPI/HuggingFace
  for (const pattern of [
    /npmjs\.com\/package\/([\w@/-]+)/i,
    /pypi\.org\/project\/([\w-]+)/i,
    /huggingface\.co\/[\w-]+\/([\w-]+)/i,
  ]) {
    const match = url.match(pattern);
    if (match) {
      return {
        name: match[1],
        standardized_name: standardizeEntityName(match[1]),
        official_url: url,
        confidence: 0.95,
        importance: 0,
        category: 'unknown',
      };
    }
  }

  return null;
}

function extractFromText(text: string): ProductEntity | null {
  for (const [pattern, conf] of ENTITY_EXTRACT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length >= 2 && name.length <= 50) {
        return {
          name,
          standardized_name: standardizeEntityName(name),
          official_url: '',
          confidence: conf,
          importance: 0,
          category: 'unknown',
        };
      }
    }
  }
  return null;
}

function validateEntity(entity: ProductEntity): boolean {
  if (!entity.name || !entity.standardized_name) return false;
  if (entity.standardized_name.length < 2) return false;
  if (INVALID_ENTITY_SET.has(entity.standardized_name)) return false;
  if (/^[\d\W_]+$/.test(entity.standardized_name)) return false;

  // 过滤纯停用词
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'can', 'shall', 'this', 'that', 'these', 'those', 'it', 'its'];
  if (stopWords.includes(entity.standardized_name)) return false;

  return true;
}

function calculateImportance(entity: ProductEntity, title: string, content: string): number {
  let score = 0;
  const nameLower = entity.name.toLowerCase();
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();

  // 标题出现
  if (titleLower.includes(nameLower)) score += 0.5;

  // 首段出现
  const firstPara = contentLower.split('\n')[0] || '';
  if (firstPara.includes(nameLower)) score += 0.2;

  // 正文出现次数
  const count = contentLower.split(nameLower).length - 1;
  score += Math.min(count * 0.05, 0.3);

  return Math.min(score, 1.0);
}

function extractEntity(raw: RawInput): ProductEntity | null {
  const fullText = `${raw.title} ${raw.content}`;

  // 优先从URL提取
  let entity = extractFromUrl(raw.url);

  // 从文本提取
  if (!entity) entity = extractFromText(fullText);

  // 没提取到
  if (!entity) return null;

  // 有效性校验
  if (!validateEntity(entity)) return null;

  // 核心度
  entity.importance = calculateImportance(entity, raw.title, raw.content);

  // 核心度过低（降低阈值以保留更多内容）
  if (entity.importance < 0.1) return null;

  // 补充官方链接
  if (!entity.official_url && raw.url) {
    const domain = extractDomain(raw.url);
    if (!['twitter.com', 'x.com', 'reddit.com', 'news.ycombinator.com'].includes(domain)) {
      entity.official_url = raw.url;
    }
  }

  return entity;
}

// ===================== 第三层：多维度置信度打分 =====================

function calcDeliveryScore(text: string, url: string, entity: ProductEntity): number {
  let score = 0;
  const fullText = `${text} ${url}`;
  for (const [pattern, point] of DELIVERY_FEATURES) {
    if (pattern.test(fullText)) score += point;
  }
  if (entity.official_url) score += 10;
  return Math.min(score, 40);
}

function calcEntityScore(entity: ProductEntity): number {
  let score = entity.confidence * 25;
  if (entity.importance >= 0.5) score += 5;
  return Math.min(score, 25);
}

function calcReleaseScore(text: string, authorType: string): number {
  let score = 0;
  for (const [pattern, point] of RELEASE_FEATURES) {
    if (pattern.test(text)) score += point;
  }
  if (authorType === 'official') score += 8;
  return Math.min(score, 20);
}

function calcChannelScore(source: string, title: string): number {
  const conf = CHANNEL_CONFIG[source] || CHANNEL_CONFIG.rss;
  let base = conf.base_score;

  // HN特殊前缀
  if (source === 'hackernews' && conf.pass_prefix) {
    for (const [pattern, extra] of Object.entries(conf.pass_prefix)) {
      if (new RegExp(pattern, 'i').test(title)) {
        base = extra;
        break;
      }
    }
  }

  return Math.min(base, 15);
}

function calcNegativePenalty(text: string): number {
  let penalty = 0;
  for (const [pattern, point] of NEGATIVE_FEATURES) {
    if (pattern.test(text)) penalty += point;
  }
  return penalty;
}

function calculateScore(raw: RawInput, entity: ProductEntity): number {
  const fullText = `${raw.title} ${raw.content}`;

  const delivery = calcDeliveryScore(fullText, raw.url, entity);
  const entityScore = calcEntityScore(entity);
  const release = calcReleaseScore(fullText, raw.author_type || 'normal');
  const channel = calcChannelScore(raw.source, raw.title);

  const rawScore = delivery + entityScore + release + channel;
  const penalty = calcNegativePenalty(fullText);

  return Math.max(0, Math.min(100, rawScore - penalty));
}

// ===================== 第四层：边界场景修正 =====================

function correctBoundary(raw: RawInput, entity: ProductEntity, score: number): number {
  const text = `${raw.title} ${raw.content}`.toLowerCase();
  let adjusted = score;

  // 老产品/知名软件
  if (WELL_KNOWN_SOFTWARE.has(entity.standardized_name)) {
    adjusted -= 30;
  }

  // 教程带仓库
  if (/\b(tutorial|course|learn|example|demo)\b/i.test(text) && raw.url.includes('github')) {
    adjusted -= 20;
  }

  // 融资但有新产品
  if (/\b(raises? \$|funding|融资)\b/i.test(text) && entity.importance >= 0.5) {
    adjusted += 10;
  }

  // 榜单/合集
  if (/\b(top \d+|best of|盘点|合集)\b/i.test(text)) {
    adjusted = Math.min(adjusted, 69);
  }

  // 公司名误识别
  if (['openai', 'google', 'microsoft', 'anthropic', 'meta'].includes(entity.standardized_name)) {
    adjusted = 0;
  }

  // 纯功能更新
  if (/\b(新增|上线|推出).*?(功能|特性|能力)\b/.test(text) && !entity.official_url) {
    adjusted -= 15;
  }

  return Math.max(0, Math.min(100, adjusted));
}

// ===================== 第五层：实体归一与分级输出 =====================

function classifyLevel(score: number): 'high' | 'mid' | 'low' {
  if (score >= THRESHOLD.high) return 'high';
  if (score >= THRESHOLD.mid) return 'mid';
  return 'low';
}

function judgeContentType(raw: RawInput, isProduct: boolean): 'product' | 'news' | 'article' | 'discussion' {
  if (isProduct) return 'product';
  return CHANNEL_CONFIG[raw.source]?.default_type || 'article';
}

// ===================== 主流水线 =====================

export function classifyV2(raw: RawInput): PipelineResult {
  const defaultType = CHANNEL_CONFIG[raw.source]?.default_type || 'article';

  // 第一层：前置硬拦截
  const { pass, reason } = preFilter(raw);
  if (!pass) {
    return { is_product: false, product_entity: null, content_type: defaultType, final_score: 0, level: 'keep', filter_reason: reason };
  }

  // 第二层：实体提取
  const entity = extractEntity(raw);
  if (!entity) {
    // 没有实体，但不丢弃，标记为默认类型（news/article/discussion）
    return { is_product: false, product_entity: null, content_type: defaultType, final_score: 0, level: 'keep', filter_reason: 'no_valid_entity' };
  }

  // 第三层：置信度打分
  const baseScore = calculateScore(raw, entity);

  // 第四层：边界修正
  const finalScore = correctBoundary(raw, entity, baseScore);

  // 第五层：分级输出
  const level = classifyLevel(finalScore);
  const isProduct = level === 'high' || level === 'mid';
  const contentType = judgeContentType(raw, isProduct);

  return {
    is_product: isProduct,
    product_entity: entity,
    content_type: contentType,
    final_score: finalScore,
    level: isProduct ? level : 'discard',
    filter_reason: isProduct ? '' : 'score_below_threshold',
  };
}

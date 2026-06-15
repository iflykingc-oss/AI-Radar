/**
 * Content Classifier - 严格区分产品、新闻、文章
 *
 * 产品定义：一个可以使用的工具、平台、服务、库、框架
 * - 有官网或 GitHub 仓库
 * - 可以安装、部署、使用
 * - 解决一个具体问题
 *
 * 新闻定义：行业动态、融资、收购、政策
 * - 关于公司或人的消息
 * - 没有可使用的产品
 *
 * 文章定义：教程、分析、讨论、观点
 * - 教育性质的内容
 * - 不是产品也不是新闻
 */
import { CrawledProduct } from '../types.js';

export type ContentType = 'product' | 'news' | 'article';

/**
 * 强产品信号：这些特征强烈表明是产品
 */
const STRONG_PRODUCT_SIGNALS = [
  // GitHub 仓库
  /github\.com\/[\w-]+\/[\w-]+/i,
  /npmjs\.com\/package\//i,
  /pypi\.org\/project\//i,
  /huggingface\.co\/[\w-]+\/[\w-]+/i,

  // 产品发布语言
  /\b(launch|launches|launched|launching)\s+(new|our|the)?\s*[\w\s]{2,30}/i,
  /\b(release|released|releases)\s+(new|v|version)?\s*[\w\s]{2,20}/i,
  /\b(introduce|introduces|introduced|introducing)\s+[\w\s]{2,30}/i,
  /\b(unveil|unveils|unveiled)\s+[\w\s]{2,30}/i,
  /\b(now\s+available|now\s+live|just\s+launched)\b/i,
  /\b(open.?source)\s+[\w\s]{2,20}/i,

  // 版本号
  /\bv\d+(\.\d+){1,2}\b/i,
  /version\s+\d+(\.\d+){0,2}/i,

  // 技术产品特征
  /\b(API|SDK|CLI|tool|library|framework|platform|service|app)\b.*\b(release|launch|available)\b/i,
  /\b(free|open.?source)\s+(tool|app|platform|API|SDK)\b/i,

  // 安装/使用语言
  /\b(install|pip install|npm install|brew install|docker)\b/i,
  /\b(get\s+started|try\s+it|sign\s+up|download)\b/i,
];

/**
 * 弱产品信号：可能表明是产品，但不确定
 */
const WEAK_PRODUCT_SIGNALS = [
  /\bnew\s+(AI|ML|LLM)\s+(tool|app|platform|model|framework)\b/i,
  /\bAI\s+(tool|app|platform|agent|assistant)\b/i,
  /\bchatbot|copilot|code\s+assistant\b/i,
  /\bimage\s+generation|video\s+generation|text-to-\b/i,
  /\bvector\s+database|RAG\s+tool|embedding\s+model\b/i,
];

/**
 * 强新闻信号：这些特征强烈表明是新闻
 */
const STRONG_NEWS_SIGNALS = [
  // 融资/收购
  /\b(raises?|raised|funding|investment)\s+\$[\dMBK]+/i,
  /\b(acquire|acquisition|merger|buyout)\b/i,
  /\b(series\s+[a-d]|pre-seed|seed\s+round)\b/i,
  /\b(valued?|valuation)\s+(at|of)\s+\$[\dMBK]+/i,

  // 公司动态
  /\b(layoff|layoffs|firing|resign|hiring)\b/i,
  /\b(CEO|CTO|CFO|founder|co-founder)\s+(says?|announced|steps?\s+down)\b/i,
  /\b(goes?\s+public|IPO|listing)\b/i,

  // 政策/监管
  /\b(regulation|regulatory|ban|policy|law|act)\b.*\b(AI|tech|company)\b/i,
  /\b(EU|US|China|government)\b.*\b(AI|tech)\b/i,
];

/**
 * 强文章信号：这些特征强烈表明是文章/教程/讨论
 */
const STRONG_ARTICLE_SIGNALS = [
  // 教程/指南
  /\b(tutorial|guide|how\s+to|getting\s+started|walkthrough)\b/i,
  /\b(introduction\s+to|beginner'?s?\s+guide|deep\s+dive)\b/i,
  /\b(understanding|learn|explain|explained)\b/i,

  // 分析/观点
  /\b(analysis|opinion|editorial|commentary|perspective)\b/i,
  /\b(why\s+|how\s+|what\s+|when\s+|should\s+)\b.*\?/i,
  /\b(future\s+of|state\s+of|trend|landscape)\b/i,

  // 列表/回顾
  /\b(top\s+\d+|best\s+\d+|\d+\s+best|\d+\s+top)\b/i,
  /\b(roundup|recap|summary|overview)\b/i,
  /\b(year\s+in\s+review|retrospective)\b/i,

  // 个人故事
  /\b(my\s+experience|lessons?\s+learned|what\s+I\s+learned)\b/i,
  /\b(journey|story|adventure|experiment)\b/i,

  // 历史/引用
  /\b(history\s+of|origins?\s+of|born\s+in|created\s+in)\b/i,
  /\b(quotes?|quotes?\s+from|wisdom\s+from)\b/i,
  /\b(\d{4})\b.*\b(quotes?|wisdom|lessons?|story)\b/i,

  // 讨论/问答
  /\b(ask\s+HN|Show\s+HN|Tell\s+HN)\b/i,
  /\b(discussion|debate|question|answer)\b/i,
  /\b(what\s+do\s+you\s+think|thoughts\s+on|opinion\s+on)\b/i,

  // 文章特征
  /\b(read|reading|article|blog\s+post|essay|paper)\b/i,
  /\b(published|written|authored)\b/i,
];

/**
 * 分类内容类型
 */
export function classify(product: CrawledProduct): ContentType {
  const name = product.name || '';
  const description = product.description || '';
  const text = `${name} ${description}`;
  const source = product.source || '';
  const url = product.website_url || product.source_url || '';

  // 1. 检查强产品信号
  for (const pattern of STRONG_PRODUCT_SIGNALS) {
    if (pattern.test(text) || pattern.test(url)) {
      return 'product';
    }
  }

  // 2. 检查强文章信号
  for (const pattern of STRONG_ARTICLE_SIGNALS) {
    if (pattern.test(name)) {
      return 'article';
    }
  }

  // 3. 检查强新闻信号
  for (const pattern of STRONG_NEWS_SIGNALS) {
    if (pattern.test(text)) {
      return 'news';
    }
  }

  // 4. 检查弱产品信号
  let weakProductCount = 0;
  for (const pattern of WEAK_PRODUCT_SIGNALS) {
    if (pattern.test(text)) {
      weakProductCount++;
    }
  }

  // 5. 基于源的默认分类
  const sourceDefaults: Record<string, ContentType> = {
    producthunt: 'product',
    github: 'product',
    npm: 'product',
    huggingface: 'product',
    hackernews: 'article',  // HN 默认是文章/讨论
    reddit: 'article',
    lobsters: 'article',
    devto: 'article',
    arxiv: 'article',
    rss: 'news',  // RSS 默认是新闻
    aihot: 'news',
    twitter: 'news',
    bluesky: 'news',
    telegram: 'news',
  };

  const defaultType = sourceDefaults[source] || 'article';

  // 6. 如果有弱产品信号，可能是产品
  if (weakProductCount >= 2) {
    return 'product';
  }

  // 7. 返回默认类型
  return defaultType;
}

/**
 * 检查内容是否可能是产品（用于过滤）
 */
export function isLikelyProduct(product: CrawledProduct): boolean {
  const type = classify(product);
  return type === 'product';
}

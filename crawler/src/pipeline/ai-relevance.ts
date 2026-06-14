/**
 * AI Relevance Filter
 *
 * Checks if content is actually related to AI/ML.
 * Filters out non-AI content like general business news, IPOs, etc.
 */

/**
 * AI-related keywords that indicate content is about AI/ML.
 */
const AI_KEYWORDS = [
  // Core AI terms
  'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
  'neural network', 'llm', 'large language model', 'nlp', 'natural language',
  'computer vision', 'cv', 'generative', 'gen ai', 'genai',

  // AI models
  'gpt', 'chatgpt', 'claude', 'gemini', 'llama', 'mistral', 'palm',
  'deepseek', 'qwen', 'yi', 'falcon', 'stable diffusion', 'midjourney',
  'dall-e', 'sora', 'whisper', 't5', 'bert', 'roberta',

  // AI companies
  'openai', 'anthropic', 'deepmind', 'google ai', 'meta ai',
  'hugging face', 'huggingface', 'stability ai', 'midjourney',
  'cohere', 'ai21', 'inflection', 'mistral ai',

  // AI concepts
  'transformer', 'attention', 'embedding', 'vector', 'rag',
  'retrieval augmented', 'fine-tune', 'finetune', 'prompt',
  'inference', 'training', 'model', 'benchmark', 'alignment',
  'rlhf', 'constitutional ai', 'agent', 'multi-agent',
  'multimodal', 'text-to-image', 'text-to-video', 'text-to-speech',
  'speech-to-text', 'image generation', 'video generation',

  // AI tools/frameworks
  'pytorch', 'tensorflow', 'keras', 'langchain', 'llamaindex',
  'openai api', 'anthropic api', 'vertex ai', 'bedrock', 'sagemaker',
  'mlflow', 'wandb', 'weights & biases', 'ollama', 'vllm',
  'llama.cpp', 'ggml', 'gguf', 'cuda', 'tensorrt',

  // AI applications
  'chatbot', 'copilot', 'code assistant', 'ai coding',
  'ai writing', 'ai image', 'ai video', 'ai audio',
  'ai search', 'ai agent', 'autonomous', 'robotics',
  'self-driving', 'autonomous driving',
];

/**
 * Non-AI keywords that indicate content is NOT about AI.
 */
const NON_AI_KEYWORDS = [
  // Business/Finance (not AI-specific)
  'ipo', 'initial public offering', 'stock price', 'market cap',
  'revenue', 'profit', 'loss', 'quarterly', 'earnings',
  'merger', 'acquisition', 'buyout', 'private equity',
  'venture capital', 'funding round', 'series a', 'series b',
  'series c', 'valuation', 'shareholder', 'board of directors',

  // General tech (not AI)
  'smartphone', 'iphone', 'android', 'ios', 'windows', 'macos',
  'linux', 'cloud computing', 'saas', 'paas', 'iaas',
  'blockchain', 'crypto', 'bitcoin', 'ethereum', 'nft',
  'web3', 'metaverse', 'vr', 'ar', 'gaming',

  // Non-tech
  'celebrity', 'sports', 'entertainment', 'movie', 'music',
  'politics', 'election', 'government', 'policy',
];

/**
 * Check if content is AI-related.
 * Returns true if the content has strong AI signals.
 */
export function isAIRelated(name: string, description: string, tags: string[]): boolean {
  const text = `${name} ${description}`.toLowerCase();
  const tagText = tags.join(' ').toLowerCase();

  // Check for non-AI keywords first (strong negative signal)
  const nonAICount = NON_AI_KEYWORDS.filter(kw => text.includes(kw)).length;
  if (nonAICount >= 2) {
    // Multiple non-AI keywords = likely not AI content
    return false;
  }

  // Check for AI keywords
  const aiCount = AI_KEYWORDS.filter(kw => text.includes(kw) || tagText.includes(kw)).length;

  // Strong AI signal: 2+ AI keywords
  if (aiCount >= 2) return true;

  // Moderate AI signal: 1 AI keyword + no non-AI keywords
  if (aiCount >= 1 && nonAICount === 0) return true;

  // Check if tags contain AI-related terms
  const aiTags = ['ai', 'ml', 'llm', 'gpt', 'claude', 'gemini', 'machine learning', 'deep learning'];
  const hasAITag = tags.some(tag => aiTags.some(ai => tag.toLowerCase().includes(ai)));
  if (hasAITag) return true;

  // Default: not AI-related
  return false;
}

/**
 * Filter products to only include AI-related content.
 */
export function filterAIRelevant<T extends { name: string; description: string; tags: string[] }>(
  products: T[]
): T[] {
  return products.filter(p => isAIRelated(p.name, p.description, p.tags));
}

/**
 * Shared constants for AI Radar
 * Used across ProductCard, ProductDetail, and Discover page
 */

export const CATEGORIES = [
  'LLM',
  'Image Generation',
  'Video Generation',
  'Speech/Audio',
  'AI Agents',
  'AI Coding',
  'AI Search',
  'AI Framework',
  'AI Platform',
  'MLOps',
  'Computer Vision',
  'NLP',
  'Robotics',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

export const PRICING_MODELS = [
  { value: 'free', label: 'Free', icon: '🆓', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { value: 'freemium', label: 'Freemium', icon: '🆓💎', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { value: 'paid', label: 'Paid', icon: '💰', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  { value: 'open_source', label: 'Open Source', icon: '📦', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
] as const;

export type PricingModel = typeof PRICING_MODELS[number]['value'];

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { value: 'low_active', label: 'Low Active', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { value: 'inactive', label: 'Inactive', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  { value: 'dead', label: 'Dead', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400' },
] as const;

export type AvailabilityStatus = typeof STATUS_OPTIONS[number]['value'];

export const CONFIDENCE_LEVELS = [
  { value: 'high', label: 'High (80+)', color: 'bg-emerald-500/10 text-emerald-600' },
  { value: 'medium', label: 'Medium (50-79)', color: 'bg-amber-500/10 text-amber-600' },
  { value: 'low', label: 'Low (<50)', color: 'bg-red-500/10 text-red-600' },
] as const;

export type ConfidenceLevel = typeof CONFIDENCE_LEVELS[number]['value'];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Newest First' },
  { value: 'confidence', label: 'Highest Score' },
  { value: 'stars', label: 'Most Stars' },
  { value: 'name', label: 'Alphabetical' },
] as const;

export type SortOption = typeof SORT_OPTIONS[number]['value'];

export const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
] as const;

export type TimeRange = typeof TIME_RANGES[number]['value'];

export const REGIONS = [
  'Global',
  'North America',
  'Europe',
  'Asia Pacific',
  'China',
  'India',
  'Latin America',
] as const;

export const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for exploring',
    features: [
      '10 products per day',
      'Basic filtering',
      'Email newsletter',
      'Community access',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$10',
    period: '/month',
    description: 'For serious entrepreneurs',
    features: [
      'Unlimited products',
      'Advanced filtering',
      'Priority newsletter',
      'Watchlist & alerts',
      'Product comparison',
      'Trend analysis',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Premium',
    price: '$25',
    period: '/month',
    description: 'For power users',
    features: [
      'Everything in Pro',
      'Daily intelligence report',
      'Monthly trend analysis',
      'API access (1000 req/min)',
      'Priority support',
      'Community VIP access',
    ],
    cta: 'Start Premium Trial',
    popular: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For teams & organizations',
    features: [
      'Everything in Premium',
      'Custom data feeds',
      'Team collaboration',
      'White-label reports',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const FAQ_DATA = [
  {
    question: 'What is AI Radar?',
    answer:
      'AI Radar is an AI startup opportunity validation platform. We automatically discover, validate, and track AI products across multiple channels (X, GitHub, Product Hunt, etc.) to help entrepreneurs, investors, and innovation teams find their next big opportunity.',
  },
  {
    question: 'How does the 4D Verification work?',
    answer:
      'Our 4D Verification system cross-validates each AI product using four dimensions: 1) Data freshness (is it recently updated?), 2) Multi-source confirmation (is it mentioned across independent platforms?), 3) Engagement signals (are people actually using it?), and 4) Technical viability (does the product actually work?). Each dimension contributes to an overall confidence score (0-100%).',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'Our crawlers run continuously across all platforms. New products are discovered and added within hours of being published. Existing products are re-validated every 24 hours to ensure data accuracy.',
  },
  {
    question: 'Is AI Radar free to use?',
    answer:
      'Yes! AI Radar offers a generous free tier that includes 10 products per day, basic filtering, and email newsletter. For advanced features like unlimited products, Watchlist, alerts, and trend analysis, check out our Pro ($10/month) and Premium ($25/month) plans.',
  },
  {
    question: 'Can I get notifications for new products?',
    answer:
      'Absolutely! You can set up notifications via Feishu, DingTalk, WeCom, Slack, Telegram, Discord, or Microsoft Teams. Customize your notification frequency (real-time, daily digest, or weekly summary) and choose what types of updates you want to receive.',
  },
];

/**
 * Get status config by status key
 */
export function getStatusConfig(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
}

/**
 * Get pricing config by pricing key
 */
export function getPricingConfig(pricing: string) {
  return PRICING_MODELS.find(p => p.value === pricing) || PRICING_MODELS[0];
}

/**
 * Source icons mapping
 */
export const SOURCE_ICONS: Record<string, string> = {
  rss: '📰',
  aihot: '🔥',
  twitter: '🐦',
  bluesky: '🦋',
  reddit: '🤖',
  hackernews: '🟠',
  github: '🐙',
  producthunt: '🚀',
  npm: '📦',
  huggingface: '🤗',
  arxiv: '📄',
  devto: '👩‍💻',
  lobsters: '🦞',
  telegram: '✈️',
  ossinsight: '📊',
};

/**
 * Source colors mapping
 */
export const SOURCE_COLORS: Record<string, string> = {
  rss: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  aihot: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  twitter: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  bluesky: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  reddit: 'bg-red-500/10 text-red-600 dark:text-red-400',
  hackernews: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  github: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  producthunt: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

/**
 * Get source icon
 */
export function getSourceIcon(source: string): string {
  return SOURCE_ICONS[source] || '📰';
}

/**
 * Get source color
 */
export function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] || 'bg-muted text-muted-foreground';
}

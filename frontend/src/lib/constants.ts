export const CATEGORIES = [
  'AI Writing',
  'AI Coding',
  'AI Design',
  'AI Video',
  'AI Audio',
  'AI Data Analysis',
  'AI Agent',
  'AI Infrastructure',
  'AI API',
  'AI Model',
  'AI Search',
  'AI Marketing',
] as const;

export const REGIONS = [
  'Global',
  'North America',
  'Europe',
  'Asia Pacific',
  'China',
  'India',
  'Latin America',
] as const;

export const PRICING_MODELS = [
  'free',
  'freemium',
  'paid',
  'open_source',
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

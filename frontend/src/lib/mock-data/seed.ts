/**
 * Seed script for regenerating mock product data.
 *
 * Usage:  npx tsx src/lib/mock-data/seed.ts
 *
 * This script prints a deterministic set of 200+ mock products
 * to stdout.  It uses a seeded PRNG so that every run produces
 * the same output.
 */

// --- Simple seeded PRNG (mulberry32) ---
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 42;
const rng = mulberry32(SEED);

// --- Data pools ---
const CATEGORIES = [
  'AI Agent', 'AI Coding', 'AI Design', 'AI Video', 'AI Audio',
  'AI Data Analysis', 'AI Search', 'AI Marketing', 'AI Writing',
  'Healthcare', 'Education', 'Finance', 'Legal', 'Development',
  'Productivity', 'Security', 'Other',
] as const;

const SUBCATEGORIES: Record<string, string[]> = {
  'AI Agent': ['Chatbots', 'Automation', 'RPA', 'Email Automation', 'Calendar', 'Data Pipeline'],
  'AI Coding': ['Code Generation', 'Documentation', 'Code Refactoring', 'Code Migration', 'Performance', 'Developer Tools', 'AI Agents'],
  'AI Design': ['Image Generation', 'UI Generation', 'Color Tools', 'Design Systems', 'Accessibility', 'Mockups', 'Typography', 'Wireframing', '3D Generation', 'Fashion'],
  'AI Video': ['Video Generation', 'Video Editing', 'Animation', 'Short-form Video', 'Detection', 'Summarization', 'Subtitles'],
  'AI Audio': ['Text-to-Speech', 'Audio Enhancement', 'Music Generation', 'Voice Cloning', 'Sound Effects', 'Transcription', 'Music Production', 'Podcast Production'],
  'AI Data Analysis': ['Synthetic Data', 'Analytics', 'Predictive Analytics', 'Survey Analysis', 'Dashboards', 'Anomaly Detection', 'Data Preparation', 'Content Moderation', 'Sports Analytics'],
  'AI Search': ['Enterprise Search', 'Research', 'Code Search', 'Video Search', 'Visual Search', 'Voice Search'],
  'AI Marketing': ['Campaign Optimization', 'Social Media', 'Email Marketing', 'Ad Copy', 'Influencer', 'SEO', 'Sentiment Analysis'],
  'AI Writing': ['Writing Assistant', 'Copywriting', 'Creative Writing', 'Translation', 'Localization', 'Professional Writing', 'Presentations', 'SEO Writing', 'Academic'],
  'Healthcare': ['Medical Imaging', 'Clinical Documentation', 'Drug Discovery', 'Mental Health', 'Clinical Trials', 'Patient Engagement', 'Nutrition', 'Fitness', 'Parenting', 'Veterinary'],
  'Education': ['AI Tutoring', 'Professional Development', 'Assessment', 'Language Learning', 'Math', 'Coding Education', 'Corporate Training'],
  'Finance': ['Financial Analysis', 'Expense Management', 'Tax Preparation', 'Investment', 'Cryptocurrency', 'Personal Finance', 'Invoice Processing', 'Real Estate', 'Insurance'],
  'Legal': ['Contract Analysis', 'Compliance', 'IP Monitoring', 'Document Review', 'Privacy', 'Legal Research'],
  'Development': ['DevOps', 'Bug Detection', 'API Testing', 'Cloud Optimization', 'Database', 'Kubernetes', 'Game Development'],
  'Productivity': ['Meeting Assistant', 'Document Processing', 'Focus & Time', 'Note Taking', 'Project Management', 'Knowledge Management'],
  'Security': ['Threat Detection', 'Vulnerability Scanning', 'Phishing Protection', 'Smart Contract', 'Code Security', 'IAM', 'Network Security'],
  'Other': ['Supply Chain', 'Energy', 'Agriculture', 'Recruiting', 'HR', 'Travel', 'Weather', 'Food', 'Gardening'],
};

const PRICING_MODELS = ['free', 'freemium', 'paid', 'open_source', 'enterprise'] as const;
const FUNDING_STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Bootstrapped', null] as const;
const CONFIDENCE_LEVELS = ['high', 'medium', 'low', 'unverified'] as const;

const ADJECTIVES = [
  'Smart', 'Intelligent', 'Auto', 'Deep', 'Neural', 'Cognitive', 'Adaptive',
  'Pro', 'Ultra', 'Hyper', 'Mega', 'Super', 'Quantum', 'Turbo', 'Rapid',
  'Swift', 'Swift', 'Brilliant', 'Genius', 'Master', 'Prime', 'Elite',
  'Vision', 'Insight', 'Insight', 'Mind', 'Brain', 'Core', 'Flow',
  'Spark', 'Pulse', 'Edge', 'Peak', 'Zen', 'Nova', 'Atlas', 'Nexus',
];

const NOUNS = [
  'Gen', 'Forge', 'Craft', 'Mind', 'Bot', 'Engine', 'Labs', 'AI',
  'Hub', 'Works', 'Sync', 'Wave', 'Lens', 'Scope', 'Cast', 'Pilot',
  'Mate', 'Guide', 'Sense', 'Track', 'Scan', 'Guard', 'Shield', 'Vision',
  'Assist', 'Builder', 'Maker', 'Creator', 'Designer', 'Optimizer',
  'Analyzer', 'Predictor', 'Classifier', 'Detector', 'Monitor',
];

const FOUNDER_INFOS = [
  'Ex-Google engineers', 'Former Meta researchers', 'AI PhDs from Stanford',
  'Industry veterans', 'Serial entrepreneurs', 'Open source contributors',
  'Ex-Amazon ML team', 'Researchers from MIT', 'Ex-Microsoft engineers',
  'Community-driven project', 'Indie developer', 'Former Apple team',
  'Ex-Netflix engineers', 'Scientists from DeepMind', 'AI researchers from OpenAI',
  'Engineers from Stripe', 'Data scientists from Tableau', 'Security experts from CrowdStrike',
];

const TECH_STACKS = [
  ['Python', 'PyTorch', 'FastAPI', 'React'],
  ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
  ['Python', 'LangChain', 'React', 'PostgreSQL'],
  ['Go', 'React', 'PostgreSQL', 'Redis'],
  ['Rust', 'Python', 'React', 'FastAPI'],
  ['Python', 'TensorFlow', 'FastAPI', 'Next.js'],
  ['TypeScript', 'Python', 'OpenAI API', 'MongoDB'],
  ['Python', 'spaCy', 'React', 'Redis'],
  ['Go', 'React', 'Kafka', 'Kubernetes'],
  ['Python', 'PyTorch', 'React', 'AWS'],
  ['React Native', 'Python', 'PostgreSQL', 'Firebase'],
  ['C++', 'CUDA', 'React', 'AWS'],
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 1): number {
  return parseFloat((rng() * (max - min) + min).toFixed(decimals));
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateProducts(count: number) {
  const products: string[] = [];
  const usedSlugs = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    let slug: string;
    do {
      name = `${pick(ADJECTIVES)}${pick(NOUNS)}`;
      if (rng() > 0.5) name += ` ${pick(['AI', 'Pro', 'Studio', 'Hub', 'Lab', 'Cloud', 'Engine'])}`;
      slug = generateSlug(name);
    } while (usedSlugs.has(slug));
    usedSlugs.add(slug);

    const category = pick(CATEGORIES);
    const subcategory = pick(SUBCATEGORIES[category as keyof typeof SUBCATEGORIES] ?? ['General']) as string;
    const pricingModel = pick(PRICING_MODELS);
    const techStack = pick(TECH_STACKS);
    const fundingStage = pick(FUNDING_STAGES);
    const hasGitHub = rng() > 0.35;
    const githubStars = hasGitHub ? randInt(50, 50000) : null;
    const launchYear = randInt(2022, 2024);
    const launchMonth = randInt(1, 12);
    const launchDay = randInt(1, 28);
    const rating = randFloat(3.5, 5.0, 1);
    const reviewCount = randInt(20, 2000);
    const isVerified = rng() > 0.25;
    const confidenceLevel = pick(CONFIDENCE_LEVELS);
    const confidenceScore = randInt(60, 99);
    const weeklyGrowth = randFloat(2, 55, 1);
    const monthlyGrowth = parseFloat((weeklyGrowth * randFloat(2.5, 4.5, 1)).toFixed(1));

    const tagPool = [
      `${subcategory.toLowerCase().replace(/\s+/g, '-')}`,
      'ai-powered', 'automation', 'api', 'real-time', 'cloud',
      'machine-learning', 'deep-learning', 'nlp', 'computer-vision',
      'analytics', 'dashboard', 'mobile', 'web', 'desktop',
      'integration', 'collaboration', 'security', 'scalable',
      'open-source', 'enterprise', 'saas', 'customizable',
      'multi-language', 'high-performance', 'low-latency',
    ];
    const tags = pickN(tagPool, randInt(10, 15));

    const featurePool = [
      'auto-detection', 'smart-routing', 'batch-processing',
      'real-time-sync', 'custom-workflows', 'analytics-dashboard',
      'api-access', 'webhooks', 'role-based-access', 'audit-log',
      'export-options', 'import-tools', 'notification-center',
      'team-collaboration', 'version-control', 'template-library',
    ];
    const featureTags = pickN(featurePool, randInt(5, 8));

    const weeklyDownloads = randInt(1000, 100000);
    const monthlyActiveUsers = Math.floor(weeklyDownloads * randFloat(2.5, 4.0, 1));

    const pricingUrl = pricingModel === 'free' || pricingModel === 'enterprise'
      ? 'null'
      : `'https://${slug.toLowerCase().replace(/\s/g, '')}.io/pricing'`;

    const githubUrl = hasGitHub
      ? `'https://github.com/${slug.toLowerCase().replace(/\s/g, '')}/core'`
      : 'null';

    products.push(`  {
    slug: '${slug}',
    name: '${name}',
    name_en: '${name}',
    name_zh: '${name}',
    description: 'AI-powered ${subcategory.toLowerCase()} tool with advanced features for modern teams. ${rating > 4.5 ? 'Top-rated by industry professionals.' : 'Growing user base with active community.'}',
    description_en: 'AI-powered ${subcategory.toLowerCase()} tool with advanced features.',
    description_zh: 'AI驱动的${subcategory}工具，高级功能。',
    website_url: 'https://${slug.toLowerCase().replace(/\s/g, '')}.io',
    github_url: ${githubUrl},
    logo_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=${slug}',
    category: '${category}',
    subcategory: '${subcategory}',
    tags: [${tags.map((t) => `'${t}'`).join(', ')}],
    tech_stack: [${techStack.map((t) => `'${t}'`).join(', ')}],
    pricing_model: '${pricingModel}',
    pricing_url: ${pricingUrl},
    availability_status: 'active',
    commercialization_status: '${fundingStage ? 'Commercial' : 'Open Source'}',
    funding_stage: ${fundingStage ? `'${fundingStage}'` : 'null'},
    founder_info: '${pick(FOUNDER_INFOS)}',
    launch_date: '${launchYear}-${String(launchMonth).padStart(2, '0')}-${String(launchDay).padStart(2, '0')}',
    last_seen: '2025-05-28',
    confidence_score: ${confidenceScore},
    confidence_level: '${confidenceLevel}',
    validation_signals: { github_stars_trend: '${rng() > 0.4 ? 'up' : 'stable'}', social_mentions: ${randInt(100, 1000)}, product_hunt_upvotes: ${rng() > 0.3 ? randInt(100, 800) : 0} },
    source_count: ${randInt(3, 15)},
    weekly_growth_rate: ${weeklyGrowth},
    monthly_growth_rate: ${monthlyGrowth},
    github_stars: ${githubStars},
    rating: ${rating},
    reviewCount: ${reviewCount},
    isVerified: ${isVerified},
    featureTags: [${featureTags.map((t) => `'${t}'`).join(', ')}],
    weeklyDownloads: ${weeklyDownloads},
    monthlyActiveUsers: ${monthlyActiveUsers},
  }`);
  }

  return products;
}

const products = generateProducts(200);

console.log(`// Auto-generated mock data — seed: ${SEED}`);
console.log(`// ${products.length} products`);
console.log(`import { MockProduct } from './types';`);
console.log('');
console.log('export const mockProducts: MockProduct[] = [');
console.log(products.join(',\n'));
console.log('];');

export interface MockProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description?: string;
  category: string;
  tags: string[];
  website_url: string;
  github_url?: string;
  github_stars?: number;
  github_forks?: number;
  pricing_model: 'free' | 'freemium' | 'paid' | 'enterprise' | 'open_source';
  confidence_score: number;
  availability_status: 'active' | 'inactive' | 'deprecated';
  created_at: string;
  updated_at: string;
  logo_url?: string;
  screenshots?: string[];
  maker_info?: {
    name: string;
    twitter?: string;
    github?: string;
    company?: string;
  };
  validation_signals?: {
    has_website: boolean;
    has_privacy_policy: boolean;
    has_terms: boolean;
    has_documentation: boolean;
    has_changelog: boolean;
    has_social_media: boolean;
    has_contact: boolean;
  };
  weekly_growth_rate?: number;
  contributor_count?: number;
  open_issues_count?: number;
  latest_release_date?: string;
}

// ============================================================
// FAMOUS PRODUCTS (50+)
// ============================================================
const famousProducts: MockProduct[] = [
  {
    id: 'prod-001', name: 'ChatGPT', slug: 'chatgpt',
    description: 'OpenAI\'s conversational AI assistant for answering questions, writing, coding, and creative tasks.',
    long_description: 'ChatGPT is a large language model developed by OpenAI that can understand and generate human-like text. It supports a wide range of tasks including answering questions, writing essays, debugging code, and creative brainstorming. Powered by the GPT-4 architecture, it offers advanced reasoning and multimodal capabilities.',
    category: 'Chatbot', tags: ['LLM', 'Conversational AI', 'Writing', 'Coding', 'Assistant'],
    website_url: 'https://chat.openai.com', github_url: 'https://github.com/openai', github_stars: 520000, github_forks: 98000,
    pricing_model: 'freemium', confidence_score: 99, availability_status: 'active',
    created_at: '2022-11-30T00:00:00Z', updated_at: '2025-06-15T00:00:00Z',
    maker_info: { name: 'Sam Altman', twitter: '@sama', company: 'OpenAI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12, contributor_count: 1200, open_issues_count: 340, latest_release_date: '2025-06-01'
  },
  {
    id: 'prod-002', name: 'Claude', slug: 'claude',
    description: 'Anthropic\'s AI assistant designed to be helpful, harmless, and honest with advanced reasoning capabilities.',
    long_description: 'Claude is a next-generation AI assistant built by Anthropic using Constitutional AI techniques. It excels at complex reasoning, code generation, document analysis, and multi-step problem solving. Claude 3.5 Sonnet offers industry-leading performance across vision, coding, and writing tasks.',
    category: 'Chatbot', tags: ['LLM', 'Conversational AI', 'Coding', 'Analysis', 'Safety'],
    website_url: 'https://claude.ai', pricing_model: 'freemium', confidence_score: 98, availability_status: 'active',
    created_at: '2023-03-14T00:00:00Z', updated_at: '2025-06-10T00:00:00Z',
    maker_info: { name: 'Dario Amodei', twitter: '@DarioAmodei', company: 'Anthropic' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.18, latest_release_date: '2025-05-20'
  },
  {
    id: 'prod-003', name: 'Midjourney', slug: 'midjourney',
    description: 'AI image generation platform creating stunning artwork from text prompts with exceptional artistic quality.',
    long_description: 'Midjourney is an AI-powered image generation tool that creates highly detailed, artistic images from text descriptions. Operating primarily through Discord, it has become one of the most popular tools for digital artists, designers, and creative professionals. Version 6 offers photorealistic rendering and improved prompt understanding.',
    category: 'Image', tags: ['Image Generation', 'Art', 'Creative', 'Design', 'AI Art'],
    website_url: 'https://midjourney.com', pricing_model: 'paid', confidence_score: 97, availability_status: 'active',
    created_at: '2022-07-12T00:00:00Z', updated_at: '2025-05-28T00:00:00Z',
    maker_info: { name: 'David Holz', twitter: '@middlekarma', company: 'Midjourney Inc.' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.09, latest_release_date: '2025-04-15'
  },
  {
    id: 'prod-004', name: 'Runway', slug: 'runway',
    description: 'AI-powered creative suite for video editing, generation, and visual effects with industry-leading tools.',
    long_description: 'Runway is an applied AI research company shaping the next era of content creation. Their Gen-3 Alpha model produces high-fidelity video generation with precise motion control. The platform offers a comprehensive suite of AI tools for video editing, green screen removal, motion tracking, and more.',
    category: 'Video', tags: ['Video Generation', 'Editing', 'VFX', 'Creative', 'GenAI'],
    website_url: 'https://runwayml.com', pricing_model: 'freemium', confidence_score: 95, availability_status: 'active',
    created_at: '2022-06-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Cristóbal Valenzuela', twitter: '@cwvalenzuela', company: 'Runway' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.15, latest_release_date: '2025-05-10'
  },
  {
    id: 'prod-005', name: 'Jasper AI', slug: 'jasper-ai',
    description: 'Enterprise AI content platform for marketing teams to create copy, blog posts, and campaigns at scale.',
    long_description: 'Jasper is an AI content platform that helps marketing teams generate high-quality copy, blog posts, social media content, and more. Built specifically for business use cases, it offers brand voice customization, template libraries, and collaboration features for teams.',
    category: 'Writing', tags: ['Content Creation', 'Marketing', 'Copywriting', 'Enterprise', 'Blog'],
    website_url: 'https://jasper.ai', pricing_model: 'paid', confidence_score: 93, availability_status: 'active',
    created_at: '2022-01-15T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Dave Rogenmoser', twitter: '@daviderogenmoser', company: 'Jasper' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06, latest_release_date: '2025-04-25'
  },
  {
    id: 'prod-006', name: 'Copy.ai', slug: 'copy-ai',
    description: 'AI-powered copywriting tool for creating marketing content, emails, social posts, and product descriptions.',
    category: 'Writing', tags: ['Copywriting', 'Marketing', 'Social Media', 'Email', 'Content'],
    website_url: 'https://copy.ai', pricing_model: 'freemium', confidence_score: 89, availability_status: 'active',
    created_at: '2022-03-01T00:00:00Z', updated_at: '2025-04-15T00:00:00Z',
    maker_info: { name: 'Chris Lu', company: 'Copy.ai' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04, latest_release_date: '2025-03-20'
  },
  {
    id: 'prod-007', name: 'GrammarlyGO', slug: 'grammarly-go',
    description: 'AI writing assistant integrated into Grammarly for tone adjustment, rewriting, and content generation.',
    long_description: 'GrammarlyGO brings generative AI into the trusted Grammarly writing platform. It helps users adjust tone, rewrite sentences, generate drafts, and improve communication across emails, documents, and messages. Integrated with 500,000+ apps and websites.',
    category: 'Writing', tags: ['Writing Assistant', 'Grammar', 'Tone', 'Productivity', 'Communication'],
    website_url: 'https://grammarly.com', pricing_model: 'freemium', confidence_score: 94, availability_status: 'active',
    created_at: '2022-04-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Alex Shevchenko', company: 'Grammarly' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-008', name: 'Notion AI', slug: 'notion-ai',
    description: 'AI-powered writing and summarization built into Notion workspace for notes, docs, and project management.',
    long_description: 'Notion AI integrates generative AI directly into the Notion workspace, allowing users to summarize long documents, brainstorm ideas, rewrite content, and automate routine writing tasks. It works seamlessly with existing Notion pages, databases, and workflows.',
    category: 'Productivity', tags: ['Note-taking', 'Workspace', 'Writing', 'Summarization', 'AI'],
    website_url: 'https://notion.so', pricing_model: 'paid', confidence_score: 96, availability_status: 'active',
    created_at: '2023-02-22T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Ivan Zhao', twitter: '@ivanhzhao', company: 'Notion Labs' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10
  },
  {
    id: 'prod-009', name: 'GitHub Copilot', slug: 'github-copilot',
    description: 'AI pair programmer that suggests code completions and entire functions in real-time across IDEs.',
    long_description: 'GitHub Copilot is an AI-powered code completion tool trained on billions of lines of public code. It suggests entire functions, methods, and code blocks as you type, supporting dozens of programming languages and frameworks. Copilot Chat enables conversational code assistance directly in your editor.',
    category: 'Coding', tags: ['Code Completion', 'IDE', 'Developer Tools', 'AI Pair Programmer', 'GitHub'],
    website_url: 'https://github.com/features/copilot', github_url: 'https://github.com/features/copilot', github_stars: 210000, github_forks: 35000,
    pricing_model: 'paid', confidence_score: 98, availability_status: 'active',
    created_at: '2022-06-21T00:00:00Z', updated_at: '2025-06-12T00:00:00Z',
    maker_info: { name: 'GitHub', company: 'Microsoft' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.14, contributor_count: 850, open_issues_count: 220, latest_release_date: '2025-06-01'
  },
  {
    id: 'prod-010', name: 'Cursor', slug: 'cursor',
    description: 'AI-first code editor with deep codebase understanding, multi-file edits, and natural language commands.',
    long_description: 'Cursor is a fork of VS Code rebuilt with AI at its core. It understands your entire codebase, can make multi-file changes from a single prompt, and offers an AI-native editing experience. Features include codebase Q&A, automatic bug fixing, and natural language code generation.',
    category: 'Coding', tags: ['Code Editor', 'AI IDE', 'Developer Tools', 'Refactoring', 'Code Generation'],
    website_url: 'https://cursor.com', pricing_model: 'freemium', confidence_score: 96, availability_status: 'active',
    created_at: '2023-05-15T00:00:00Z', updated_at: '2025-06-14T00:00:00Z',
    maker_info: { name: 'Michael Truzhin', twitter: '@michaeltruzhin', company: 'Anysphere' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.38, latest_release_date: '2025-06-10'
  },
  {
    id: 'prod-011', name: 'Vercel AI SDK', slug: 'vercel-ai-sdk',
    description: 'Open-source toolkit for building AI-powered applications with React, Next.js, and streaming support.',
    long_description: 'The Vercel AI SDK provides a unified interface for building AI applications across multiple providers. It supports streaming, tool calling, and framework integrations with React Server Components, Next.js, SvelteKit, and Nuxt. The SDK simplifies chat UIs, RAG pipelines, and agent workflows.',
    category: 'Coding', tags: ['SDK', 'Framework', 'React', 'Next.js', 'Streaming', 'Open Source'],
    website_url: 'https://sdk.vercel.ai', github_url: 'https://github.com/vercel/ai', github_stars: 34000, github_forks: 4200,
    pricing_model: 'open_source', confidence_score: 92, availability_status: 'active',
    created_at: '2023-04-10T00:00:00Z', updated_at: '2025-06-08T00:00:00Z',
    maker_info: { name: 'Vercel', twitter: '@vercel', company: 'Vercel' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.22, contributor_count: 420, open_issues_count: 85, latest_release_date: '2025-05-30'
  },
  {
    id: 'prod-012', name: 'LangChain', slug: 'langchain',
    description: 'Framework for building applications powered by large language models with composable components.',
    long_description: 'LangChain is a framework for developing applications powered by language models. It provides abstractions for working with LLMs, including prompt management, chains, agents, and retrieval. The ecosystem includes LangSmith for observability and LangGraph for building stateful, multi-actor applications.',
    category: 'Coding', tags: ['Framework', 'LLM', 'Agent', 'RAG', 'Open Source', 'Python'],
    website_url: 'https://langchain.com', github_url: 'https://github.com/langchain-ai/langchain', github_stars: 92000, github_forks: 15000,
    pricing_model: 'open_source', confidence_score: 97, availability_status: 'active',
    created_at: '2022-10-17T00:00:00Z', updated_at: '2025-06-11T00:00:00Z',
    maker_info: { name: 'Harrison Chase', twitter: '@hwchase17', company: 'LangChain' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.16, contributor_count: 3200, open_issues_count: 540, latest_release_date: '2025-06-05'
  },
  {
    id: 'prod-013', name: 'LlamaIndex', slug: 'llamaindex',
    description: 'Data framework for connecting custom data sources to large language models for RAG applications.',
    long_description: 'LlamaIndex (formerly GPT Index) is a data framework for LLM applications that provides tools for ingesting, structuring, and accessing private or domain-specific data. It supports complex retrieval patterns including hybrid search, knowledge graphs, and multi-step reasoning over documents.',
    category: 'Coding', tags: ['RAG', 'Data Framework', 'LLM', 'Search', 'Open Source', 'Python'],
    website_url: 'https://llamaindex.ai', github_url: 'https://github.com/run-llama/llama_index', github_stars: 35000, github_forks: 5200,
    pricing_model: 'open_source', confidence_score: 94, availability_status: 'active',
    created_at: '2022-11-28T00:00:00Z', updated_at: '2025-06-07T00:00:00Z',
    maker_info: { name: 'Jerry Liu', twitter: '@jerryjliu0', company: 'LlamaIndex' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.19, contributor_count: 1800, open_issues_count: 310, latest_release_date: '2025-05-28'
  },
  {
    id: 'prod-014', name: 'Hugging Face', slug: 'hugging-face',
    description: 'Platform for building, training, and deploying machine learning models with 500K+ open models.',
    long_description: 'Hugging Face is the AI community platform hosting the largest collection of open-source models, datasets, and demos. It provides tools for model training, inference, and deployment, along with collaborative spaces for researchers and developers. The Transformers library is the de facto standard for NLP.',
    category: 'Coding', tags: ['ML Platform', 'Models', 'Open Source', 'NLP', 'Community', 'Transformers'],
    website_url: 'https://huggingface.co', github_url: 'https://github.com/huggingface', github_stars: 140000, github_forks: 28000,
    pricing_model: 'freemium', confidence_score: 99, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-06-14T00:00:00Z',
    maker_info: { name: 'Clément Delangue', twitter: '@ClementDelangue', company: 'Hugging Face' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.11, contributor_count: 5600, open_issues_count: 890, latest_release_date: '2025-06-12'
  },
  {
    id: 'prod-015', name: 'Stability AI', slug: 'stability-ai',
    description: 'Open-source AI company behind Stable Diffusion, offering image, video, and 3D generation models.',
    long_description: 'Stability AI is the company behind Stable Diffusion, one of the most popular open-source image generation models. They also develop models for video generation (Stable Video Diffusion), 3D model creation (Stable Zero123), and language processing. Their models are widely used in creative and research communities.',
    category: 'Image', tags: ['Stable Diffusion', 'Open Source', 'Image Generation', '3D', 'Video'],
    website_url: 'https://stability.ai', github_url: 'https://github.com/Stability-AI', github_stars: 45000, github_forks: 7800,
    pricing_model: 'freemium', confidence_score: 93, availability_status: 'active',
    created_at: '2022-08-22T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'Christian Laforte', twitter: '@christianlaforte', company: 'Stability AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07, contributor_count: 980, open_issues_count: 210, latest_release_date: '2025-04-18'
  },
  {
    id: 'prod-016', name: 'DALL-E', slug: 'dall-e',
    description: 'OpenAI\'s image generation model creating realistic images and art from natural language descriptions.',
    long_description: 'DALL-E 3 is OpenAI\'s latest text-to-image model, generating high-quality, detailed images from natural language prompts. It integrates with ChatGPT for conversational image creation and offers strong prompt adherence, text rendering in images, and style customization capabilities.',
    category: 'Image', tags: ['Image Generation', 'Text-to-Image', 'Creative', 'OpenAI', 'Art'],
    website_url: 'https://openai.com/dall-e', pricing_model: 'paid', confidence_score: 96, availability_status: 'active',
    created_at: '2022-04-06T00:00:00Z', updated_at: '2025-05-30T00:00:00Z',
    maker_info: { name: 'OpenAI', twitter: '@OpenAI', company: 'OpenAI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-017', name: 'Sora', slug: 'sora',
    description: 'OpenAI\'s text-to-video model generating realistic, minute-long videos from text descriptions.',
    long_description: 'Sora is OpenAI\'s text-to-video model capable of generating high-fidelity, minute-long videos from text prompts. It can create multiple shots, complex scenes with accurate motion, and even extend existing videos. The model understands physics, camera movements, and scene composition.',
    category: 'Video', tags: ['Text-to-Video', 'Video Generation', 'OpenAI', 'Creative', 'Multimodal'],
    website_url: 'https://openai.com/sora', pricing_model: 'paid', confidence_score: 90, availability_status: 'active',
    created_at: '2024-02-15T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'OpenAI', twitter: '@OpenAI', company: 'OpenAI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: false, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.25
  },
  {
    id: 'prod-018', name: 'ElevenLabs', slug: 'elevenlabs',
    description: 'AI voice synthesis platform for realistic text-to-speech, voice cloning, and dubbing in 32+ languages.',
    long_description: 'ElevenLabs provides the most advanced AI voice platform, offering realistic text-to-speech with emotional range, voice cloning from short samples, and automated dubbing across 32+ languages. Used by creators, publishers, and enterprises for audiobooks, video content, and interactive applications.',
    category: 'Audio', tags: ['Text-to-Speech', 'Voice Cloning', 'Dubbing', 'Audio', 'Multilingual'],
    website_url: 'https://elevenlabs.io', pricing_model: 'freemium', confidence_score: 95, availability_status: 'active',
    created_at: '2023-01-10T00:00:00Z', updated_at: '2025-06-03T00:00:00Z',
    maker_info: { name: 'Matty Berman', twitter: '@mattyboi', company: 'ElevenLabs' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.20, latest_release_date: '2025-05-15'
  },
  {
    id: 'prod-019', name: 'Otter.ai', slug: 'otter-ai',
    description: 'AI meeting assistant that records, transcribes, and summarizes meetings in real-time.',
    long_description: 'Otter.ai is an AI-powered meeting assistant that provides real-time transcription, automatic meeting summaries, and action item extraction. It integrates with Zoom, Google Meet, and Microsoft Teams, making it essential for teams that need to capture and share meeting insights efficiently.',
    category: 'Productivity', tags: ['Transcription', 'Meetings', 'Notes', 'AI Assistant', 'Collaboration'],
    website_url: 'https://otter.ai', pricing_model: 'freemium', confidence_score: 91, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-05-18T00:00:00Z',
    maker_info: { name: 'Sam Liang', twitter: '@samliang', company: 'Otter.ai' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-020', name: 'Descript', slug: 'descript',
    description: 'All-in-one audio/video editing platform with AI-powered transcription, overdub, and screen recording.',
    long_description: 'Descript is a collaborative audio and video editing platform that works like a word processor. Edit video by editing text, remove filler words automatically, clone your voice with Overdub, and create AI-generated video avatars. It combines transcription, editing, and publishing in one tool.',
    category: 'Video', tags: ['Video Editing', 'Audio Editing', 'Transcription', 'Overdub', 'Screen Recording'],
    website_url: 'https://descript.com', pricing_model: 'freemium', confidence_score: 92, availability_status: 'active',
    created_at: '2022-02-15T00:00:00Z', updated_at: '2025-05-22T00:00:00Z',
    maker_info: { name: 'Andrew Mason', twitter: '@andrewmason', company: 'Descript' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07, latest_release_date: '2025-04-28'
  },
  {
    id: 'prod-021', name: 'Synthesia', slug: 'synthesia',
    description: 'AI video generation platform creating professional videos with AI avatars in 130+ languages.',
    long_description: 'Synthesia enables anyone to create professional-quality videos using AI avatars. Simply type your script, choose from 160+ diverse AI avatars, and generate videos in 130+ languages. Used by enterprises for training, onboarding, marketing, and internal communications.',
    category: 'Video', tags: ['AI Avatar', 'Video Generation', 'Enterprise', 'Training', 'Multilingual'],
    website_url: 'https://synthesia.io', pricing_model: 'paid', confidence_score: 93, availability_status: 'active',
    created_at: '2022-03-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Victor Riparbelli', twitter: '@VictorRiparbelli', company: 'Synthesia' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-022', name: 'Loom AI', slug: 'loom-ai',
    description: 'AI-powered video messaging with automatic summaries, chapter generation, and smart editing.',
    long_description: 'Loom AI enhances the popular video messaging platform with AI features that automatically generate titles, summaries, chapters, and action items from your recordings. It removes filler words, suggests edits, and makes async communication more efficient.',
    category: 'Productivity', tags: ['Video Messaging', 'Async', 'Summarization', 'Communication', 'Atlassian'],
    website_url: 'https://loom.com', pricing_model: 'freemium', confidence_score: 89, availability_status: 'active',
    created_at: '2022-05-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Joe Thomas', company: 'Loom (Atlassian)' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-023', name: 'Figma AI', slug: 'figma-ai',
    description: 'AI design features in Figma for generating layouts, editing images, and automating design workflows.',
    long_description: 'Figma AI brings generative AI capabilities to the leading design tool. Features include Make Designs for generating UI from prompts, Visual Search for finding similar design elements, and AI-powered image editing. It accelerates the design workflow from concept to prototype.',
    category: 'Design', tags: ['UI Design', 'Prototyping', 'AI Design', 'Collaboration', 'Layout'],
    website_url: 'https://figma.com', pricing_model: 'freemium', confidence_score: 94, availability_status: 'active',
    created_at: '2024-06-01T00:00:00Z', updated_at: '2025-06-10T00:00:00Z',
    maker_info: { name: 'Dylan Field', twitter: '@zoink', company: 'Figma (Adobe)' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.13
  },
  {
    id: 'prod-024', name: 'Canva AI', slug: 'canva-ai',
    description: 'AI-powered design platform with Magic Studio for generating images, text, and complete designs.',
    long_description: 'Canva AI (Magic Studio) offers a suite of AI tools including Magic Media for text-to-image generation, Magic Write for copy, Magic Expand for extending images, and Magic Design for generating complete templates. It democratizes design creation for non-designers.',
    category: 'Design', tags: ['Design', 'Templates', 'Magic Studio', 'Text-to-Image', 'Marketing'],
    website_url: 'https://canva.com', pricing_model: 'freemium', confidence_score: 95, availability_status: 'active',
    created_at: '2022-09-01T00:00:00Z', updated_at: '2025-06-08T00:00:00Z',
    maker_info: { name: 'Melanie Perkins', twitter: '@melaniecanva', company: 'Canva' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.09
  },
  {
    id: 'prod-025', name: 'Adobe Firefly', slug: 'adobe-firefly',
    description: 'Adobe\'s generative AI family of models for creating images, vectors, and text effects commercially safely.',
    long_description: 'Adobe Firefly is a family of creative generative AI models trained on Adobe Stock, openly licensed content, and public domain content. It provides commercially safe AI generation for images, vector graphics, text effects, and color palettes, integrated across Creative Cloud applications.',
    category: 'Design', tags: ['Generative AI', 'Creative Cloud', 'Image Generation', 'Vector', 'Commercial'],
    website_url: 'https://firefly.adobe.com', pricing_model: 'freemium', confidence_score: 94, availability_status: 'active',
    created_at: '2023-05-23T00:00:00Z', updated_at: '2025-06-02T00:00:00Z',
    maker_info: { name: 'Adobe', twitter: '@Adobe', company: 'Adobe' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10
  },
  {
    id: 'prod-026', name: 'Shopify AI', slug: 'shopify-ai',
    description: 'AI tools for merchants to generate product descriptions, email campaigns, and store content at scale.',
    long_description: 'Shopify AI (Sidekick) provides intelligent assistance for ecommerce merchants, including product description generation, email campaign creation, customer insights, and store analytics. It helps merchants optimize their stores and create compelling content efficiently.',
    category: 'Marketing', tags: ['Ecommerce', 'Product Descriptions', 'Email', 'Analytics', 'Shopify'],
    website_url: 'https://shopify.com', pricing_model: 'paid', confidence_score: 91, availability_status: 'active',
    created_at: '2023-09-01T00:00:00Z', updated_at: '2025-05-28T00:00:00Z',
    maker_info: { name: 'Tobi Lütke', twitter: '@tobi', company: 'Shopify' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-027', name: 'Replicate', slug: 'replicate',
    description: 'Cloud platform for running open-source AI models with serverless API and GPU infrastructure.',
    long_description: 'Replicate is a cloud platform that lets you run machine learning models with a simple API. It hosts thousands of open-source models including image generation, language models, audio processing, and more. No infrastructure management needed — just call the API and pay per prediction.',
    category: 'Coding', tags: ['ML Infrastructure', 'API', 'GPU', 'Open Source', 'Serverless'],
    website_url: 'https://replicate.com', github_url: 'https://github.com/replicate', github_stars: 12000, github_forks: 1800,
    pricing_model: 'paid', confidence_score: 92, availability_status: 'active',
    created_at: '2022-04-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Ben Firshman', twitter: '@bfirsh', company: 'Replicate' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.14, contributor_count: 280, open_issues_count: 45, latest_release_date: '2025-05-22'
  },
  {
    id: 'prod-028', name: 'OpenRouter', slug: 'openrouter',
    description: 'Unified API access to 200+ AI models from multiple providers with smart routing and cost optimization.',
    long_description: 'OpenRouter provides a single API endpoint to access models from OpenAI, Anthropic, Google, Meta, Mistral, and dozens more providers. It handles model routing, fallbacks, cost optimization, and unified billing. Ideal for applications that need flexibility across AI providers.',
    category: 'Coding', tags: ['API', 'LLM Router', 'Multi-Provider', 'Cost Optimization', 'Developer Tools'],
    website_url: 'https://openrouter.ai', pricing_model: 'freemium', confidence_score: 90, availability_status: 'active',
    created_at: '2023-10-01T00:00:00Z', updated_at: '2025-06-12T00:00:00Z',
    maker_info: { name: 'Alex Lourenco', twitter: '@alex_lourenco1', company: 'OpenRouter' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.28, latest_release_date: '2025-06-08'
  },
  {
    id: 'prod-029', name: 'Perplexity', slug: 'perplexity',
    description: 'AI-powered search engine providing accurate, cited answers with real-time web access.',
    long_description: 'Perplexity AI is a conversational search engine that combines the power of large language models with real-time web search. It provides accurate, sourced answers with inline citations, making it ideal for research, fact-checking, and knowledge discovery. Pro Search enables multi-step reasoning.',
    category: 'Research', tags: ['Search', 'Research', 'LLM', 'Citations', 'Knowledge'],
    website_url: 'https://perplexity.ai', pricing_model: 'freemium', confidence_score: 95, availability_status: 'active',
    created_at: '2022-12-01T00:00:00Z', updated_at: '2025-06-14T00:00:00Z',
    maker_info: { name: 'Aravind Srinivas', twitter: '@AravSrinivas', company: 'Perplexity AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.22
  },
  {
    id: 'prod-030', name: 'Pi (Inflection AI)', slug: 'pi-inflection',
    description: 'Personal AI assistant designed for supportive, emotionally intelligent conversations and knowledge.',
    long_description: 'Pi is a personal AI assistant from Inflection AI designed to be genuinely helpful, supportive, and emotionally aware. It excels at brainstorming, advice, learning, and casual conversation. Inflection AI was later acquired by Microsoft and its technology powers Copilot.',
    category: 'Chatbot', tags: ['Personal AI', 'Emotional AI', 'Conversation', 'Assistant', 'Inflection'],
    website_url: 'https://pi.ai', pricing_model: 'free', confidence_score: 78, availability_status: 'active',
    created_at: '2023-05-02T00:00:00Z', updated_at: '2025-03-15T00:00:00Z',
    maker_info: { name: 'Mustafa Suleyman', twitter: '@mustafasuleyman', company: 'Microsoft' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: false, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.02
  },
  {
    id: 'prod-031', name: 'Character.ai', slug: 'character-ai',
    description: 'Platform for creating and chatting with AI characters, from fictional personas to helpful assistants.',
    long_description: 'Character.ai lets users create custom AI personalities and chat with characters created by others. From fictional characters and celebrities to helpful tutors and roleplay scenarios, it offers an engaging way to interact with AI. Used by millions for entertainment and creative expression.',
    category: 'Chatbot', tags: ['Characters', 'Roleplay', 'Creative', 'Entertainment', 'Chat'],
    website_url: 'https://character.ai', pricing_model: 'freemium', confidence_score: 88, availability_status: 'active',
    created_at: '2022-09-15T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Noam Shazeer', twitter: '@noamshazeer', company: 'Character.ai (Google)' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: false, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-032', name: 'Poe', slug: 'poe',
    description: 'Platform by Quora for accessing multiple AI models including GPT-4, Claude, and open-source options.',
    long_description: 'Poe by Quora provides access to multiple AI models in one place. Users can switch between GPT-4, Claude, Llama, and other models, create custom bots, and build AI-powered applications. It offers a unified subscription for premium model access.',
    category: 'Chatbot', tags: ['Multi-Model', 'Platform', 'Quora', 'Bot Creation', 'LLM'],
    website_url: 'https://poe.com', pricing_model: 'freemium', confidence_score: 90, availability_status: 'active',
    created_at: '2022-12-07T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'Adam D\'Angelo', twitter: '@adamdangelo', company: 'Quora' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-033', name: 'Claude Code', slug: 'claude-code',
    description: 'Anthropic\'s agentic coding tool that plans, debugs, and writes code directly in your terminal.',
    long_description: 'Claude Code is an agentic coding assistant from Anthropic that works directly in your terminal. It can plan features, debug complex issues, write and test code, and refactor large codebases. It understands project context and can handle multi-file changes autonomously.',
    category: 'Coding', tags: ['Agentic Coding', 'Terminal', 'Code Generation', 'Debugging', 'Refactoring'],
    website_url: 'https://claude.ai/code', pricing_model: 'paid', confidence_score: 93, availability_status: 'active',
    created_at: '2025-03-25T00:00:00Z', updated_at: '2025-06-10T00:00:00Z',
    maker_info: { name: 'Anthropic', twitter: '@AnthropicAI', company: 'Anthropic' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.42, latest_release_date: '2025-06-05'
  },
  {
    id: 'prod-034', name: 'Windsurf', slug: 'windsurf',
    description: 'AI-powered IDE by Codeium with multi-file agentic coding, deep codebase awareness, and Cascades.',
    long_description: 'Windsurf by Codeium is an AI-first IDE that combines agentic coding with deep codebase understanding. Its Cascade feature enables multi-step workflows where the AI plans, implements, and tests changes across your entire project. Supports all major languages and frameworks.',
    category: 'Coding', tags: ['AI IDE', 'Agentic Coding', 'Codeium', 'Code Generation', 'Developer Tools'],
    website_url: 'https://windsurf.com', pricing_model: 'freemium', confidence_score: 91, availability_status: 'active',
    created_at: '2024-10-01T00:00:00Z', updated_at: '2025-06-08T00:00:00Z',
    maker_info: { name: 'Codeium', company: 'Exafunction' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.32, latest_release_date: '2025-05-30'
  },
  {
    id: 'prod-035', name: 'Aider', slug: 'aider',
    description: 'AI pair programming in your terminal using GPT-4 and Claude to edit code in your local git repo.',
    long_description: 'Aider is AI pair programming in your terminal. It works with your existing editor and git repository, allowing GPT-4 and Claude to edit code in-place. It handles codebase-wide changes, writes tests, fixes bugs, and commits changes with descriptive messages.',
    category: 'Coding', tags: ['Terminal', 'Pair Programming', 'Git', 'CLI', 'Open Source'],
    website_url: 'https://aider.chat', github_url: 'https://github.com/Aider-AI/aider', github_stars: 18000, github_forks: 2100,
    pricing_model: 'open_source', confidence_score: 90, availability_status: 'active',
    created_at: '2023-05-14T00:00:00Z', updated_at: '2025-06-11T00:00:00Z',
    maker_info: { name: 'Paul Gauthier', twitter: '@skunkwerk', company: '' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.24, contributor_count: 380, open_issues_count: 95, latest_release_date: '2025-06-09'
  },
  {
    id: 'prod-036', name: 'Continue', slug: 'continue',
    description: 'Open-source autopilot for software development bringing AI coding assistance to VS Code and JetBrains.',
    long_description: 'Continue is an open-source IDE extension that brings the power of AI coding assistants to VS Code and JetBrains. It supports tab autocomplete, natural language editing, chat with your codebase, and custom model configuration. Works with any LLM provider.',
    category: 'Coding', tags: ['Open Source', 'VS Code', 'JetBrains', 'Autocomplete', 'Chat'],
    website_url: 'https://continue.dev', github_url: 'https://github.com/continuedev/continue', github_stars: 15000, github_forks: 1900,
    pricing_model: 'open_source', confidence_score: 89, availability_status: 'active',
    created_at: '2023-06-01T00:00:00Z', updated_at: '2025-06-06T00:00:00Z',
    maker_info: { name: 'Nate Sestina', twitter: '@nate_sestina', company: 'Continue.dev' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.18, contributor_count: 520, open_issues_count: 140, latest_release_date: '2025-06-02'
  },
  {
    id: 'prod-037', name: 'Supermaven', slug: 'supermaven',
    description: 'Ultra-fast AI code completion with 1M token context window and sub-30ms response times.',
    long_description: 'Supermaven offers blazing-fast AI code completion with an industry-leading 1 million token context window. It understands your entire codebase and provides suggestions in under 30 milliseconds. Available as VS Code and JetBrains extensions.',
    category: 'Coding', tags: ['Code Completion', 'Fast', 'Large Context', 'IDE', 'Developer Tools'],
    website_url: 'https://supermaven.com', pricing_model: 'freemium', confidence_score: 85, availability_status: 'active',
    created_at: '2024-03-15T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Supermaven', company: 'Supermaven' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.16
  },
  {
    id: 'prod-038', name: 'Tabnine', slug: 'tabnine',
    description: 'AI code assistant providing personalized code completions trained on your team\'s codebase.',
    long_description: 'Tabnine is an AI code assistant that provides personalized code completions, full-line suggestions, and natural language to code. It can be trained on your team\'s private codebase for domain-specific suggestions, with enterprise-grade security and compliance.',
    category: 'Coding', tags: ['Code Completion', 'Enterprise', 'Security', 'Personalized', 'IDE'],
    website_url: 'https://tabnine.com', pricing_model: 'freemium', confidence_score: 88, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-05-12T00:00:00Z',
    maker_info: { name: 'Tabnine', company: 'Tabnine' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-039', name: 'Phind', slug: 'phind',
    description: 'AI search engine for developers with real-time web access, code examples, and technical answers.',
    long_description: 'Phind is an AI search engine built specifically for developers. It provides technical answers with code examples, real-time web access for latest information, and understands complex programming questions. The Pro version offers GPT-4 level reasoning.',
    category: 'Research', tags: ['Developer Tools', 'Search', 'Code Examples', 'Technical', 'Q&A'],
    website_url: 'https://phind.com', pricing_model: 'freemium', confidence_score: 86, availability_status: 'active',
    created_at: '2023-03-01T00:00:00Z', updated_at: '2025-04-28T00:00:00Z',
    maker_info: { name: 'Michael Royzen', company: 'Phind' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: false, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-040', name: 'v0.dev', slug: 'v0-dev',
    description: 'Vercel\'s AI-powered UI generator creating React components from text descriptions.',
    long_description: 'v0 by Vercel generates production-ready React components from text prompts using AI. It creates accessible, styled components using Tailwind CSS and shadcn/ui. Iterate on designs through conversation, copy the code directly, or deploy instantly.',
    category: 'Coding', tags: ['UI Generation', 'React', 'Tailwind', 'Vercel', 'Components'],
    website_url: 'https://v0.dev', pricing_model: 'freemium', confidence_score: 92, availability_status: 'active',
    created_at: '2023-11-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Vercel', twitter: '@vercel', company: 'Vercel' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.20
  },
  {
    id: 'prod-041', name: 'Bolt.new', slug: 'bolt-new',
    description: 'AI-powered full-stack web development platform that builds and deploys apps from natural language.',
    long_description: 'Bolt.new by StackBlitz lets you build, deploy, and iterate on full-stack web applications using natural language prompts. It runs entirely in the browser using WebContainers, providing instant development environments with zero setup. Supports React, Vue, Svelte, and more.',
    category: 'Coding', tags: ['Full-Stack', 'Web Development', 'No-Code', 'Browser IDE', 'StackBlitz'],
    website_url: 'https://bolt.new', pricing_model: 'freemium', confidence_score: 90, availability_status: 'active',
    created_at: '2024-07-01T00:00:00Z', updated_at: '2025-06-10T00:00:00Z',
    maker_info: { name: 'StackBlitz', twitter: '@StackBlitz', company: 'StackBlitz' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.26
  },
  {
    id: 'prod-042', name: 'Lovable', slug: 'lovable',
    description: 'AI software engineer that builds full web applications from descriptions with Supabase integration.',
    long_description: 'Lovable is an AI software engineer that transforms ideas into production-ready web applications. It handles frontend, backend, and database setup with Supabase integration. Users describe what they want, and Lovable generates, deploys, and iterates on the complete application.',
    category: 'Coding', tags: ['Full-Stack', 'App Builder', 'Supabase', 'Deployment', 'AI Engineer'],
    website_url: 'https://lovable.dev', pricing_model: 'freemium', confidence_score: 88, availability_status: 'active',
    created_at: '2024-09-01T00:00:00Z', updated_at: '2025-06-08T00:00:00Z',
    maker_info: { name: 'Lovable', company: 'Lovable' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.30
  },
  {
    id: 'prod-043', name: 'Replit Agent', slug: 'replit-agent',
    description: 'Autonomous AI agent in Replit that plans and builds complete applications from natural language.',
    long_description: 'Replit Agent is an autonomous AI that can plan, write, debug, and deploy complete applications from a natural language description. It handles project setup, dependency management, testing, and deployment on Replit\'s cloud infrastructure.',
    category: 'Agent', tags: ['Autonomous Agent', 'App Builder', 'Cloud IDE', 'Deployment', 'Replit'],
    website_url: 'https://replit.com', pricing_model: 'paid', confidence_score: 89, availability_status: 'active',
    created_at: '2024-09-26T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Amjad Masad', twitter: '@amasad', company: 'Replit' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.22
  },
  {
    id: 'prod-044', name: 'Google AI Studio', slug: 'google-ai-studio',
    description: 'Browser-based IDE for rapidly prototyping with Gemini models and building generative AI apps.',
    long_description: 'Google AI Studio (now part of Gemini) is a browser-based tool for prototyping with Google\'s Gemini models. It offers prompt design, system instructions, function calling, and code export. Ideal for quickly testing and iterating on generative AI applications.',
    category: 'Coding', tags: ['Gemini', 'Prototyping', 'IDE', 'Google', 'Prompt Engineering'],
    website_url: 'https://aistudio.google.com', pricing_model: 'freemium', confidence_score: 94, availability_status: 'active',
    created_at: '2023-12-06T00:00:00Z', updated_at: '2025-06-10T00:00:00Z',
    maker_info: { name: 'Google DeepMind', company: 'Google' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.14
  },
  {
    id: 'prod-045', name: 'Vertex AI', slug: 'vertex-ai',
    description: 'Google Cloud\'s unified ML platform for building, deploying, and managing AI models at enterprise scale.',
    long_description: 'Vertex AI is Google Cloud\'s end-to-end machine learning platform. It provides tools for data preparation, model training, evaluation, deployment, and monitoring. With pre-built APIs for vision, language, and speech, plus AutoML for custom model training.',
    category: 'Coding', tags: ['ML Platform', 'Enterprise', 'Google Cloud', 'AutoML', 'MLOps'],
    website_url: 'https://cloud.google.com/vertex-ai', pricing_model: 'paid', confidence_score: 93, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Google Cloud', company: 'Google' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-046', name: 'Amazon Bedrock', slug: 'amazon-bedrock',
    description: 'AWS managed service providing access to leading foundation models through a single API.',
    long_description: 'Amazon Bedrock is a fully managed service that provides access to high-performing foundation models from leading AI companies through a single API. It supports model customization, RAG, agents, and enterprise-grade security. Choose from Claude, Llama, Titan, and more.',
    category: 'Coding', tags: ['AWS', 'Foundation Models', 'Enterprise', 'API', 'MLOps'],
    website_url: 'https://aws.amazon.com/bedrock', pricing_model: 'paid', confidence_score: 92, availability_status: 'active',
    created_at: '2023-09-25T00:00:00Z', updated_at: '2025-05-28T00:00:00Z',
    maker_info: { name: 'AWS', company: 'Amazon' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.11
  },
  {
    id: 'prod-047', name: 'Azure OpenAI', slug: 'azure-openai',
    description: 'Microsoft Azure\'s enterprise-ready access to OpenAI models with security, compliance, and SLAs.',
    long_description: 'Azure OpenAI Service provides enterprise-grade access to OpenAI\'s GPT-4, GPT-4o, DALL-E, Whisper, and embedding models. It offers Azure\'s security features including private networking, data encryption, and responsible AI content filtering, with guaranteed SLAs.',
    category: 'Coding', tags: ['Azure', 'OpenAI', 'Enterprise', 'Security', 'GPT-4'],
    website_url: 'https://azure.microsoft.com/openai', pricing_model: 'paid', confidence_score: 93, availability_status: 'active',
    created_at: '2022-06-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Microsoft Azure', company: 'Microsoft' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.09
  },
  {
    id: 'prod-048', name: 'Sourcegraph Cody', slug: 'sourcegraph-cody',
    description: 'AI coding assistant with deep codebase context using Sourcegraph\'s code search and indexing.',
    long_description: 'Cody is Sourcegraph\'s AI coding assistant that leverages deep codebase understanding through code search and indexing. It answers questions about your codebase, generates code with full context, and provides automated code reviews. Available across all major IDEs.',
    category: 'Coding', tags: ['Code Search', 'Codebase Context', 'IDE', 'Code Review', 'Developer Tools'],
    website_url: 'https://sourcegraph.com/cody', github_url: 'https://github.com/sourcegraph/cody', github_stars: 3200, github_forks: 480,
    pricing_model: 'freemium', confidence_score: 87, availability_status: 'active',
    created_at: '2023-05-10T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Sourcegraph', twitter: '@sourcegraph', company: 'Sourcegraph' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10, contributor_count: 180, open_issues_count: 65, latest_release_date: '2025-05-15'
  },
  {
    id: 'prod-049', name: 'Codeium', slug: 'codeium',
    description: 'Free AI code completion and chat assistant supporting 70+ languages and major IDEs.',
    long_description: 'Codeium offers free AI-powered code completion and chat for developers. It provides autocomplete suggestions, function-level completions, and a chat interface for codebase questions. Supports 70+ programming languages across VS Code, JetBrains, Vim, and more.',
    category: 'Coding', tags: ['Code Completion', 'Free', 'Multi-Language', 'Chat', 'IDE'],
    website_url: 'https://codeium.com', pricing_model: 'free', confidence_score: 88, availability_status: 'active',
    created_at: '2022-11-01T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'Varun Mohan', company: 'Exafunction' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12
  },
  {
    id: 'prod-050', name: 'Tempo', slug: 'tempo-labs',
    description: 'Visual AI development environment for building production-ready apps with click-to-deploy workflows.',
    long_description: 'Tempo Labs provides a visual development environment where you can build apps with AI through a combination of visual editing and code generation. It supports React component creation, layout design, and one-click deployment to major cloud providers.',
    category: 'Coding', tags: ['Visual Development', 'React', 'App Builder', 'Deployment', 'Low-Code'],
    website_url: 'https://tempolabs.ai', pricing_model: 'freemium', confidence_score: 82, availability_status: 'active',
    created_at: '2024-06-15T00:00:00Z', updated_at: '2025-05-18T00:00:00Z',
    maker_info: { name: 'Tempo Labs', company: 'Tempo Labs' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.15
  },
];

// ============================================================
// EMERGING / MID-TIER PRODUCTS (100)
// ============================================================
const emergingProducts: MockProduct[] = [
  {
    id: 'prod-101', name: 'Zapier Central', slug: 'zapier-central',
    description: 'AI-powered automation that learns your workflows and creates intelligent bots for routine tasks.',
    category: 'Productivity', tags: ['Automation', 'Workflow', 'Bots', 'Integration', 'No-Code'],
    website_url: 'https://zapier.com/central', pricing_model: 'freemium', confidence_score: 85, availability_status: 'active',
    created_at: '2024-02-01T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Zapier', company: 'Zapier' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.14
  },
  {
    id: 'prod-102', name: 'Mintlify', slug: 'mintlify',
    description: 'AI-powered documentation platform that auto-generates and maintains technical docs from code.',
    category: 'Coding', tags: ['Documentation', 'Technical Writing', 'Auto-Generation', 'Developer Tools'],
    website_url: 'https://mintlify.com', github_url: 'https://github.com/mintlify', github_stars: 8500, github_forks: 920,
    pricing_model: 'freemium', confidence_score: 87, availability_status: 'active',
    created_at: '2023-06-01T00:00:00Z', updated_at: '2025-05-28T00:00:00Z',
    maker_info: { name: 'Han Wang', twitter: '@hanwen112', company: 'Mintlify' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.16, contributor_count: 120, open_issues_count: 32, latest_release_date: '2025-05-20'
  },
  {
    id: 'prod-103', name: 'Gamma', slug: 'gamma-app',
    description: 'AI-powered presentation and document creation tool with beautiful templates and one-click design.',
    category: 'Productivity', tags: ['Presentations', 'Documents', 'Design', 'Templates', 'Content'],
    website_url: 'https://gamma.app', pricing_model: 'freemium', confidence_score: 88, availability_status: 'active',
    created_at: '2023-07-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Grant Lee', company: 'Gamma' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.18
  },
  {
    id: 'prod-104', name: 'Tome', slug: 'tome-app',
    description: 'AI-native storytelling platform for creating compelling presentations, pitch decks, and narratives.',
    category: 'Productivity', tags: ['Storytelling', 'Presentations', 'Pitch Decks', 'Narrative', 'Design'],
    website_url: 'https://tome.app', pricing_model: 'freemium', confidence_score: 83, availability_status: 'active',
    created_at: '2023-01-15T00:00:00Z', updated_at: '2025-04-25T00:00:00Z',
    maker_info: { name: 'Keith Peiris', company: 'Tome' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-105', name: 'Pika', slug: 'pika-labs',
    description: 'AI video creation platform for generating and editing videos with text prompts and image input.',
    category: 'Video', tags: ['Video Generation', 'Text-to-Video', 'Editing', 'Creative', 'AI Video'],
    website_url: 'https://pika.art', pricing_model: 'freemium', confidence_score: 86, availability_status: 'active',
    created_at: '2023-06-22T00:00:00Z', updated_at: '2025-05-30T00:00:00Z',
    maker_info: { name: 'Demi Guo', twitter: '@demiguoo', company: 'Pika Labs' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12
  },
  {
    id: 'prod-106', name: 'Kling AI', slug: 'kling-ai',
    description: 'Advanced AI video generation model producing high-quality, realistic video from text and image prompts.',
    category: 'Video', tags: ['Video Generation', 'Realistic', 'Text-to-Video', 'Kuaishou', 'Creative'],
    website_url: 'https://klingai.com', pricing_model: 'freemium', confidence_score: 84, availability_status: 'active',
    created_at: '2024-06-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Kuaishou', company: 'Kuaishou Technology' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.20
  },
  {
    id: 'prod-107', name: 'Minimax (Hailuo AI)', slug: 'minimax-hailuo',
    description: 'Chinese AI lab producing competitive video generation and conversational AI models.',
    category: 'Video', tags: ['Video Generation', 'Chinese AI', 'Conversational', 'Multimodal'],
    website_url: 'https://hailuoai.com', pricing_model: 'freemium', confidence_score: 80, availability_status: 'active',
    created_at: '2024-08-01T00:00:00Z', updated_at: '2025-05-28T00:00:00Z',
    maker_info: { name: 'Minimax', company: 'MiniMax' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: false, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.15
  },
  {
    id: 'prod-108', name: 'Suno AI', slug: 'suno-ai',
    description: 'AI music generation platform creating full songs with vocals and instrumentation from text prompts.',
    long_description: 'Suno AI generates complete songs with lyrics, vocals, and instrumentation from simple text prompts. Users can specify genre, mood, and style to create original music. It has become one of the most popular AI music tools for creators, musicians, and hobbyists.',
    category: 'Audio', tags: ['Music Generation', 'Song Creation', 'Vocals', 'Audio', 'Creative'],
    website_url: 'https://suno.com', pricing_model: 'freemium', confidence_score: 91, availability_status: 'active',
    created_at: '2023-08-15T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Michael Shulman', twitter: '@mikeyshulman', company: 'Suno' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.16
  },
  {
    id: 'prod-109', name: 'Udio', slug: 'udio',
    description: 'AI music creation tool offering high-fidelity song generation with professional-grade quality.',
    category: 'Audio', tags: ['Music Generation', 'Song Creation', 'High Fidelity', 'Audio', 'Professional'],
    website_url: 'https://udio.com', pricing_model: 'freemium', confidence_score: 87, availability_status: 'active',
    created_at: '2024-04-10T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'Udio', company: 'Uncharted Labs' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.13
  },
  {
    id: 'prod-110', name: 'Adobe Podcast', slug: 'adobe-podcast',
    description: 'AI-powered audio recording and editing tool with studio-quality enhancement and noise removal.',
    category: 'Audio', tags: ['Audio Enhancement', 'Noise Removal', 'Podcast', 'Recording', 'Adobe'],
    website_url: 'https://podcast.adobe.com', pricing_model: 'freemium', confidence_score: 86, availability_status: 'active',
    created_at: '2023-03-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Adobe', company: 'Adobe' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-111', name: 'Murf AI', slug: 'murf-ai',
    description: 'Professional AI voiceover studio with 120+ voices in 20 languages for videos, presentations, and ads.',
    category: 'Audio', tags: ['Voiceover', 'Text-to-Speech', 'Professional', 'Multilingual', 'Enterprise'],
    website_url: 'https://murf.ai', pricing_model: 'paid', confidence_score: 85, availability_status: 'active',
    created_at: '2022-04-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Prateek Panda', company: 'Murf AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-112', name: 'Deepgram', slug: 'deepgram',
    description: 'AI speech-to-text API with real-time transcription, speaker diarization, and industry-leading accuracy.',
    category: 'Audio', tags: ['Speech-to-Text', 'Transcription', 'Real-Time', 'API', 'Developer Tools'],
    website_url: 'https://deepgram.com', pricing_model: 'paid', confidence_score: 89, availability_status: 'active',
    created_at: '2022-02-01T00:00:00Z', updated_at: '2025-06-02T00:00:00Z',
    maker_info: { name: 'Scott Stephenson', company: 'Deepgram' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.11
  },
  {
    id: 'prod-113', name: 'AssemblyAI', slug: 'assembly-ai',
    description: 'AI speech models for transcription, audio intelligence, and real-time speech understanding.',
    category: 'Audio', tags: ['Speech AI', 'Transcription', 'Audio Intelligence', 'API', 'LeMUR'],
    website_url: 'https://assemblyai.com', pricing_model: 'paid', confidence_score: 88, availability_status: 'active',
    created_at: '2022-05-01T00:00:00Z', updated_at: '2025-05-28T00:00:00Z',
    maker_info: { name: 'Janek Ambrose', company: 'AssemblyAI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10
  },
  {
    id: 'prod-114', name: 'Krisp', slug: 'krisp',
    description: 'AI noise cancellation for calls and recordings, removing background noise and echo in real-time.',
    category: 'Audio', tags: ['Noise Cancellation', 'Meetings', 'Real-Time', 'Audio', 'Productivity'],
    website_url: 'https://krisp.ai', pricing_model: 'freemium', confidence_score: 86, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-04-15T00:00:00Z',
    maker_info: { name: 'David Bagdasarian', company: 'Krisp' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-115', name: 'Flux.1 (Black Forest Labs)', slug: 'flux-black-forest',
    description: 'Open-source image generation model delivering exceptional quality and prompt adherence.',
    category: 'Image', tags: ['Image Generation', 'Open Source', 'Stable Diffusion', 'Quality', 'BFL'],
    website_url: 'https://blackforestlabs.ai', pricing_model: 'open_source', confidence_score: 92, availability_status: 'active',
    created_at: '2024-08-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Black Forest Labs', company: 'Black Forest Labs' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.22
  },
  {
    id: 'prod-116', name: 'Leonardo AI', slug: 'leonardo-ai',
    description: 'AI image generation platform with fine-tuned models, canvas editing, and game asset creation.',
    category: 'Image', tags: ['Image Generation', 'Game Assets', 'Canvas', 'Fine-Tuning', 'Creative'],
    website_url: 'https://leonardo.ai', pricing_model: 'freemium', confidence_score: 87, availability_status: 'active',
    created_at: '2023-04-01T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Leonardo AI', company: 'Leonardo AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.09
  },
  {
    id: 'prod-117', name: 'Ideogram', slug: 'ideogram',
    description: 'AI image generator specializing in typography and text rendering within generated images.',
    category: 'Image', tags: ['Typography', 'Text Rendering', 'Image Generation', 'Design', 'Creative'],
    website_url: 'https://ideogram.ai', pricing_model: 'freemium', confidence_score: 88, availability_status: 'active',
    created_at: '2023-08-01T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'Ideogram', company: 'Ideogram Research' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.11
  },
  {
    id: 'prod-118', name: 'ComfyUI', slug: 'comfyui',
    description: 'Node-based GUI for Stable Diffusion and Flux models with modular workflow and custom nodes.',
    category: 'Image', tags: ['Stable Diffusion', 'GUI', 'Node-Based', 'Open Source', 'Custom Nodes'],
    website_url: 'https://comfy.org', github_url: 'https://github.com/comfyanonymous/ComfyUI', github_stars: 56000, github_forks: 8200,
    pricing_model: 'open_source', confidence_score: 90, availability_status: 'active',
    created_at: '2023-01-15T00:00:00Z', updated_at: '2025-06-08T00:00:00Z',
    maker_info: { name: 'comfyanonymous', company: '' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: false, has_contact: true },
    weekly_growth_rate: 0.14, contributor_count: 680, open_issues_count: 210, latest_release_date: '2025-06-05'
  },
  {
    id: 'prod-119', name: 'Automatic1111 (SD WebUI)', slug: 'sd-webui',
    description: 'Popular web UI for Stable Diffusion with extensive extensions, upscaling, and model management.',
    category: 'Image', tags: ['Stable Diffusion', 'Web UI', 'Extensions', 'Open Source', 'Community'],
    website_url: '', github_url: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui', github_stars: 140000, github_forks: 28000,
    pricing_model: 'open_source', confidence_score: 91, availability_status: 'active',
    created_at: '2022-08-15T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'AUTOMATIC1111', company: '' },
    validation_signals: { has_website: false, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: false, has_contact: false },
    weekly_growth_rate: 0.03, contributor_count: 520, open_issues_count: 890, latest_release_date: '2025-04-20'
  },
  {
    id: 'prod-120', name: 'Clipdrop', slug: 'clipdrop',
    description: 'Suite of AI visual tools for removing backgrounds, upscaling images, and cleaning up photos.',
    category: 'Image', tags: ['Background Removal', 'Upscaling', 'Photo Editing', 'Cleanup', 'Creative'],
    website_url: 'https://clipdrop.co', pricing_model: 'freemium', confidence_score: 85, availability_status: 'active',
    created_at: '2022-06-01T00:00:00Z', updated_at: '2025-04-28T00:00:00Z',
    maker_info: { name: 'Clipdrop', company: 'Stability AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-121', name: 'Photoroom', slug: 'photoroom',
    description: 'AI photo editor for product photography with background removal, AI backgrounds, and batch editing.',
    category: 'Image', tags: ['Product Photography', 'Background Removal', 'Batch Editing', 'Ecommerce', 'Mobile'],
    website_url: 'https://photoroom.com', pricing_model: 'freemium', confidence_score: 84, availability_status: 'active',
    created_at: '2022-03-01T00:00:00Z', updated_at: '2025-05-05T00:00:00Z',
    maker_info: { name: 'Matthieu Rouif', company: 'Photoroom' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-122', name: 'Luma Dream Machine', slug: 'luma-dream-machine',
    description: 'High-quality AI video generation model creating realistic 5-second clips from text and images.',
    category: 'Video', tags: ['Video Generation', 'Realistic', 'Text-to-Video', 'Image-to-Video', 'Luma AI'],
    website_url: 'https://lumalabs.ai/dream-machine', pricing_model: 'freemium', confidence_score: 86, availability_status: 'active',
    created_at: '2024-06-17T00:00:00Z', updated_at: '2025-05-30T00:00:00Z',
    maker_info: { name: 'Luma AI', company: 'Luma AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.14
  },
  {
    id: 'prod-123', name: 'Haiper AI', slug: 'haiper-ai',
    description: 'AI video generation platform with text-to-video, image-to-video, and video editing capabilities.',
    category: 'Video', tags: ['Video Generation', 'Editing', 'Creative', 'Text-to-Video', 'Creative Tools'],
    website_url: 'https://haiper.ai', pricing_model: 'freemium', confidence_score: 82, availability_status: 'active',
    created_at: '2024-02-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Haiper', company: 'Haiper' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10
  },
  {
    id: 'prod-124', name: 'Viggle AI', slug: 'viggle-ai',
    description: 'AI video tool for creating character animations and motion transfer from reference videos.',
    category: 'Video', tags: ['Animation', 'Motion Transfer', 'Character', 'Video Generation', 'Creative'],
    website_url: 'https://viggle.ai', pricing_model: 'freemium', confidence_score: 79, availability_status: 'active',
    created_at: '2024-03-15T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Viggle', company: 'Viggle AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: false, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12
  },
  {
    id: 'prod-125', name: 'Opus Clip', slug: 'opus-clip',
    description: 'AI video repurposing tool that turns long videos into viral short clips with captions and highlights.',
    category: 'Video', tags: ['Video Repurposing', 'Short Clips', 'Captions', 'Social Media', 'Automation'],
    website_url: 'https://opus.pro', pricing_model: 'paid', confidence_score: 83, availability_status: 'active',
    created_at: '2023-06-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Opus', company: 'Opus' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-126', name: 'HeyGen', slug: 'heygen',
    description: 'AI video avatar platform for creating professional talking-head videos in 175+ languages.',
    category: 'Video', tags: ['AI Avatar', 'Talking Head', 'Multilingual', 'Enterprise', 'Training'],
    website_url: 'https://heygen.com', pricing_model: 'paid', confidence_score: 88, availability_status: 'active',
    created_at: '2023-01-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Joshua Xu', company: 'HeyGen' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.14
  },
  {
    id: 'prod-127', name: 'CapCut AI', slug: 'capcut-ai',
    description: 'AI video editor with auto-captions, templates, effects, and one-click social media optimization.',
    category: 'Video', tags: ['Video Editing', 'Auto-Captions', 'Templates', 'Social Media', 'Mobile'],
    website_url: 'https://capcut.com', pricing_model: 'free', confidence_score: 90, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'ByteDance', company: 'ByteDance' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10
  },
  {
    id: 'prod-128', name: 'Fliki', slug: 'fliki',
    description: 'AI video creation from text with voiceovers, stock media, and automated scene generation.',
    category: 'Video', tags: ['Text-to-Video', 'Voiceover', 'Stock Media', 'Automation', 'Content Creation'],
    website_url: 'https://fliki.ai', pricing_model: 'freemium', confidence_score: 81, availability_status: 'active',
    created_at: '2023-02-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Fliki', company: 'Fliki' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-129', name: 'InVideo AI', slug: 'invideo-ai',
    description: 'AI video generator that creates professional videos from text prompts with stock footage and editing.',
    category: 'Video', tags: ['Video Generation', 'Text-to-Video', 'Stock Footage', 'Marketing', 'YouTube'],
    website_url: 'https://invideo.io', pricing_model: 'freemium', confidence_score: 84, availability_status: 'active',
    created_at: '2023-05-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'InVideo', company: 'InVideo' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-130', name: 'Pictory', slug: 'pictory',
    description: 'AI video editing tool that transforms long-form content into short, shareable video clips.',
    category: 'Video', tags: ['Video Editing', 'Content Repurposing', 'Short Clips', 'Blog-to-Video', 'Automation'],
    website_url: 'https://pictory.ai', pricing_model: 'paid', confidence_score: 82, availability_status: 'active',
    created_at: '2022-06-01T00:00:00Z', updated_at: '2025-04-25T00:00:00Z',
    maker_info: { name: 'Pictory', company: 'Pictory' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-131', name: 'Replit Ghostwriter', slug: 'replit-ghostwriter',
    description: 'AI coding assistant integrated into Replit IDE with code explanation, generation, and debugging.',
    category: 'Coding', tags: ['Cloud IDE', 'Code Generation', 'Debugging', 'Explanation', 'Replit'],
    website_url: 'https://replit.com/site/ghostwriter', pricing_model: 'paid', confidence_score: 84, availability_status: 'active',
    created_at: '2023-02-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Replit', company: 'Replit' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-132', name: 'Devin (Cognition)', slug: 'devin-cognition',
    description: 'Autonomous AI software engineer that can plan, execute, and debug complex engineering tasks.',
    long_description: 'Devin by Cognition AI is the first AI software engineer capable of autonomously completing complex engineering tasks. It can plan strategies, write and execute code, debug issues, and even deploy applications. It represents a significant step toward autonomous software development.',
    category: 'Agent', tags: ['Autonomous', 'Software Engineer', 'Planning', 'Debugging', 'Deployment'],
    website_url: 'https://cognition.ai', pricing_model: 'enterprise', confidence_score: 89, availability_status: 'active',
    created_at: '2024-03-12T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Scott Wu', twitter: '@scott_wu_12', company: 'Cognition' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.28
  },
  {
    id: 'prod-133', name: 'Open Interpreter', slug: 'open-interpreter',
    description: 'Open-source AI agent that runs code locally to complete any task using natural language commands.',
    category: 'Agent', tags: ['Open Source', 'Code Execution', 'Local', 'Agent', 'Python'],
    website_url: 'https://openinterpreter.com', github_url: 'https://github.com/OpenInterpreter/open-interpreter', github_stars: 52000, github_forks: 6200,
    pricing_model: 'open_source', confidence_score: 88, availability_status: 'active',
    created_at: '2023-07-01T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'Killian Lucas', twitter: '@killianlucas', company: '' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12, contributor_count: 450, open_issues_count: 180, latest_release_date: '2025-05-15'
  },
  {
    id: 'prod-134', name: 'CrewAI', slug: 'crewai',
    description: 'Framework for orchestrating role-playing autonomous AI agents that collaborate on complex tasks.',
    category: 'Agent', tags: ['Agent Framework', 'Multi-Agent', 'Role-Playing', 'Orchestration', 'Python'],
    website_url: 'https://crewai.com', github_url: 'https://github.com/crewAIInc/crewAI', github_stars: 24000, github_forks: 3800,
    pricing_model: 'open_source', confidence_score: 90, availability_status: 'active',
    created_at: '2023-11-01T00:00:00Z', updated_at: '2025-06-08T00:00:00Z',
    maker_info: { name: 'João Moura', twitter: '@joaomdmoura', company: 'CrewAI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.22, contributor_count: 380, open_issues_count: 95, latest_release_date: '2025-06-01'
  },
  {
    id: 'prod-135', name: 'AutoGen (Microsoft)', slug: 'autogen-microsoft',
    description: 'Microsoft\'s framework for building multi-agent AI systems with conversational programming patterns.',
    category: 'Agent', tags: ['Multi-Agent', 'Microsoft', 'Conversational', 'Framework', 'Open Source'],
    website_url: 'https://microsoft.github.io/autogen', github_url: 'https://github.com/microsoft/autogen', github_stars: 30000, github_forks: 5200,
    pricing_model: 'open_source', confidence_score: 91, availability_status: 'active',
    created_at: '2023-08-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Microsoft Research', company: 'Microsoft' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.15, contributor_count: 620, open_issues_count: 240, latest_release_date: '2025-05-28'
  },
  {
    id: 'prod-136', name: 'Semantic Kernel', slug: 'semantic-kernel',
    description: 'Microsoft\'s SDK for integrating LLMs with traditional programming in .NET, Python, and Java.',
    category: 'Coding', tags: ['SDK', 'Microsoft', 'LLM Integration', 'Plugins', 'Enterprise'],
    website_url: 'https://learn.microsoft.com/semantic-kernel', github_url: 'https://github.com/microsoft/semantic-kernel', github_stars: 18000, github_forks: 2800,
    pricing_model: 'open_source', confidence_score: 89, availability_status: 'active',
    created_at: '2023-04-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Microsoft', company: 'Microsoft' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10, contributor_count: 340, open_issues_count: 150, latest_release_date: '2025-05-25'
  },
  {
    id: 'prod-137', name: 'DSPy', slug: 'dspy',
    description: 'Framework for systematically programming language models instead of prompt engineering.',
    category: 'Coding', tags: ['Framework', 'Programming', 'DSP', 'Optimization', 'Stanford'],
    website_url: 'https://dspy.ai', github_url: 'https://github.com/stanfordnlp/dspy', github_stars: 15000, github_forks: 1800,
    pricing_model: 'open_source', confidence_score: 88, availability_status: 'active',
    created_at: '2023-10-01T00:00:00Z', updated_at: '2025-05-30T00:00:00Z',
    maker_info: { name: 'Omar Khattab', twitter: '@lateinteraction', company: 'Stanford' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.18, contributor_count: 220, open_issues_count: 75, latest_release_date: '2025-05-20'
  },
  {
    id: 'prod-138', name: 'Llama.cpp', slug: 'llama-cpp',
    description: 'Plain C/C++ implementation for running LLaMA models efficiently on consumer hardware.',
    category: 'Coding', tags: ['LLaMA', 'Local Inference', 'C++', 'Open Source', 'Performance'],
    website_url: '', github_url: 'https://github.com/ggerganov/llama.cpp', github_stars: 60000, github_forks: 10000,
    pricing_model: 'open_source', confidence_score: 94, availability_status: 'active',
    created_at: '2023-03-10T00:00:00Z', updated_at: '2025-06-10T00:00:00Z',
    maker_info: { name: 'Georgi Gerganov', twitter: '@ggeorgi_g', company: '' },
    validation_signals: { has_website: false, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08, contributor_count: 920, open_issues_count: 320, latest_release_date: '2025-06-08'
  },
  {
    id: 'prod-139', name: 'Ollama', slug: 'ollama',
    description: 'Local LLM runner that makes it easy to run, manage, and interact with open models on your machine.',
    long_description: 'Ollama simplifies running large language models locally. It provides a clean CLI for downloading, running, and managing models like Llama 3, Mistral, Gemma, and more. It supports API-compatible endpoints for easy integration with existing applications.',
    category: 'Coding', tags: ['Local LLM', 'CLI', 'Model Management', 'Open Source', 'Developer Tools'],
    website_url: 'https://ollama.com', github_url: 'https://github.com/ollama/ollama', github_stars: 100000, github_forks: 12000,
    pricing_model: 'open_source', confidence_score: 95, availability_status: 'active',
    created_at: '2023-06-24T00:00:00Z', updated_at: '2025-06-12T00:00:00Z',
    maker_info: { name: 'Jeffrey Morgan', twitter: '@jmorganca', company: '' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.16, contributor_count: 780, open_issues_count: 420, latest_release_date: '2025-06-10'
  },
  {
    id: 'prod-140', name: 'LM Studio', slug: 'lm-studio',
    description: 'Desktop app for discovering, downloading, and running local LLMs with a beautiful GUI.',
    category: 'Coding', tags: ['Desktop App', 'Local LLM', 'GUI', 'Model Discovery', 'Developer Tools'],
    website_url: 'https://lmstudio.ai', pricing_model: 'free', confidence_score: 87, availability_status: 'active',
    created_at: '2023-09-01T00:00:00Z', updated_at: '2025-05-28T00:00:00Z',
    maker_info: { name: 'LM Studio', company: 'LM Studio' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12
  },
  {
    id: 'prod-141', name: 'vLLM', slug: 'vllm',
    description: 'High-throughput, memory-efficient LLM serving engine with PagedAttention and continuous batching.',
    category: 'Coding', tags: ['LLM Serving', 'Inference', 'GPU', 'Open Source', 'Performance'],
    website_url: 'https://vllm.ai', github_url: 'https://github.com/vllm-project/vllm', github_stars: 28000, github_forks: 4500,
    pricing_model: 'open_source', confidence_score: 93, availability_status: 'active',
    created_at: '2023-05-01T00:00:00Z', updated_at: '2025-06-08T00:00:00Z',
    maker_info: { name: 'UC Berkeley SkyLab', company: 'UC Berkeley' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.14, contributor_count: 580, open_issues_count: 190, latest_release_date: '2025-06-01'
  },
  {
    id: 'prod-142', name: 'Weights & Biases', slug: 'wandb',
    description: 'ML platform for experiment tracking, model registry, and dataset versioning at enterprise scale.',
    category: 'Data', tags: ['ML Platform', 'Experiment Tracking', 'MLOps', 'Model Registry', 'Enterprise'],
    website_url: 'https://wandb.ai', pricing_model: 'freemium', confidence_score: 90, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Lukas Biewald', twitter: '@lkbiewald', company: 'Weights & Biases' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-143', name: 'Pinecone', slug: 'pinecone',
    description: 'Serverless vector database for building and scaling AI applications with semantic search.',
    category: 'Data', tags: ['Vector Database', 'Semantic Search', 'Serverless', 'RAG', 'AI Infrastructure'],
    website_url: 'https://pinecone.io', pricing_model: 'freemium', confidence_score: 91, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-06-02T00:00:00Z',
    maker_info: { name: 'Edo Liberty', company: 'Pinecone' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-144', name: 'Weaviate', slug: 'weaviate',
    description: 'Open-source vector database with built-in ML, hybrid search, and multi-tenancy support.',
    category: 'Data', tags: ['Vector Database', 'Open Source', 'Hybrid Search', 'Multi-Tenancy', 'GraphQL'],
    website_url: 'https://weaviate.io', github_url: 'https://github.com/weaviate/weaviate', github_stars: 12000, github_forks: 1400,
    pricing_model: 'open_source', confidence_score: 89, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Bob van Luijt', twitter: '@bobvanluijt', company: 'Weaviate' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10, contributor_count: 320, open_issues_count: 120, latest_release_date: '2025-05-30'
  },
  {
    id: 'prod-145', name: 'Chroma', slug: 'chroma-db',
    description: 'Open-source embedding database for building AI applications with lightweight, developer-friendly APIs.',
    category: 'Data', tags: ['Embedding Database', 'Open Source', 'Developer Friendly', 'RAG', 'Python'],
    website_url: 'https://trychroma.com', github_url: 'https://github.com/chroma-core/chroma', github_stars: 14000, github_forks: 1800,
    pricing_model: 'open_source', confidence_score: 87, availability_status: 'active',
    created_at: '2023-02-01T00:00:00Z', updated_at: '2025-05-28T00:00:00Z',
    maker_info: { name: 'Chroma', company: 'Chroma' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12, contributor_count: 280, open_issues_count: 95, latest_release_date: '2025-05-20'
  },
  {
    id: 'prod-146', name: 'Qdrant', slug: 'qdrant',
    description: 'High-performance vector database with advanced filtering, distributed scaling, and REST/gRPC APIs.',
    category: 'Data', tags: ['Vector Database', 'High Performance', 'Filtering', 'Open Source', 'Rust'],
    website_url: 'https://qdrant.tech', github_url: 'https://github.com/qdrant/qdrant', github_stars: 22000, github_forks: 2800,
    pricing_model: 'open_source', confidence_score: 90, availability_status: 'active',
    created_at: '2022-04-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Andrey Vasnetsov', company: 'Qdrant' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.11, contributor_count: 180, open_issues_count: 65, latest_release_date: '2025-05-30'
  },
  {
    id: 'prod-147', name: 'Milvus', slug: 'milvus',
    description: 'Cloud-native vector database for billion-scale similarity search with distributed architecture.',
    category: 'Data', tags: ['Vector Database', 'Cloud-Native', 'Billion-Scale', 'Distributed', 'Open Source'],
    website_url: 'https://milvus.io', github_url: 'https://github.com/milvus-io/milvus', github_stars: 28000, github_forks: 4200,
    pricing_model: 'open_source', confidence_score: 89, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Zilliz', company: 'Zilliz' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08, contributor_count: 420, open_issues_count: 180, latest_release_date: '2025-05-25'
  },
  {
    id: 'prod-148', name: 'Cursor Rules', slug: 'cursor-rules',
    description: 'Community-driven repository of .cursorrules files for optimizing AI code editor behavior.',
    category: 'Coding', tags: ['Cursor', 'Rules', 'Community', 'Optimization', 'Open Source'],
    website_url: 'https://cursor.directory', github_url: 'https://github.com/PatrickJS/awesome-cursorrules', github_stars: 8200, github_forks: 1100,
    pricing_model: 'open_source', confidence_score: 78, availability_status: 'active',
    created_at: '2024-08-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'PatrickJS', twitter: '@patrickjs', company: '' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: false },
    weekly_growth_rate: 0.16, contributor_count: 180, open_issues_count: 15, latest_release_date: '2025-05-10'
  },
  {
    id: 'prod-149', name: 'Dify', slug: 'dify',
    description: 'Open-source LLM app development platform with visual workflow, RAG pipeline, and model management.',
    category: 'Coding', tags: ['LLM App', 'Visual Workflow', 'RAG', 'Open Source', 'No-Code'],
    website_url: 'https://dify.ai', github_url: 'https://github.com/langgenius/dify', github_stars: 50000, github_forks: 8200,
    pricing_model: 'open_source', confidence_score: 92, availability_status: 'active',
    created_at: '2023-05-15T00:00:00Z', updated_at: '2025-06-10T00:00:00Z',
    maker_info: { name: 'Dify', company: 'LangGenius' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.20, contributor_count: 620, open_issues_count: 280, latest_release_date: '2025-06-05'
  },
  {
    id: 'prod-150', name: 'Flowise', slug: 'flowise',
    description: 'Drag-and-drop UI for building custom LLM flows with LangChain integrations and API deployment.',
    category: 'Coding', tags: ['Low-Code', 'LangChain', 'Drag-and-Drop', 'LLM Flows', 'Open Source'],
    website_url: 'https://flowiseai.com', github_url: 'https://github.com/FlowiseAI/Flowise', github_stars: 32000, github_forks: 5200,
    pricing_model: 'open_source', confidence_score: 88, availability_status: 'active',
    created_at: '2023-04-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'FlowiseAI', company: 'FlowiseAI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.14, contributor_count: 340, open_issues_count: 150, latest_release_date: '2025-05-28'
  },
  {
    id: 'prod-151', name: 'Ragas', slug: 'ragas-eval',
    description: 'Framework for evaluating RAG pipelines with automated metrics for faithfulness, relevance, and context.',
    category: 'Data', tags: ['RAG', 'Evaluation', 'Metrics', 'Testing', 'Open Source'],
    website_url: 'https://ragas.io', github_url: 'https://github.com/explodinggradients/ragas', github_stars: 8500, github_forks: 920,
    pricing_model: 'open_source', confidence_score: 86, availability_status: 'active',
    created_at: '2023-07-01T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'Exploding Gradients', company: 'Exploding Gradients' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.15, contributor_count: 150, open_issues_count: 42, latest_release_date: '2025-05-15'
  },
  {
    id: 'prod-152', name: 'LangSmith', slug: 'langsmith',
    description: 'Platform for debugging, testing, evaluating, and monitoring LLM applications built with LangChain.',
    category: 'Coding', tags: ['LLM Observability', 'Debugging', 'Testing', 'Monitoring', 'LangChain'],
    website_url: 'https://smith.langchain.com', pricing_model: 'freemium', confidence_score: 90, availability_status: 'active',
    created_at: '2023-07-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'LangChain', company: 'LangChain' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12
  },
  {
    id: 'prod-153', name: 'Arize Phoenix', slug: 'arize-phoenix',
    description: 'Open-source LLM observability platform for tracing, evaluating, and debugging AI applications.',
    category: 'Coding', tags: ['Observability', 'LLM', 'Tracing', 'Open Source', 'Evaluation'],
    website_url: 'https://phoenix.arize.com', github_url: 'https://github.com/Arize-ai/phoenix', github_stars: 5200, github_forks: 480,
    pricing_model: 'open_source', confidence_score: 85, availability_status: 'active',
    created_at: '2023-06-01T00:00:00Z', updated_at: '2025-05-28T00:00:00Z',
    maker_info: { name: 'Arize AI', company: 'Arize AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10, contributor_count: 120, open_issues_count: 38, latest_release_date: '2025-05-20'
  },
  {
    id: 'prod-154', name: 'Helicone', slug: 'helicone',
    description: 'Open-source LLM observability platform for tracking costs, latency, and quality of AI API calls.',
    category: 'Coding', tags: ['LLM Observability', 'Cost Tracking', 'Open Source', 'Proxy', 'Analytics'],
    website_url: 'https://helicone.ai', github_url: 'https://github.com/Helicone/helicone', github_stars: 3800, github_forks: 380,
    pricing_model: 'freemium', confidence_score: 83, availability_status: 'active',
    created_at: '2023-08-01T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Helicone', company: 'Helicone' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.13, contributor_count: 65, open_issues_count: 22, latest_release_date: '2025-05-10'
  },
  {
    id: 'prod-155', name: 'Bland AI', slug: 'bland-ai',
    description: 'AI phone calling platform for building voice agents that handle customer service and sales calls.',
    category: 'Agent', tags: ['Voice Agent', 'Phone Calling', 'Customer Service', 'Sales', 'Automation'],
    website_url: 'https://bland.ai', pricing_model: 'paid', confidence_score: 82, availability_status: 'active',
    created_at: '2023-09-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Bland AI', company: 'Bland AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.14
  },
  {
    id: 'prod-156', name: 'Vapi', slug: 'vapi',
    description: 'Developer platform for building AI voice assistants with real-time conversational capabilities.',
    category: 'Agent', tags: ['Voice AI', 'Developer Platform', 'Real-Time', 'Conversational', 'API'],
    website_url: 'https://vapi.ai', pricing_model: 'freemium', confidence_score: 84, availability_status: 'active',
    created_at: '2024-01-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Vapi', company: 'Vapi' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.18
  },
  {
    id: 'prod-157', name: 'Retell AI', slug: 'retell-ai',
    description: 'Platform for building production-grade AI voice agents with low-latency conversations.',
    category: 'Agent', tags: ['Voice Agent', 'Low Latency', 'Production', 'Conversational AI', 'Platform'],
    website_url: 'https://retellai.com', pricing_model: 'paid', confidence_score: 81, availability_status: 'active',
    created_at: '2024-02-01T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Retell AI', company: 'Retell AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.16
  },
  {
    id: 'prod-158', name: 'LangGraph', slug: 'langgraph',
    description: 'Library for building stateful, multi-actor applications with LLMs using graph-based orchestration.',
    category: 'Agent', tags: ['Graph', 'Stateful', 'Multi-Agent', 'LangChain', 'Orchestration'],
    website_url: 'https://langchain-ai.github.io/langgraph', github_url: 'https://github.com/langchain-ai/langgraph', github_stars: 12000, github_forks: 1800,
    pricing_model: 'open_source', confidence_score: 90, availability_status: 'active',
    created_at: '2024-01-15T00:00:00Z', updated_at: '2025-06-08T00:00:00Z',
    maker_info: { name: 'LangChain', company: 'LangChain' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.20, contributor_count: 220, open_issues_count: 75, latest_release_date: '2025-06-01'
  },
  {
    id: 'prod-159', name: 'Open WebUI', slug: 'open-webui',
    description: 'Self-hosted web UI for running LLMs locally with support for Ollama and OpenAI-compatible APIs.',
    category: 'Coding', tags: ['Self-Hosted', 'Web UI', 'Ollama', 'Open Source', 'Local LLM'],
    website_url: 'https://openwebui.com', github_url: 'https://github.com/open-webui/open-webui', github_stars: 42000, github_forks: 6800,
    pricing_model: 'open_source', confidence_score: 91, availability_status: 'active',
    created_at: '2023-08-01T00:00:00Z', updated_at: '2025-06-10T00:00:00Z',
    maker_info: { name: 'Timothy J. Baek', twitter: '@timothyjb', company: '' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.15, contributor_count: 420, open_issues_count: 180, latest_release_date: '2025-06-05'
  },
  {
    id: 'prod-160', name: 'AnythingLLM', slug: 'anything-llm',
    description: 'All-in-one desktop app for chatting with private LLMs using your documents and knowledge base.',
    category: 'Chatbot', tags: ['Desktop App', 'Private LLM', 'Documents', 'Knowledge Base', 'RAG'],
    website_url: 'https://anythingllm.com', github_url: 'https://github.com/Mintplex-Labs/anything-llm', github_stars: 20000, github_forks: 2800,
    pricing_model: 'open_source', confidence_score: 85, availability_status: 'active',
    created_at: '2023-09-01T00:00:00Z', updated_at: '2025-05-28T00:00:00Z',
    maker_info: { name: 'Mintplex Labs', company: 'Mintplex Labs' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10, contributor_count: 180, open_issues_count: 65, latest_release_date: '2025-05-20'
  },
  {
    id: 'prod-161', name: 'ChatDev', slug: 'chatdev',
    description: 'Multi-agent framework simulating a software company where AI agents collaborate to build software.',
    category: 'Agent', tags: ['Multi-Agent', 'Software Company', 'Collaboration', 'Open Source', 'Research'],
    website_url: 'https://chatdev.modelbest.cn', github_url: 'https://github.com/OpenBMB/ChatDev', github_stars: 18000, github_forks: 2200,
    pricing_model: 'open_source', confidence_score: 84, availability_status: 'active',
    created_at: '2023-07-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'OpenBMB', company: 'THUNLP' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06, contributor_count: 120, open_issues_count: 45, latest_release_date: '2025-04-28'
  },
  {
    id: 'prod-162', name: 'MetaGPT', slug: 'metagpt',
    description: 'Multi-agent framework where GPTs with different roles collaborate to solve complex tasks.',
    category: 'Agent', tags: ['Multi-Agent', 'GPT', 'Role-Playing', 'Open Source', 'Framework'],
    website_url: 'https://deepwisdom.ai', github_url: 'https://github.com/geekan/MetaGPT', github_stars: 45000, github_forks: 7200,
    pricing_model: 'open_source', confidence_score: 87, availability_status: 'active',
    created_at: '2023-07-15T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'DeepWisdom', company: 'DeepWisdom' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07, contributor_count: 320, open_issues_count: 120, latest_release_date: '2025-05-18'
  },
  {
    id: 'prod-163', name: 'AgentGPT', slug: 'agent-gpt',
    description: 'Browser-based autonomous AI agents that self-chain tasks to achieve any goal you configure.',
    category: 'Agent', tags: ['Autonomous', 'Browser', 'Goal-Oriented', 'Open Source', 'Web'],
    website_url: 'https://agentgpt.reworkd.ai', github_url: 'https://github.com/reworkd/AgentGPT', github_stars: 30000, github_forks: 5000,
    pricing_model: 'open_source', confidence_score: 80, availability_status: 'active',
    created_at: '2023-04-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Reworkd', company: 'Reworkd' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.03, contributor_count: 280, open_issues_count: 95, latest_release_date: '2025-04-10'
  },
  {
    id: 'prod-164', name: 'Superagent', slug: 'superagent-ai',
    description: 'Open-source AI assistant framework for building, deploying, and managing AI assistants.',
    category: 'Agent', tags: ['AI Assistant', 'Framework', 'Open Source', 'Deployment', 'Management'],
    website_url: 'https://docs.superagent.sh', github_url: 'https://github.com/superagent-ai/superagent', github_stars: 8500, github_forks: 1200,
    pricing_model: 'open_source', confidence_score: 79, availability_status: 'active',
    created_at: '2023-05-01T00:00:00Z', updated_at: '2025-04-28T00:00:00Z',
    maker_info: { name: 'Superagent', company: 'Superagent' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05, contributor_count: 95, open_issues_count: 35, latest_release_date: '2025-04-15'
  },
  {
    id: 'prod-165', name: 'Notion Calendar', slug: 'notion-calendar',
    description: 'Smart calendar app with AI scheduling that integrates seamlessly with Notion workspace.',
    category: 'Productivity', tags: ['Calendar', 'Scheduling', 'Notion', 'AI', 'Time Management'],
    website_url: 'https://notion.so/calendar', pricing_model: 'free', confidence_score: 82, availability_status: 'active',
    created_at: '2024-01-15T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Notion', company: 'Notion Labs' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-166', name: 'Motion', slug: 'motion-app',
    description: 'AI-powered calendar and task manager that automatically schedules and prioritizes your day.',
    category: 'Productivity', tags: ['Calendar', 'Task Management', 'Scheduling', 'Priority', 'Automation'],
    website_url: 'https://usemotion.com', pricing_model: 'paid', confidence_score: 84, availability_status: 'active',
    created_at: '2023-01-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Motion', company: 'Motion' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10
  },
  {
    id: 'prod-167', name: 'Reclaim AI', slug: 'reclaim-ai',
    description: 'AI scheduling assistant that finds optimal meeting times and protects focus time automatically.',
    category: 'Productivity', tags: ['Scheduling', 'Calendar', 'Meeting', 'Focus Time', 'Google Calendar'],
    website_url: 'https://reclaim.ai', pricing_model: 'freemium', confidence_score: 83, availability_status: 'active',
    created_at: '2022-06-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Dan Biner', company: 'Reclaim AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-168', name: 'Mem', slug: 'mem-ai',
    description: 'AI-first workspace that organizes notes, docs, and knowledge automatically using AI.',
    category: 'Productivity', tags: ['Knowledge Management', 'Notes', 'AI Organization', 'Workspace', 'Search'],
    website_url: 'https://get.mem.ai', pricing_model: 'freemium', confidence_score: 80, availability_status: 'active',
    created_at: '2022-04-01T00:00:00Z', updated_at: '2025-04-25T00:00:00Z',
    maker_info: { name: 'Ivan Zhao', company: 'Mem' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-169', name: 'Glean', slug: 'glean',
    description: 'AI-powered enterprise search that connects all company apps and surfaces relevant knowledge.',
    category: 'Productivity', tags: ['Enterprise Search', 'Knowledge', 'Company Apps', 'AI', 'Internal'],
    website_url: 'https://glean.com', pricing_model: 'enterprise', confidence_score: 86, availability_status: 'active',
    created_at: '2022-02-01T00:00:00Z', updated_at: '2025-05-28T00:00:00Z',
    maker_info: { name: 'Frank Chen', company: 'Glean' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-170', name: 'Clay', slug: 'clay-com',
    description: 'AI research assistant that finds and organizes information from the web into structured data.',
    category: 'Research', tags: ['Research', 'Data Collection', 'Web Scraping', 'Enrichment', 'CRM'],
    website_url: 'https://clay.com', pricing_model: 'freemium', confidence_score: 83, availability_status: 'active',
    created_at: '2023-06-01T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Clay', company: 'Clay' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12
  },
  {
    id: 'prod-171', name: 'Consensus', slug: 'consensus-ai',
    description: 'AI search engine for scientific research with evidence-based answers from peer-reviewed papers.',
    category: 'Research', tags: ['Scientific Research', 'Papers', 'Evidence', 'Academic', 'Search'],
    website_url: 'https://consensus.app', pricing_model: 'freemium', confidence_score: 85, availability_status: 'active',
    created_at: '2022-08-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Consensus', company: 'Consensus' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.09
  },
  {
    id: 'prod-172', name: 'Elicit', slug: 'elicit',
    description: 'AI research assistant that automates literature reviews and extracts key findings from papers.',
    category: 'Research', tags: ['Literature Review', 'Research', 'Paper Analysis', 'Academic', 'AI'],
    website_url: 'https://elicit.com', pricing_model: 'freemium', confidence_score: 86, availability_status: 'active',
    created_at: '2022-10-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Elicit', company: 'Elicit' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.11
  },
  {
    id: 'prod-173', name: 'Scite.ai', slug: 'scite-ai',
    description: 'Smart citations platform showing how research has been cited: supporting, contrasting, or mentioning.',
    category: 'Research', tags: ['Citations', 'Research', 'Academic', 'Smart Citations', 'Validation'],
    website_url: 'https://scite.ai', pricing_model: 'paid', confidence_score: 84, availability_status: 'active',
    created_at: '2022-03-01T00:00:00Z', updated_at: '2025-04-28T00:00:00Z',
    maker_info: { name: 'Scite', company: 'Scite.ai' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-174', name: 'Julius AI', slug: 'julius-ai',
    description: 'AI data analyst that creates charts, performs statistical analysis, and generates reports from data.',
    category: 'Data', tags: ['Data Analysis', 'Charts', 'Statistics', 'Reports', 'No-Code'],
    website_url: 'https://julius.ai', pricing_model: 'freemium', confidence_score: 82, availability_status: 'active',
    created_at: '2023-05-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Julius AI', company: 'Julius AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-175', name: 'Hex', slug: 'hex-tech',
    description: 'Collaborative data platform combining notebooks, SQL, Python, and AI-assisted data exploration.',
    category: 'Data', tags: ['Data Platform', 'Notebooks', 'SQL', 'Python', 'Collaboration'],
    website_url: 'https://hex.tech', pricing_model: 'freemium', confidence_score: 85, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'Hex', company: 'Hex Technologies' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-176', name: 'Akiflow', slug: 'akiflow',
    description: 'Productivity platform combining tasks, calendar, and communication with AI-powered planning.',
    category: 'Productivity', tags: ['Tasks', 'Calendar', 'Planning', 'Communication', 'Productivity'],
    website_url: 'https://akiflow.com', pricing_model: 'paid', confidence_score: 79, availability_status: 'active',
    created_at: '2023-03-01T00:00:00Z', updated_at: '2025-04-15T00:00:00Z',
    maker_info: { name: 'Akiflow', company: 'Akiflow' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-177', name: 'Arc Search', slug: 'arc-search',
    description: 'AI-powered mobile browser by The Browser Company that reads and summarizes web pages for you.',
    category: 'Research', tags: ['Mobile Browser', 'Summarization', 'Web Reading', 'AI', 'iOS'],
    website_url: 'https://arc.net', pricing_model: 'free', confidence_score: 84, availability_status: 'active',
    created_at: '2024-03-01T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Josh Miller', twitter: '@joshm', company: 'The Browser Company' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: false, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12
  },
  {
    id: 'prod-178', name: 'Humata', slug: 'humata',
    description: 'AI tool for asking questions and getting answers from PDF documents, research papers, and contracts.',
    category: 'Research', tags: ['PDF', 'Documents', 'Q&A', 'Research', 'Contracts'],
    website_url: 'https://humata.ai', pricing_model: 'freemium', confidence_score: 80, availability_status: 'active',
    created_at: '2023-04-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Humata', company: 'Humata AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-179', name: 'Nanonets', slug: 'nanonets',
    description: 'AI-powered OCR and document processing platform for extracting data from invoices, forms, and receipts.',
    category: 'Data', tags: ['OCR', 'Document Processing', 'Data Extraction', 'Invoices', 'Automation'],
    website_url: 'https://nanonets.com', pricing_model: 'paid', confidence_score: 83, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-05-05T00:00:00Z',
    maker_info: { name: 'Nanonets', company: 'Nanonets' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-180', name: 'Luminoso', slug: 'luminoso',
    description: 'AI-powered text analytics for understanding customer feedback, surveys, and open-ended responses.',
    category: 'Data', tags: ['Text Analytics', 'Customer Feedback', 'NLP', 'Surveys', 'Sentiment'],
    website_url: 'https://luminoso.com', pricing_model: 'enterprise', confidence_score: 81, availability_status: 'active',
    created_at: '2022-03-01T00:00:00Z', updated_at: '2025-04-15T00:00:00Z',
    maker_info: { name: 'Luminoso', company: 'Luminoso Technologies' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-181', name: 'Browse AI', slug: 'browse-ai',
    description: 'No-code web scraping and monitoring platform that turns any website into structured data.',
    category: 'Data', tags: ['Web Scraping', 'No-Code', 'Monitoring', 'Data Extraction', 'Automation'],
    website_url: 'https://browse.ai', pricing_model: 'freemium', confidence_score: 82, availability_status: 'active',
    created_at: '2022-08-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Browse AI', company: 'Browse AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-182', name: 'Harpa AI', slug: 'harpa-ai',
    description: 'Chrome extension AI assistant that automates web workflows, monitoring, and data extraction.',
    category: 'Productivity', tags: ['Chrome Extension', 'Web Automation', 'Monitoring', 'Data Extraction', 'Workflow'],
    website_url: 'https://harpa.ai', pricing_model: 'freemium', confidence_score: 78, availability_status: 'active',
    created_at: '2023-05-01T00:00:00Z', updated_at: '2025-04-28T00:00:00Z',
    maker_info: { name: 'Harpa', company: 'Harpa AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-183', name: 'MagickPen', slug: 'magickpen',
    description: 'AI writing assistant focused on academic and professional writing with citation support.',
    category: 'Writing', tags: ['Academic Writing', 'Professional', 'Citations', 'Research', 'Essays'],
    website_url: 'https://magickpen.com', pricing_model: 'freemium', confidence_score: 72, availability_status: 'active',
    created_at: '2023-08-01T00:00:00Z', updated_at: '2025-04-15T00:00:00Z',
    maker_info: { name: 'MagickPen', company: 'MagickPen' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: false, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.03
  },
  {
    id: 'prod-184', name: 'QuillBot', slug: 'quillbot',
    description: 'AI paraphrasing and writing tool with multiple modes for rewording, summarizing, and grammar checking.',
    category: 'Writing', tags: ['Paraphrasing', 'Writing', 'Grammar', 'Summarization', 'Education'],
    website_url: 'https://quillbot.com', pricing_model: 'freemium', confidence_score: 85, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'QuillBot', company: 'QuillBot' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-185', name: 'Wordtune', slug: 'wordtune',
    description: 'AI writing companion that rewrites sentences for clarity, tone, and impact in real-time.',
    category: 'Writing', tags: ['Rewriting', 'Clarity', 'Tone', 'Real-Time', 'Writing Assistant'],
    website_url: 'https://wordtune.com', pricing_model: 'freemium', confidence_score: 83, availability_status: 'active',
    created_at: '2022-02-01T00:00:00Z', updated_at: '2025-05-05T00:00:00Z',
    maker_info: { name: 'AI21 Labs', company: 'AI21 Labs' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-186', name: 'HyperWrite', slug: 'hyperwrite',
    description: 'AI writing assistant that works across the web, helping you write emails, posts, and documents anywhere.',
    category: 'Writing', tags: ['Writing Assistant', 'Web', 'Email', 'Posts', 'Chrome Extension'],
    website_url: 'https://hyperwriteai.com', pricing_model: 'freemium', confidence_score: 79, availability_status: 'active',
    created_at: '2023-03-01T00:00:00Z', updated_at: '2025-04-25T00:00:00Z',
    maker_info: { name: 'HyperWrite', company: 'HyperWrite' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-187', name: 'Rytr', slug: 'rytr',
    description: 'AI writing assistant for generating blog posts, emails, ad copy, and social media content quickly.',
    category: 'Writing', tags: ['Content Generation', 'Blog', 'Email', 'Ad Copy', 'Social Media'],
    website_url: 'https://rytr.me', pricing_model: 'freemium', confidence_score: 80, availability_status: 'active',
    created_at: '2022-05-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Rytr', company: 'Rytr' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.03
  },
  {
    id: 'prod-188', name: 'Writesonic', slug: 'writesonic',
    description: 'AI content platform for creating SEO-optimized articles, landing pages, and marketing copy at scale.',
    category: 'Writing', tags: ['SEO', 'Articles', 'Landing Pages', 'Marketing', 'Content Platform'],
    website_url: 'https://writesonic.com', pricing_model: 'freemium', confidence_score: 82, availability_status: 'active',
    created_at: '2022-03-01T00:00:00Z', updated_at: '2025-05-01T00:00:00Z',
    maker_info: { name: 'Writesonic', company: 'Writesonic' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-189', name: 'Anyword', slug: 'anyword',
    description: 'AI copywriting platform with predictive performance scoring for ads, landing pages, and emails.',
    category: 'Marketing', tags: ['Copywriting', 'Performance Scoring', 'Ads', 'Landing Pages', 'Predictive'],
    website_url: 'https://anyword.com', pricing_model: 'paid', confidence_score: 81, availability_status: 'active',
    created_at: '2022-06-01T00:00:00Z', updated_at: '2025-04-28T00:00:00Z',
    maker_info: { name: 'Anyword', company: 'Anyword' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-190', name: 'Surfer SEO', slug: 'surfer-seo',
    description: 'AI-powered SEO tool that analyzes and optimizes content for search engine rankings.',
    category: 'Marketing', tags: ['SEO', 'Content Optimization', 'Rankings', 'Analysis', 'SERP'],
    website_url: 'https://surferseo.com', pricing_model: 'paid', confidence_score: 86, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Surfer SEO', company: 'Surfer' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-191', name: 'Frase', slug: 'frase-io',
    description: 'AI content optimization platform for researching, writing, and optimizing SEO content.',
    category: 'Marketing', tags: ['Content Optimization', 'SEO', 'Research', 'Writing', 'Briefs'],
    website_url: 'https://frase.io', pricing_model: 'paid', confidence_score: 80, availability_status: 'active',
    created_at: '2022-04-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Frase', company: 'Frase' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.03
  },
  {
    id: 'prod-192', name: 'MarketMuse', slug: 'marketmuse',
    description: 'AI content intelligence platform for strategy, optimization, and competitive analysis.',
    category: 'Marketing', tags: ['Content Strategy', 'Intelligence', 'Optimization', 'Competitive', 'Enterprise'],
    website_url: 'https://marketmuse.com', pricing_model: 'enterprise', confidence_score: 82, availability_status: 'active',
    created_at: '2022-02-01T00:00:00Z', updated_at: '2025-05-01T00:00:00Z',
    maker_info: { name: 'MarketMuse', company: 'MarketMuse' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-193', name: 'Predis AI', slug: 'predis-ai',
    description: 'AI social media content generator creating posts, captions, and visuals for all major platforms.',
    category: 'Marketing', tags: ['Social Media', 'Content Generation', 'Posts', 'Captions', 'Visuals'],
    website_url: 'https://predis.ai', pricing_model: 'freemium', confidence_score: 78, availability_status: 'active',
    created_at: '2023-04-01T00:00:00Z', updated_at: '2025-04-25T00:00:00Z',
    maker_info: { name: 'Predis', company: 'Predis AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-194', name: 'Ocoya', slug: 'ocoya',
    description: 'All-in-one social media management with AI content creation, scheduling, and analytics.',
    category: 'Marketing', tags: ['Social Media', 'Scheduling', 'Analytics', 'Content Creation', 'Management'],
    website_url: 'https://ocoya.com', pricing_model: 'paid', confidence_score: 79, availability_status: 'active',
    created_at: '2023-02-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Ocoya', company: 'Ocoya' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-195', name: 'Jasper Campaigns', slug: 'jasper-campaigns',
    description: 'AI marketing campaign builder that generates multi-channel campaigns from a single brief.',
    category: 'Marketing', tags: ['Campaign', 'Multi-Channel', 'Brief', 'Marketing', 'Automation'],
    website_url: 'https://jasper.ai', pricing_model: 'paid', confidence_score: 84, availability_status: 'active',
    created_at: '2024-01-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Jasper', company: 'Jasper' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-196', name: 'Midday', slug: 'midday-ai',
    description: 'AI-powered business management platform for invoicing, accounting, and financial oversight.',
    category: 'Finance', tags: ['Invoicing', 'Accounting', 'Finance', 'Business', 'Management'],
    website_url: 'https://midday.ai', pricing_model: 'paid', confidence_score: 77, availability_status: 'active',
    created_at: '2024-02-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Midday', company: 'Midday' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-197', name: 'DoNotPay', slug: 'donotpay',
    description: 'AI robot lawyer that helps fight corporations, appeal parking tickets, and handle legal tasks.',
    category: 'Legal', tags: ['Legal', 'Robot Lawyer', 'Parking Tickets', 'Consumer Rights', 'Automation'],
    website_url: 'https://donotpay.com', pricing_model: 'freemium', confidence_score: 80, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-04-28T00:00:00Z',
    maker_info: { name: 'Joshua Browder', twitter: '@JoshUA_Browder', company: 'DoNotPay' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-198', name: 'Harvey', slug: 'harvey-ai',
    description: 'AI legal assistant for law firms providing contract analysis, research, and document drafting.',
    category: 'Legal', tags: ['Legal', 'Contract Analysis', 'Research', 'Document Drafting', 'Enterprise'],
    website_url: 'https://harvey.ai', pricing_model: 'enterprise', confidence_score: 86, availability_status: 'active',
    created_at: '2023-03-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Winston AI', company: 'Harvey AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.14
  },
  {
    id: 'prod-199', name: 'Khanmigo', slug: 'khanmigo',
    description: 'Khan Academy\'s AI tutor providing personalized learning, practice, and teaching assistance.',
    category: 'Education', tags: ['Education', 'Tutor', 'Personalized Learning', 'Khan Academy', 'Teaching'],
    website_url: 'https://khanmigo.khanacademy.org', pricing_model: 'paid', confidence_score: 87, availability_status: 'active',
    created_at: '2023-03-15T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'Sal Khan', twitter: '@salkhanacademy', company: 'Khan Academy' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.09
  },
  {
    id: 'prod-200', name: 'Duolingo Max', slug: 'duolingo-max',
    description: 'AI-powered language learning with role-play scenarios and grammar explanations powered by GPT-4.',
    category: 'Education', tags: ['Language Learning', 'Role-Play', 'Grammar', 'GPT-4', 'Mobile'],
    website_url: 'https://duolingo.com', pricing_model: 'paid', confidence_score: 90, availability_status: 'active',
    created_at: '2023-03-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Luis von Ahn', twitter: '@luisvonahn', company: 'Duolingo' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
];

// ============================================================
// NICHE / SPECIALIZED PRODUCTS (50+)
// ============================================================
const nicheProducts: MockProduct[] = [
  {
    id: 'prod-301', name: 'LegalSifter', slug: 'legalsifter',
    description: 'AI contract review platform that identifies risks, missing clauses, and suggests improvements.',
    category: 'Legal', tags: ['Contract Review', 'Risk Assessment', 'Legal', 'AI', 'Compliance'],
    website_url: 'https://legalsifter.com', pricing_model: 'paid', confidence_score: 78, availability_status: 'active',
    created_at: '2022-06-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'LegalSifter', company: 'LegalSifter' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-302', name: 'Spellbook', slug: 'spellbook-legal',
    description: 'AI contract drafting assistant for lawyers using GPT-4 with legal-specific training.',
    category: 'Legal', tags: ['Contract Drafting', 'Legal', 'GPT-4', 'Lawyers', 'Drafting'],
    website_url: 'https://spellbook.legal', pricing_model: 'paid', confidence_score: 80, availability_status: 'active',
    created_at: '2023-06-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Spellbook', company: 'Spellbook' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-303', name: 'Casetext', slug: 'casetext',
    description: 'AI legal research platform with CARA AI for case analysis and paralegal AI assistant.',
    category: 'Legal', tags: ['Legal Research', 'Case Analysis', 'AI', 'Paralegal', 'Westlaw'],
    website_url: 'https://casetext.com', pricing_model: 'paid', confidence_score: 82, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-05-01T00:00:00Z',
    maker_info: { name: 'Casetext', company: 'Thomson Reuters' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.03
  },
  {
    id: 'prod-304', name: 'Abridge', slug: 'abridge-ai',
    description: 'AI medical documentation platform that transforms clinical conversations into structured notes.',
    category: 'Healthcare', tags: ['Medical', 'Documentation', 'Clinical', 'Ambient AI', 'EHR'],
    website_url: 'https://abridge.com', pricing_model: 'enterprise', confidence_score: 82, availability_status: 'active',
    created_at: '2023-02-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Abridge', company: 'Abridge AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10
  },
  {
    id: 'prod-305', name: 'Ambience Healthcare', slug: 'ambience-healthcare',
    description: 'AI ambient clinical documentation that listens to patient visits and generates clinical notes.',
    category: 'Healthcare', tags: ['Clinical Documentation', 'Ambient AI', 'Patient Visits', 'Medical Notes', 'Healthcare'],
    website_url: 'https://ambiencehealthcare.com', pricing_model: 'enterprise', confidence_score: 79, availability_status: 'active',
    created_at: '2023-04-01T00:00:00Z', updated_at: '2025-04-28T00:00:00Z',
    maker_info: { name: 'Ambience', company: 'Ambience Healthcare' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-306', name: 'Heidi Health', slug: 'heidi-health',
    description: 'AI medical scribe that creates clinical documentation from doctor-patient conversations.',
    category: 'Healthcare', tags: ['Medical Scribe', 'Clinical Documentation', 'Conversations', 'Healthcare', 'AI'],
    website_url: 'https://heiditech.com', pricing_model: 'paid', confidence_score: 78, availability_status: 'active',
    created_at: '2023-07-01T00:00:00Z', updated_at: '2025-05-05T00:00:00Z',
    maker_info: { name: 'Heidi Health', company: 'Heidi Health' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-307', name: 'Nabla', slug: 'nabla-health',
    description: 'AI clinical assistant that generates medical notes and letters during patient consultations.',
    category: 'Healthcare', tags: ['Clinical Assistant', 'Medical Notes', 'Consultation', 'Healthcare', 'AI'],
    website_url: 'https://nabla.com', pricing_model: 'paid', confidence_score: 77, availability_status: 'active',
    created_at: '2023-09-01T00:00:00Z', updated_at: '2025-04-25T00:00:00Z',
    maker_info: { name: 'Nabla', company: 'Nabla' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-308', name: 'Curie', slug: 'curie-ai-health',
    description: 'AI health research assistant that helps patients understand medical literature and treatment options.',
    category: 'Healthcare', tags: ['Health Research', 'Patient Education', 'Medical Literature', 'Treatment', 'AI'],
    website_url: 'https://curie.health', pricing_model: 'freemium', confidence_score: 74, availability_status: 'active',
    created_at: '2024-01-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Curie', company: 'Curie AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-309', name: 'Trellis', slug: 'trellis-3d',
    description: 'AI 3D model generation platform creating production-ready 3D assets from text or images.',
    category: 'Design', tags: ['3D Generation', 'Text-to-3D', 'Image-to-3D', 'Assets', 'Game Dev'],
    website_url: 'https://trellis3d.ai', pricing_model: 'freemium', confidence_score: 78, availability_status: 'active',
    created_at: '2024-05-01T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Trellis', company: 'Trellis AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12
  },
  {
    id: 'prod-310', name: 'Meshy', slug: 'meshy-ai',
    description: 'AI 3D content generation for game assets, product visualization, and character creation.',
    category: 'Design', tags: ['3D Generation', 'Game Assets', 'Product Viz', 'Characters', 'Text-to-3D'],
    website_url: 'https://meshy.ai', pricing_model: 'freemium', confidence_score: 80, availability_status: 'active',
    created_at: '2023-10-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Meshy', company: 'Meshy AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10
  },
  {
    id: 'prod-311', name: 'CSM (Common Sense Machines)', slug: 'csm-3d',
    description: 'AI platform that converts 2D images into interactive 3D models with texture and animation.',
    category: 'Design', tags: ['2D-to-3D', '3D Models', 'Texture', 'Animation', 'Interactive'],
    website_url: 'https://csm.ai', pricing_model: 'freemium', confidence_score: 76, availability_status: 'active',
    created_at: '2023-06-01T00:00:00Z', updated_at: '2025-04-28T00:00:00Z',
    maker_info: { name: 'CSM', company: 'Common Sense Machines' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-312', name: 'Galileo AI', slug: 'galileo-ai',
    description: 'AI UI design generator that creates high-fidelity interfaces from text descriptions.',
    category: 'Design', tags: ['UI Design', 'Text-to-UI', 'High Fidelity', 'Interface', 'Figma'],
    website_url: 'https://usegalileo.ai', pricing_model: 'freemium', confidence_score: 82, availability_status: 'active',
    created_at: '2023-04-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Galileo', company: 'Galileo AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-313', name: 'Uizard', slug: 'uizard',
    description: 'AI-powered design tool for creating wireframes, mockups, and prototypes from sketches.',
    category: 'Design', tags: ['Wireframes', 'Mockups', 'Prototypes', 'Sketch-to-Design', 'No-Code'],
    website_url: 'https://uizard.io', pricing_model: 'freemium', confidence_score: 83, availability_status: 'active',
    created_at: '2022-06-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Uizard', company: 'Uizard' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-314', name: 'Visily', slug: 'visily',
    description: 'AI design tool for converting screenshots and sketches into editable wireframes and prototypes.',
    category: 'Design', tags: ['Screenshot-to-Design', 'Wireframes', 'Prototypes', 'AI Design', 'Collaboration'],
    website_url: 'https://visily.ai', pricing_model: 'freemium', confidence_score: 79, availability_status: 'active',
    created_at: '2023-02-01T00:00:00Z', updated_at: '2025-04-25T00:00:00Z',
    maker_info: { name: 'Visily', company: 'Visily' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-315', name: 'Motiff', slug: 'motiff',
    description: 'AI-native design tool for professional UI/UX design with smart component generation.',
    category: 'Design', tags: ['UI/UX', 'Design Tool', 'Components', 'Professional', 'AI-Native'],
    website_url: 'https://motiff.com', pricing_model: 'freemium', confidence_score: 77, availability_status: 'active',
    created_at: '2024-02-01T00:00:00Z', updated_at: '2025-05-05T00:00:00Z',
    maker_info: { name: 'Motiff', company: 'Motiff' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.09
  },
  {
    id: 'prod-316', name: 'Relume', slug: 'relume',
    description: 'AI sitemap and wireframe generator for web designers and agencies to speed up site planning.',
    category: 'Design', tags: ['Sitemap', 'Wireframe', 'Web Design', 'Agency', 'Planning'],
    website_url: 'https://relume.io', pricing_model: 'freemium', confidence_score: 80, availability_status: 'active',
    created_at: '2023-08-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Relume', company: 'Relume' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-317', name: 'v0 by Vercel', slug: 'v0-vercel',
    description: 'Generative UI tool that creates React components from text prompts using Tailwind and shadcn/ui.',
    category: 'Coding', tags: ['Generative UI', 'React', 'Tailwind', 'Components', 'Vercel'],
    website_url: 'https://v0.dev', pricing_model: 'freemium', confidence_score: 88, availability_status: 'active',
    created_at: '2024-03-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Vercel', company: 'Vercel' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.15
  },
  {
    id: 'prod-318', name: 'Liner AI', slug: 'liner-ai',
    description: 'AI research assistant for highlighting, summarizing, and organizing web content and PDFs.',
    category: 'Research', tags: ['Research', 'Highlighting', 'Summarization', 'PDF', 'Web'],
    website_url: 'https://getliner.com', pricing_model: 'freemium', confidence_score: 78, availability_status: 'active',
    created_at: '2023-01-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Liner', company: 'Liner' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-319', name: 'Scispace', slug: 'scispace',
    description: 'AI research platform for finding, understanding, and communicating scientific research papers.',
    category: 'Research', tags: ['Scientific Research', 'Papers', 'Understanding', 'Communication', 'Academic'],
    website_url: 'https://typeset.io', pricing_model: 'freemium', confidence_score: 80, availability_status: 'active',
    created_at: '2022-08-01T00:00:00Z', updated_at: '2025-05-05T00:00:00Z',
    maker_info: { name: 'Typeset', company: 'SciSpace' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-320', name: 'Genei', slug: 'genei',
    description: 'AI research tool for summarizing articles, papers, and documents with key insight extraction.',
    category: 'Research', tags: ['Summarization', 'Articles', 'Papers', 'Insight Extraction', 'Research'],
    website_url: 'https://genei.io', pricing_model: 'freemium', confidence_score: 76, availability_status: 'active',
    created_at: '2023-03-01T00:00:00Z', updated_at: '2025-04-15T00:00:00Z',
    maker_info: { name: 'Genei', company: 'Genei' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-321', name: 'PaperBrain', slug: 'paperbrain',
    description: 'AI platform for accessing, understanding, and generating research papers with simplified explanations.',
    category: 'Research', tags: ['Research Papers', 'Understanding', 'Simplified', 'Generation', 'Academic'],
    website_url: 'https://paperbrain.study', pricing_model: 'freemium', confidence_score: 73, availability_status: 'active',
    created_at: '2023-09-01T00:00:00Z', updated_at: '2025-04-10T00:00:00Z',
    maker_info: { name: 'PaperBrain', company: 'PaperBrain' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: false, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.03
  },
  {
    id: 'prod-322', name: 'ChatPDF', slug: 'chatpdf',
    description: 'AI tool that lets you chat with any PDF document, extracting answers and summaries instantly.',
    category: 'Research', tags: ['PDF', 'Chat', 'Summarization', 'Document Q&A', 'AI'],
    website_url: 'https://chatpdf.com', pricing_model: 'freemium', confidence_score: 80, availability_status: 'active',
    created_at: '2023-02-01T00:00:00Z', updated_at: '2025-05-01T00:00:00Z',
    maker_info: { name: 'ChatPDF', company: 'ChatPDF' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-323', name: 'AskYourPDF', slug: 'askyourpdf',
    description: 'AI-powered PDF analysis tool for extracting insights, answering questions, and generating summaries.',
    category: 'Research', tags: ['PDF Analysis', 'Q&A', 'Summarization', 'Document Insights', 'AI'],
    website_url: 'https://askyourpdf.com', pricing_model: 'freemium', confidence_score: 75, availability_status: 'active',
    created_at: '2023-04-01T00:00:00Z', updated_at: '2025-04-18T00:00:00Z',
    maker_info: { name: 'AskYourPDF', company: 'AskYourPDF' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.03
  },
  {
    id: 'prod-324', name: 'Explainpaper', slug: 'explainpaper',
    description: 'AI tool for explaining complex academic papers in simple terms with highlighted text explanations.',
    category: 'Education', tags: ['Academic Papers', 'Explanation', 'Simple Terms', 'Education', 'Research'],
    website_url: 'https://explainpaper.com', pricing_model: 'freemium', confidence_score: 74, availability_status: 'active',
    created_at: '2022-11-01T00:00:00Z', updated_at: '2025-04-10T00:00:00Z',
    maker_info: { name: 'Explainpaper', company: 'Explainpaper' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: false, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.02
  },
  {
    id: 'prod-325', name: 'Wisio', slug: 'wisio',
    description: 'AI scientific writing assistant for researchers to write, edit, and format academic papers.',
    category: 'Education', tags: ['Scientific Writing', 'Academic', 'Editing', 'Formatting', 'Research'],
    website_url: 'https://wisio.app', pricing_model: 'freemium', confidence_score: 72, availability_status: 'active',
    created_at: '2023-05-01T00:00:00Z', updated_at: '2025-04-05T00:00:00Z',
    maker_info: { name: 'Wisio', company: 'Wisio' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: false, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.02
  },
  {
    id: 'prod-326', name: 'Mindgrasp', slug: 'mindgrasp',
    description: 'AI learning assistant that creates notes, summaries, and flashcards from videos, PDFs, and web pages.',
    category: 'Education', tags: ['Learning', 'Notes', 'Flashcards', 'Summarization', 'Study'],
    website_url: 'https://mindgrasp.ai', pricing_model: 'paid', confidence_score: 79, availability_status: 'active',
    created_at: '2023-06-01T00:00:00Z', updated_at: '2025-05-01T00:00:00Z',
    maker_info: { name: 'Mindgrasp', company: 'Mindgrasp AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-327', name: 'Scholarcy', slug: 'scholarcy',
    description: 'AI article summarizer that creates flashcard-style summaries of research papers and reports.',
    category: 'Education', tags: ['Summarization', 'Research Papers', 'Flashcards', 'Reports', 'Academic'],
    website_url: 'https://scholarcy.com', pricing_model: 'freemium', confidence_score: 76, availability_status: 'active',
    created_at: '2022-07-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Scholarcy', company: 'Scholarcy' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.03
  },
  {
    id: 'prod-328', name: 'Wysa', slug: 'wysa',
    description: 'AI mental health chatbot providing CBT-based therapy, mindfulness exercises, and emotional support.',
    category: 'Healthcare', tags: ['Mental Health', 'CBT', 'Chatbot', 'Mindfulness', 'Emotional Support'],
    website_url: 'https://wysa.io', pricing_model: 'freemium', confidence_score: 80, availability_status: 'active',
    created_at: '2022-04-01T00:00:00Z', updated_at: '2025-05-05T00:00:00Z',
    maker_info: { name: 'Wysa', company: 'Wysa' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-329', name: 'Woebot', slug: 'woebot',
    description: 'AI mental health companion using CBT and interpersonal therapy techniques for daily check-ins.',
    category: 'Healthcare', tags: ['Mental Health', 'CBT', 'Daily Check-in', 'Companion', 'Therapy'],
    website_url: 'https://woebothealth.com', pricing_model: 'freemium', confidence_score: 81, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Woebot Health', company: 'Woebot Health' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-330', name: 'Kintsugi', slug: 'kintsugi-health',
    description: 'AI voice biomarker platform detecting signs of depression and cognitive decline from speech patterns.',
    category: 'Healthcare', tags: ['Voice Biomarkers', 'Depression', 'Cognitive Decline', 'Speech', 'Diagnostics'],
    website_url: 'https://kintsugihealth.com', pricing_model: 'enterprise', confidence_score: 77, availability_status: 'active',
    created_at: '2023-05-01T00:00:00Z', updated_at: '2025-04-25T00:00:00Z',
    maker_info: { name: 'Kintsugi Health', company: 'Kintsugi Health' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-331', name: 'Regie.ai', slug: 'regie-ai',
    description: 'AI sales content platform for generating personalized outreach emails, sequences, and content.',
    category: 'Marketing', tags: ['Sales', 'Outreach', 'Email', 'Sequences', 'Personalization'],
    website_url: 'https://regie.ai', pricing_model: 'paid', confidence_score: 80, availability_status: 'active',
    created_at: '2022-08-01T00:00:00Z', updated_at: '2025-05-01T00:00:00Z',
    maker_info: { name: 'Regie.ai', company: 'Regie.ai' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-332', name: 'Lavender', slug: 'lavender-ai',
    description: 'AI email coach for sales professionals, optimizing cold emails for higher reply rates.',
    category: 'Marketing', tags: ['Email Coaching', 'Sales', 'Cold Email', 'Reply Rate', 'Optimization'],
    website_url: 'https://lavender.ai', pricing_model: 'paid', confidence_score: 81, availability_status: 'active',
    created_at: '2022-05-01T00:00:00Z', updated_at: '2025-05-05T00:00:00Z',
    maker_info: { name: 'Lavender', company: 'Lavender' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-333', name: 'Mutiny', slug: 'mutiny-ai',
    description: 'AI website personalization platform that converts more visitors with targeted messaging.',
    category: 'Marketing', tags: ['Website Personalization', 'Conversion', 'Targeting', 'ABM', 'B2B'],
    website_url: 'https://mutinyhq.com', pricing_model: 'paid', confidence_score: 82, availability_status: 'active',
    created_at: '2022-03-01T00:00:00Z', updated_at: '2025-05-10T00:00:00Z',
    maker_info: { name: 'Mutiny', company: 'Mutiny' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.08
  },
  {
    id: 'prod-334', name: 'Attention', slug: 'attention-ai',
    description: 'AI security monitoring platform that detects anomalous behavior and potential threats in real-time.',
    category: 'Security', tags: ['Security', 'Monitoring', 'Anomaly Detection', 'Threats', 'Real-Time'],
    website_url: 'https://attention.ai', pricing_model: 'enterprise', confidence_score: 76, availability_status: 'active',
    created_at: '2023-07-01T00:00:00Z', updated_at: '2025-04-28T00:00:00Z',
    maker_info: { name: 'Attention', company: 'Attention AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
  {
    id: 'prod-335', name: 'Darktrace', slug: 'darktrace',
    description: 'AI cybersecurity platform for threat detection and autonomous response across cloud and network.',
    category: 'Security', tags: ['Cybersecurity', 'Threat Detection', 'Autonomous Response', 'Cloud', 'Network'],
    website_url: 'https://darktrace.com', pricing_model: 'enterprise', confidence_score: 88, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z',
    maker_info: { name: 'Darktrace', company: 'Darktrace' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-336', name: 'Cylance', slug: 'cylance',
    description: 'AI-powered endpoint protection that prevents malware and zero-day threats using predictive models.',
    category: 'Security', tags: ['Endpoint Protection', 'Malware Prevention', 'Zero-Day', 'Predictive', 'BlackBerry'],
    website_url: 'https://cylance.blackberry.com', pricing_model: 'enterprise', confidence_score: 84, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'BlackBerry', company: 'BlackBerry' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.03
  },
  {
    id: 'prod-337', name: 'Abnormal Security', slug: 'abnormal-security',
    description: 'AI email security platform detecting phishing, BEC, and account takeover with behavioral analysis.',
    category: 'Security', tags: ['Email Security', 'Phishing', 'BEC', 'Account Takeover', 'Behavioral'],
    website_url: 'https://abnormalsecurity.com', pricing_model: 'enterprise', confidence_score: 85, availability_status: 'active',
    created_at: '2022-02-01T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Abnormal Security', company: 'Abnormal Security' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.07
  },
  {
    id: 'prod-338', name: 'Robocorp', slug: 'robocorp',
    description: 'Open-source platform for building and deploying AI-powered robotic process automation at scale.',
    category: 'Agent', tags: ['RPA', 'Automation', 'Open Source', 'Robots', 'Enterprise'],
    website_url: 'https://robocorp.com', github_url: 'https://github.com/robocorp', github_stars: 2800, github_forks: 320,
    pricing_model: 'open_source', confidence_score: 78, availability_status: 'active',
    created_at: '2022-06-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'Robocorp', company: 'Robocorp' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04, contributor_count: 85, open_issues_count: 28, latest_release_date: '2025-04-10'
  },
  {
    id: 'prod-339', name: 'n8n', slug: 'n8n',
    description: 'Fair-code workflow automation platform with 400+ integrations and AI agent capabilities.',
    category: 'Productivity', tags: ['Workflow', 'Automation', 'Integration', 'AI Agent', 'Fair-Code'],
    website_url: 'https://n8n.io', github_url: 'https://github.com/n8n-io/n8n', github_stars: 48000, github_forks: 7200,
    pricing_model: 'open_source', confidence_score: 90, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-06-08T00:00:00Z',
    maker_info: { name: 'Jan Oberhauser', twitter: '@jan_Oberhauser', company: 'n8n' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.14, contributor_count: 520, open_issues_count: 280, latest_release_date: '2025-06-05'
  },
  {
    id: 'prod-340', name: 'Make (Integromat)', slug: 'make-integromat',
    description: 'Visual automation platform for building workflows between apps with AI-powered scenarios.',
    category: 'Productivity', tags: ['Automation', 'Visual', 'Workflows', 'Integration', 'AI'],
    website_url: 'https://make.com', pricing_model: 'freemium', confidence_score: 86, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Make', company: 'Make' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-341', name: 'LlamaGuard', slug: 'llamaguard',
    description: 'Open-source safety model from Meta for detecting harmful content in LLM inputs and outputs.',
    category: 'Security', tags: ['Safety', 'Content Moderation', 'Meta', 'Open Source', 'LLM'],
    website_url: '', github_url: 'https://github.com/meta-llama/Prompt-Guard', github_stars: 1500, github_forks: 180,
    pricing_model: 'open_source', confidence_score: 82, availability_status: 'active',
    created_at: '2023-12-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Meta AI', company: 'Meta' },
    validation_signals: { has_website: false, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10, contributor_count: 45, open_issues_count: 12, latest_release_date: '2025-05-01'
  },
  {
    id: 'prod-342', name: 'NeMo Guardrails', slug: 'nemo-guardrails',
    description: 'NVIDIA\'s toolkit for building guardrails on LLM applications to ensure safe, policy-compliant outputs.',
    category: 'Security', tags: ['Guardrails', 'NVIDIA', 'Safety', 'Policy', 'LLM'],
    website_url: 'https://github.com/NVIDIA/NeMo-Guardrails', github_url: 'https://github.com/NVIDIA/NeMo-Guardrails', github_stars: 4200, github_forks: 520,
    pricing_model: 'open_source', confidence_score: 84, availability_status: 'active',
    created_at: '2023-06-01T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'NVIDIA', company: 'NVIDIA' },
    validation_signals: { has_website: true, has_privacy_policy: false, has_terms: false, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.12, contributor_count: 120, open_issues_count: 38, latest_release_date: '2025-05-18'
  },
  {
    id: 'prod-343', name: 'PromptLayer', slug: 'promptlayer',
    description: 'Platform for versioning, tracking, and optimizing prompts used in LLM applications.',
    category: 'Coding', tags: ['Prompt Management', 'Versioning', 'Tracking', 'Optimization', 'LLM'],
    website_url: 'https://promptlayer.com', pricing_model: 'freemium', confidence_score: 79, availability_status: 'active',
    created_at: '2023-03-01T00:00:00Z', updated_at: '2025-04-28T00:00:00Z',
    maker_info: { name: 'PromptLayer', company: 'PromptLayer' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-344', name: 'Langfuse', slug: 'langfuse',
    description: 'Open-source LLM engineering platform for prompt management, tracing, and evaluation.',
    category: 'Coding', tags: ['LLM Engineering', 'Tracing', 'Evaluation', 'Open Source', 'Prompt Management'],
    website_url: 'https://langfuse.com', github_url: 'https://github.com/langfuse/langfuse', github_stars: 5800, github_forks: 620,
    pricing_model: 'open_source', confidence_score: 86, availability_status: 'active',
    created_at: '2023-08-01T00:00:00Z', updated_at: '2025-06-05T00:00:00Z',
    maker_info: { name: 'Langfuse', company: 'Langfuse' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.16, contributor_count: 120, open_issues_count: 45, latest_release_date: '2025-06-01'
  },
  {
    id: 'prod-345', name: 'Braintrust', slug: 'braintrust',
    description: 'AI evaluation platform for testing, comparing, and monitoring LLM application quality.',
    category: 'Coding', tags: ['Evaluation', 'Testing', 'Monitoring', 'LLM Quality', 'Developer Tools'],
    website_url: 'https://braintrustdata.com', pricing_model: 'freemium', confidence_score: 81, availability_status: 'active',
    created_at: '2023-09-01T00:00:00Z', updated_at: '2025-05-20T00:00:00Z',
    maker_info: { name: 'Braintrust', company: 'Braintrust' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.10
  },
  {
    id: 'prod-346', name: 'Galileo (Prompt Engineering)', slug: 'galileo-prompt',
    description: 'Platform for monitoring, evaluating, and improving LLM prompts and outputs in production.',
    category: 'Coding', tags: ['Prompt Engineering', 'Monitoring', 'Evaluation', 'Production', 'LLM'],
    website_url: 'https://rungalileo.io', pricing_model: 'paid', confidence_score: 79, availability_status: 'active',
    created_at: '2023-05-01T00:00:00Z', updated_at: '2025-04-25T00:00:00Z',
    maker_info: { name: 'Galileo', company: 'Galileo AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-347', name: 'Patronus AI', slug: 'patronus-ai',
    description: 'Enterprise AI evaluation platform for testing LLM outputs for hallucination, safety, and compliance.',
    category: 'Security', tags: ['AI Evaluation', 'Hallucination', 'Safety', 'Compliance', 'Enterprise'],
    website_url: 'https://patronus.ai', pricing_model: 'enterprise', confidence_score: 82, availability_status: 'active',
    created_at: '2023-06-01T00:00:00Z', updated_at: '2025-05-15T00:00:00Z',
    maker_info: { name: 'Patronus AI', company: 'Patronus AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.09
  },
  {
    id: 'prod-348', name: 'TruEra', slug: 'truera',
    description: 'AI model quality management platform for diagnosing and fixing ML model issues in production.',
    category: 'Data', tags: ['Model Quality', 'ML', 'Diagnostics', 'Production', 'Management'],
    website_url: 'https://truera.com', pricing_model: 'enterprise', confidence_score: 78, availability_status: 'active',
    created_at: '2022-06-01T00:00:00Z', updated_at: '2025-04-20T00:00:00Z',
    maker_info: { name: 'TruEra', company: 'TruEra' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.04
  },
  {
    id: 'prod-349', name: 'Arize AI', slug: 'arize-ai',
    description: 'ML observability platform for monitoring model performance, drift detection, and root cause analysis.',
    category: 'Data', tags: ['ML Observability', 'Drift Detection', 'Root Cause', 'Monitoring', 'Enterprise'],
    website_url: 'https://arize.com', pricing_model: 'enterprise', confidence_score: 85, availability_status: 'active',
    created_at: '2022-01-01T00:00:00Z', updated_at: '2025-05-25T00:00:00Z',
    maker_info: { name: 'Aparna Dhinakaran', company: 'Arize AI' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.06
  },
  {
    id: 'prod-350', name: 'WhyLabs', slug: 'whylabs',
    description: 'Data and AI observability platform with WhyLabs for monitoring data quality and model performance.',
    category: 'Data', tags: ['Data Quality', 'AI Observability', 'Monitoring', 'Data Profiling', 'WhyLabs'],
    website_url: 'https://whylabs.ai', pricing_model: 'freemium', confidence_score: 79, availability_status: 'active',
    created_at: '2022-04-01T00:00:00Z', updated_at: '2025-05-05T00:00:00Z',
    maker_info: { name: 'WhyLabs', company: 'WhyLabs' },
    validation_signals: { has_website: true, has_privacy_policy: true, has_terms: true, has_documentation: true, has_changelog: true, has_social_media: true, has_contact: true },
    weekly_growth_rate: 0.05
  },
];

// ============================================================
// COMBINE ALL PRODUCTS
// ============================================================
export const allMockProducts: MockProduct[] = [
  ...famousProducts,
  ...emergingProducts,
  ...nicheProducts,
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================
export function getProductById(id: string): MockProduct | undefined {
  return allMockProducts.find(p => p.id === id);
}

export function getProductBySlug(slug: string): MockProduct | undefined {
  return allMockProducts.find(p => p.slug === slug);
}

export function getProductsByCategory(category: string): MockProduct[] {
  return allMockProducts.filter(p => p.category === category);
}

export function getProductsByPricing(pricing: string): MockProduct[] {
  return allMockProducts.filter(p => p.pricing_model === pricing);
}

export function searchProducts(query: string): MockProduct[] {
  const lower = query.toLowerCase();
  return allMockProducts.filter(
    p =>
      p.name.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower) ||
      p.tags.some(t => t.toLowerCase().includes(lower)) ||
      p.category.toLowerCase().includes(lower)
  );
}

export function getTrendingProducts(limit: number = 20): MockProduct[] {
  return [...allMockProducts]
    .filter(p => p.weekly_growth_rate !== undefined)
    .sort((a, b) => (b.weekly_growth_rate ?? 0) - (a.weekly_growth_rate ?? 0))
    .slice(0, limit);
}

export function getHighConfidenceProducts(minScore: number = 80): MockProduct[] {
  return allMockProducts.filter(p => p.confidence_score >= minScore);
}

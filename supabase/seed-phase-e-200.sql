-- =====================================================================
-- AI Radar Phase E — Master Orchestrator (Categories + Product_Signals)
-- File: supabase/seed-phase-e-200.sql
-- Author: 寇豆码 (Engineer)
-- Date: 2026-05-31
-- Related: T03 (A线-W1)
--
-- 范围:
--   1. categories: 40 条 = 13 个一级 (L1) + 27 个二级 (L2 sub-category)
--   2. product_signals: 25 条 (M:N 关联 products ↔ trend_signals)
--   3. 本文件为 master, 不会与上面 3 个 split file 数据重复
--
-- 子分类分布 (27 = 每个 L1 顶级 2-3 个子分类, 平均 2.07):
--   LLM: foundation-model, chatbot, reasoning-model
--   AI Image: image-generation, image-editing, design-assistant
--   AI Coding: code-completion, ai-ide, app-builder
--   AI Agents: autonomous-agent, agent-framework, browser-use
--   AI Productivity: writing-assistant, meeting-assistant, knowledge-base
--   AI Audio: tts-voice, voice-cloning, music-generation
--   AI Video: video-generation, avatar-video, video-editing
--   AI Infra: model-hub, inference-platform, training-platform
--   AI Search: answer-engine, traditional-search, research-assistant
--   AI Education: ai-tutor, language-learning, study-companion
--   AI Customer Service: support-agent, chatbot-platform, deflection
--   AI Healthcare: clinical-assistant, scribe, diagnostic
--   AI Marketing: copywriting, personalization, seo-content
--
-- 幂等策略:
--   categories: ON CONFLICT (slug) DO UPDATE
--   product_signals: ON CONFLICT (product_id, signal_id) DO UPDATE
-- =====================================================================

-- =====================================================================
-- Part A: 13 个顶级 L1 categories (parent_id = NULL)
-- =====================================================================

INSERT INTO categories (slug, name_en, name_zh, description, parent_id, product_count, hot_score, display_order, icon)
VALUES
  ('llm', 'Large Language Models', '大语言模型', 'Foundation models, chat models, reasoning models.', NULL, 0, 95.0, 100, 'brain'),
  ('ai-image', 'AI Image', 'AI 图像', 'Image generation, editing, design tools.', NULL, 0, 82.0, 200, 'image'),
  ('ai-coding', 'AI Coding', 'AI 编程', 'Code completion, AI IDE, app builders.', NULL, 0, 92.0, 300, 'code'),
  ('ai-agents', 'AI Agents', 'AI 智能体', 'Autonomous agents, agent frameworks, browser-use.', NULL, 0, 88.0, 400, 'robot'),
  ('ai-productivity', 'AI Productivity', 'AI 生产力', 'Writing, meeting, knowledge assistants.', NULL, 0, 76.0, 500, 'lightning'),
  ('ai-audio', 'AI Audio', 'AI 音频', 'TTS, voice cloning, music generation.', NULL, 0, 73.0, 600, 'music'),
  ('ai-video', 'AI Video', 'AI 视频', 'Video generation, avatar video, video editing.', NULL, 0, 85.0, 700, 'video'),
  ('ai-infra', 'AI Infrastructure', 'AI 基础设施', 'Model hub, inference, training platforms.', NULL, 0, 78.0, 800, 'server'),
  ('ai-search', 'AI Search', 'AI 搜索', 'Answer engines, traditional search, research.', NULL, 0, 68.0, 900, 'search'),
  ('ai-education', 'AI Education', 'AI 教育', 'AI tutors, language learning, study companions.', NULL, 0, 71.0, 1000, 'book'),
  ('ai-customer-service', 'AI Customer Service', 'AI 客服', 'Support agents, chatbot platforms, deflection.', NULL, 0, 79.0, 1100, 'headphones'),
  ('ai-healthcare', 'AI Healthcare', 'AI 医疗', 'Clinical assistants, scribes, diagnostics.', NULL, 0, 72.0, 1200, 'heart'),
  ('ai-marketing', 'AI Marketing', 'AI 营销', 'Copywriting, personalization, SEO content.', NULL, 0, 70.0, 1300, 'megaphone')
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_zh = EXCLUDED.name_zh,
  description = EXCLUDED.description,
  hot_score = EXCLUDED.hot_score,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- =====================================================================
-- Part B: 27 个二级 L2 sub-categories
-- 注意: 父类用 CTE + slug 匹配, 不硬编码 UUID
-- =====================================================================

INSERT INTO categories (slug, name_en, name_zh, description, parent_id, product_count, hot_score, display_order, icon)
SELECT
  sub.slug, sub.name_en, sub.name_zh, sub.description,
  parent.id AS parent_id,
  sub.product_count, sub.hot_score, sub.display_order, sub.icon
FROM (VALUES
  -- ===== LLM (3 subs) =====
  ('foundation-model',         'Foundation Model',     '基础模型',     'Pre-trained base models, multi-modal foundation.',  'llm', 0, 95.0, 101, 'brain'),
  ('chatbot',                  'Chatbot',              '对话机器人',   'Conversational interfaces over LLMs.',               'llm', 0, 90.0, 102, 'message-circle'),
  ('reasoning-model',          'Reasoning Model',      '推理模型',     'Models optimized for chain-of-thought reasoning.',  'llm', 0, 88.0, 103, 'puzzle'),

  -- ===== AI Image (3 subs) =====
  ('image-generation',         'Image Generation',     '图像生成',     'Text-to-image generation models and tools.',         'ai-image', 0, 88.0, 201, 'image'),
  ('image-editing',            'Image Editing',        '图像编辑',     'AI-powered photo editing and retouching.',           'ai-image', 0, 72.0, 202, 'edit'),
  ('design-assistant',         'Design Assistant',     '设计助手',     'AI design tools for UI, brand, layout.',             'ai-image', 0, 68.0, 203, 'pen-tool'),

  -- ===== AI Coding (3 subs) =====
  ('code-completion',          'Code Completion',      '代码补全',     'Inline AI code suggestions and autocompletion.',     'ai-coding', 0, 90.0, 301, 'terminal'),
  ('ai-ide',                   'AI IDE',               'AI IDE',       'Full AI-powered IDEs and code editors.',             'ai-coding', 0, 92.0, 302, 'code-2'),
  ('app-builder',              'App Builder',          '应用生成',     'AI full-stack app generators and prototyping.',      'ai-coding', 0, 87.0, 303, 'layout'),

  -- ===== AI Agents (3 subs) =====
  ('autonomous-agent',         'Autonomous Agent',     '自主智能体',   'Goal-driven agents that execute tasks end-to-end.',  'ai-agents', 0, 90.0, 401, 'bot'),
  ('agent-framework',          'Agent Framework',      '智能体框架',   'Frameworks for building and orchestrating agents.',  'ai-agents', 0, 82.0, 402, 'network'),
  ('browser-use',              'Browser-Use',          '浏览器操作',   'Agents that navigate and operate web browsers.',    'ai-agents', 0, 85.0, 403, 'globe'),

  -- ===== AI Productivity (3 subs) =====
  ('writing-assistant',        'Writing Assistant',    '写作助手',     'AI tools for drafting, editing, and rewriting.',     'ai-productivity', 0, 80.0, 501, 'pencil'),
  ('meeting-assistant',        'Meeting Assistant',    '会议助手',     'Transcribe, summarize, and extract action items.',   'ai-productivity', 0, 70.0, 502, 'users'),
  ('knowledge-base',           'Knowledge Base',       '知识库',       'Personal and team knowledge management with AI.',   'ai-productivity', 0, 74.0, 503, 'database'),

  -- ===== AI Audio (3 subs) =====
  ('tts-voice',                'TTS / Voice',          '语音合成',     'Text-to-speech and conversational voice.',           'ai-audio', 0, 78.0, 601, 'mic'),
  ('voice-cloning',            'Voice Cloning',        '声音克隆',     'Clone and replicate specific human voices.',         'ai-audio', 0, 72.0, 602, 'mic-2'),
  ('music-generation',         'Music Generation',     '音乐生成',     'AI music composition and audio generation.',        'ai-audio', 0, 70.0, 603, 'music'),

  -- ===== AI Video (3 subs) =====
  ('video-generation',         'Video Generation',     '视频生成',     'Text-to-video and image-to-video models.',           'ai-video', 0, 90.0, 701, 'film'),
  ('avatar-video',             'Avatar Video',         '数字人视频',   'AI-driven avatar and presenter videos.',             'ai-video', 0, 82.0, 702, 'user-circle'),
  ('video-editing',            'Video Editing',        '视频剪辑',     'AI-assisted video editing and post-production.',     'ai-video', 0, 78.0, 703, 'scissors'),

  -- ===== AI Infra (3 subs) =====
  ('model-hub',                'Model Hub',            '模型仓库',     'Repositories and registries for ML models.',         'ai-infra', 0, 80.0, 801, 'folder'),
  ('inference-platform',       'Inference Platform',   '推理平台',     'Serverless and managed model inference.',            'ai-infra', 0, 82.0, 802, 'zap'),
  ('training-platform',        'Training Platform',    '训练平台',     'Distributed training and fine-tuning infrastructure.', 'ai-infra', 0, 74.0, 803, 'cpu'),

  -- ===== AI Search (3 subs) =====
  ('answer-engine',            'Answer Engine',        '答案引擎',     'LLM-based direct answer search.',                    'ai-search', 0, 75.0, 901, 'search'),
  ('traditional-search',       'Traditional Search',   '传统搜索',     'AI-enhanced keyword search engines.',                'ai-search', 0, 65.0, 902, 'search-2'),
  ('research-assistant',       'Research Assistant',   '研究助手',     'Multi-step research and synthesis assistants.',      'ai-search', 0, 70.0, 903, 'book-open'),

  -- ===== AI Education (3 subs) =====
  ('ai-tutor',                 'AI Tutor',             'AI 辅导',      'Personalized AI tutors for K-12 and beyond.',        'ai-education', 0, 74.0, 1001, 'graduation-cap'),
  ('language-learning',        'Language Learning',    '语言学习',     'AI-driven language learning apps.',                  'ai-education', 0, 70.0, 1002, 'globe-2'),
  ('study-companion',          'Study Companion',      '学习伴侣',     'AI study buddies, flashcards, quiz companions.',     'ai-education', 0, 68.0, 1003, 'bookmark'),

  -- ===== AI Customer Service (3 subs) =====
  ('support-agent',            'Support Agent',        '客服智能体',   'Autonomous customer support agents.',                'ai-customer-service', 0, 82.0, 1101, 'headphones-2'),
  ('chatbot-platform',         'Chatbot Platform',     '对话平台',     'Enterprise chatbot builder platforms.',              'ai-customer-service', 0, 76.0, 1102, 'message-square'),
  ('deflection',               'Ticket Deflection',    '工单分流',     'AI-driven ticket deflection and triage.',            'ai-customer-service', 0, 72.0, 1103, 'filter'),

  -- ===== AI Healthcare (2 subs) =====
  ('clinical-assistant',       'Clinical Assistant',   '临床助手',     'AI assistants for clinicians and care teams.',       'ai-healthcare', 0, 75.0, 1201, 'stethoscope'),
  ('scribe',                   'Medical Scribe',       '医疗记录',     'AI medical scribes for clinical documentation.',     'ai-healthcare', 0, 72.0, 1202, 'file-text'),

  -- ===== AI Marketing (2 subs) =====
  ('copywriting',              'Copywriting',          '文案写作',     'AI copywriting for ads, emails, blogs.',             'ai-marketing', 0, 72.0, 1301, 'type'),
  ('personalization',          'Personalization',      '个性化',       'AI-driven website and message personalization.',    'ai-marketing', 0, 68.0, 1302, 'target')
) AS sub(slug, name_en, name_zh, description, parent_slug, product_count, hot_score, display_order, icon)
JOIN categories parent ON parent.slug = sub.parent_slug
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_zh = EXCLUDED.name_zh,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  hot_score = EXCLUDED.hot_score,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- =====================================================================
-- Part C: 25 条 product_signals (M:N 关联, 0-1 relevance)
-- 通过 slug + (signal_type, scope) 定位行
-- =====================================================================

INSERT INTO product_signals (product_id, signal_id, relevance)
SELECT
  p.id AS product_id,
  ts.id AS signal_id,
  ps.relevance
FROM (VALUES
  -- agent-orchestration (4 products)
  ('cursor',    'tag_emerging', 'tag:agent-orchestration',      0.95),
  ('manus',     'tag_emerging', 'tag:agent-orchestration',      0.98),
  ('autogpt',   'tag_emerging', 'tag:agent-orchestration',      0.92),
  ('lindy',     'tag_emerging', 'tag:agent-orchestration',      0.88),

  -- multimodal-long-context (3)
  ('claude',    'tag_emerging', 'tag:multimodal-long-context',  0.96),
  ('doubao',    'tag_emerging', 'tag:multimodal-long-context',  0.85),
  ('hunyuan',   'tag_emerging', 'tag:multimodal-long-context',  0.84),

  -- voice-agents (2)
  ('playht',     'tag_emerging', 'tag:voice-agents',             0.82),
  ('resemble-ai','tag_emerging', 'tag:voice-agents',             0.78),

  -- open-weights-coding (3) - via existing in DB
  ('cody',       'tag_emerging', 'tag:open-weights-coding',     0.80),
  ('tabnine',    'tag_emerging', 'tag:open-weights-coding',     0.75),
  ('replit',     'tag_emerging', 'tag:open-weights-coding',     0.72),

  -- ai-tutor-k12 (3)
  ('khanmigo',      'tag_emerging', 'tag:ai-tutor-k12',         0.94),
  ('duolingo-max',  'tag_emerging', 'tag:ai-tutor-k12',         0.86),
  ('quizlet-qchat', 'tag_emerging', 'tag:ai-tutor-k12',         0.82),

  -- browser-use-agents (1)
  ('manus',         'tag_emerging', 'tag:browser-use-agents',   0.90),

  -- small-language-models (2)
  ('glm-4',         'tag_emerging', 'tag:small-language-models',0.78),
  ('baichuan',      'tag_emerging', 'tag:small-language-models',0.72),

  -- video-avatars-real-time (3)
  ('heygen',        'tag_emerging', 'tag:video-avatars-real-time', 0.95),
  ('synthesia',     'tag_emerging', 'tag:video-avatars-real-time', 0.93),
  ('luma-dream-machine', 'tag_emerging', 'tag:video-avatars-real-time', 0.65),

  -- category:ai-customer-service (3)
  ('intercom-fin',  'category_growing', 'category:ai-customer-service', 0.96),
  ('ada-support',   'category_growing', 'category:ai-customer-service', 0.88),
  ('forethought',   'category_growing', 'category:ai-customer-service', 0.85),

  -- category:ai-video-generation (2)
  ('luma-dream-machine', 'category_growing', 'category:ai-video-generation', 0.92),
  ('synthesia',     'category_growing', 'category:ai-video-generation',      0.78),

  -- category:ai-coding-assistants (3)
  ('cursor',        'category_growing', 'category:ai-coding-assistants',    0.98),
  ('cody',          'category_growing', 'category:ai-coding-assistants',    0.82),
  ('replit',        'category_growing', 'category:ai-coding-assistants',    0.88),

  -- category:ai-marketing-personalization (2)
  ('jasper-ai',     'category_growing', 'category:ai-marketing-personalization', 0.95),
  ('copy-ai',       'category_growing', 'category:ai-marketing-personalization', 0.90),

  -- category:ai-healthcare-clinical (2)
  ('hippocratic-ai','category_growing', 'category:ai-healthcare-clinical', 0.94),
  ('glass-health',  'category_growing', 'category:ai-healthcare-clinical', 0.88),

  -- category:ai-education-language (2)
  ('speak-app',     'category_growing', 'category:ai-education-language', 0.92),
  ('duolingo-max',  'category_growing', 'category:ai-education-language', 0.90),

  -- category:ai-image-editing (1) - peaking
  ('adobe-firefly', 'category_growing', 'category:ai-image-editing',     0.88),

  -- category:ai-productivity-writing (2) - peaking
  ('grammarly',     'category_growing', 'category:ai-productivity-writing', 0.94),
  ('jasper-ai',     'category_growing', 'category:ai-productivity-writing', 0.86),

  -- category:ai-search-answer (1) - peaking
  ('brave-search',  'cluster_new',      'cluster:ai-search-answer-2024q3', 0.78),

  -- tech_stack:rust-inference (1)
  ('huggingface',   'tech_stack_shift', 'stack:rust-inference',           0.72),

  -- tech_stack:moe (2)
  ('hunyuan',       'tech_stack_shift', 'stack:moe-mixture-of-experts',   0.80),
  ('glm-4',         'tech_stack_shift', 'stack:moe-mixture-of-experts',   0.78),

  -- funding_pattern:agent-startup-seed (2)
  ('manus',         'funding_pattern',  'funding:agent-startup-seed',     0.90),
  ('lindy',         'funding_pattern',  'funding:agent-startup-seed',     0.82),

  -- cluster:ai-web-builder-2026q1 (2)
  ('replit',        'cluster_new',      'cluster:ai-web-builder-2026q1', 0.96),
  ('manus',         'cluster_new',      'cluster:ai-web-builder-2026q1', 0.92),

  -- cluster:agent-protocol-2026q1 (1)
  ('replicate',     'cluster_new',      'cluster:agent-protocol-2026q1', 0.65),

  -- category:ai-meeting-assistants (1) - cooling
  ('otter-ai',      'category_growing', 'category:ai-meeting-assistants', 0.90),

  -- category:ai-inference-platforms (2) - peaking
  ('replicate',     'category_growing', 'category:ai-inference-platforms',0.88),
  ('anyscale',      'category_growing', 'category:ai-inference-platforms',0.92)
) AS ps(product_slug, signal_type, scope, relevance)
JOIN products p ON p.slug = ps.product_slug
JOIN trend_signals ts ON ts.signal_type = ps.signal_type AND ts.scope = ps.scope
ON CONFLICT (product_id, signal_id) DO UPDATE SET
  relevance = EXCLUDED.relevance;

-- =====================================================================
-- 验证
-- =====================================================================

DO $$
DECLARE
  v_cat_total INTEGER;
  v_cat_l1 INTEGER;
  v_cat_l2 INTEGER;
  v_ps INTEGER;
  v_ts INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_cat_total FROM categories;
  SELECT COUNT(*) INTO v_cat_l1 FROM categories WHERE parent_id IS NULL;
  SELECT COUNT(*) INTO v_cat_l2 FROM categories WHERE parent_id IS NOT NULL;
  SELECT COUNT(*) INTO v_ps FROM product_signals;
  SELECT COUNT(*) INTO v_ts FROM trend_signals;

  RAISE NOTICE 'seed-phase-e-200:';
  RAISE NOTICE '  categories: total=%, L1=%, L2=%', v_cat_total, v_cat_l1, v_cat_l2;
  RAISE NOTICE '  trend_signals: %', v_ts;
  RAISE NOTICE '  product_signals: %', v_ps;
END $$;

-- ANALYZE
ANALYZE categories;
ANALYZE product_signals;

-- =====================================================================
-- Master 执行顺序说明 (建议):
--   psql -f supabase/seed-phase-e-products-40.sql
--   psql -f supabase/seed-phase-e-launch-events-120.sql
--   psql -f supabase/seed-phase-e-trend-signals-40.sql
--   psql -f supabase/seed-phase-e-200.sql        (本文件)
--
-- 注: 本文件 product_signals JOIN 依赖 products + trend_signals,
--     所以 product_signals 部分必须在 products-40 + trend-signals-40 之后执行。
-- =====================================================================

-- ============================================
-- AI Radar - Complete Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create tables
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  name_zh TEXT,
  description TEXT,
  description_en TEXT,
  description_zh TEXT,
  website_url TEXT,
  github_url TEXT,
  logo_url TEXT,
  category TEXT,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  pricing_model TEXT CHECK (pricing_model IN ('free', 'freemium', 'paid', 'open_source')),
  pricing_url TEXT,
  availability_status TEXT DEFAULT 'active' CHECK (availability_status IN ('active', 'low_active', 'inactive', 'dead')),
  commercialization_status TEXT,
  funding_stage TEXT,
  founder_info TEXT,
  launch_date DATE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confidence_score INTEGER DEFAULT 0,
  confidence_level TEXT DEFAULT 'unverified' CHECK (confidence_level IN ('high', 'medium', 'low', 'unverified')),
  validation_signals JSONB DEFAULT '{}',
  source_count INTEGER DEFAULT 0,
  weekly_growth_rate NUMERIC DEFAULT 0,
  monthly_growth_rate NUMERIC DEFAULT 0,
  github_stars INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  avatar_url TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  plan TEXT DEFAULT 'free',
  preferred_language TEXT DEFAULT 'en',
  interest_tags TEXT[] DEFAULT '{}',
  region_preferences TEXT[] DEFAULT '{}',
  consent_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS push_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  webhook_url TEXT,
  webhook_secret TEXT,
  push_frequency TEXT DEFAULT 'daily',
  push_time TEXT,
  notify_new_products BOOLEAN DEFAULT true,
  notify_status_change BOOLEAN DEFAULT true,
  notify_test_failure BOOLEAN DEFAULT true,
  notify_weekly_report BOOLEAN DEFAULT true,
  notify_opportunity_alert BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  last_push_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_confidence ON products(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_github ON products(github_stars DESC);

-- Step 3: Crawler provenance columns (migration 002)
ALTER TABLE products ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_mentions TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS crawled_at TIMESTAMPTZ;

-- Step 4: Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_channels ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read (drop if exists first for idempotency)
DROP POLICY IF EXISTS "products_select_all" ON products;
CREATE POLICY "products_select_all" ON products FOR SELECT USING (true);

-- User profiles
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Watchlist
DROP POLICY IF EXISTS "watchlist_select_own" ON watchlist;
CREATE POLICY "watchlist_select_own" ON watchlist FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "watchlist_insert_own" ON watchlist;
CREATE POLICY "watchlist_insert_own" ON watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "watchlist_delete_own" ON watchlist;
CREATE POLICY "watchlist_delete_own" ON watchlist FOR DELETE USING (auth.uid() = user_id);

-- Push channels
DROP POLICY IF EXISTS "push_channels_select_own" ON push_channels;
CREATE POLICY "push_channels_select_own" ON push_channels FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "push_channels_insert_own" ON push_channels;
CREATE POLICY "push_channels_insert_own" ON push_channels FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "push_channels_update_own" ON push_channels;
CREATE POLICY "push_channels_update_own" ON push_channels FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "push_channels_delete_own" ON push_channels;
CREATE POLICY "push_channels_delete_own" ON push_channels FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Step 6: Seed Data (63 AI products)
-- ============================================

INSERT INTO products (slug, name, name_en, name_zh, description, website_url, github_url, logo_url, category, subcategory, tags, tech_stack, pricing_model, availability_status, confidence_score, confidence_level, validation_signals, source_count, weekly_growth_rate, monthly_growth_rate, github_stars) VALUES
  ('chatgpt', 'ChatGPT', 'ChatGPT', 'ChatGPT', 'OpenAI''s conversational AI assistant powered by GPT-4o and later models.', 'https://chatgpt.com', NULL, NULL, 'LLM', 'Chatbot', ARRAY['chatbot','generative-ai','conversational-ai','multimodal'], ARRAY['Python','PyTorch','Kubernetes'], 'freemium', 'active', 98, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 15, 2.1, 8.5, NULL),
  ('claude', 'Claude', 'Claude', 'Claude', 'Anthropic''s AI assistant with long context windows and advanced reasoning.', 'https://claude.ai', NULL, NULL, 'LLM', 'Chatbot', ARRAY['chatbot','generative-ai','long-context','reasoning'], ARRAY['Python','JAX'], 'freemium', 'active', 97, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 14, 3.2, 12.1, NULL),
  ('gemini', 'Gemini', 'Gemini', 'Gemini', 'Google''s multimodal AI model family, available via Gemini app and API.', 'https://gemini.google.com', 'https://github.com/google/generative-ai-docs', NULL, 'LLM', 'Foundation Model', ARRAY['multimodal','generative-ai','google','foundation-model'], ARRAY['Python','TensorFlow','TPU'], 'freemium', 'active', 96, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 13, 1.8, 7.2, NULL),
  ('qwen', '通义千问', 'Qwen', '通义千问', 'Alibaba''s large language model series, open-source and API available.', 'https://tongyi.aliyun.com', 'https://github.com/QwenLM/Qwen', NULL, 'LLM', 'Foundation Model', ARRAY['open-source','chinese-llm','foundation-model','multimodal'], ARRAY['Python','PyTorch'], 'freemium', 'active', 93, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 11, 2.5, 10.3, 18000),
  ('deepseek', 'DeepSeek', 'DeepSeek', '深度求索', 'Chinese AI company known for open-source LLMs and efficient training.', 'https://deepseek.com', 'https://github.com/deepseek-ai', NULL, 'LLM', 'Foundation Model', ARRAY['open-source','chinese-llm','reasoning','cost-effective'], ARRAY['Python','PyTorch'], 'free', 'active', 94, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 12, 5.8, 22, 15000),
  ('llama', 'Llama', 'Llama', 'Llama', 'Meta''s open-source LLM family, powering countless downstream projects.', 'https://llama.meta.com', 'https://github.com/meta-llama/llama', NULL, 'LLM', 'Foundation Model', ARRAY['open-source','foundation-model','meta','multimodal'], ARRAY['Python','PyTorch'], 'open_source', 'active', 96, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 14, 1.5, 6, 56000),
  ('mistral', 'Mistral AI', 'Mistral AI', 'Mistral AI', 'French AI company building efficient open-weight LLMs.', 'https://mistral.ai', 'https://github.com/mistralai', NULL, 'LLM', 'Foundation Model', ARRAY['open-source','european-ai','efficient-llm'], ARRAY['Python','PyTorch','JAX'], 'freemium', 'active', 90, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 9, 2, 8, 12000),
  ('grok', 'Grok', 'Grok', 'Grok', 'xAI''s conversational AI integrated with X (Twitter), known for real-time knowledge.', 'https://grok.com', NULL, NULL, 'LLM', 'Chatbot', ARRAY['chatbot','real-time','x-platform'], ARRAY['Python','JAX'], 'paid', 'active', 88, 'high', '{"official_website":true,"media_coverage":true}', 8, 1.2, 5, NULL),
  ('kimi', 'Kimi', 'Kimi', 'Kimi 智能助手', 'Moonshot AI''s conversational assistant with ultra-long context window.', 'https://kimi.moonshot.cn', 'https://github.com/MoonshotAI', NULL, 'LLM', 'Chatbot', ARRAY['chinese-llm','long-context','chatbot'], ARRAY['Python','PyTorch'], 'freemium', 'active', 89, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 7, 2.8, 11, NULL),
  ('ernie-bot', '文心一言', 'ERNIE Bot', '文心一言', 'Baidu''s large language model, integrated across Baidu''s product ecosystem.', 'https://yiyan.baidu.com', NULL, NULL, 'LLM', 'Chatbot', ARRAY['chinese-llm','baidu','enterprise'], ARRAY['Python','PaddlePaddle'], 'freemium', 'active', 86, 'high', '{"official_website":true,"media_coverage":true}', 6, 0.8, 3.2, NULL),
  ('github-copilot', 'GitHub Copilot', 'GitHub Copilot', 'GitHub Copilot', 'AI pair programmer powered by OpenAI Codex and GPT models.', 'https://github.com/features/copilot', NULL, NULL, 'AI Coding', 'Code Completion', ARRAY['code-generation','developer-tools','ide-extension','github'], ARRAY['TypeScript','Python','OpenAI API'], 'paid', 'active', 97, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 13, 1.5, 6, NULL),
  ('cursor', 'Cursor', 'Cursor', 'Cursor', 'AI-first code editor built for pair-programming with AI, fork of VS Code.', 'https://cursor.com', NULL, NULL, 'AI Coding', 'AI IDE', ARRAY['ai-ide','code-generation','developer-tools','fork-vscode'], ARRAY['TypeScript','Electron','LSP'], 'freemium', 'active', 93, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 11, 4.5, 18, NULL),
  ('windsurf', 'Windsurf', 'Windsurf', 'Windsurf', 'AI IDE by Codeium with agentic coding capabilities and deep codebase understanding.', 'https://windsurf.com', NULL, NULL, 'AI Coding', 'AI IDE', ARRAY['ai-ide','code-completion','developer-tools'], ARRAY['TypeScript','Rust','LSP'], 'freemium', 'active', 87, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 8, 3.8, 15, NULL),
  ('cline', 'Cline', 'Cline', 'Cline', 'Open-source autonomous coding agent for VS Code, capable of complex multi-step tasks.', NULL, 'https://github.com/cline/cline', NULL, 'AI Coding', 'Coding Agent', ARRAY['open-source','coding-agent','vscode-extension','autonomous'], ARRAY['TypeScript','OpenRouter'], 'open_source', 'active', 85, 'high', '{"github":true,"media_coverage":true}', 6, 5, 20, 32000),
  ('continue', 'Continue', 'Continue', 'Continue', 'Open-source AI code assistant plugin for VS Code and JetBrains.', 'https://continue.dev', 'https://github.com/continuedev/continue', NULL, 'AI Coding', 'Code Assistant', ARRAY['open-source','code-completion','vscode-extension','jetbrains'], ARRAY['TypeScript','Python'], 'open_source', 'active', 86, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 7, 2.5, 10, 20000),
  ('codex-cli', 'OpenAI Codex CLI', 'Codex CLI', 'Codex CLI', 'OpenAI''s open-source coding agent running in the terminal.', NULL, 'https://github.com/openai/codex', NULL, 'AI Coding', 'Coding Agent', ARRAY['open-source','coding-agent','terminal','openai'], ARRAY['TypeScript','Rust'], 'open_source', 'active', 90, 'high', '{"github":true,"media_coverage":true}', 7, 6, 25, 28000),
  ('boto', 'Bolt.new', 'Bolt.new', 'Bolt.new', 'AI-powered web app builder by StackBlitz — prompt to full-stack app in browser.', 'https://bolt.new', NULL, NULL, 'AI Coding', 'App Builder', ARRAY['web-development','ai-builder','fullstack','stackblitz'], ARRAY['TypeScript','WebContainers','React'], 'freemium', 'active', 88, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 8, 2.2, 9, NULL),
  ('midjourney', 'Midjourney', 'Midjourney', 'Midjourney', 'AI image generation platform known for high-quality artistic images.', 'https://midjourney.com', NULL, NULL, 'AI Image', 'Image Generation', ARRAY['image-generation','art','discord-bot','creative'], ARRAY['Python','PyTorch','Diffusion'], 'paid', 'active', 96, 'high', '{"official_website":true,"media_coverage":true}', 12, 1.2, 5, NULL),
  ('dall-e', 'DALL·E', 'DALL·E', 'DALL·E', 'OpenAI''s text-to-image model, integrated into ChatGPT and available via API.', 'https://openai.com/index/dall-e', NULL, NULL, 'AI Image', 'Image Generation', ARRAY['image-generation','text-to-image','openai'], ARRAY['Python','PyTorch','Diffusion'], 'paid', 'active', 95, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 10, 0.8, 3.5, NULL),
  ('stable-diffusion', 'Stable Diffusion', 'Stable Diffusion', 'Stable Diffusion', 'Open-source text-to-image model by Stability AI.', 'https://stability.ai', 'https://github.com/Stability-AI/stablediffusion', NULL, 'AI Image', 'Image Generation', ARRAY['open-source','image-generation','diffusion','text-to-image'], ARRAY['Python','PyTorch','Diffusion'], 'open_source', 'active', 93, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 11, 1, 4, 45000),
  ('flux', 'FLUX', 'FLUX', 'FLUX', 'Open-source image generation model by Black Forest Labs.', 'https://blackforestlabs.ai', 'https://github.com/black-forest-labs/flux', NULL, 'AI Image', 'Image Generation', ARRAY['open-source','image-generation','text-rendering'], ARRAY['Python','PyTorch','Diffusion'], 'open_source', 'active', 90, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 8, 4, 16, 25000),
  ('comfyui', 'ComfyUI', 'ComfyUI', 'ComfyUI', 'Node-based GUI for Stable Diffusion and other diffusion models.', NULL, 'https://github.com/comfyanonymous/ComfyUI', NULL, 'AI Image', 'Image Tools', ARRAY['open-source','gui','stable-diffusion','node-based'], ARRAY['Python','PyTorch'], 'open_source', 'active', 91, 'high', '{"github":true,"media_coverage":true}', 9, 3.5, 14, 58000),
  ('kling', '可灵', 'Kling AI', '可灵', 'Kuaishou''s AI video generation platform.', 'https://klingai.com', NULL, NULL, 'AI Video', 'Video Generation', ARRAY['video-generation','chinese-ai','kuaishou'], ARRAY['Python','PyTorch'], 'freemium', 'active', 88, 'high', '{"official_website":true,"media_coverage":true}', 7, 4, 16, NULL),
  ('runway', 'Runway', 'Runway', 'Runway', 'AI creative tools for video generation, editing, and post-production.', 'https://runwayml.com', NULL, NULL, 'AI Video', 'Video Generation', ARRAY['video-generation','creative-tools','gen3'], ARRAY['Python','PyTorch'], 'freemium', 'active', 93, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 10, 2, 8, NULL),
  ('sora', 'Sora', 'Sora', 'Sora', 'OpenAI''s text-to-video model capable of generating up to 20-second clips.', 'https://openai.com/sora', NULL, NULL, 'AI Video', 'Video Generation', ARRAY['video-generation','openai','text-to-video'], ARRAY['Python','PyTorch'], 'paid', 'active', 94, 'high', '{"official_website":true,"media_coverage":true}', 10, 1.8, 7, NULL),
  ('perplexity', 'Perplexity AI', 'Perplexity AI', 'Perplexity AI', 'AI-powered answer engine that provides sourced, conversational search results.', 'https://perplexity.ai', NULL, NULL, 'AI Search', 'Answer Engine', ARRAY['search','answer-engine','conversational','sourced'], ARRAY['Python','TypeScript','React'], 'freemium', 'active', 95, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 12, 3, 12, NULL),
  ('notebooklm', 'NotebookLM', 'NotebookLM', 'NotebookLM', 'Google''s AI research assistant that creates podcast-style audio overviews.', 'https://notebooklm.google', NULL, NULL, 'AI Search', 'Research Assistant', ARRAY['research','google','audio-overview','documents'], ARRAY['Python','TensorFlow'], 'free', 'active', 90, 'high', '{"official_website":true,"media_coverage":true}', 8, 3, 12, NULL),
  ('chatglm', '智谱清言', 'ChatGLM', '智谱清言', 'Zhipu AI''s conversational platform with GLM models.', 'https://chatglm.cn', 'https://github.com/THUDM/ChatGLM-6B', NULL, 'LLM', 'Chatbot', ARRAY['chinese-llm','open-source','glm'], ARRAY['Python','PyTorch'], 'freemium', 'active', 90, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 8, 1.5, 6, 16000),
  ('dify', 'Dify', 'Dify', 'Dify', 'Open-source LLM app development platform with visual workflow builder.', 'https://dify.ai', 'https://github.com/langgenius/dify', NULL, 'AI Agents', 'LLM App Platform', ARRAY['open-source','llm-apps','workflow','low-code'], ARRAY['Python','TypeScript','Next.js','Docker'], 'open_source', 'active', 90, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 9, 4, 16, 55000),
  ('langchain', 'LangChain', 'LangChain', 'LangChain', 'Open-source framework for building applications powered by large language models.', 'https://langchain.com', 'https://github.com/langchain-ai/langchain', NULL, 'AI Agents', 'Framework', ARRAY['open-source','framework','llm-apps','python'], ARRAY['Python','TypeScript'], 'open_source', 'active', 96, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 13, 1, 4, 105000),
  ('crewai', 'CrewAI', 'CrewAI', 'CrewAI', 'Framework for orchestrating role-playing AI agents working together on tasks.', 'https://crewai.com', 'https://github.com/crewAIInc/crewAI', NULL, 'AI Agents', 'Agent Framework', ARRAY['open-source','multi-agent','orchestration'], ARRAY['Python'], 'open_source', 'active', 87, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 8, 5, 20, 24000),
  ('ollama', 'Ollama', 'Ollama', 'Ollama', 'Run LLMs locally with a simple CLI — Llama, Mistral, Phi and more.', 'https://ollama.com', 'https://github.com/ollama/ollama', NULL, 'AI Infra', 'Local LLM Runtime', ARRAY['open-source','local-llm','cli','self-hosted'], ARRAY['Go','C','CUDA'], 'open_source', 'active', 95, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 12, 3, 12, 110000),
  ('vllm', 'vLLM', 'vLLM', 'vLLM', 'High-throughput and memory-efficient LLM inference engine.', 'https://docs.vllm.ai', 'https://github.com/vllm-project/vllm', NULL, 'AI Infra', 'Inference Engine', ARRAY['open-source','inference','gpu','pagedattention'], ARRAY['Python','CUDA','C++'], 'open_source', 'active', 94, 'high', '{"github":true,"media_coverage":true}', 11, 2, 8, 48000),
  ('n8n', 'n8n', 'n8n', 'n8n', 'Fair-code workflow automation platform with AI/LLM integration nodes.', 'https://n8n.io', 'https://github.com/n8n-io/n8n', NULL, 'AI Agents', 'Workflow Automation', ARRAY['open-source','automation','workflow','ai-integration'], ARRAY['TypeScript','Node.js','Vue'], 'open_source', 'active', 92, 'high', '{"official_website":true,"github":true,"media_coverage":true}', 10, 3, 12, 62000)
ON CONFLICT (slug) DO NOTHING;

-- Done! 35 core products seeded.

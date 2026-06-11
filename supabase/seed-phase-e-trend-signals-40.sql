-- =====================================================================
-- AI Radar Phase E — Trend Signals Seed (40 signals)
-- File: supabase/seed-phase-e-trend-signals-40.sql
-- Author: 寇豆码 (Engineer)
-- Date: 2026-05-31
-- Related: T03 (A线-W1)
--
-- 范围:
--   40 条 trend_signals, status 分布:
--     emerging (24, 60%): tag_emerging(8) + category_growing(6) + tech_stack_shift(4) + cluster_new(4) + funding_pattern(2)
--     peaking  (12, 30%): tag_emerging(4) + category_growing(3) + tech_stack_shift(2) + cluster_new(2) + funding_pattern(1)
--     cooling  ( 4, 10%): tag_emerging(1) + category_growing(1) + tech_stack_shift(1) + cluster_new(1)
--
-- 业务格式:
--   scope  ∈ 'tag:<slug>' | 'category:<slug>' | 'stack:<name>' | 'cluster:<id>' | 'funding:<stage>'
--   evidence: JSONB { products: [slugs...], metrics: {...}, sources: [...] }
--
-- 幂等策略:
--   INSERT ... ON CONFLICT (signal_type, scope) DO UPDATE
-- =====================================================================

INSERT INTO trend_signals (
  signal_type, scope, title, description, evidence,
  strength, velocity, novelty, first_seen, last_updated, status
) VALUES
  -- =====================================================================
  -- EMERGING (24 records, 60%)
  -- =====================================================================

  -- ===== emerging / tag_emerging (8) =====
  ('tag_emerging', 'tag:agent-orchestration',
   'Agent Orchestration is the fastest-rising tag of Q2-2026',
   'Tag "agent-orchestration" co-occurrence grew 312% in 12 weeks. Cursor/Manus/AutoGPT cluster anchors.',
   '{"products":["cursor","manus","autogpt","lindy"],"metrics":{"tag_count_12w":412,"growth_pct":312,"z_score":4.8},"sources":["github","producthunt","x"]}',
   88.5, 9.2, 0.92, '2026-02-15', '2026-05-28', 'emerging'),

  ('tag_emerging', 'tag:multimodal-long-context',
   '1M-context multimodal models dominating launches',
   'Multimodal + 1M context combo appears in 18 launches since 2026-03. Claude 4.7 / Gemini 3 / Qwen 3 leading.',
   '{"products":["claude","qwen","doubao","hunyuan"],"metrics":{"launches_with_tag":18,"avg_context_tokens":1000000,"growth_pct":210},"sources":["arxiv","x","github"]}',
   85.0, 7.8, 0.88, '2026-03-01', '2026-05-26', 'emerging'),

  ('tag_emerging', 'tag:voice-agents',
   'Voice-first AI agents shipping in production',
   'Tag "voice-agents" sees 6 launches in 60 days. Vapi/Bland/Retell AI driving adoption.',
   '{"products":["vapi","bland","retell-ai","elevenlabs"],"metrics":{"tag_count_60d":6,"voice_revenue_growth":240,"growth_pct":185},"sources":["producthunt","x","y-combinator"]}',
   78.4, 8.5, 0.95, '2026-03-25', '2026-05-25', 'emerging'),

  ('tag_emerging', 'tag:open-weights-coding',
   'Open-weights coding models challenging proprietary leaders',
   'DeepSeek-Coder-V3 / Qwen-Coder / Codestral-2 open-weights pushing 90% HumanEval+. Strong GitHub traction.',
   '{"products":["deepseek-coder","qwen-coder","codestral","starcoder-2"],"metrics":{"open_models_count":8,"avg_humaneval":0.91,"github_stars_total":248000},"sources":["github","arxiv","hackernews"]}',
   82.0, 6.4, 0.78, '2026-02-20', '2026-05-24', 'emerging'),

  ('tag_emerging', 'tag:ai-tutor-k12',
   'AI Tutor for K-12 education mainstreaming',
   'Khanmigo / Duolingo Max / Q-Chat see 4x MAU growth in K-12 segment. School district contracts growing.',
   '{"products":["khanmigo","duolingo-max","quizlet-qchat","speak-app"],"metrics":{"k12_contracts":42,"mau_growth_pct":380,"growth_pct":340},"sources":["producthunt","ed-survey-2026","x"]}',
   75.0, 5.6, 0.86, '2026-03-10', '2026-05-22', 'emerging'),

  ('tag_emerging', 'tag:browser-use-agents',
   'Browser-use autonomous agents hit production reliability',
   'Browser-Use / Skyvern / Anchor Browser hit 95%+ task completion on WebArena. Enterprise pilots begin.',
   '{"products":["browser-use","skyvern","anchor-browser","multion"],"metrics":{"webarena_pass_rate":0.95,"enterprise_pilots":28,"growth_pct":420},"sources":["arxiv","x","github"]}',
   86.2, 9.8, 0.93, '2026-04-01', '2026-05-29', 'emerging'),

  ('tag_emerging', 'tag:small-language-models',
   'Sub-7B SLMs on-device surge',
   'Phi-4-mini / Gemma-3-2B / Llama-3.2-1B driving on-device AI. Phone makers integrating native.',
   '{"products":["phi-4-mini","gemma-3-2b","llama-3.2-1b","qwen-2.5-3b"],"metrics":{"slm_releases":14,"on_device_partners":9,"growth_pct":265},"sources":["github","x","hackernews"]}',
   79.0, 7.2, 0.81, '2026-02-28', '2026-05-21', 'emerging'),

  ('tag_emerging', 'tag:video-avatars-real-time',
   'Real-time conversational avatar video crosses quality bar',
   'HeyGen / Synthesia / Tavus reach sub-200ms latency with lip-sync 4.6/5. Call center deployments starting.',
   '{"products":["heygen","synthesia","tavus","d-id"],"metrics":{"latency_ms":180,"mos_score":4.6,"call_center_deploys":12,"growth_pct":290},"sources":["producthunt","x","gartner"]}',
   81.5, 8.1, 0.89, '2026-04-05', '2026-05-27', 'emerging'),

  -- ===== emerging / category_growing (6) =====
  ('category_growing', 'category:ai-customer-service',
   'AI Customer Service category growing 18% MoM',
   'Intercom Fin / Ada / Forethought / Decagon seeing strong enterprise adoption. 320+ new SaaS launches in 2026.',
   '{"products":["intercom-fin","ada-support","forethought","decagon"],"metrics":{"new_products_2026":321,"mom_growth_pct":18,"enterprise_arr_growth":260},"sources":["producthunt","y-combinator","x"]}',
   90.0, 8.9, 0.70, '2026-01-15', '2026-05-29', 'emerging'),

  ('category_growing', 'category:ai-video-generation',
   'AI Video Generation category breaking out of niche',
   'Runway Gen-4 / Sora 2 / Luma Dream Machine hit creator mainstream. Short-video platforms integrating.',
   '{"products":["runway","sora-2","luma-dream-machine","kling-2"],"metrics":{"creator_users":12500000,"mom_growth_pct":15,"videos_generated_daily":4200000},"sources":["producthunt","x","youtube"]}',
   92.5, 9.5, 0.65, '2026-01-20', '2026-05-28', 'emerging'),

  ('category_growing', 'category:ai-coding-assistants',
   'AI Coding Assistant category approaching $5B ARR',
   'Cursor / Copilot / Cody / Replit Agent collectively approach $5B ARR. New "agentic IDE" subcategory emerges.',
   '{"products":["cursor","copilot","cody","replit"],"metrics":{"combined_arr":4800000000,"mom_growth_pct":12,"active_developers":14500000},"sources":["github","producthunt","x"]}',
   95.0, 7.0, 0.45, '2026-01-05', '2026-05-29', 'emerging'),

  ('category_growing', 'category:ai-marketing-personalization',
   'AI Marketing Personalization category scaling',
   'Jasper / Mutiny / Copy.ai / Smartwriter scaling to mid-market. 6Sense / Demandbase integrating AI agents.',
   '{"products":["jasper-ai","copy-ai","mutiny","6sense-ai"],"metrics":{"mid_market_customers":1850,"mom_growth_pct":14,"growth_pct":210},"sources":["producthunt","x","gartner"]}',
   80.0, 6.8, 0.55, '2026-02-05', '2026-05-25', 'emerging'),

  ('category_growing', 'category:ai-healthcare-clinical',
   'AI Healthcare Clinical category mainstreaming',
   'Hippocratic AI / Glass Health / Suki / Abridge in 200+ hospital systems. FDA clearances accelerating.',
   '{"products":["hippocratic-ai","glass-health","suki-ai","abridge"],"metrics":{"hospital_systems":214,"fda_clearances_2026":9,"growth_pct":195},"sources":["arxiv","x","klas-research"]}',
   83.5, 7.5, 0.72, '2026-01-30', '2026-05-27', 'emerging'),

  ('category_growing', 'category:ai-education-language',
   'AI Language Learning category renewing growth',
   'Speak / Duolingo Max / Elsa / Cake scaling globally. Voice-first approach maturing rapidly.',
   '{"products":["speak-app","duolingo-max","elsa-speak","cake-app"],"metrics":{"active_learners":28000000,"mom_growth_pct":11,"growth_pct":178},"sources":["producthunt","app-store","x"]}',
   77.0, 6.2, 0.50, '2026-02-10', '2026-05-24', 'emerging'),

  -- ===== emerging / tech_stack_shift (4) =====
  ('tech_stack_shift', 'stack:mamba',
   'Mamba SSM architecture gaining production traction',
   'Mamba-3 / Jamba-1.5 / Falcon-Mamba in 14 production deployments. Linear-attention hybrid models emerging.',
   '{"products":["mamba-3","jamba-1.5","falcon-mamba","mamba-coder"],"metrics":{"production_deploys":14,"arxiv_papers_2026":128,"growth_pct":380},"sources":["arxiv","github","hackernews"]}',
   76.0, 8.4, 0.96, '2026-03-05', '2026-05-28', 'emerging'),

  ('tech_stack_shift', 'stack:moe-mixture-of-experts',
   'MoE architectures standard for frontier models',
   'Mixtral-8x22B / DeepSeek-V3 / Qwen-MoE standard. Active expert routing R&D accelerating.',
   '{"products":["mixtral-8x22b","deepseek-v3","qwen-moe","dbrx"],"metrics":{"moe_models_2026":21,"active_params_efficiency":4.2,"growth_pct":145},"sources":["arxiv","github","x"]}',
   84.0, 5.8, 0.62, '2026-02-15', '2026-05-26', 'emerging'),

  ('tech_stack_shift', 'stack:rust-inference',
   'Rust-based inference engines (llm-chain, mistral.rs) growing',
   'Rust inference up 220% in GitHub stars. Hugging Face candle, llama.cpp Rust bindings mainstreaming.',
   '{"products":["candle-rs","llama-cpp-rust","mistral-rs","burn-rs"],"metrics":{"github_stars_2026":68000,"production_deploys":9,"growth_pct":220},"sources":["github","hackernews","x"]}',
   71.5, 7.1, 0.91, '2026-03-15', '2026-05-25', 'emerging'),

  ('tech_stack_shift', 'stack:diffusion-transformers',
   'Diffusion Transformers (DiT) for video/text going mainstream',
   'Sora 2 / MovieGen / Flux-Video adopt DiT. Latent diffusion transformers standard in 2026 video gen.',
   '{"products":["sora-2","moviegen","flux-video","wan-2.1"],"metrics":{"dit_papers_2026":86,"production_video_models":12,"growth_pct":265},"sources":["arxiv","github","x"]}',
   82.5, 8.0, 0.87, '2026-02-25', '2026-05-29', 'emerging'),

  -- ===== emerging / cluster_new (4) =====
  ('cluster_new', 'cluster:agent-protocol-2026q1',
   'New cluster: Standardized Agent Protocols (MCP/ACP/A2A)',
   'Anthropic MCP / Google A2A / Linux Foundation ACP form agent-interop standard. 80+ integrations in 90 days.',
   '{"products":["anthropic-mcp","google-a2a","linux-foundation-acp","langchain-mcp"],"metrics":{"integrations":82,"adopters":45,"growth_pct":580},"sources":["github","x","anthropic-blog"]}',
   87.0, 9.6, 0.98, '2026-04-10', '2026-05-29', 'emerging'),

  ('cluster_new', 'cluster:enterprise-rag-2026q2',
   'New cluster: Enterprise RAG with hybrid retrieval',
   'Hybrid retrieval (BM25 + vector + rerank) standard for enterprise. 25+ vendors with 6mo momentum.',
   '{"products":["glean","cohere-rag","vectara","pinecone-rag"],"metrics":{"enterprise_rag_vendors":27,"avg_improvement":0.34,"growth_pct":240},"sources":["x","gartner","producthunt"]}',
   78.0, 7.0, 0.85, '2026-04-15', '2026-05-26', 'emerging'),

  ('cluster_new', 'cluster:ai-web-builder-2026q1',
   'New cluster: AI Web/App Builder (v0/Bolt/Replit/Manus)',
   'v0.dev / Bolt.new / Replit Agent / Manus redefine full-stack prototyping. Sub-10-min MVP viable.',
   '{"products":["v0","bolt-new","replit-agent","manus"],"metrics":{"mvp_build_time_min":9.5,"signups_2026":2100000,"growth_pct":460},"sources":["producthunt","x","github"]}',
   89.0, 9.2, 0.94, '2026-01-25', '2026-05-28', 'emerging'),

  ('cluster_new', 'cluster:sovereign-llm-2026q2',
   'New cluster: Sovereign LLM (national / regional foundation models)',
   'EU / Japan / Korea / India sovereign LLMs. 12 nations launched sovereign models in 2026.',
   '{"products":["mistral-eurollm","rinna-jp","hyperclova-x","k-llm"],"metrics":{"nations_with_sovereign_llm":12,"govt_spend_m":4200,"growth_pct":520},"sources":["x","eu-commission","korean-ict","github"]}',
   73.5, 6.6, 0.92, '2026-04-20', '2026-05-29', 'emerging'),

  -- ===== emerging / funding_pattern (2) =====
  ('funding_pattern', 'funding:agent-startup-seed',
   'Agent startups: 2026 seed funding 3.4x YoY',
   'Seed rounds for AI agent startups up 240% YoY. 412 seed deals closed in 2026 alone.',
   '{"products":["manus","lindy","bland","skyvern"],"metrics":{"seed_deals_2026":412,"seed_growth_pct":240,"median_round_m":3.8},"sources":["crunchbase","techcrunch","x"]}',
   84.5, 7.5, 0.80, '2026-01-10', '2026-05-27', 'emerging'),

  ('funding_pattern', 'funding:vertical-ai-series-b',
   'Vertical AI startups: 2026 Series B wave ($1B+ rounds)',
   'Vertical AI (legal/health/finance) Series B at record pace. 14 mega-rounds in Q1-2026.',
   '{"products":["harvey","hippocratic-ai","evenup","suki"],"metrics":{"series_b_mega_rounds":14,"median_round_m":120,"growth_pct":195},"sources":["crunchbase","techcrunch","x"]}',
   81.0, 6.2, 0.75, '2026-02-10', '2026-05-25', 'emerging'),

  -- =====================================================================
  -- PEAKING (12 records, 30%)
  -- =====================================================================

  -- ===== peaking / tag_emerging (4) =====
  ('tag_emerging', 'tag:general-llm-chatbot',
   'General LLM Chatbot tag has plateaued',
   'ChatGPT / Claude / Gemini core tag co-occurrence stable. Growth slowing (<2% MoM).',
   '{"products":["chatgpt","claude","gemini","perplexity"],"metrics":{"tag_growth_pct":1.8,"monthly_active_chats":950000000,"growth_pct":12},"sources":["producthunt","x"]}',
   60.0, 1.5, 0.30, '2024-08-01', '2026-05-29', 'peaking'),

  ('tag_emerging', 'tag:image-generation',
   'Image Generation tag peaking after 18-month climb',
   'Midjourney / DALL-E / Firefly share saturated. New launches no longer gaining 2x growth.',
   '{"products":["midjourney","dall-e-3","adobe-firefly","ideogram"],"metrics":{"tag_growth_pct":3.2,"monthly_active_users":84000000,"growth_pct":48},"sources":["producthunt","x","reddit"]}',
   72.0, 3.0, 0.25, '2024-01-15', '2026-05-28', 'peaking'),

  ('tag_emerging', 'tag:rag-baseline',
   'Naive RAG tag maturing — peak adoption',
   'RAG-as-baseline in 78% of LLM products. Velocity slowing as standard pattern.',
   '{"products":["langchain","llamaindex","haystack","dify"],"metrics":{"adoption_pct":78,"growth_pct":22,"z_score":2.1},"sources":["github","x","langchain-blog"]}',
   65.5, 2.2, 0.20, '2024-06-01', '2026-05-26', 'peaking'),

  ('tag_emerging', 'tag:fine-tuning-platforms',
   'Fine-tuning platforms tag hitting ceiling',
   'Together / Anyscale / Lambda saw growth flatten at 8% MoM. OpenAI fine-tuning API dominant.',
   '{"products":["together-ai","anyscale","lambda-fine-tuning","openai-fine-tuning"],"metrics":{"tag_growth_pct":8.2,"revenue_growth_pct":34,"growth_pct":45},"sources":["github","x"]}',
   58.0, 1.8, 0.18, '2024-09-10', '2026-05-22', 'peaking'),

  -- ===== peaking / category_growing (3) =====
  ('category_growing', 'category:ai-image-editing',
   'AI Image Editing category near peak maturity',
   'Photoshop AI / Luminar / Remove.bg saturated. New tools incremental, not disruptive.',
   '{"products":["photoshop-ai","luminar-neural","remove-bg","photoroom"],"metrics":{"new_tools_60d":3,"monthly_active_users":45000000,"growth_pct":28},"sources":["producthunt","x"]}',
   63.0, 2.5, 0.22, '2024-03-20', '2026-05-27', 'peaking'),

  ('category_growing', 'category:ai-productivity-writing',
   'AI Writing category peaked — distribution war',
   'Grammarly / Notion AI / Jasper / Copy.ai compete for same users. Net new category growth stalled.',
   '{"products":["grammarly","notion-ai","jasper-ai","copy-ai"],"metrics":{"category_growth_pct":4.5,"user_overlap_pct":68,"growth_pct":32},"sources":["producthunt","x"]}',
   68.5, 2.0, 0.15, '2024-05-15', '2026-05-25', 'peaking'),

  ('category_growing', 'category:ai-inference-platforms',
   'AI Inference Platforms category at peak',
   'Replicate / Modal / RunPod / Together scaling, but pricing compressing. Core hyperscaler competition.',
   '{"products":["replicate","modal","runpod","together-ai"],"metrics":{"category_growth_pct":6.0,"gross_margin_pct":42,"growth_pct":55},"sources":["github","x"]}',
   70.0, 2.8, 0.20, '2024-07-01', '2026-05-29', 'peaking'),

  -- ===== peaking / tech_stack_shift (2) =====
  ('tech_stack_shift', 'stack:vector-databases',
   'Vector databases stack-shift plateauing',
   'Pinecone / Weaviate / Qdrant growth slowing as pgvector / built-in DB vector search dominate.',
   '{"products":["pinecone","weaviate","qdrant","chroma"],"metrics":{"stack_growth_pct":5.5,"pgvector_share_pct":48,"growth_pct":38},"sources":["github","x","dbta"]}',
   61.0, 2.2, 0.20, '2024-04-10', '2026-05-26', 'peaking'),

  ('tech_stack_shift', 'stack:langchain-stack',
   'LangChain stack-shift at peak adoption — alternatives emerging',
   'LangChain / LlamaIndex in 60% of LLM apps. Velocity slowing. New entrants (DSPy, Letta) growing.',
   '{"products":["langchain","llamaindex","dspy","letta"],"metrics":{"langchain_share_pct":60,"alt_growth_pct":85,"growth_pct":42},"sources":["github","x"]}',
   66.0, 1.8, 0.30, '2024-02-15', '2026-05-23', 'peaking'),

  -- ===== peaking / cluster_new (2) =====
  ('cluster_new', 'cluster:ai-search-answer-2024q3',
   'AI Search & Answer Engines cluster reached plateau',
   'Perplexity / You.com / Andi growth slowing. Google AI Overviews absorbing demand.',
   '{"products":["perplexity","you-com","andi-search","komo"],"metrics":{"cluster_growth_pct":3.8,"google_ai_overviews_share_pct":55,"growth_pct":35},"sources":["producthunt","x"]}',
   64.0, 2.0, 0.25, '2024-08-20', '2026-05-24', 'peaking'),

  ('cluster_new', 'cluster:ai-avatar-video-2025q2',
   'AI Avatar Video cluster maturing into B2B',
   'HeyGen / Synthesia / D-ID reach plateau in growth, expanding from creator to enterprise use cases.',
   '{"products":["heygen","synthesia","d-id","tavus"],"metrics":{"cluster_growth_pct":4.2,"enterprise_revenue_pct":62,"growth_pct":48},"sources":["producthunt","x"]}',
   67.5, 2.4, 0.18, '2025-04-01', '2026-05-28', 'peaking'),

  -- ===== peaking / funding_pattern (1) =====
  ('funding_pattern', 'funding:infrastructure-mega-rounds',
   'AI Infra mega-rounds peak — capital concentrating',
   'Anyscale / Together / Lambda / CoreWeave: median round size peaked. Capital concentration in top 5.',
   '{"products":["anyscale","together-ai","lambda","coreweave"],"metrics":{"median_round_m":480,"top5_share_pct":72,"growth_pct":28},"sources":["crunchbase","techcrunch"]}',
   59.5, 1.6, 0.20, '2024-10-15', '2026-05-25', 'peaking'),

  -- =====================================================================
  -- COOLING (4 records, 10%)
  -- =====================================================================

  -- ===== cooling / tag_emerging (1) =====
  ('tag_emerging', 'tag:text-to-3d',
   'Text-to-3D tag cooling after 12-month peak',
   'Meshy / Tripo3D / Luma Genie growth reversing. Enterprise 3D use cases not materializing at scale.',
   '{"products":["meshy","tripo3d","luma-genie","csd-3d"],"metrics":{"tag_growth_pct":-12.4,"monthly_revenue_growth":-8,"growth_pct":-22},"sources":["producthunt","x","github"]}',
   32.0, -2.4, 0.10, '2024-09-01', '2026-05-29', 'cooling'),

  -- ===== cooling / category_growing (1) =====
  ('category_growing', 'category:ai-meeting-assistants',
   'AI Meeting Assistants category cooling',
   'Otter / Fireflies / Read AI growth slowing post-pandemic. Saturation in core sales/customer success segments.',
   '{"products":["otter-ai","fireflies-ai","read-ai","fathom"],"metrics":{"category_growth_pct":-3.5,"user_churn_pct":18,"growth_pct":-8},"sources":["producthunt","x"]}',
   35.0, -1.8, 0.08, '2024-02-10', '2026-05-26', 'cooling'),

  -- ===== cooling / tech_stack_shift (1) =====
  ('tech_stack_shift', 'stack:prompt-engineering-platforms',
   'Prompt engineering platforms stack cooling',
   'PromptLayer / Helicone / LangSmith adoption slowing. Native observability in major frameworks.',
   '{"products":["promptlayer","helicone","langsmith","portkey"],"metrics":{"stack_growth_pct":-2.8,"new_adopters_q1":42,"growth_pct":-5},"sources":["github","x"]}',
   28.5, -1.2, 0.10, '2024-05-20', '2026-05-24', 'cooling'),

  -- ===== cooling / cluster_new (1) =====
  ('cluster_new', 'cluster:ai-personal-assistant-2024q1',
   'AI Personal Assistant cluster cooling post hype',
   'Replika / Pi / Kindroid growth reversed. Consumer retention below 20% at 90 days.',
   '{"products":["replika","pi-ai","kindroid","character-ai"],"metrics":{"cluster_growth_pct":-8.5,"retention_d90_pct":19,"growth_pct":-18},"sources":["producthunt","x","app-store"]}',
   30.0, -2.0, 0.08, '2024-01-15', '2026-05-28', 'cooling')

ON CONFLICT (signal_type, scope) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  evidence = EXCLUDED.evidence,
  strength = EXCLUDED.strength,
  velocity = EXCLUDED.velocity,
  novelty = EXCLUDED.novelty,
  first_seen = EXCLUDED.first_seen,
  last_updated = EXCLUDED.last_updated,
  status = EXCLUDED.status;

-- 验证
DO $$
DECLARE
  v_count INTEGER;
  v_emerging INTEGER;
  v_peaking INTEGER;
  v_cooling INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM trend_signals;
  SELECT COUNT(*) INTO v_emerging FROM trend_signals WHERE status = 'emerging';
  SELECT COUNT(*) INTO v_peaking FROM trend_signals WHERE status = 'peaking';
  SELECT COUNT(*) INTO v_cooling FROM trend_signals WHERE status = 'cooling';
  RAISE NOTICE 'seed-phase-e-trend-signals-40: total=%, emerging=%, peaking=%, cooling=%',
    v_count, v_emerging, v_peaking, v_cooling;
END $$;

-- ANALYZE
ANALYZE trend_signals;

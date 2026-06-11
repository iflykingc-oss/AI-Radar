-- =====================================================================
-- AI Radar W2 — Fresh Launch Events Seed (30 events, last 24h)
-- File: supabase/seed-w2-fresh-launches.sql
-- Author: 寇豆码 (Engineer)
-- Date: 2026-05-30
-- Related: T-1 (P0) — home page /launches L2 layer + new /launches page
--
-- 范围:
--   - 30 条新 launch_events, 全部在 24h 之内 (用 now() - INTERVAL 锚定)
--   - 覆盖 5+ 数据源: producthunt(8) / hackernews(6) / github(6) /
--     x(5) / arxiv(3) / huggingface(2)
--   - event_type 分布: launch(13) / major_update(12) / open_source(4) /
--     milestone(1)
--   - 每条至少关联 1 个 product (由 slug 匹配)
--
-- 幂等策略:
--   INSERT ... ON CONFLICT (source, source_id) DO UPDATE
--   重复执行 (比如 W2 期间多次刷新) 不会产生重复行, 只会更新
--   detected_at / event_at / confidence 字段.
--
-- 验证:
--   SELECT COUNT(*) FROM launch_events
--     WHERE event_at >= now() - INTERVAL '24 hours';
--   -- 期望: >= 30
-- =====================================================================

INSERT INTO launch_events (
  product_id, source, source_url, source_id, event_type,
  title, body, author, engagement,
  detected_at, event_at, confidence, raw_data
)
SELECT
  p.id AS product_id,
  e.source, e.source_url, e.source_id, e.event_type,
  e.title, e.body, e.author, e.engagement::jsonb,
  e.detected_at_str::timestamptz, e.event_at_str::timestamptz, e.confidence, e.raw_data::jsonb
FROM (VALUES
  -- ===== producthunt (8) — recent launches in last 24h =====
  ('cursor',          'producthunt', 'https://www.producthunt.com/posts/cursor-0-51',       'ph-cursor-0-51-w2',          'major_update',
   'Cursor 0.51 — Background Agents 2.0',
   'Background agents now run in parallel, share state via a blackboard file, and report progress in the sidebar.',
   'cursor_team',  '{"upvotes":3210,"comments":184}', now() - INTERVAL '2 hours', now() - INTERVAL '2 hours', 0.96,
   '{"tagline":"Background agents 2.0","rank":1,"launched_at":"2026-05-30"}'),
  ('claude',          'producthunt', 'https://www.producthunt.com/posts/claude-4-7-1',       'ph-claude-4-7-1-w2',         'major_update',
   'Claude 4.7.1 — Voice in / Voice out',
   'Adds native voice-to-voice with <200ms latency and a Sonnet-tier voice persona.',
   'anthropic_team', '{"upvotes":2890,"comments":201}', now() - INTERVAL '5 hours', now() - INTERVAL '5 hours', 0.95,
   '{"tagline":"Real-time voice agent","rank":2}'),
  ('chatgpt',         'producthunt', 'https://www.producthunt.com/posts/chatgpt-memory-v3',  'ph-chatgpt-memory-v3-w2',    'major_update',
   'ChatGPT Memory v3 — Cross-chat Recall',
   'Memory now spans all your chats and is searchable. New "forget this" UI lets you scrub individual facts.',
   'openai_team', '{"upvotes":4120,"comments":345}', now() - INTERVAL '8 hours', now() - INTERVAL '8 hours', 0.94,
   '{"tagline":"Memory that travels with you","rank":1}'),
  ('gemini',          'producthunt', 'https://www.producthunt.com/posts/gemini-2-5-pro',     'ph-gemini-2-5-pro-w2',       'launch',
   'Gemini 2.5 Pro — 2M Context Window',
   'Google doubles the context window to 2M tokens and ships a new Deep Research mode.',
   'google_team', '{"upvotes":5640,"comments":432}', now() - INTERVAL '11 hours', now() - INTERVAL '11 hours', 0.97,
   '{"tagline":"2M context, deep research","rank":1}'),
  ('midjourney',      'producthunt', 'https://www.producthunt.com/posts/midjourney-v8',      'ph-midjourney-v8-w2',        'launch',
   'Midjourney v8 — Live Canvas',
   'A real-time infinite canvas where every brushstroke is AI-refined. Now in public beta.',
   'midjourney_team', '{"upvotes":3210,"comments":278}', now() - INTERVAL '14 hours', now() - INTERVAL '14 hours', 0.92,
   '{"tagline":"Paint with the model","rank":3}'),
  ('runway',          'producthunt', 'https://www.producthunt.com/posts/runway-gen-4',       'ph-runway-gen-4-w2',         'launch',
   'Runway Gen-4 — Character Consistency',
   'Maintain a single character across 60s of generated video. New motion-brush controls.',
   'runway_team', '{"upvotes":1980,"comments":145}', now() - INTERVAL '17 hours', now() - INTERVAL '17 hours', 0.91,
   '{"tagline":"One character, sixty seconds","rank":4}'),
  ('windsurf',        'producthunt', 'https://www.producthunt.com/posts/windsurf-flow-2',    'ph-windsurf-flow-2-w2',      'launch',
   'Windsurf Flow 2 — Multi-repo Awareness',
   'Flow now understands your entire org, not just the open file. PRs reference related work across monorepos.',
   'windsurf_team', '{"upvotes":1450,"comments":98}', now() - INTERVAL '20 hours', now() - INTERVAL '20 hours', 0.89,
   '{"tagline":"Codebase-aware AI","rank":5}'),
  ('perplexity',      'producthunt', 'https://www.producthunt.com/posts/perplexity-pages',   'ph-perplexity-pages-w2',     'major_update',
   'Perplexity Pages — Publish from a Search',
   'Turn any search into a shareable, cited, ad-free article. Now in public beta.',
   'perplexity_team', '{"upvotes":2640,"comments":187}', now() - INTERVAL '22 hours', now() - INTERVAL '22 hours', 0.93,
   '{"tagline":"Search → shareable page","rank":2}'),

  -- ===== hackernews (6) — Show HN / Launch HN =====
  ('cline',           'hackernews',  'https://news.ycombinator.com/item?id=w2-cline-mem',    'hn-cline-mem-w2',           'major_update',
   'Show HN: Cline Memory — Local-first agent memory',
   'A drop-in memory layer for Cline that persists across sessions, stored in your repo under .cline/mem.',
   'cline_dev',    '{"upvotes":1840,"comments":312}', now() - INTERVAL '3 hours', now() - INTERVAL '3 hours', 0.91,
   '{"tagline":"Local memory for Cline","hn_rank":1}'),
  ('continue',        'hackernews',  'https://news.ycombinator.com/item?id=w2-continue-rag', 'hn-continue-rag-w2',        'major_update',
   'Show HN: Continue — RAG over your whole git history',
   'Indexes every commit, PR review, and comment. Ask "why did we drop gRPC?" and get a sourced answer.',
   'continue_dev', '{"upvotes":1230,"comments":198}', now() - INTERVAL '6 hours', now() - INTERVAL '6 hours', 0.88,
   '{"tagline":"RAG over git history","hn_rank":2}'),
  ('llama',           'hackernews',  'https://news.ycombinator.com/item?id=w2-llama-4',       'hn-llama-4-w2',             'launch',
   'Llama 4 — Open Weights 70B/400B MoE',
   'Meta releases Llama 4 with mixture-of-experts architecture. 400B MoE ships under Llama 4 community license.',
   'meta_ai',     '{"upvotes":3210,"comments":687}', now() - INTERVAL '9 hours', now() - INTERVAL '9 hours', 0.96,
   '{"tagline":"Llama 4 400B MoE","hn_rank":1}'),
  ('mistral',         'hackernews',  'https://news.ycombinator.com/item?id=w2-mistral-codestral', 'hn-mistral-codestral-w2','major_update',
   'Mistral Codestral 25.06 — Fill-in-the-middle 2x faster',
   'FIM now runs at 2x the previous throughput. New repo-level context window of 256k.',
   'mistral_team', '{"upvotes":1480,"comments":241}', now() - INTERVAL '13 hours', now() - INTERVAL '13 hours', 0.90,
   '{"tagline":"Faster FIM, longer context","hn_rank":3}'),
  ('grok',            'hackernews',  'https://news.ycombinator.com/item?id=w2-grok-3',        'hn-grok-3-w2',              'launch',
   'Grok 3 — Realtime Search + Vision',
   'xAI ships Grok 3 with realtime X search and a vision encoder. Beats Gemini 2.5 Pro on a handful of public benchmarks.',
   'xai_team',    '{"upvotes":2120,"comments":412}', now() - INTERVAL '18 hours', now() - INTERVAL '18 hours', 0.92,
   '{"tagline":"Grok 3 with vision","hn_rank":2}'),
  ('kimi',            'hackernews',  'https://news.ycombinator.com/item?id=w2-kimi-k2',       'hn-kimi-k2-w2',             'launch',
   'Kimi K2 — Open Weights 1T MoE',
   'Moonshot releases Kimi K2, a 1T-parameter MoE that beats Llama 4 on MMLU-Pro at 1/3 the inference cost.',
   'moonshot_team', '{"upvotes":1980,"comments":287}', now() - INTERVAL '21 hours', now() - INTERVAL '21 hours', 0.93,
   '{"tagline":"Kimi K2 1T MoE","hn_rank":4}'),

  -- ===== github (6) — releases / open-source launches =====
  ('github-copilot',  'github',      'https://github.com/features/copilot/releases/w2-agent-mode', 'gh-copilot-agent-w2',  'major_update',
   'GitHub Copilot — Agent Mode GA',
   'Agent mode is now GA for all Copilot Business users. Multi-file edits, run tests, open PRs.',
   'github_team', '{"stars":0,"comments":0,"forks":0}', now() - INTERVAL '1 hour', now() - INTERVAL '1 hour', 0.97,
   '{"tagline":"Agent mode GA","release":"v2.1.0"}'),
  ('stable-diffusion','github',      'https://github.com/Stability-AI/sd3.5-w2',           'gh-sd3-5-w2',               'open_source',
   'Stable Diffusion 3.5 — 8B Model, Apache 2.0',
   'Stability releases SD 3.5 with a 8B-param base + refiner, fully open under Apache 2.0.',
   'stability_ai', '{"stars":8420,"comments":156,"forks":1120}', now() - INTERVAL '4 hours', now() - INTERVAL '4 hours', 0.94,
   '{"tagline":"SD 3.5 8B, Apache 2.0","release":"v3.5.0"}'),
  ('codex-cli',       'github',      'https://github.com/openai/codex/releases/w2-v0.5',   'gh-codex-cli-v0-5-w2',      'major_update',
   'OpenAI Codex CLI v0.5 — Voice + Multi-agent',
   'New voice-driven TUI mode, plus a "team" command that spawns 3 worker codexes in parallel.',
   'openai_team', '{"stars":12400,"comments":231,"forks":1890}', now() - INTERVAL '7 hours', now() - INTERVAL '7 hours', 0.95,
   '{"tagline":"Codex CLI v0.5","release":"v0.5.0"}'),
  ('augment-code',    'github',      'https://github.com/augmentcode/agent-w2',             'gh-augment-agent-w2',       'launch',
   'Augment Code Agent — Repo-aware refactoring',
   'New agent that performs large refactors across your org, with per-PR review assignment.',
   'augment_team', '{"stars":3120,"comments":87,"forks":420}', now() - INTERVAL '12 hours', now() - INTERVAL '12 hours', 0.89,
   '{"tagline":"Org-scale refactoring","release":"v0.9.0"}'),
  ('comfyui',         'github',      'https://github.com/comfyanonymous/ComfyUI/releases/w2', 'gh-comfyui-w2',           'open_source',
   'ComfyUI v0.4 — Native Video Nodes',
   'New node graph natively supports video diffusion. Drag in a Wan 2.1 model and run end-to-end.',
   'comfyui_team', '{"stars":24100,"comments":312,"forks":3120}', now() - INTERVAL '16 hours', now() - INTERVAL '16 hours', 0.92,
   '{"tagline":"Video in node graphs","release":"v0.4.0"}'),
  ('boto',            'github',      'https://github.com/stackblitz/bolt.new/releases/w2-2', 'gh-bolt-2-w2',              'major_update',
   'Bolt.new v2 — One-shot Full-stack Apps',
   'StackBlitz ships a v2 model that turns one prompt into a deployed, DB-backed, full-stack app.',
   'stackblitz_team', '{"stars":18600,"comments":198,"forks":2240}', now() - INTERVAL '19 hours', now() - INTERVAL '19 hours', 0.93,
   '{"tagline":"One prompt, full-stack app","release":"v2.0.0"}'),

  -- ===== x (Twitter) (5) — announcement tweets =====
  ('qwen',            'x',           'https://x.com/Alibaba_Qwen/status/w2-qwen-3',         'x-qwen-3-w2',               'launch',
   'Qwen 3 — Native Tool Use + 1M Context',
   'Qwen team announces Qwen 3 with native tool use, structured output, and a 1M-token context window.',
   'qwen_team',   '{"likes":4820,"retweets":1240,"comments":387}', now() - INTERVAL '10 hours', now() - INTERVAL '10 hours', 0.93,
   '{"tagline":"Qwen 3 with tools","tweet_id":"w2-qwen-3"}'),
  ('deepseek',        'x',           'https://x.com/deepseek_ai/status/w2-v3',              'x-deepseek-v3-w2',          'launch',
   'DeepSeek V3 — Sparse MoE, 90% cost reduction',
   'DeepSeek announces V3: a 671B MoE with only 37B active per token. API pricing cut 90% vs V2.',
   'deepseek_team', '{"likes":6210,"retweets":1820,"comments":541}', now() - INTERVAL '15 hours', now() - INTERVAL '15 hours', 0.96,
   '{"tagline":"V3 sparse MoE, 90% off","tweet_id":"w2-v3"}'),
  ('ernie-bot',       'x',           'https://x.com/Baidu_Inc/status/w2-ernie-5',           'x-ernie-5-w2',              'major_update',
   'ERNIE 5 — Bilingual Reasoning Boost',
   'Baidu ships ERNIE 5 with significantly stronger Chinese+English reasoning. 128k context.',
   'baidu_team',  '{"likes":1240,"retweets":420,"comments":98}', now() - INTERVAL '23 hours', now() - INTERVAL '23 hours', 0.88,
   '{"tagline":"ERNIE 5 bilingual","tweet_id":"w2-ernie-5"}'),
  ('dall-e',          'x',           'https://x.com/OpenAI/status/w2-dalle-4',              'x-dalle-4-w2',              'major_update',
   'DALL·E 4 — Photoreal Update',
   'OpenAI ships DALL·E 4 with dramatically better photorealism and a new "inpainting studio" UI.',
   'openai_team', '{"likes":5420,"retweets":1640,"comments":421}', now() - INTERVAL '1 hour', now() - INTERVAL '1 hour', 0.94,
   '{"tagline":"DALL·E 4 photoreal","tweet_id":"w2-dalle-4"}'),
  ('flux',            'x',           'https://x.com/blackforests/status/w2-flux-2',         'x-flux-2-w2',               'launch',
   'FLUX.2 — 12B Param Image Model',
   'Black Forest Labs announces FLUX.2, a 12B parameter image model with state-of-the-art typography.',
   'bfl_team',    '{"likes":3120,"retweets":920,"comments":241}', now() - INTERVAL '13 hours', now() - INTERVAL '13 hours', 0.92,
   '{"tagline":"FLUX.2 12B","tweet_id":"w2-flux-2"}'),

  -- ===== arxiv (3) — notable research papers =====
  ('llama',           'arxiv',       'https://arxiv.org/abs/w2-llama-4-moe',                'arxiv-llama-4-moe-w2',      'launch',
   'Llama 4: Open Sparse Mixture-of-Experts',
   'Paper describing the architecture, training, and evaluation of Llama 4 400B MoE. 67-page technical report.',
   'meta_research', '{}'::jsonb, now() - INTERVAL '16 hours', now() - INTERVAL '16 hours', 0.97,
   '{"tagline":"Llama 4 paper","arxiv_id":"w2-llama-4-moe"}'),
  ('gemini',          'arxiv',       'https://arxiv.org/abs/w2-gemini-2-5',                 'arxiv-gemini-2-5-w2',       'launch',
   'Gemini 2.5: A Family of Multimodal Reasoning Models',
   'Google DeepMind paper on Gemini 2.5 family, covering architecture, training, and benchmark results.',
   'google_research', '{}'::jsonb, now() - INTERVAL '20 hours', now() - INTERVAL '20 hours', 0.95,
   '{"tagline":"Gemini 2.5 paper","arxiv_id":"w2-gemini-2-5"}'),
  ('claude',          'arxiv',       'https://arxiv.org/abs/w2-claude-eval',                'arxiv-claude-eval-w2',      'milestone',
   'Constitutional AI Revisited: Lessons from Claude 4.7',
   'Anthropic team publishes a comprehensive evaluation of Claude 4.7 across 12 safety benchmarks.',
   'anthropic_research', '{}'::jsonb, now() - INTERVAL '4 hours', now() - INTERVAL '4 hours', 0.92,
   '{"tagline":"Claude 4.7 eval","arxiv_id":"w2-claude-eval"}'),

  -- ===== huggingface (2) — model releases =====
  ('mistral',         'huggingface', 'https://huggingface.co/mistralai/w2-codestral-25-06', 'hf-mistral-codestral-w2',   'open_source',
   'Mistral Codestral 25.06 — Apache 2.0 Weights',
   '22B parameter code model with 256k context, fully open under Apache 2.0. Drops today.',
   'mistral_team', '{"stars":2840,"forks":210,"likes":1240}', now() - INTERVAL '7 hours', now() - INTERVAL '7 hours', 0.91,
   '{"tagline":"Codestral 25.06 open","model_id":"mistralai/w2-codestral-25-06"}'),
  ('stable-diffusion','huggingface', 'https://huggingface.co/stabilityai/w2-sd-3-5',        'hf-sd-3-5-w2',              'open_source',
   'Stable Diffusion 3.5 — Hugging Face Open Release',
   'SD 3.5 base + refiner, both with Apache 2.0 weights, hosted on HF with one-click inference endpoints.',
   'stability_ai', '{"stars":4120,"forks":520,"likes":1840}', now() - INTERVAL '2 hours', now() - INTERVAL '2 hours', 0.93,
   '{"tagline":"SD 3.5 on HF","model_id":"stabilityai/w2-sd-3-5"}')
) AS e(slug, source, source_url, source_id, event_type,
       title, body, author, engagement,
       detected_at_str, event_at_str, confidence, raw_data)
CROSS JOIN LATERAL (
  SELECT id FROM products WHERE products.slug = e.slug ORDER BY id LIMIT 1
) p
ON CONFLICT (source, source_id) DO UPDATE SET
  product_id      = EXCLUDED.product_id,
  source_url      = EXCLUDED.source_url,
  event_type      = EXCLUDED.event_type,
  title           = EXCLUDED.title,
  body            = EXCLUDED.body,
  author          = EXCLUDED.author,
  engagement      = EXCLUDED.engagement,
  detected_at     = EXCLUDED.detected_at,
  event_at        = EXCLUDED.event_at,
  confidence      = EXCLUDED.confidence,
  raw_data        = EXCLUDED.raw_data;

-- Sanity: report what just landed
DO $$
DECLARE
  fresh_count int;
  total_count int;
BEGIN
  SELECT COUNT(*) INTO fresh_count
  FROM launch_events
  WHERE event_at >= now() - INTERVAL '24 hours';
  SELECT COUNT(*) INTO total_count FROM launch_events;
  RAISE NOTICE 'Fresh events (24h): %  /  Total events: %', fresh_count, total_count;
END $$;

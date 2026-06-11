# Phase C — 9 个分类的最佳功能深挖

**项目**: AI Radar (ai-radar.dev)
**报告日期**: 2026-05-29
**研究范围**: 9 个 AI 工具分类的最佳功能、定价、Top players、差异化

---

## TL;DR

| 分类 | # 工具 | 关键发现 | AI Radar 当前覆盖 |
|------|--------|----------|------------------|
| AI Writing | ~250+ | 三大梯队：Jasper/Copy.ai(企业) → Writesonic/Rytr(SMB) → Notion AI/ChatGPT(原生集成) | ⚠️ 仅基础信息 |
| AI Coding | ~120+ | 三大势力：GitHub Copilot(IDE 集成) / Cursor(原生 AI 编辑器) / Claude Code(终端) | ❌ 无 schema 字段 |
| AI Design | ~150+ | Canva AI / Figma AI / Midjourney 三足鼎立；Firefly 强版权合规 | ❌ 无 schema 字段 |
| AI Video | ~80+ | 2026 群雄逐鹿：Sora 2 / Runway Gen-4.5 / Veo 3 / Kling / Pika / Hailuo | ❌ 无 schema 字段 |
| AI Audio | ~100+ | ElevenLabs ($11B) / Suno / Udio / Descript / 魔音工坊 | ❌ 无 schema 字段 |
| AI Data Analysis | ~80+ | 分四类：无代码对话(Julius) / BI(Talend/Looker) / 预测 ML(Akkio) / 专业(MonkeyLearn) | ❌ 无 schema 字段 |
| AI Agent | ~60+ | 五大框架：LangChain(生态) / CrewAI(团队) / AutoGen(微软) / LlamaIndex(RAG) / Semantic Kernel(企业) | ❌ 无 schema 字段 |
| AI Infrastructure | ~30+ | 三大平台：Hugging Face(生态) / Replicate(媒体) / Together AI(LLM 速度) | ❌ 无 schema 字段 |
| AI API | ~25+ | 11 家：OpenAI / Anthropic / Google / DeepSeek / Groq / Mistral / Cohere / Together / Fireworks / Bedrock / Azure | ❌ 无 schema 字段 |

**核心结论**: AI Radar 当前 9 个分类的 schema 字段严重不足。需要在 `categories` 表增加 **40+ 个分类特定字段**（如 `ide_support` for coding、`model_architecture` for video、`pricing_per_token` for API 等），并为每个分类定义"功能评分维度"。

---

## 一、AI Writing（AI 写作）

### 1.1 Top 6 玩家

| # | 工具 | 公司 | 定价 | 关键特性 | 差异化 |
|---|------|------|------|---------|--------|
| 1 | **Jasper AI** | Jasper (US) | Creator $49/月；Teams $125/月；Business 自定义 | 品牌声音学习、SEO 模式、50+ 模板、Surfer SEO 集成、25+ 语言、9 个工作流 | 最佳 B2B 营销自动化 |
| 2 | **Copy.ai** | Copy.ai (US) | Free(2,000 词)；Pro $49/月；Team $249/月 | 工作流自动化、Brand Voice、90+ 提示模板、Infobase 知识库 | 工作流 + 营销自动化领先 |
| 3 | **Writesonic** | Writesonic (US) | Free(10,000 词)；Solo $20/月；Team $500/月 | SEO 优化器、AI Article Writer 6.0、Chatsonic、Audiosonic、Botsonic | 性价比最高的全栈 |
| 4 | **Rytr** | Rytr (US) | Free(10K 字符/月)；Saver $9/月；Unlimited $29/月 | 40+ 用例、30+ 语言、内置抄袭检查、Chrome 扩展 | 最便宜的全功能方案 |
| 5 | **KoalaWriter** | Koala (US) | Starter $9/月；Pro $49/月 | 实时 Google 搜索、SERP 分析、亚马逊联盟文章、自动内部链接 | SERP-first 写作 |
| 6 | **Notion AI** | Notion (US) | $10/用户/月(Notion Plus) | Q&A、写作辅助、翻译、摘要、Action items、自动填充数据库 | 原生集成 Notion 工作空间 |

### 1.2 通用功能清单（Top 6 全对照）

| 功能维度 | Jasper | Copy.ai | Writesonic | Rytr | Koala | Notion AI |
|---------|:------:|:-------:|:----------:|:----:|:-----:|:---------:|
| **长文博客** | ✅ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |
| **品牌声音学习** | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| **SEO 集成** | ✅ Surfer | ⚠️ | ✅ | ⚠️ | ✅ | ❌ |
| **多语言(20+)** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| **工作流自动化** | ✅ | ✅ 强 | ✅ | ❌ | ❌ | ⚠️ |
| **图像生成** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **抄袭检查** | ✅ | ⚠️ | ✅ | ✅ | ❌ | ❌ |
| **知识库/RAG** | ✅ | ✅ Infobase | ⚠️ | ❌ | ⚠️ | ✅ Notion 文档 |
| **团队协作** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **API** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ |

### 1.3 AI Radar Schema 现状 & Gap

**当前 `products` 表对 Writing 分类的字段**:
- `category = 'writing'`
- 通用字段: `name`, `description`, `tags`, `pricing_model`, `github_stars`, `confidence_score`

**Gap**:
- ❌ 无 `supported_languages` 字段
- ❌ 无 `brand_voice_support` 布尔
- ❌ 无 `seo_integration` 字段
- ❌ 无 `long_form_capable` 字段
- ❌ 无 `plagiarism_checker` 字段
- ❌ 无 `max_word_count` 数值
- ❌ 无 `image_generation` 布尔
- ❌ 无 `api_available` 布尔

**建议新增字段（Writing 专用）**:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS writing_features JSONB DEFAULT '{}';
-- 内容包含: supported_languages[], brand_voice, seo_integration,
-- long_form, plagiarism_checker, image_generation, workflow_automation,
-- max_word_count, templates_count, knowledge_base, team_seats
```

---

## 二、AI Coding（AI 编程）

### 2.1 Top 5 玩家

| # | 工具 | 公司 | 定价 | 关键特性 | 差异化 |
|---|------|------|------|---------|--------|
| 1 | **GitHub Copilot** | GitHub/MS | Individual $10/月；Business $19/用户/月；Enterprise $39/用户/月 | 多 IDE 集成(VS Code/JetBrains/Neovim)、Copilot Chat、Copilot Workspace、Agent 模式 | IDE 集成之王 |
| 2 | **Cursor** | Anysphere (US) | Hobby $0(慢)；Pro $20/月；Business $40/用户/月 | AI-native IDE(基于 VS Code fork)、Composer 多文件编辑、Tab 补全、Codebase indexing | 最佳 AI 原生 IDE 体验 |
| 3 | **Windsurf** | Codeium (US) | Free；Pro $15/月；Teams $30/用户/月 | Cascade agent、Flows 协作、Supercomplete、DeepSeek 集成 | Agent + 协作平衡 |
| 4 | **Claude Code** | Anthropic (US) | Max $100-$200/月；Pro $20/月(基础访问) | 终端原生、200K 上下文、CLAUDE.md 项目配置、Agentic Edit | 终端原生 + 大上下文 |
| 5 | **Cline** | Cline (US) | 免费(自带 API Key) | VS Code 扩展、Plan/Act 双模式、多模型支持、浏览器自动化 | 开源 + 跨模型 |

### 2.2 通用功能清单

| 功能维度 | Copilot | Cursor | Windsurf | Claude Code | Cline |
|---------|:-------:|:------:|:--------:|:-----------:|:-----:|
| **多 IDE 支持** | ✅ 5+ | ❌ 自家 | ⚠️ 自家 | ⚠️ 终端 | ✅ VS Code |
| **多文件编辑** | ✅ | ✅ Composer | ✅ Cascade | ✅ | ✅ |
| **Agent 模式** | ✅ | ✅ | ✅ | ✅ | ✅ Plan/Act |
| **Codebase Indexing** | ✅ | ✅ | ✅ | ✅ CLAUDE.md | ✅ |
| **本地模型支持** | ❌ | ❌ | ⚠️ | ❌ | ✅ Ollama |
| **大上下文(>100K)** | ⚠️ | ✅ | ✅ | ✅ 200K | ⚠️ |
| **CLI / 终端** | ✅ CLI | ⚠️ | ⚠️ | ✅ 原生 | ⚠️ |
| **协作/Cascade** | ⚠️ | ⚠️ | ✅ Flows | ❌ | ❌ |
| **免费版** | ⚠️ | ✅ Hobby | ✅ | ❌ | ✅ |

### 2.3 AI Radar Schema Gap

**建议新增字段（Coding 专用）**:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS coding_features JSONB DEFAULT '{}';
-- 内容:
--   supported_ides[] (vscode, jetbrains, neovim, vim, eclipse, xcode, terminal)
--   supported_languages[] (python, typescript, rust, go, java, c++, ...)
--   agent_mode (bool)
--   multi_file_edit (bool)
--   context_window (int tokens)
--   self_hosted (bool)
--   open_source (bool)
--   cli_available (bool)
--   codebase_indexing (bool)
--   inline_completion (bool)
```

---

## 三、AI Design（AI 设计）

### 3.1 Top 4 玩家

| # | 工具 | 公司 | 定价 | 关键特性 | 差异化 |
|---|------|------|------|---------|--------|
| 1 | **Canva AI** | Canva (AU) | Free(基础)；Pro $15/月；Teams $30/用户/月 | Magic Design、Magic Eraser、Text to Image、Brand Kit、Background Remover、Magic Animate | 最易用 + 模板最丰富 |
| 2 | **Figma AI** | Figma (US) | 免费(教育)；Professional $15/编辑/月；Organization $45/编辑/月 | First Draft 自动生成、Visual Search、Content Rewrite、Auto-Layout Suggestion | 协作设计之王 + AI |
| 3 | **Adobe Firefly** | Adobe (US) | Free(25 积分)；Standard $4.99/月(100 积分)；Pro $9.99/月(500 积分) | 文生图(Adobe 版权库)、Generative Fill、Structure Reference、Style Reference、Vector AI | 商业安全 + Adobe 生态 |
| 4 | **Midjourney** | Midjourney (US) | Basic $10/月(3.3 小时 GPU)；Standard $30/月(15 小时)；Pro $60/月(30 小时) | 6.1/6.2 模型、SREF 风格参考、--cref 角色参考、V7 alpha、--sref 任意图像 | 艺术质量最高 |

### 3.2 通用功能清单

| 功能维度 | Canva AI | Figma AI | Firefly | Midjourney |
|---------|:--------:|:--------:|:-------:|:----------:|
| **文生图** | ✅ | ✅ | ✅ | ✅ 顶级 |
| **图像修复(Inpainting)** | ✅ Magic Eraser | ⚠️ | ✅ Generative Fill | ✅ |
| **风格参考** | ⚠️ | ⚠️ | ✅ | ✅ SREF |
| **角色一致性** | ⚠️ | ⚠️ | ⚠️ | ✅ --cref |
| **协作设计** | ✅ | ✅ 顶级 | ✅ | ❌ |
| **视频/动画** | ✅ Magic Animate | ✅ | ⚠️ | ⚠️ |
| **矢量图** | ✅ | ✅ | ✅ Vector AI | ❌ |
| **商业版权安全** | ✅ | ✅ | ✅ Adobe 训练库 | ⚠️ |
| **API** | ⚠️ | ⚠️ | ✅ | ✅ |
| **免费额度** | ✅ | ✅ | ✅ 25 积分 | ❌ |

### 3.3 AI Radar Schema Gap

**建议新增字段（Design 专用）**:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS design_features JSONB DEFAULT '{}';
-- 内容:
--   output_types[] (image, vector, video, animation, 3d, presentation, brand_kit)
--   style_reference_support (bool)
--   character_consistency (bool)
--   inpainting (bool)
--   background_removal (bool)
--   brand_kit_support (bool)
--   collaboration (bool)
--   commercial_use_safe (bool)  -- 重要版权字段
--   training_data_source (text) -- 关键合规字段
--   max_resolution (text) -- 4K, 8K
--   gpu_minutes_per_month (int)
```

---

## 四、AI Video（AI 视频）

### 4.1 Top 6 玩家

| # | 工具 | 公司 | 定价 | 关键特性 | 差异化 |
|---|------|------|------|---------|--------|
| 1 | **Runway Gen-4.5** | Runway (US) | Standard $15/月(625 credits)；Pro $35/月；Unlimited $95/月 | Gen-4.5 视频模型、Act-Two 动作迁移、Aleph 视频编辑、Image-to-Video、最长 10s 1080p | 最强视频生成 + 编辑一体 |
| 2 | **Sora 2** | OpenAI (US) | ChatGPT Plus $20/月(50 videos)；Pro $200/月(500 videos) | 物理一致性、5s 短片、Sora 2 Pro 1080p、Audio 同步、Storyboard 模式 | 物理模拟 + 生态 |
| 3 | **Pika** | Pika (US) | Free(150 credits)；Standard $10/月(700)；Pro $35/月(2000) | Pikaffects 特效、Scene P ingredients、Image-to-Video、5s 视频 | 特效 + 短社交视频 |
| 4 | **Veo 3** | Google (US) | 通过 Vertex AI；Google AI Plus $8/月；Ultra $250/月 | 8s 1080p、原生音频、视频拼接、镜头控制、虚拟角色 | 8s + 原生音频 + Google 生态 |
| 5 | **Kling** | 快手 (CN) | Free(66 credits/天)；Standard $5.99/月；Pro $9.99/月 | 2.0/2.1 模型、10s 1080p、Motion Brush、Virtual Try-on、首尾帧控制 | 性价比 + 物理模拟 |
| 6 | **Hailuo** | MiniMax (CN) | Free(基础)；Standard $9.99/月 | Hailuo-02 模型、T2V/I2V、Subject Reference、4K 渲染 | 质量/价格比 + 4K |

### 4.2 通用功能清单

| 功能维度 | Runway | Sora 2 | Pika | Veo 3 | Kling | Hailuo |
|---------|:------:|:------:|:----:|:-----:|:-----:|:------:|
| **图生视频** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **文生视频** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **视频延长** | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |
| **原生音频** | ❌ | ✅ | ❌ | ✅ | ⚠️ | ❌ |
| **最长时长** | 10s | 5-20s | 5s | 8s | 10s | 6s |
| **最高分辨率** | 1080p | 1080p | 1080p | 1080p | 1080p | 4K |
| **首尾帧控制** | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **动作迁移** | ✅ Act-Two | ❌ | ✅ Pikaffects | ⚠️ | ✅ | ⚠️ |
| **物理一致性** | ⚠️ | ✅ 顶级 | ⚠️ | ✅ | ✅ | ⚠️ |
| **API** | ✅ | ✅ | ✅ | ✅ Vertex | ✅ | ⚠️ |

### 4.3 AI Radar Schema Gap

**建议新增字段（Video 专用）**:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_features JSONB DEFAULT '{}';
-- 内容:
--   max_duration_seconds (int)
--   max_resolution (text) -- 720p, 1080p, 4K
--   has_native_audio (bool)
--   has_motion_brush (bool)
--   has_first_last_frame (bool)
--   has_act_two_motion (bool)
--   has_video_extension (bool)
--   has_image_to_video (bool)
--   has_text_to_video (bool)
--   model_versions[] (gen-4, gen-4.5, sora-2, veo-3, kling-2.1)
--   api_available (bool)
```

---

## 五、AI Audio（AI 音频）

### 5.1 Top 5 玩家

| # | 工具 | 公司 | 定价 | 关键特性 | 差异化 |
|---|------|------|------|---------|--------|
| 1 | **ElevenLabs** | ElevenLabs (US) | Free(10K 字符)；Starter $5/月(30K)；Creator $22/月(100K)；Pro $99/月(500K) | Voice Design(自定义声音)、Voice Cloning(即时+专业)、Eleven Music、AI Dubbing 29 语言、Conversational AI | 语音克隆 + 多语言配音之王 |
| 2 | **Suno** | Suno (US) | Free(50 credits/天)；Pro $10/月(2,500)；Premier $30/月(10,000) | v4.5 模型、最长 4 分钟、Lyrics 生成、Covers、Stem 分离 | 音乐生成之王 |
| 3 | **Udio** | Uudio (US) | Free(有限)；Standard $10/月；Pro $30/月 | 音乐生成、音频上传、Covers、Extend、Remix | 音乐质量对标 Suno |
| 4 | **Descript** | Descript (US) | Free(1 小时转录)；Hobby $24/月；Pro $33/月；Business $50/用户/月 | 文本化音视频编辑、Overdub 声音克隆、Studio Sound 降噪、远程录制、AI Eye Contact | 播客 + 视频编辑创新者 |
| 5 | **魔音工坊** | 出门问问 (CN) | 免费试用；会员 ¥99/月；专业版 ¥299/月 | 声音克隆、AI 配音、客服外呼、数字人配音、API | 国内王者 + 数字人集成 |

### 5.2 通用功能清单

| 功能维度 | ElevenLabs | Suno | Udio | Descript | 魔音工坊 |
|---------|:----------:|:----:|:----:|:--------:|:--------:|
| **TTS 语音合成** | ✅ 顶级 | ⚠️ | ⚠️ | ✅ | ✅ |
| **声音克隆** | ✅ 即时+专业 | ⚠️ | ⚠️ | ✅ Overdub | ✅ |
| **音乐生成** | ✅ Eleven Music | ✅ 顶级 | ✅ 顶级 | ❌ | ⚠️ |
| **多语言** | ✅ 29 | ⚠️ | ⚠️ | ⚠️ | ✅ 中文强 |
| **音频编辑** | ⚠️ | ⚠️ | ⚠️ | ✅ 文本化 | ⚠️ |
| **降噪** | ⚠️ | ❌ | ❌ | ✅ Studio Sound | ⚠️ |
| **转录** | ✅ | ⚠️ | ⚠️ | ✅ 顶级 | ✅ |
| **API** | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| **商用授权** | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |

### 5.3 AI Radar Schema Gap

**建议新增字段（Audio 专用）**:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS audio_features JSONB DEFAULT '{}';
-- 内容:
--   output_types[] (tts, music, voice_cloning, transcription, dubbing, editing)
--   voice_cloning (bool)
--   voice_cloning_instant (bool) -- 几秒内克隆
--   voice_cloning_professional (bool) -- 需要长样本
--   max_music_duration (int seconds)
--   supported_languages_count (int)
--   has_denoise (bool)
--   has_transcription (bool)
--   commercial_license (bool)
--   api_available (bool)
```

---

## 六、AI Data Analysis（AI 数据分析）

### 6.1 Top 12 玩家（按 4 个子分类）

#### 子分类 1：无代码对话式分析
| # | 工具 | 定价 | 关键特性 | 差异化 |
|---|------|------|---------|--------|
| 1 | **Julius AI** | Free; Pro $20/月 | 自动图表、统计分析、脏数据处理、Python notebook 导出 | 最宽容的脏数据处理 |
| 2 | **ChatGPT Advanced Data Analysis** | Plus $20/月 | 文件上传(CSV/Excel/PDF)、沙箱 Python、迭代式分析 | ChatGPT 生态集成 |
| 3 | **Rows AI** | Free(100 AI req)；Pro $9/月 | 50+ 数据连接器、AI 公式、电子表格内工作流 | 表格内 AI + 实时数据 |
| 4 | **Polymer Search** | Free(5 workspace)；Starter $10/月 | 自动仪表盘、Google Sheets 同步、嵌入报告 | 表格转可搜索数据库 |

#### 子分类 2：BI 平台
| # | 工具 | 定价 | 关键特性 | 差异化 |
|---|------|------|---------|--------|
| 5 | **Tableau AI** | Creator $75/用户/月；Viewer $15/用户/月 | Tableau Pulse、Einstein Copilot、异常检测、Salesforce 集成 | Salesforce 生态 |
| 6 | **Microsoft Fabric Copilot** | Power BI Pro $10/用户/月；Fabric $263/月起 | DAX 自动生成、OneLake、Azure 整合 | Microsoft 生态 |
| 7 | **Google Looker** | Studio 免费；Enterprise $5K+/月 | LookML 语义层、Gemini 集成、BigQuery 原生 | Google Cloud 生态 |

#### 子分类 3：ML/预测分析
| # | 工具 | 定价 | 关键特性 | 差异化 |
|---|------|------|---------|--------|
| 8 | **Akkio** | Free; Pro $49/月; Team $99/月 | 自动化 ML、Lead Scoring、Churn 预测 | 中小企业无代码 ML |
| 9 | **Obviously AI** | Starter $75/月 | 自然语言建模、可解释预测 | 可解释性最强 |
| 10 | **DataRobot** | Enterprise $100K+/年 | 100+ 算法、偏见检测、MLOps 治理 | 企业级生产 ML |

#### 子分类 4：专业分析
| # | 工具 | 定价 | 关键特性 | 差异化 |
|---|------|------|---------|--------|
| 11 | **MonkeyLearn** | Free(300 req)；Team $299/月 | 情感分析、主题分类、文本 NLP | 文本分析专业化 |
| 12 | **Hex** | Free(1 conn)；Team $28/用户/月 | SQL+Python notebook、反应式参数、dbt 集成 | 协作数据工作空间 |

### 6.2 通用功能矩阵

| 功能维度 | Julius | ChatGPT | Rows | Polymer | Tableau | Fabric | Looker | Akkio | DataRobot | Hex |
|---------|:------:|:-------:|:----:|:-------:|:-------:|:------:|:------:|:-----:|:---------:|:---:|
| **自然语言查询** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| **自动可视化** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **数据连接器** | ⚠️ | ⚠️ | ✅ 50+ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **预测/ML** | ❌ | ⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| **Python 执行** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **协作** | ⚠️ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **嵌入式分析** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **异常检测** | ⚠️ | ⚠️ | ❌ | ❌ | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ⚠️ |
| **NLP 专项** | ⚠️ | ⚠️ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ |
| **免费版** | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ | ✅ | ❌ | ✅ |

### 6.3 AI Radar Schema Gap

**建议新增字段（Data Analysis 专用）**:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS data_analysis_features JSONB DEFAULT '{}';
-- 内容:
--   sub_category (enum: no_code_chat, bi_platform, predictive_ml, specialized)
--   natural_language_query (bool)
--   auto_visualization (bool)
--   data_connectors_count (int)
--   supports_ml_modeling (bool)
--   python_execution (bool)
--   collaboration (bool)
--   embedded_analytics (bool)
--   anomaly_detection (bool)
--   nlp_specialty (bool)
--   free_tier (bool)
--   enterprise_tier (bool)
--   starting_price_usd (numeric)
--   min_price (numeric)
--   max_price (numeric)
```

---

## 七、AI Agent（AI 智能体框架）

### 7.1 Top 5 框架

| # | 框架 | 维护方 | GitHub Stars | 关键特性 | 最佳场景 |
|---|------|--------|-------------|---------|---------|
| 1 | **LangChain / LangGraph** | LangChain (开源) | 131.7k | 最广工具生态、PostgreSQL checkpointer、HITL 中断、MCP 完整支持、LangSmith 观测 | 快速模型切换 + 图级控制 |
| 2 | **CrewAI** | CrewAI (开源) | 47.7k | 角色+任务+团队抽象、MCP 完整支持、跨职能团队协作 | 角色驱动多智能体 |
| 3 | **AutoGen** | Microsoft (开源) | 56.5k | 对话优先、AgentChat/Core 双层、OpenAI 扩展 | 对话型实验 + 微软生态 |
| 4 | **LlamaIndex** | LlamaIndex (开源) | 48.2k | RAG 原生、3 种多智能体模式、FunctionAgent、丰富连接器 | 文档检索为核心 |
| 5 | **Semantic Kernel** | Microsoft (开源) | 27.7k | C#/Python/Java SDK、Kernel 服务+插件、Azure 深度集成 | .NET/Java 企业 |

### 7.2 对比维度

| 维度 | LangChain | CrewAI | AutoGen | LlamaIndex | Semantic Kernel |
|------|:---------:|:------:|:-------:|:----------:|:---------------:|
| **多智能体编排** | ✅ 完整 | ✅ 完整 | ✅ 完整 | ⚠️ 三种模式 | ⚠️ 视语言 |
| **持久化/记忆** | ⚠️ LangGraph | ❌ | ❌ | ❌ | ❌ |
| **RAG 原生** | ⚠️ | ❌ | ❌ | ✅ 完整 | ⚠️ |
| **MCP 支持** | ✅ 完整 | ✅ 完整 | ⚠️ | ⚠️ | ⚠️ |
| **HITL 人工审批** | ⚠️ LangGraph | ❌ | ❌ | ❌ | ❌ |
| **审计追溯** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **部署灵活性** | 高 Py/TS | 中 Py | 高 Py/.NET | 中 Py/TS | 高 C#/Py/Java |
| **GAIA 基准(秒)** | 12.86 | 11.87 | **8.41 最佳** | 24.26 | N/A |

### 7.3 关键洞察

- **所有五大框架都缺乏**: 原生 policy gate、HITL approval、audit trail
- **生产化必须配合外部 Agent Control Plane**（如 Cordum、Prefect、Temporal）
- **LangChain 生态最大但不一定质量最好**（Token 消耗 7,753K，vs AutoGen 1,381K）
- **AutoGen 速度最快**（GAIA 8.41s）但 Token 消耗并不一定低

### 7.4 AI Radar Schema Gap

**建议新增字段（Agent 专用）**:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS agent_features JSONB DEFAULT '{}';
-- 内容:
--   framework_type (enum: framework, platform, sdk, no_code)
--   multi_agent_support (bool)
--   persistence_support (bool)
--   rag_native (bool)
--   mcp_support (bool)
--   hitl_approval (bool)
--   audit_trail (bool)
--   supported_languages[] (python, typescript, csharp, java, dotnet)
--   github_stars (int)
--   pypi_downloads (bigint)
--   commercial_offering (bool)
--   primary_use_case (text)
```

---

## 八、AI Infrastructure（AI 模型托管/推理）

### 8.1 Top 5 平台

| # | 平台 | 定价模式 | 关键特性 | 差异化 |
|---|------|----------|---------|--------|
| 1 | **Hugging Face** | Serverless 按 token + Dedicated 按 GPU 时 | 1M+ 模型、AutoTrain、Spaces、Transformers 生态 | 生态之王 |
| 2 | **Replicate** | 按 GPU 秒 | 30K+ 模型、Cog 容器、Cloudflare 收购 | 媒体模型之王 |
| 3 | **Together AI** | Serverless 按 token + Dedicated | 200+ 精选模型、Batch 50% 折扣、200 tok/s LLM | LLM 速度专家 |
| 4 | **Groq** | 按 token | 自研 LPU、840 tok/s、仅开源模型 | 速度之王 |
| 5 | **Fireworks AI** | 按 token + 缓存 50% 折扣 | 函数调用/结构化输出强、缓存优惠 | 缓存专家 |

### 8.2 GPU 时薪对比

| GPU | Hugging Face | Replicate | Together AI | Fireworks |
|-----|:-------------:|:---------:|:-----------:|:---------:|
| T4 (16GB) | $0.50/hr | $0.81/hr | - | - |
| L4 (24GB) | $0.80/hr | - | - | - |
| A10G (24GB) | $1.00/hr | - | - | - |
| L40S (48GB) | $1.80/hr | $3.51/hr | - | - |
| A100 (80GB) | $2.50/hr | $5.04/hr | $0.85/hr 起 | $2.90/hr |
| H100 (80GB) | $10.00/hr (GCP) | $5.49/hr | - | $4.00/hr |
| H200 (141GB) | $5.00/hr | - | - | $6.00/hr |

### 8.3 LLM 推理成本对比（100 万次请求，Llama 3.1 70B）

| 平台 | 模式 | 100 万次成本 |
|------|------|------------|
| Hugging Face 专用 A100 | $2.50/hr, ~4 req/s | **~$175/月**（常驻） |
| Together AI 批处理 | 50% 折扣 | **$210** |
| Together AI serverless | $0.60/M | $420 |
| Replicate A100 | ~5s/次 @ $5.04/hr | **~$7,000** |

### 8.4 AI Radar Schema Gap

**建议新增字段（Infrastructure 专用）**:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS infrastructure_features JSONB DEFAULT '{}';
-- 内容:
--   service_type (enum: serverless, dedicated, both, marketplace)
--   pricing_model (enum: per_token, per_gpu_hour, per_second, hybrid)
--   model_count (int)
--   gpu_types[] (T4, L4, A10G, L40S, A100, H100, H200, LPU, custom)
--   max_context_window (int)
--   has_batch_api (bool)
--   has_fine_tuning (bool)
--   has_spaces_or_demos (bool)
--   cold_start_seconds (int)
--   free_tier (bool)
--   free_credit_usd (numeric)
--   enterprise_sso (bool)
```

---

## 九、AI API（LLM API 提供商）

### 9.1 Top 11 玩家完整价格表

| 提供商 | 旗舰模型 | 输入/MTok | 输出/MTok | 上下文 | 速度 | 优势 |
|--------|----------|:---------:|:---------:|:------:|:----:|------|
| **OpenAI** | GPT-5.4 | $2.50 | $10.00 | 128K | ~100 tok/s | 生态最成熟、function call 最佳 |
| | GPT-4.1 | $2.00 | $8.00 | **1M** | ~100 tok/s | 1M 上下文 |
| | GPT-4.1-mini | $0.40 | $1.60 | 1M | ~200 tok/s | 性价比 |
| | GPT-4.1-nano | $0.10 | $0.40 | 1M | ~300 tok/s | 极致便宜 |
| | o3 (reasoning) | $2.00 | $8.00 | 200K | ~50 tok/s | 推理强 |
| **Anthropic** | Claude Opus 4.6 | $5.00 | $25.00 | 200K (1M beta) | ~60 tok/s | 代码之王、MCP 原生 |
| | Claude Sonnet 4.6 | $3.00 | $15.00 | 200K (1M beta) | ~80 tok/s | SWE-Bench 82% |
| | Claude Haiku 4.5 | $1.00 | $5.00 | 200K | ~150 tok/s | 性价比 |
| **Google** | Gemini 3.1 Pro | $2.00 | $12.00 | **1M+** | ~200 tok/s | 多模态 + 1M 上下文 |
| | Gemini 2.5 Pro | $1.25 | $10.00 | 1M | ~200 tok/s | 性价比 + 长上下文 |
| | Gemini 2.5 Flash | $0.30 | $2.50 | 1M | ~300 tok/s | **最佳价值** + 免费层 |
| | Gemini 2.5 Flash-Lite | $0.10 | $0.40 | 1M | ~500 tok/s | 最便宜 + 免费层 |
| **DeepSeek** | V3.2 (chat) | $0.28 | $0.42 | 128K | ~80 tok/s | **价格颠覆者** (24x 便宜) |
| **Groq** | Llama 3.1 8B | $0.05 | $0.08 | 128K | **840 tok/s** | 速度之王 |
| | Llama 4 Scout | $0.11 | $0.34 | 128K | 594 tok/s | 速度 + MoE |
| | Llama 3.3 70B | $0.59 | $0.79 | 128K | 394 tok/s | 大模型速度 |
| **Together AI** | Llama 4 Maverick | $0.27 | $0.85 | 128K | ~200 tok/s | 200+ 精选模型 |
| | DeepSeek V3.1 | $0.60 | $1.70 | 128K | ~150 tok/s | 托管 DeepSeek |
| **Fireworks AI** | DeepSeek V3 | $0.56 | $1.68 | 128K | ~200 tok/s | 缓存 50% 折扣 |
| | Kimi K2.5 | $0.60 | $3.00 | 128K | ~200 tok/s | 缓存 $0.10 |
| **Mistral** | Mistral Large 3 | ~$2 | ~$8 | 128K | ~100 tok/s | 欧洲数据驻留 |
| | Codestral | ~$0.30 | ~$0.90 | 256K | ~200 tok/s | 代码生成 |
| **Cohere** | Command A | $2.50 | $10.00 | 256K | ~100 tok/s | RAG + Embedding 强 |
| **Amazon Bedrock** | 多种 | +1-2x | +1-2x | 视模型 | 视模型 | 合规 + AWS 整合 |
| **Azure OpenAI** | GPT-5.4/4.1 | +1-2x | +1-2x | 同 OpenAI | 同 OpenAI | 企业合规 + VNet |

### 9.2 真实场景成本对比

#### Coding Agent: 1,000 文件/天（50M input + 5M output tokens）

| 模型 | 月成本 |
|------|-------:|
| Claude Opus 4.6 | **$11,250** |
| Claude Sonnet 4.6 | $6,750 |
| GPT-4.1 | $4,200 |
| Gemini 2.5 Pro | $3,390 |
| GPT-4.1-mini | $840 |
| **DeepSeek V3.2** | **$484** |
| GPT-4.1-nano | $210 |

#### 客服 Chatbot: 10K 通话/天

| 模型 | 月成本 |
|------|-------:|
| Claude Haiku 4.5 | $1,350 |
| GPT-4.1-mini | $480 |
| Gemini 2.5 Flash | $563 |
| DeepSeek V3.2 | $234 |
| **Groq Llama 3.1 8B** | **$42** |

### 9.3 关键洞察

- **价格差距 300 倍**：$0.08 (Groq Llama 3.1 8B 输出) → $25 (Claude Opus 4.6 输出)
- **80/20 法则**：80% 应用在 $0.40-$2.50/MTok 输出范围就够用
- **双模型路由是生产标准**：80-95% 流量走便宜模型，复杂任务升级到旗舰
- **生产架构选择**：
  - 编程：Claude Sonnet 4.6 / GPT-4.1
  - Chatbot：GPT-4.1-mini / Gemini Flash
  - 长上下文：Gemini 2.5 Flash（3-6x 便宜于 Claude）
  - Agent：Claude Opus 4.6 / o3
  - 高量低成本：DeepSeek V3.2 / GPT-4.1-nano
  - 低延迟：Groq
  - 企业合规：Azure OpenAI / Bedrock

### 9.4 AI Radar Schema Gap

**建议新增字段（API 专用）**:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS api_features JSONB DEFAULT '{}';
-- 内容:
--   provider_type (enum: openai, anthropic, google, deepseek, groq, mistral, cohere, together, fireworks, bedrock, azure)
--   flagship_model (text)
--   input_price_per_mtok (numeric)
--   output_price_per_mtok (numeric)
--   context_window (int)
--   max_output_tokens (int)
--   has_function_calling (bool)
--   has_structured_output (bool)
--   has_vision (bool)
--   has_streaming (bool)
--   has_batch_api (bool)
--   has_prompt_caching (bool)
--   cache_discount (numeric) -- 0.5 = 50% off
--   reasoning_mode (bool)
--   supports_mcp (bool)
--   supports_finetuning (bool)
--   self_hosting (bool)
--   throughput_tok_per_sec (int)
--   ttft_ms (int)
--   free_tier (bool)
--   free_credit_usd (numeric)
--   data_residency (text[]) -- eu, us, cn, global
--   compliance[] (soc2, hipaa, gdpr, iso27001)
```

---

## 十、9 个分类的 Schema 整合方案

### 10.1 总体策略

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|:------:|
| **A. 9 个 JSONB 字段**（每分类一个） | 灵活、按需查询、不破坏 schema | 难统一查询、需要 cast | ⭐⭐⭐ |
| **B. 通用 features JSONB 字段** | 简单、跨分类统一 | 类型混乱、难分析 | ⭐ |
| **C. 新建 category_features 表**（一対多） | 完全规范化、可分析 | JOIN 成本、表爆炸 | ⭐⭐ |
| **D. A + category_features_view 物化视图** | 灵活 + 高性能 | 实现复杂 | ⭐⭐⭐⭐ |

**推荐方案 D**：用 JSONB 灵活存储（方案 A），并为热门查询建立**物化视图** + **GIN 索引**。

### 10.2 实施 SQL（推荐方案）

```sql
-- 1. 给 products 表加 9 个 JSONB 字段
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS writing_features JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS coding_features JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS design_features JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_features JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS audio_features JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS data_analysis_features JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS agent_features JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS infrastructure_features JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS api_features JSONB DEFAULT '{}';

-- 2. 给 JSONB 加 GIN 索引（支持 contains 查询）
CREATE INDEX IF NOT EXISTS idx_products_writing_features_gin
  ON products USING GIN (writing_features);
CREATE INDEX IF NOT EXISTS idx_products_coding_features_gin
  ON products USING GIN (coding_features);
-- ... 9 个分类都加

-- 3. 创建物化视图：按 category 聚合特征
CREATE MATERIALIZED VIEW products_feature_summary AS
SELECT
  id,
  slug,
  name,
  category,
  CASE category
    WHEN 'writing' THEN writing_features
    WHEN 'coding' THEN coding_features
    WHEN 'design' THEN design_features
    WHEN 'video' THEN video_features
    WHEN 'audio' THEN audio_features
    WHEN 'data_analysis' THEN data_analysis_features
    WHEN 'agent' THEN agent_features
    WHEN 'infrastructure' THEN infrastructure_features
    WHEN 'api' THEN api_features
  END as features,
  confidence_score,
  last_seen
FROM products
WHERE availability_status = 'active';

CREATE INDEX idx_feature_summary_gin ON products_feature_summary USING GIN (features);

-- 4. 创建常用查询函数
CREATE OR REPLACE FUNCTION find_by_feature(
  cat TEXT,
  feature_key TEXT,
  feature_value JSONB
) RETURNS SETOF products AS $$
  SELECT * FROM products
  WHERE category = cat
  AND CASE cat
    WHEN 'writing' THEN writing_features
    WHEN 'coding' THEN coding_features
    WHEN 'design' THEN design_features
    WHEN 'video' THEN video_features
    WHEN 'audio' THEN audio_features
    WHEN 'data_analysis' THEN data_analysis_features
    WHEN 'agent' THEN agent_features
    WHEN 'infrastructure' THEN infrastructure_features
    WHEN 'api' THEN api_features
  END @> jsonb_build_object(feature_key, feature_value);
$$ LANGUAGE SQL STABLE;
```

### 10.3 数据采集策略

**采集方式**（按分类定制）：

| 分类 | 数据源 | 更新频率 | 自动化 |
|------|--------|---------|-------|
| Writing | Jasper 官网、Copy.ai pricing page、Product Hunt 标签 | 季度 | 半自动 |
| Coding | GitHub API（stars/releases）、JetBrains 插件市场、VS Code Marketplace | 周 | **全自动** |
| Design | Adobe 官网、Canva pricing、Behance | 月 | 半自动 |
| Video | Runway/Pika/Sora API 公告、Twitter AI KOL | 周 | 半自动 |
| Audio | ElevenLabs 官网、Suno 官网、Apple Podcasts charts | 月 | 半自动 |
| Data Analysis | G2 分类、Crunchbase、vendor 官网 | 季度 | 手动 |
| Agent | GitHub API（每框架的 stars/releases）、PyPI 下载量 | 周 | **全自动** |
| Infrastructure | Replicate/HF/Together 官网定价页 | 季度 | 手动 |
| API | 各 provider 官网 pricing（更新频繁） | 月 | 半自动 |

---

## 十一、关键发现汇总

### 11.1 跨分类共同模式

1. **价格两极分化**：从 $0 完全免费（Gemini Flash-Lite、HF free）到 $100K+/年（DataRobot 企业版、Looker 企业版）
2. **生态绑定明显**：Writing 选 Notion、Coding 选 VS Code、Design 选 Figma、Data 选 Salesforce/Microsoft/Google 三选一
3. **"免费版 + 付费"是主流**：几乎所有 50+ 工具都有 free tier，付费解锁核心功能
4. **API 是基础设施**：50%+ 工具提供 API，方便集成和自动化
5. **协作功能成标配**：60%+ 工具有实时协作 / 团队 / 分享
6. **2026 趋势：Agent 化**：所有分类都在加 Agent 能力（AutoGPT、Manus、Devin 是信号）
7. **2026 趋势：AI Search Optimization**：被 ChatGPT/Perplexity 引用成新 SEO

### 11.2 AI Radar 独特机会

| 机会 | 价值 | 实施成本 |
|------|------|---------|
| **跨分类功能比较** | 极高（无竞品提供） | 中（需要完整 9 分类字段） |
| **价格历史追踪** | 高（用户决策核心） | 中（time-series 表） |
| **API 价格实时对比** | 高（LLM API 决策必备） | 低（爬虫 + 定时任务） |
| **Agent 框架 benchmark** | 中（技术受众） | 高（需要跑 GAIA 等基准） |
| **4D 验证（多源可信度）** | 极高（差异化壁垒） | 中（已有置信度字段） |
| **AI 分类的"AI Radar Verified"** | 极高 | 中（4D 验证 + 编辑审核） |

### 11.3 下一步行动

| 任务 | 优先级 | 时间 | 产出 |
|------|:------:|:----:|------|
| 1. 在 Supabase 跑 `phase-c-schema.sql` | P0 | 0.5 天 | 9 个 JSONB 字段 + GIN 索引 |
| 2. 为 5 个已分类产品补全 writing_features | P1 | 1 天 | 5 条记录 + 模板 |
| 3. 爬取 11 个 LLM API 提供商定价 | P1 | 2 天 | api_features 表（11 工具） |
| 4. 抓取 GitHub top 30 Agent 框架元数据 | P1 | 1 天 | agent_features 表（30 工具） |
| 5. UI 端增加"按功能筛选" | P2 | 3 天 | `/discover?feature=long_form` 等 |

---

## 附录 A：参考资料

### A.1 主要数据源
- theairegistry.com — AI Data Analysis 12 工具
- cordum.io — AI Agent 框架对比（含 GitHub stars、PyPI 下载量）
- toolhalla.ai — AI 推理平台定价
- morphllm.com — LLM API 2026 完整对比（11 提供商）
- 各类厂商官网（pricing 页）

### A.2 关键发现的文件
- `/frontend/src/lib/constants.ts` — 当前 categories 数组
- `/supabase/init.sql` — products 表 schema

### A.3 下游依赖
- Phase D 商业化 plan 会引用本报告的「机会」清单
- Schema 改动需要 QA 工程师 + DBA 评审
- 数据采集需要至少 1 个 cron job + 1 个 ETL 脚本

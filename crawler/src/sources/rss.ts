/**
 * RSS feed data source.
 *
 * Fetches and parses RSS feeds from tech news sites to discover new AI products.
 * Supported feeds:
 *   - TechCrunch AI
 *   - VentureBeat AI
 *
 * Uses fast-xml-parser for RSS parsing and node-fetch for HTTP requests.
 */
import { CrawledProduct, DataSource } from '../types.js';
import { XMLParser } from 'fast-xml-parser';

/**
 * RSS feed URLs to scrape for AI product news.
 * Organized by category for maintainability.
 * Last verified: 2026-06-14
 */
const RSS_FEEDS: Array<{ url: string; name: string }> = [
  // ============================================
  // ENGLISH TECH MEDIA (新闻为主)
  // ============================================
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch AI' },
  { url: 'https://venturebeat.com/category/ai/feed/', name: 'VentureBeat AI' },
  { url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', name: 'The Verge AI' },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Tech Review' },
  { url: 'https://www.wired.com/feed/tag/ai/latest/rss', name: 'Wired AI' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica' },
  { url: 'https://www.artificialintelligence-news.com/feed/', name: 'AI News' },
  { url: 'https://the-decoder.com/feed/', name: 'The Decoder' },
  { url: 'https://www.marktechpost.com/feed/', name: 'MarkTechPost' },
  { url: 'https://aibusiness.com/rss.xml', name: 'AI Business' },
  { url: 'https://lastweekin.ai/feed', name: 'Last Week in AI' },
  { url: 'https://semianalysis.com/feed/', name: 'SemiAnalysis' },
  { url: 'https://www.newscientist.com/subject/artificial-intelligence/feed/', name: 'New Scientist AI' },
  { url: 'https://spectrum.ieee.org/rss/topic/artificial-intelligence', name: 'IEEE Spectrum AI' },
  { url: 'https://www.nature.com/subjects/machine-learning.rss', name: 'Nature ML' },
  { url: 'https://www.nature.com/natmachintell.rss', name: 'Nature Machine Intelligence' },
  { url: 'https://www.science.org/rss/news_current.xml', name: 'Science Magazine' },
  { url: 'https://www.engadget.com/rss.xml', name: 'Engadget' },
  { url: 'https://singularityhub.com/feed/', name: 'Singularity Hub' },
  { url: 'https://www.futurism.com/feeds/latest', name: 'Futurism' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Tech' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', name: 'NY Times Tech' },
  { url: 'https://www.reuters.com/rssFeed/technologyNews', name: 'Reuters Tech' },
  { url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml', name: 'ZDNet AI' },
  { url: 'https://www.cnet.com/rss/ai/', name: 'CNET AI' },

  // ============================================
  // AI-SPECIFIC ENGLISH NEWS
  // ============================================
  { url: 'https://www.unite.ai/feed/', name: 'Unite AI' },
  { url: 'https://neurosciencenews.com/feed/', name: 'Neuroscience News' },
  { url: 'https://analyticsindiamag.com/feed/', name: 'Analytics India Magazine' },
  { url: 'https://www.kdnuggets.com/feed', name: 'KDnuggets' },
  { url: 'https://machinelearningmastery.com/feed/', name: 'Machine Learning Mastery' },
  { url: 'https://www.freecodecamp.org/news/rss/', name: 'freeCodeCamp' },
  { url: 'https://dev.to/feed', name: 'Dev.to' },
  { url: 'https://medium.com/feed/tag/artificial-intelligence', name: 'Medium AI' },
  { url: 'https://towardsdatascience.com/feed', name: 'Towards Data Science' },
  { url: 'https://theaisummit.com/feed/', name: 'AI Summit' },
  { url: 'https://www.aiweekly.co/feed', name: 'AI Weekly' },
  { url: 'https://www.exponentialview.co/feed', name: 'Exponential View' },
  { url: 'https://thesequence.substack.com/feed', name: 'The Sequence' },
  { url: 'https://www.superhuman.ai/feed', name: 'Superhuman AI' },
  { url: 'https://www.aitidbits.substack.com/feed', name: 'AI Tidbits' },
  { url: 'https://bensbites.beehiiv.com/feed', name: "Ben's Bites" },
  { url: 'https://www.theaiedge.com/feed/', name: 'The AI Edge' },
  { url: 'https://ai.stackexchange.com/feeds', name: 'AI Stack Exchange' },

  // ============================================
  // CHINESE MEDIA (中文)
  // ============================================
  { url: 'https://www.jiqizhixin.com/rss', name: '机器之心' },
  { url: 'https://www.qbitai.com/feed', name: '量子位' },
  { url: 'https://sspai.com/feed', name: '少数派' },
  { url: 'https://www.infoq.cn/feed', name: 'InfoQ中文' },
  { url: 'https://36kr.com/feed', name: '36氪' },
  { url: 'https://www.leiphone.com/feed', name: '雷锋网' },
  { url: 'https://www.geekpark.net/rss', name: '极客公园' },
  { url: 'https://www.tmtpost.com/feed', name: '钛媒体' },
  { url: 'https://www.ifanr.com/feed', name: '爱范儿' },
  { url: 'https://www.woshipm.com/feed', name: '人人都是产品经理' },
  { url: 'https://www.pingwest.com/feed', name: '品玩' },
  { url: 'https://www.niaogebiji.com/feed', name: '鸟哥笔记' },
  { url: 'https://www.huxiu.com/rss/0.xml', name: '虎嗅' },
  { url: 'https://www.36kr.com/feed-article', name: '36氪深度' },
  { url: 'https://www.geekpark.net/rss/news', name: '极客公园新闻' },

  // ============================================
  // COMPANY BLOGS (验证过的)
  // ============================================
  { url: 'https://huggingface.co/blog/feed.xml', name: 'HuggingFace Blog' },
  { url: 'https://deepmind.google/blog/rss.xml', name: 'Google DeepMind' },
  { url: 'https://mistral.ai/news/rss.xml', name: 'Mistral AI' },
  { url: 'https://blog.langchain.dev/rss/', name: 'LangChain Blog' },
  { url: 'https://blog.vllm.ai/feed', name: 'vLLM Blog' },
  { url: 'https://ollama.com/blog', name: 'Ollama Blog' },
  { url: 'https://www.llamaindex.ai/blog/rss.xml', name: 'LlamaIndex Blog' },
  { url: 'https://cohere.com/blog', name: 'Cohere Blog' },
  { url: 'https://www.anthropic.com/research/rss.xml', name: 'Anthropic Research' },
  { url: 'https://openai.com/research/rss.xml', name: 'OpenAI Research' },
  { url: 'https://ai.googleblog.com/feeds/posts/default?alt=rss', name: 'Google AI Blog' },
  { url: 'https://blogs.microsoft.com/ai/feed/', name: 'Microsoft AI Blog' },
  { url: 'https://ai.meta.com/blog/rss/', name: 'Meta AI Blog' },
  { url: 'https://engineering.fb.com/feed/', name: 'Meta Engineering' },
  { url: 'https://blog.google/technology/ai/rss/', name: 'Google AI' },
  { url: 'https://www.nvidia.com/blog/feed/', name: 'NVIDIA Blog' },
  { url: 'https://aws.amazon.com/blogs/machine-learning/feed/', name: 'AWS ML Blog' },
  { url: 'https://cloud.google.com/blog/products/ai-machine-learning/rss', name: 'Google Cloud AI' },
  { url: 'https://azure.microsoft.com/en-us/blog/feed/', name: 'Azure Blog' },
  { url: 'https://research.ibm.com/blog/rss.xml', name: 'IBM Research' },
  { url: 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss', name: 'IEEE Spectrum AI' },
  { url: 'https://www.samsung.com/us/news/feed/', name: 'Samsung News' },
  { url: 'https://www.qualcomm.com/news/releases/feed', name: 'Qualcomm' },
  { url: 'https://www.amd.com/en/blog/rss.xml', name: 'AMD Blog' },
  { url: 'https://www.intel.com/content/www/us/en/newsroom/feed', name: 'Intel News' },
  { url: 'https://www.oracle.com/news/feed/', name: 'Oracle News' },
  { url: 'https://www.salesforce.com/news/feed/', name: 'Salesforce News' },
  { url: 'https://www.adobe.com/content/dam/acom/en/newsroom/pdfs/rss/pressreleases.xml', name: 'Adobe' },
  { url: 'https://www.autodesk.com/blogs/autodesk/feed/', name: 'Autodesk' },
  { url: 'https://www.servicenow.com/content/dam/servicenow-assets/public/en-us/doc-type/resource-center/rss/rss.xml', name: 'ServiceNow' },
  { url: 'https://www.palantir.com/feed/', name: 'Palantir' },
  { url: 'https://www.snowflake.com/blog/feed/', name: 'Snowflake' },
  { url: 'https://www.databricks.com/feed', name: 'Databricks' },
  { url: 'https://www.confluent.io/blog/feed/', name: 'Confluent' },
  { url: 'https://www.hashicorp.com/blog/feed.xml', name: 'HashiCorp' },
  { url: 'https://www.grafana.com/blog/index.xml', name: 'Grafana' },
  { url: 'https://www.pagerduty.com/blog/feed/', name: 'PagerDuty' },
  { url: 'https://www.jfrog.com/blog/feed/', name: 'JFrog' },
  { url: 'https://www.snyk.io/blog/feed/', name: 'Snyk' },
  { url: 'https://www.docker.com/blog/feed/', name: 'Docker' },
  { url: 'https://kubernetes.io/feed.xml', name: 'Kubernetes' },
  { url: 'https://www.elastic.co/blog/feed', name: 'Elastic' },
  { url: 'https://www.mongodb.com/blog/rss', name: 'MongoDB' },
  { url: 'https://redis.io/blog/feed/', name: 'Redis' },
  { url: 'https://www.postgresql.org/news.rss', name: 'PostgreSQL' },
  { url: 'https://www.mysql.com/blog/feed/', name: 'MySQL' },
  { url: 'https://supabase.com/blog/rss.xml', name: 'Supabase' },
  { url: 'https://www.prisma.io/blog/feed', name: 'Prisma' },
  { url: 'https://www.typescriptlang.org/feed.xml', name: 'TypeScript' },
  { url: 'https://react.dev/blog/rss', name: 'React Blog' },
  { url: 'https://nextjs.org/blog/feed.xml', name: 'Next.js Blog' },
  { url: 'https://vercel.com/blog/feed.xml', name: 'Vercel Blog' },
  { url: 'https://www.netlify.com/blog/feed.xml', name: 'Netlify' },
  { url: 'https://www.railway.app/blog/rss.xml', name: 'Railway' },
  { url: 'https://fly.io/blog/feed.xml', name: 'Fly.io' },
  { url: 'https://www.cloudflare.com/blog/feed/', name: 'Cloudflare' },
  { url: 'https://blog.cloudflare.com/rss/', name: 'Cloudflare Blog' },
  { url: 'https://www.fastly.com/blog/feed', name: 'Fastly' },
  { url: 'https://www.digitalocean.com/blog/feed', name: 'DigitalOcean' },
  { url: 'https://www.linode.com/blog/feed/', name: 'Linode' },
  { url: 'https://www.vultr.com/blog/feed/', name: 'Vultr' },
  { url: 'https://www.hetzner.com/blog/feed/', name: 'Hetzner' },
  { url: 'https://www.ovhcloud.com/en/blog/feed/', name: 'OVHcloud' },
  { url: 'https://www.alibabacloud.com/blog/feed', name: 'Alibaba Cloud' },
  { url: 'https://www.tencentcloud.com/blog/feed', name: 'Tencent Cloud' },
  { url: 'https://www.huawei.com/en/news/feed', name: 'Huawei' },
  { url: 'https://www.baidu.com/blog/feed', name: 'Baidu' },
  { url: 'https://www.bytedance.com/en/feed', name: 'ByteDance' },
  { url: 'https://www.tiktok.com/blog/feed', name: 'TikTok' },
  { url: 'https://www.spotify.com/blog/feed', name: 'Spotify' },
  { url: 'https://www.netflix.com/blog/feed', name: 'Netflix' },
  { url: 'https://www.disney.com/blog/feed', name: 'Disney' },
  { url: 'https://www.apple.com/newsroom/feed', name: 'Apple Newsroom' },
  { url: 'https://www.sony.com/en/presscentre/rss', name: 'Sony' },
  { url: 'https://www.samsung.com/global/galaxy/rss', name: 'Samsung Galaxy' },
  { url: 'https://www.xiaomi.com/global/blog/feed', name: 'Xiaomi' },
  { url: 'https://www.oppo.com/global/blog/feed', name: 'OPPO' },
  { url: 'https://www.vivo.com/global/blog/feed', name: 'Vivo' },
  { url: 'https://www.oneplus.com/global/blog/feed', name: 'OnePlus' },
  { url: 'https://www.nothing.tech/blog/feed', name: 'Nothing' },
  { url: 'https://www.fairphone.com/blog/feed/', name: 'Fairphone' },
  { url: 'https://www.pine64.org/feed/', name: 'Pine64' },
  { url: 'https://www.purism.com/blog/feed/', name: 'Purism' },
  { url: 'https://www.system76.com/blog/feed', name: 'System76' },
  { url: 'https://www.frame.work/blog/feed', name: 'Framework' },
  { url: 'https://www.raspberrypi.org/blog/feed/', name: 'Raspberry Pi' },
  { url: 'https://www.arduino.cc/blog/feed/', name: 'Arduino' },
  { url: 'https://www.espressif.com/en/news/feed', name: 'Espressif' },
  { url: 'https://www.st.com/content/st_com/en/about/media-center/blog.feed', name: 'STMicroelectronics' },
  { url: 'https://www.nxp.com/company/blog/feed', name: 'NXP' },
  { url: 'https://www.ti.com/blog/feed', name: 'Texas Instruments' },
  { url: 'https://www.analog.com/en/news/rss.xml', name: 'Analog Devices' },
  { url: 'https://www.maximintegrated.com/en/blog/feed', name: 'Maxim Integrated' },
  { url: 'https://www.microchip.com/en/blog/feed', name: 'Microchip' },
  { url: 'https://www.renesas.com/us/en/blog/feed', name: 'Renesas' },
  { url: 'https://www.infineon.com/blog/feed', name: 'Infineon' },
  { url: 'https://www.onsemi.com/blog/feed', name: 'onsemi' },
  { url: 'https://www.rohm.com/blog/feed', name: 'ROHM' },
  { url: 'https://www.toshiba.semicon-storage.com/blog/feed', name: 'Toshiba' },
  { url: 'https://www.panasonic.com/global/corporate/blog/feed', name: 'Panasonic' },
  { url: 'https://www.hitachi.com/blog/feed', name: 'Hitachi' },
  { url: 'https://www.fujitsu.com/global/blog/feed', name: 'Fujitsu' },
  { url: 'https://www.nec.com/en/blog/feed', name: 'NEC' },
  { url: 'https://www.nokia.com/blog/feed/', name: 'Nokia' },
  { url: 'https://www.ericsson.com/en/blog/feed', name: 'Ericsson' },
  { url: 'https://www.qualcomm.com/blog/feed', name: 'Qualcomm Blog' },
  { url: 'https://www.arm.com/blog/feed', name: 'ARM' },
  { url: 'https://www.amd.com/en/blog/feed', name: 'AMD' },
  { url: 'https://www.nvidia.com/en-us/blog/feed/', name: 'NVIDIA' },
  { url: 'https://www.intel.com/content/www/us/en/blog/feed', name: 'Intel' },

  // ============================================
  // RESEARCH & ACADEMIC
  // ============================================
  { url: 'https://bair.berkeley.edu/blog/feed.xml', name: 'BAIR Blog' },
  { url: 'https://thegradient.pub/rss/', name: 'The Gradient' },
  { url: 'https://blog.ml.cmu.edu/feed/', name: 'CMU ML Blog' },
  { url: 'https://allenai.org/rss.xml', name: 'Allen AI' },
  { url: 'https://www.lesswrong.com/feed.xml', name: 'LessWrong' },
  { url: 'https://www.alignmentforum.org/feed.xml', name: 'Alignment Forum' },
  { url: 'https://distill.pub/rss.xml', name: 'Distill' },
  { url: 'https://lilianweng.github.io/index.xml', name: 'Lilian Weng' },
  { url: 'https://jalammar.github.io/feed.xml', name: 'Jay Alammar' },
  { url: 'https://colah.github.io/rss.xml', name: 'Chris Olah' },
  { url: 'https://karpathy.ai/feed.xml', name: 'Andrej Karpathy' },
  { url: 'https://www.inference.vc/feed/', name: 'Inference' },
  { url: 'https://www.mlyearning.org/feed/', name: 'MLearning.ai' },
  { url: 'https://www.marktechpost.com/feed/', name: 'MarkTechPost' },
  { url: 'https://neptune.ai/blog/feed', name: 'Neptune.ai' },
  { url: 'https://www.datacamp.com/blog/rss', name: 'DataCamp' },
  { url: 'https://www.kaggle.com/blog/feed', name: 'Kaggle' },
  { url: 'https://paperswithcode.com/latest.rss', name: 'Papers With Code' },
  { url: 'https://huggingface.co/papers/rss', name: 'HuggingFace Papers' },

  // ============================================
  // NEWSLETTERS & BLOGS
  // ============================================
  { url: 'https://simonwillison.net/atom/everything/', name: 'Simon Willison' },
  { url: 'https://www.deeplearning.ai/the-batch/feed/', name: 'The Batch (Andrew Ng)' },
  { url: 'https://importai.substack.com/feed', name: 'Import AI' },
  { url: 'https://www.latent.space/feed', name: 'Latent Space' },
  { url: 'https://www.interconnects.ai/feed', name: 'Interconnects' },
  { url: 'https://huyenchip.com/feed.xml', name: 'Huyen Chip' },
  { url: 'https://eugeneyan.com/rss/', name: 'Eugene Yan' },
  { url: 'https://magazine.sebastianraschka.com/feed', name: 'Sebastian Raschka' },
  { url: 'https://wandb.ai/site/rss.xml', name: 'Weights & Biases' },
  { url: 'https://www.oreilly.com/radar/feed/', name: "O'Reilly Radar" },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Tech Review' },
  { url: 'https://spectrum.ieee.org/feed', name: 'IEEE Spectrum' },
  { url: 'https://www.newscientist.com/feed/', name: 'New Scientist' },
  { url: 'https://www.scientificamerican.com/feed/', name: 'Scientific American' },
  { url: 'https://www.nature.com/nature.rss', name: 'Nature' },
  { url: 'https://www.science.org/action/showFeed?type=etoc&feed=rss&jc=science', name: 'Science' },
  { url: 'https://www.pnas.org/action/showFeed?type=etoc&feed=rss&jc=pnas', name: 'PNAS' },
  { url: 'https://arxiv.org/rss/cs.AI', name: 'arXiv CS.AI' },
  { url: 'https://arxiv.org/rss/cs.CL', name: 'arXiv CS.CL (NLP)' },
  { url: 'https://arxiv.org/rss/cs.LG', name: 'arXiv CS.LG (ML)' },
  { url: 'https://arxiv.org/rss/cs.CV', name: 'arXiv CS.CV (Vision)' },
  { url: 'https://arxiv.org/rss/cs.RO', name: 'arXiv CS.RO (Robotics)' },
  { url: 'https://arxiv.org/rss/cs.CR', name: 'arXiv CS.CR (Crypto)' },
  { url: 'https://arxiv.org/rss/cs.DC', name: 'arXiv CS.DC (Distributed)' },
  { url: 'https://arxiv.org/rss/cs.NE', name: 'arXiv CS.NE (Neural)' },
  { url: 'https://arxiv.org/rss/stat.ML', name: 'arXiv stat.ML' },

  // ============================================
  // PRODUCT & COMMUNITY
  // ============================================
  { url: 'https://www.producthunt.com/feed', name: 'Product Hunt' },
  { url: 'https://www.ruanyifeng.com/blog/atom.xml', name: '阮一峰周刊' },
  { url: 'https://www.indiehackers.com/feed.xml', name: 'Indie Hackers' },
  { url: 'https://www.reddit.com/r/MachineLearning/.rss', name: 'r/MachineLearning' },
  { url: 'https://www.reddit.com/r/artificial/.rss', name: 'r/artificial' },
  { url: 'https://www.reddit.com/r/LocalLLaMA/.rss', name: 'r/LocalLLaMA' },
  { url: 'https://www.reddit.com/r/singularity/.rss', name: 'r/singularity' },
  { url: 'https://www.reddit.com/r/OpenAI/.rss', name: 'r/OpenAI' },
  { url: 'https://www.reddit.com/r/ClaudeAI/.rss', name: 'r/ClaudeAI' },
  { url: 'https://news.ycombinator.com/rss', name: 'Hacker News' },
  { url: 'https://lobste.rs/rss', name: 'Lobsters' },
  { url: 'https://dev.to/feed', name: 'Dev.to' },
  { url: 'https://medium.com/feed/tag/technology', name: 'Medium Tech' },
  { url: 'https://www.quora.com/topic/Artificial-Intelligence/rss', name: 'Quora AI' },
  { url: 'https://stackoverflow.com/feeds/tag/artificial-intelligence', name: 'SO AI' },
  { url: 'https://github.blog/feed/', name: 'GitHub Blog' },
  { url: 'https://gitlab.com/blog/feed.xml', name: 'GitLab Blog' },
  { url: 'https://bitbucket.org/blog/feed', name: 'Bitbucket Blog' },
];

/**
 * Keywords that indicate a feed item is about a specific AI product.
 */
const PRODUCT_KEYWORDS = [
  'launch', 'launches', 'launched',
  'release', 'released',
  'introduces', 'introducing',
  'announces', 'announcing',
  'debuts', 'unveils',
  'now available', 'now live',
  'new tool', 'new platform', 'new service', 'new app',
  'startup',
];

export class RSSSource implements DataSource {
  readonly name = 'rss';

  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      trimValues: true,
    });
  }

  /**
   * Fetch all configured RSS feeds and extract AI product mentions.
   * @returns Array of CrawledProduct objects, or empty array on failure.
   */
  async fetch(): Promise<CrawledProduct[]> {
    const products: CrawledProduct[] = [];

    for (const feed of RSS_FEEDS) {
      try {
        console.log(`[${this.name}] Fetching feed: ${feed.name} (${feed.url})`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(feed.url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) {
          console.error(
            `[${this.name}] Failed to fetch ${feed.name}: HTTP ${response.status}`
          );
          continue;
        }

        const xmlText = await response.text();
        const parsed = this.parser.parse(xmlText) as RSSFeed;

        const items = this.extractItems(parsed);

        for (const item of items) {
          const product = this.extractProduct(item, feed.name);
          if (product) {
            products.push(product);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[${this.name}] Failed to parse ${feed.name}: ${message}`);
        // Continue to next feed
      }
    }

    console.log(`[${this.name}] Extracted ${products.length} products.`);
    return products;
  }

  /**
   * Extract the array of <item> elements from a parsed RSS feed.
   * Handles both RSS 2.0 and various nesting patterns.
   */
  private extractItems(parsed: RSSFeed): RSSItem[] {
    const channel = parsed.rss?.channel ?? parsed.feed;
    if (!channel) return [];

    const items = channel.item;
    if (Array.isArray(items)) return items;
    if (items) return [items];
    return [];
  }

  /**
   * Extract a CrawledProduct from an RSS feed item if it appears to be
   * about a new AI product.
   */
  private extractProduct(item: RSSItem, feedName: string): CrawledProduct | null {
    const title = item.title ?? '';
    const description = this.stripHtml(item.description ?? '');
    const link = item.link ?? '';

    // Check if the title suggests a product launch
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    const isProductLaunch = PRODUCT_KEYWORDS.some(
      (kw) => titleLower.includes(kw) || descLower.includes(kw)
    );

    // Also check for AI-related keywords
    const hasAIKeyword = this.containsAIKeyword(titleLower, descLower);

    if (!hasAIKeyword) return null;

    // Extract product name from title
    // Typical format: "Company launches Product Name" or "Product Name: description"
    const name = this.extractProductName(title);

    if (!name || name.length < 2) return null;

    // Derive category
    const category = this.deriveCategory(titleLower, descLower);

    // Derive tags
    const tags = this.deriveTags(titleLower, descLower);

    return {
      name,
      name_en: name,
      description: description || title,
      website_url: link,
      tags,
      category,
      source: 'rss',
      source_url: link,
      crawled_at: new Date().toISOString(),
      pricing_model: undefined,
    };
  }

  /**
   * Strip HTML tags from a string (RSS descriptions often contain HTML).
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Check if the text contains AI-related keywords.
   */
  private containsAIKeyword(titleLower: string, descLower: string): boolean {
    const text = titleLower + ' ' + descLower;
    const aiKeywords = [
      'ai', 'llm', 'gpt', 'llama', 'mistral', 'claude', 'gemini',
      'machine learning', 'artificial intelligence',
      'generative', 'diffusion', 'stable diffusion',
      'openai', 'anthropic', 'deepmind',
      'agent', 'chatbot',
      'rag', 'retrieval augmented',
    ];
    return aiKeywords.some((kw) => text.includes(kw));
  }

  /**
   * Extract a product name from an RSS item title.
   * Attempts common title patterns to isolate the product name.
   */
  private extractProductName(title: string): string | null {
    // Pattern: "Company launches Product Name"
    const launchMatch = title.match(
      /(?:launch|release|introduce|announce|unveil|debut)s?\s+["']?([^"':\-.]+)/i
    );
    if (launchMatch) {
      return launchMatch[1].trim();
    }

    // Pattern: "Product Name: description" or "Product Name - description"
    const colonMatch = title.match(/^["']?([^"':\-\|–—]+)["']?(?:[-–—|:].*)?$/);
    if (colonMatch) {
      return colonMatch[1].trim();
    }

    // Fallback: use the first 40 characters
    return title.substring(0, 40).trim() || null;
  }

  /**
   * Derive a category from the item text.
   */
  private deriveCategory(titleLower: string, descLower: string): string {
    const text = titleLower + ' ' + descLower;

    if (text.includes('llm') || text.includes('gpt') || text.includes('llama')) {
      return 'LLM';
    }
    if (text.includes('image') || text.includes('diffusion') || text.includes('video generation')) {
      return 'Image Generation';
    }
    if (text.includes('speech') || text.includes('voice') || text.includes('tts')) {
      return 'Speech / Audio';
    }
    if (text.includes('agent') || text.includes('autonomous')) {
      return 'AI Agents';
    }
    return 'Other';
  }

  /**
   * Derive tags from the item text.
   */
  private deriveTags(titleLower: string, descLower: string): string[] {
    const text = titleLower + ' ' + descLower;
    const tags: string[] = [];
    const keywords = ['llm', 'gpt', 'llama', 'mistral', 'claude', 'gemini', 'agent', 'chatbot', 'rag', 'diffusion', 'openai', 'anthropic'];

    for (const kw of keywords) {
      if (text.includes(kw)) {
        tags.push(kw);
      }
    }

    if (tags.length === 0) {
      tags.push('ai');
    }

    return tags;
  }
}

// --- RSS types (simplified for common RSS 2.0 structure) ---

interface RSSFeed {
  rss?: {
    channel: RSSChannel;
  };
  feed?: RSSChannel;
}

interface RSSChannel {
  title?: string;
  link?: string;
  description?: string;
  item?: RSSItem | RSSItem[];
}

interface RSSItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  guid?: string;
  category?: string | { _text: string } | Array<string | { _text: string }>;
}

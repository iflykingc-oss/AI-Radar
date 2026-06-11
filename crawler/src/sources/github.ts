/**
 * GitHub data source.
 *
 * Uses the GitHub Search API to find repositories with rapidly growing stars
 * related to AI / ML. Searches for repos with stars > 100, recently pushed,
 * and tagged with relevant topics.
 *
 * API docs: https://docs.github.com/en/rest/search
 */
import { CrawledProduct, DataSource } from '../types.js';

/**
 * GitHub Search API endpoint for repository queries.
 */
const GITHUB_SEARCH_API = 'https://api.github.com/search/repositories';

/**
 * Number of results per page (max 100 per GitHub API).
 */
const GITHUB_PER_PAGE = 100;

/**
 * Search queries targeting different AI/ML topics.
 * Each query is run independently to maximize coverage.
 */
const SEARCH_QUERIES = [
  'stars:>100 pushed:>2024-01-01 topic:machine-learning',
  'stars:>100 pushed:>2024-01-01 topic:ai',
  'stars:>100 pushed:>2024-01-01 topic:artificial-intelligence',
  'stars:>100 pushed:>2024-01-01 topic:llm',
  'stars:>100 pushed:>2024-01-01 topic:deep-learning',
];

/**
 * Maximum number of repos to collect across all queries.
 */
const MAX_REPOS = 50;

export class GitHubSource implements DataSource {
  readonly name = 'github';

  /**
   * Personal access token for the GitHub API.
   * Set via environment variable GITHUB_TOKEN.
   */
  private token: string;

  constructor() {
    const token = process.env.CRAWLER_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn(
        `[${this.name}] CRAWLER_GITHUB_TOKEN is not set. This source will be skipped.`
      );
    }
    this.token = token || '';
  }

  /**
   * Fetch AI/ML repositories from GitHub.
   * @returns Array of CrawledProduct objects, or empty array on failure.
   */
  async fetch(): Promise<CrawledProduct[]> {
    if (!this.token) {
      console.error(`[${this.name}] Skipping: no API token configured.`);
      return [];
    }

    const seenUrls = new Set<string>();
    const products: CrawledProduct[] = [];

    for (const query of SEARCH_QUERIES) {
      if (products.length >= MAX_REPOS) break;

      try {
        console.log(`[${this.name}] Searching: ${query}`);

        const url = new URL(GITHUB_SEARCH_API);
        url.searchParams.set('q', query);
        url.searchParams.set('per_page', String(GITHUB_PER_PAGE));
        url.searchParams.set('sort', 'stars');
        url.searchParams.set('order', 'desc');

        const response = await fetch(url.toString(), {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${this.token}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
        });

        if (!response.ok) {
          console.error(
            `[${this.name}] Search failed for query "${query}": HTTP ${response.status}`
          );
          continue;
        }

        const json = (await response.json()) as GitHubSearchResponse;
        const items = json.items ?? [];

        for (const repo of items) {
          if (products.length >= MAX_REPOS) break;
          if (seenUrls.has(repo.html_url)) continue;
          seenUrls.add(repo.html_url);

          // Skip if description is empty (not a useful product)
          if (!repo.description && !repo.homepage) continue;

          // Derive tags from repo topics
          const tags = repo.topics ?? [];

          // Derive category from the most relevant topic
          const category = this.deriveCategory(tags, repo.description ?? '');

          // Determine pricing model (GitHub repos are typically open source)
          const pricingModel = repo.license
            ? 'open_source'
            : undefined;

          const description = repo.description ?? '';
          const websiteUrl = repo.homepage ?? repo.html_url ?? '';

          products.push({
            name: repo.name,
            name_en: repo.name,
            description,
            website_url: websiteUrl,
            github_url: repo.html_url,
            tags,
            category,
            source: 'github',
            source_url: repo.html_url,
            crawled_at: new Date().toISOString(),
            github_stars: repo.stargazers_count,
            pricing_model: pricingModel,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[${this.name}] Fetch failed for query "${query}": ${message}`);
        // Continue to next query — one failure doesn't block others
      }
    }

    console.log(`[${this.name}] Extracted ${products.length} repositories.`);
    return products;
  }

  /**
   * Derive a high-level category from repo topics and description.
   */
  private deriveCategory(topics: string[], description: string): string {
    const allText = (topics.join(' ') + ' ' + description).toLowerCase();

    if (allText.includes('llm') || allText.includes('large language')) {
      return 'LLM';
    }
    if (allText.includes('image') || allText.includes('diffusion') || allText.includes('stable')) {
      return 'Image Generation';
    }
    if (allText.includes('speech') || allText.includes('tts') || allText.includes('stt') || allText.includes('whisper')) {
      return 'Speech / Audio';
    }
    if (allText.includes('nlp') || allText.includes('text')) {
      return 'NLP';
    }
    if (allText.includes('robot') || allText.includes('control')) {
      return 'Robotics';
    }
    if (allText.includes('agent') || allText.includes('autonomous')) {
      return 'AI Agents';
    }

    return topics.length > 0 ? topics[0] : 'Other';
  }
}

// --- GitHub API response types ---

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items?: Array<GitHubRepo>;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  pushed_at: string;
  topics: string[];
  license: { spdx_id: string; name: string } | null;
  language: string | null;
}

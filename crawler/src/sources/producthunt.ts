/**
 * Product Hunt data source.
 *
 * Uses the Product Hunt GraphQL API v2 to fetch products posted in the last 24 hours.
 * Extracts name, description, website, votesCount (as a proxy for popularity), and tags/topics.
 *
 * API docs: https://api.producthunt.com/v2/api/graphql
 */
import { CrawledProduct, DataSource } from '../types.js';

/**
 * GraphQL query to fetch today's products from Product Hunt.
 * Returns posts with product details, topics, and website info.
 */
const PH_GRAPHQL_QUERY = `
query GetPosts($first: Int!) {
  posts(first: $first) {
    edges {
      node {
        id
        name
        tagline
        description
        url
        votesCount
        featuredAt
        website
        topics {
          edges {
            node {
              id
              name
              slug
            }
          }
        }
      }
    }
  }
}
`;

/**
 * Number of posts to fetch per run (covers ~24h of new posts).
 */
const PH_POST_LIMIT = 50;

/**
 * Product Hunt GraphQL API endpoint.
 */
const PH_API_URL = 'https://api.producthunt.com/v2/api/graphql';

export class ProductHuntSource implements DataSource {
  readonly name = 'producthunt';

  /**
   * Personal access token for the Product Hunt API.
   * Set via environment variable PRODUCT_HUNT_API_TOKEN.
   */
  private token: string;

  constructor() {
    const token = process.env.PRODUCT_HUNT_API_TOKEN;
    if (!token) {
      console.warn(
        `[${this.name}] PRODUCT_HUNT_API_TOKEN is not set. This source will be skipped.`
      );
    }
    this.token = token || '';
  }

  /**
   * Fetch products from Product Hunt.
   * @returns Array of CrawledProduct objects, or empty array on failure.
   */
  async fetch(): Promise<CrawledProduct[]> {
    if (!this.token) {
      console.error(`[${this.name}] Skipping: no API token configured.`);
      return [];
    }

    try {
      console.log(`[${this.name}] Fetching up to ${PH_POST_LIMIT} recent posts...`);

      const response = await fetch(PH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          query: PH_GRAPHQL_QUERY,
          variables: { first: PH_POST_LIMIT },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Product Hunt API returned HTTP ${response.status}: ${response.statusText}`
        );
      }

      const json = (await response.json()) as PHGraphQLResponse;

      if (json.errors && json.errors.length > 0) {
        throw new Error(
          `Product Hunt GraphQL errors: ${JSON.stringify(json.errors)}`
        );
      }

      const edges = json.data?.posts?.edges ?? [];
      const products: CrawledProduct[] = [];

      for (const edge of edges) {
        const post = edge.node;
        if (!post) continue;

        // Skip posts older than 24 hours
        if (post.featuredAt) {
          const featuredTime = new Date(post.featuredAt).getTime();
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          if (featuredTime < oneDayAgo) continue;
        }

        const topics = post.topics?.edges?.map((e) => e.node.name) ?? [];

        // Derive category from the first topic, or default to "Other"
        const category = topics.length > 0 ? topics[0] : 'Other';

        products.push({
          name: post.name,
          name_en: post.name,
          description: post.description ?? post.tagline ?? '',
          website_url: post.website?.url ?? post.url ?? '',
          tags: topics,
          category,
          source: 'producthunt',
          source_url: post.url,
          crawled_at: new Date().toISOString(),
          pricing_model: this.inferPricingModel(post.description ?? '', topics),
        });
      }

      console.log(`[${this.name}] Extracted ${products.length} products.`);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.name}] Fetch failed: ${message}`);
      return [];
    }
  }

  /**
   * Heuristic to guess the pricing model from description text and topics.
   */
  private inferPricingModel(
    description: string,
    topics: string[]
  ): CrawledProduct['pricing_model'] {
    const text = (description + ' ' + topics.join(' ')).toLowerCase();
    if (text.includes('open source') || text.includes('opensource')) {
      return 'open_source';
    }
    if (text.includes('free') && text.includes('pro')) {
      return 'freemium';
    }
    if (text.includes('free trial') || text.includes('freemium')) {
      return 'freemium';
    }
    if (text.includes('paid') || text.includes('subscription')) {
      return 'paid';
    }
    // Default to freemium for Product Hunt products (most are freemium)
    return 'freemium';
  }
}

// --- GraphQL response types ---

interface PHGraphQLResponse {
  data?: {
    posts?: {
      edges: Array<{
        node: PHPostNode;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

interface PHPostNode {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  url: string;
  votesCount: number;
  featuredAt?: string;
  website?: { url: string };
  topics?: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  };
}

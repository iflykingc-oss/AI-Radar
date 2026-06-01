import { allMockProducts, searchProducts, getProductsByCategory, getProductsByPricing, getTrendingProducts, getProductBySlug, type MockProduct } from './mock-data';
import { mockWatchlistItems } from './mock-watchlist';

export interface GetProductsOptions {
  search?: string;
  category?: string;
  pricing?: string;
  confidence?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult {
  products: MockProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function applyFilters(products: MockProduct[], options: GetProductsOptions): MockProduct[] {
  let filtered = [...products];

  if (options.search) {
    const lower = options.search.toLowerCase();
    filtered = filtered.filter(
      p =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.tags.some(t => t.toLowerCase().includes(lower)) ||
        p.category.toLowerCase().includes(lower)
    );
  }

  if (options.category) {
    filtered = filtered.filter(p => p.category === options.category);
  }

  if (options.pricing) {
    filtered = filtered.filter(p => p.pricing_model === options.pricing);
  }

  if (options.confidence === 'high') {
    filtered = filtered.filter(p => p.confidence_score >= 80);
  } else if (options.confidence === 'medium') {
    filtered = filtered.filter(p => p.confidence_score >= 50 && p.confidence_score < 80);
  } else if (options.confidence === 'low') {
    filtered = filtered.filter(p => p.confidence_score >= 20 && p.confidence_score < 50);
  }

  // Sort
  const sort = options.sort || 'recent';
  if (sort === 'recent') {
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sort === 'confidence') {
    filtered.sort((a, b) => b.confidence_score - a.confidence_score);
  } else if (sort === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'stars') {
    filtered.sort((a, b) => (b.github_stars ?? 0) - (a.github_stars ?? 0));
  }

  return filtered;
}

export const mockService = {
  getProducts: (options: GetProductsOptions = {}): PaginatedResult => {
    let filtered = applyFilters(allMockProducts, options);

    const page = options.page || 1;
    const limit = options.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const from = (page - 1) * limit;
    const to = from + limit;

    const paginatedProducts = filtered.slice(from, to);

    return {
      products: paginatedProducts.map(p => ({ ...p, source: 'mock' as const })),
      pagination: { page, limit, total, totalPages },
    };
  },

  getProductBySlug: (slug: string): { product: MockProduct & { source: string } | null } => {
    const product = getProductBySlug(slug);
    if (!product) return { product: null };
    return { product: { ...product, source: 'mock' } };
  },

  getWatchlist: (): { products: MockProduct[] } => {
    const products = mockWatchlistItems.map(item => ({
      ...item.product,
      source: 'mock' as const,
    }));
    return { products };
  },

  getTrends: (range: string = '7d'): { products: MockProduct[]; range: string } => {
    const trending = getTrendingProducts(20);
    return {
      products: trending.map(p => ({ ...p, source: 'mock' as const })),
      range,
    };
  },

  getRecommendations: (): { products: MockProduct[] } => {
    // Return a mix of high-confidence products across categories
    const categories = Array.from(new Set(allMockProducts.map(p => p.category)));
    const recommended: MockProduct[] = [];
    for (const cat of categories.slice(0, 8)) {
      const catProducts = allMockProducts
        .filter(p => p.category === cat && p.confidence_score >= 85)
        .sort((a, b) => b.confidence_score - a.confidence_score)
        .slice(0, 2);
      recommended.push(...catProducts);
    }
    return { products: recommended.map(p => ({ ...p, source: 'mock' as const })) };
  },

  searchProducts: (query: string): { products: MockProduct[] } => {
    if (!query || query.length < 2) return { products: [] };
    const results = searchProducts(query);
    return { products: results.map(p => ({ ...p, source: 'mock' as const })) };
  },
};

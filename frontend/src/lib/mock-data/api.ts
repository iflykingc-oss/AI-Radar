import { mockProducts } from './products';
import type { MockProduct, ProductFilters, PaginatedResult, CategoryCount } from './types';

// ---- Core API Functions ----

export function getProducts(filters?: ProductFilters): PaginatedResult<MockProduct> {
  let result = [...mockProducts];

  // Apply filters
  if (filters) {
    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }
    if (filters.subcategory) {
      result = result.filter((p) => p.subcategory === filters.subcategory);
    }
    if (filters.pricingModel) {
      result = result.filter((p) => p.pricing_model === filters.pricingModel);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.name_en && p.name_en.toLowerCase().includes(q)) ||
          (p.name_zh && p.name_zh.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.subcategory?.toLowerCase().includes(q)
      );
    }
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter((p) =>
        filters.tags!.every((tag) => p.tags.includes(tag))
      );
    }
    if (filters.minRating !== undefined) {
      result = result.filter((p) => p.rating >= filters.minRating!);
    }
    if (filters.maxRating !== undefined) {
      result = result.filter((p) => p.rating <= filters.maxRating!);
    }
  }

  // Apply sorting
  const sort = filters?.sort ?? 'newest';
  result.sort((a, b) => {
    switch (sort) {
      case 'trending':
        return b.weekly_growth_rate - a.weekly_growth_rate;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'github_stars': {
        const aStars = a.github_stars ?? 0;
        const bStars = b.github_stars ?? 0;
        return bStars - aStars;
      }
      case 'newest':
      default:
        return new Date(b.launch_date ?? '').getTime() - new Date(a.launch_date ?? '').getTime();
    }
  });

  // Pagination
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const total = result.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: result.slice(start, end),
    total,
    page,
    limit,
    totalPages,
  };
}

export function getProduct(slug: string): MockProduct | undefined {
  return mockProducts.find((p) => p.slug === slug);
}

export function getTrendingProducts(limit = 10): MockProduct[] {
  return [...mockProducts]
    .sort((a, b) => b.weekly_growth_rate - a.weekly_growth_rate)
    .slice(0, limit);
}

export function getRisingStars(limit = 10): MockProduct[] {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return [...mockProducts]
    .filter((p) => p.launch_date && new Date(p.launch_date) >= sixMonthsAgo)
    .sort((a, b) => b.weekly_growth_rate - a.weekly_growth_rate)
    .slice(0, limit);
}

export function getCategories(): CategoryCount[] {
  const counts: Record<string, number> = {};
  for (const p of mockProducts) {
    if (p.category) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function searchProducts(query: string, limit = 20): MockProduct[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();

  return mockProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.name_en && p.name_en.toLowerCase().includes(q)) ||
        (p.name_zh && p.name_zh.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.subcategory?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    )
    .sort((a, b) => {
      // Prioritize name match, then description, then tags
      const aNameMatch = a.name.toLowerCase().includes(q) ? 1 : 0;
      const bNameMatch = b.name.toLowerCase().includes(q) ? 1 : 0;
      if (aNameMatch !== bNameMatch) return bNameMatch - aNameMatch;
      return b.rating - a.rating;
    })
    .slice(0, limit);
}

export function getProductsByTags(tags: string[], limit = 20): MockProduct[] {
  return mockProducts
    .filter((p) => tags.some((tag) => p.tags.includes(tag)))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function getProductsByPricing(
  pricingModel: NonNullable<MockProduct['pricing_model']>,
  limit = 20
): MockProduct[] {
  return mockProducts
    .filter((p) => p.pricing_model === pricingModel)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function getProductsByRatingRange(
  min: number,
  max: number,
  limit = 20
): MockProduct[] {
  return mockProducts
    .filter((p) => p.rating >= min && p.rating <= max)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function getTotalProductCount(): number {
  return mockProducts.length;
}

export function getSubcategories(category: string): string[] {
  const subs = new Set<string>();
  for (const p of mockProducts) {
    if (p.category === category && p.subcategory) {
      subs.add(p.subcategory);
    }
  }
  return Array.from(subs).sort();
}

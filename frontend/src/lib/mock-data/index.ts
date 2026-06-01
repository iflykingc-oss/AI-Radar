// Barrel export for the mock data layer.
//
// Import from this module to keep the rest of the app
// decoupled from the internal file structure.

export { mockProducts } from './products';
export {
  getProducts,
  getProduct,
  getTrendingProducts,
  getRisingStars,
  getCategories,
  searchProducts,
  getProductsByTags,
  getProductsByPricing,
  getProductsByRatingRange,
  getTotalProductCount,
  getSubcategories,
} from './api';
export { USE_MOCK_DATA, MOCK_DELAY_MS } from './config';

export type { MockProduct, ProductFilters, PaginatedResult, CategoryCount } from './types';

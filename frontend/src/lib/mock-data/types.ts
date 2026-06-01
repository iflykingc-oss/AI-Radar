import { Database } from '../supabase/types';

type ProductRow = Database['public']['Tables']['products']['Row'];

export interface MockProduct extends Omit<ProductRow, 'id' | 'created_at' | 'updated_at' | 'pricing_model'> {
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  featureTags: string[];
  weeklyDownloads: number;
  monthlyActiveUsers: number;
  created_at?: string;
  updated_at?: string;
  pricing_model: 'free' | 'freemium' | 'paid' | 'open_source' | 'enterprise' | null;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  pricingModel?: string;
  sort?: 'newest' | 'trending' | 'rating' | 'name' | 'github_stars';
  page?: number;
  limit?: number;
  minRating?: number;
  maxRating?: number;
  tags?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategoryCount {
  name: string;
  count: number;
}

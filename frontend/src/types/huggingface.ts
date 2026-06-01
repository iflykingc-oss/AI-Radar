/**
 * Hugging Face Model interface representing a normalized model from HF Trending API.
 */
export interface HuggingFaceModel {
  id: string;
  name: string;
  author: string;
  description: string;
  url: string;
  likes: number;
  trendingScore: number;
  tags: string[];
  lastModified: string;
  source: 'huggingface' | 'mock';
}

/**
 * Raw model structure returned by the Hugging Face API.
 */
export interface HuggingFaceApiModel {
  _id: string;
  id: string;
  author: string;
  likes: number;
  trendingScore?: number;
  tags?: string[];
  pipeline_tag?: string;
  lastModified: string;
  description?: string;
  cardData?: {
    language?: string | string[];
    license?: string;
    dataset?: string;
  };
}

/**
 * API response shape for the Hugging Face source endpoint.
 */
export interface HuggingFaceApiResponse {
  models: HuggingFaceModel[];
  total: number;
  fetchedAt: string;
  source?: 'huggingface' | 'mock';
}

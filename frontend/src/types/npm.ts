/**
 * NPM Package interface representing a normalized AI package from npms.io search.
 */
export interface NpmPackage {
  id: string;
  name: string;
  description: string;
  url: string;
  version: string;
  score: number;
  downloads: number;
  author: string;
  source: 'npm' | 'mock';
}

/**
 * Raw package structure returned by the npms.io API.
 */
export interface NpmApiPackage {
  package: {
    name: string;
    description: string;
    version: string;
    links?: {
      npm?: string;
      homepage?: string;
      repository?: string;
    };
    date?: string;
    author?: {
      name?: string;
      email?: string;
      username?: string;
    } | string;
    keywords?: string[];
    publisher?: {
      username: string;
      email: string;
    };
    maintainers?: {
      username: string;
      email: string;
    }[];
  };
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
  searchScore: number;
}

/**
 * Raw response structure from the npms.io search API.
 */
export interface NpmApiResponse {
  total: number;
  results: NpmApiPackage[];
}

/**
 * API response shape for the npm source endpoint.
 */
export interface NpmApiEndpointResponse {
  packages: NpmPackage[];
  total: number;
  fetchedAt: string;
  source?: 'npm' | 'mock';
}

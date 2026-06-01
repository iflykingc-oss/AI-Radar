import type { MockProduct } from './mock-data';
import { getProductById } from './mock-data';

export interface MockWatchlistItem {
  id: string;
  product_id: string;
  product: MockProduct;
  added_at: string;
  notes?: string;
  alert_enabled: boolean;
}

export const mockWatchlistItems: MockWatchlistItem[] = [
  {
    id: 'wl-001',
    product_id: 'prod-010',
    product: getProductById('prod-010')!,
    added_at: '2025-03-10T14:30:00Z',
    notes: 'Most promising AI IDE for our dev team.',
    alert_enabled: true,
  },
  {
    id: 'wl-002',
    product_id: 'prod-002',
    product: getProductById('prod-002')!,
    added_at: '2025-03-08T09:15:00Z',
    notes: 'Best for code review and complex reasoning.',
    alert_enabled: true,
  },
  {
    id: 'wl-003',
    product_id: 'prod-040',
    product: getProductById('prod-040')!,
    added_at: '2025-03-05T16:45:00Z',
    notes: 'Great for prototyping UI components.',
    alert_enabled: false,
  },
  {
    id: 'wl-004',
    product_id: 'prod-041',
    product: getProductById('prod-041')!,
    added_at: '2025-03-01T11:00:00Z',
    notes: 'Full-stack app builder to watch closely.',
    alert_enabled: true,
  },
  {
    id: 'wl-005',
    product_id: 'prod-132',
    product: getProductById('prod-132')!,
    added_at: '2025-02-25T08:30:00Z',
    notes: 'Autonomous software engineer - potential game changer.',
    alert_enabled: true,
  },
  {
    id: 'wl-006',
    product_id: 'prod-139',
    product: getProductById('prod-139')!,
    added_at: '2025-02-20T13:00:00Z',
    notes: 'Best local LLM runner.',
    alert_enabled: false,
  },
  {
    id: 'wl-007',
    product_id: 'prod-149',
    product: getProductById('prod-149')!,
    added_at: '2025-02-15T10:30:00Z',
    notes: 'Great for no-code LLM app building.',
    alert_enabled: true,
  },
  {
    id: 'wl-008',
    product_id: 'prod-004',
    product: getProductById('prod-004')!,
    added_at: '2025-02-10T15:00:00Z',
    notes: 'Industry leading video generation.',
    alert_enabled: true,
  },
  {
    id: 'wl-009',
    product_id: 'prod-115',
    product: getProductById('prod-115')!,
    added_at: '2025-02-05T09:00:00Z',
    notes: 'Best open-source image model.',
    alert_enabled: false,
  },
  {
    id: 'wl-010',
    product_id: 'prod-028',
    product: getProductById('prod-028')!,
    added_at: '2025-02-01T14:00:00Z',
    notes: 'Essential multi-model router.',
    alert_enabled: true,
  },
  {
    id: 'wl-011',
    product_id: 'prod-029',
    product: getProductById('prod-029')!,
    added_at: '2025-01-28T11:00:00Z',
    notes: 'Best AI search for research.',
    alert_enabled: true,
  },
  {
    id: 'wl-012',
    product_id: 'prod-108',
    product: getProductById('prod-108')!,
    added_at: '2025-01-20T16:00:00Z',
    notes: 'Leading AI music generation.',
    alert_enabled: false,
  },
  {
    id: 'wl-013',
    product_id: 'prod-134',
    product: getProductById('prod-134')!,
    added_at: '2025-01-15T10:00:00Z',
    notes: 'Best multi-agent framework.',
    alert_enabled: true,
  },
  {
    id: 'wl-014',
    product_id: 'prod-198',
    product: getProductById('prod-198')!,
    added_at: '2025-01-10T08:00:00Z',
    notes: 'AI legal assistant for law firms.',
    alert_enabled: true,
  },
  {
    id: 'wl-015',
    product_id: 'prod-339',
    product: getProductById('prod-339')!,
    added_at: '2025-01-05T12:00:00Z',
    notes: 'Great automation with AI capabilities.',
    alert_enabled: false,
  },
  {
    id: 'wl-016',
    product_id: 'prod-344',
    product: getProductById('prod-344')!,
    added_at: '2024-12-28T09:30:00Z',
    notes: 'Open-source LLM tracing and evaluation.',
    alert_enabled: true,
  },
  {
    id: 'wl-017',
    product_id: 'prod-122',
    product: getProductById('prod-122')!,
    added_at: '2024-12-20T14:00:00Z',
    notes: 'High-quality video generation alternative.',
    alert_enabled: false,
  },
  {
    id: 'wl-018',
    product_id: 'prod-156',
    product: getProductById('prod-156')!,
    added_at: '2024-12-15T11:00:00Z',
    notes: 'Developer platform for AI voice assistants.',
    alert_enabled: true,
  },
  {
    id: 'wl-019',
    product_id: 'prod-042',
    product: getProductById('prod-042')!,
    added_at: '2024-12-10T16:00:00Z',
    notes: 'Full-stack app builder with Supabase.',
    alert_enabled: true,
  },
  {
    id: 'wl-020',
    product_id: 'prod-018',
    product: getProductById('prod-018')!,
    added_at: '2024-12-05T10:00:00Z',
    notes: 'Best voice synthesis platform.',
    alert_enabled: false,
  },
];

export const getWatchlist = (): MockWatchlistItem[] => mockWatchlistItems;

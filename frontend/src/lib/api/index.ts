/**
 * Barrel export for Phase E API hooks and shared types.
 *
 * Consumers should prefer importing from `@/lib/api` rather than the
 * individual files, e.g.:
 *   import { useLaunches, useTrends, useCategories } from '@/lib/api';
 */
export * from './types';
export * from './launches';
export * from './trends';
export * from './categories';
export * from './newsletter';

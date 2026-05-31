/**
 * Mock data configuration.
 *
 * Set `USE_MOCK_DATA` to `true` to route all data fetching
 * to the mock API layer instead of real Supabase calls.
 *
 * When switching to real data, set this to `false` and
 * update the data-access layer to call Supabase directly.
 */
export const USE_MOCK_DATA = false;

/**
 * Mock response delay in milliseconds.
 * Simulates network latency for a more realistic dev experience.
 * Set to `0` for instant responses.
 */
export const MOCK_DELAY_MS = 200;

/**
 * CategoryGrid — Server Component for the mature categories grid.
 *
 * Renders a responsive grid of `<CategoryCard>` instances from a list
 * of `CategoryItem`. The grid is intentionally a Server Component —
 * the data is already known at render time, so we avoid shipping
 * client JS for a static layout.
 *
 * Behaviour:
 *  - `items` is filtered against the active `layer` and pricing
 *    filters at the **page** level (the grid is dumb).
 *  - If `items` is empty, we render `DiscoverEmptyState` instead so
 *    the page never presents a blank grid.
 */

import * as React from 'react';
import { CategoryCard } from './CategoryCard';
import { DiscoverEmptyState } from './DiscoverEmptyState';
import type { CategoryItem } from '@/lib/api/types';

export interface CategoryGridProps {
  items: CategoryItem[];
  /** Optional className for the grid wrapper. */
  className?: string;
}

export function CategoryGrid({ items, className }: CategoryGridProps) {
  if (items.length === 0) {
    return <DiscoverEmptyState />;
  }

  return (
    <div
      role="list"
      aria-label="Mature categories"
      data-testid="category-grid"
      className={
        'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ' +
        (className ?? '')
      }
    >
      {items.map((item) => (
        <div role="listitem" key={item.id}>
          <CategoryCard {...item} />
        </div>
      ))}
    </div>
  );
}

export default CategoryGrid;

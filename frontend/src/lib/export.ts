import type { Database } from '@/lib/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

/**
 * Escape a field value for CSV: wrap in quotes if it contains comma, newline, or double-quote.
 * Double any existing double-quotes per RFC 4180.
 */
function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format a nullable value: return 'N/A' when null/undefined/empty.
 */
function fmt(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'N/A';
  return String(value);
}

/**
 * Export product comparison data as a CSV file and trigger browser download.
 *
 * CSV layout:
 * - Row 1: headers (Dimension, then each product name)
 * - Row 2+: each comparison dimension (name, category, description, pricing, confidence, etc.)
 *
 * UTF-8 BOM (\ufeff) is prepended so Excel opens the file with correct encoding.
 */
export function exportToCSV(products: Product[]): void {
  if (products.length === 0) return;

  // Dimension definitions: [i18n key or label, extractor function]
  const dimensions: { label: string; getValue: (p: Product) => string }[] = [
    { label: 'Name', getValue: (p) => fmt(p.name) },
    { label: 'Category', getValue: (p) => fmt(p.category) },
    { label: 'Description', getValue: (p) => fmt(p.description) },
    { label: 'Pricing', getValue: (p) => fmt(p.pricing_model) },
    {
      label: 'Confidence Score',
      getValue: (p) => (p.confidence_score != null ? `${p.confidence_score}%` : 'N/A'),
    },
    { label: 'Status', getValue: (p) => fmt(p.availability_status) },
    {
      label: 'Tech Stack',
      getValue: (p) => (p.tech_stack && p.tech_stack.length > 0 ? p.tech_stack.join('; ') : 'N/A'),
    },
    {
      label: 'GitHub Stars',
      getValue: (p) => (p.github_stars != null ? String(p.github_stars) : 'N/A'),
    },
    {
      label: 'Weekly Growth',
      getValue: (p) =>
        p.weekly_growth_rate != null ? `${p.weekly_growth_rate}%` : 'N/A',
    },
    { label: 'Launch Date', getValue: (p) => fmt(p.launch_date) },
    {
      label: 'Last Updated',
      getValue: (p) =>
        p.last_seen ? new Date(p.last_seen).toLocaleDateString() : 'N/A',
    },
  ];

  // Build header row: "Dimension", then each product name
  const headerRow = ['Dimension', ...products.map((p) => p.name)];

  // Build data rows
  const dataRows = dimensions.map((dim) => {
    const values = [dim.label, ...products.map((p) => dim.getValue(p))];
    return values.map(csvEscape);
  });

  // Assemble CSV content with UTF-8 BOM
  const csvContent =
    '\ufeff' +
    [headerRow.map(csvEscape), ...dataRows].map((row) => row.join(',')).join('\n');

  // Create Blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;

  // Filename: ai-radar-comparison-YYYY-MM-DD.csv
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  link.download = `ai-radar-comparison-${today}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

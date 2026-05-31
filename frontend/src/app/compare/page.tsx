'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, X, Download, Link, Highlighter } from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import { useTranslations } from 'next-intl';
import { exportToCSV } from '@/lib/export';

type Product = Database['public']['Tables']['products']['Row'];

const PRODUCT_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

const RADAR_DIMENSIONS = [
  { key: 'confidence_score', labelKey: 'radar_confidence', normalize: (p: Product) => p.confidence_score },
  { key: 'github_stars', labelKey: 'radar_github_stars', normalize: (p: Product) => Math.min(((p.github_stars ?? 0) / 10000) * 100, 100) },
  { key: 'weekly_growth_rate', labelKey: 'radar_growth_rate', normalize: (p: Product) => Math.min(p.weekly_growth_rate ?? 0, 100) },
];

function RadarChart({ products, dimensions, t, width = 500, height = 400 }: {
  products: { name: string; color: string; values: number[] }[];
  dimensions: string[];
  t: (key: string) => string;
  width?: number;
  height?: number;
}) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 40;
  const levels = 5;
  const angleStep = (2 * Math.PI) / dimensions.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[400px]">
      {Array.from({ length: levels }, (_, i) => (
        <circle key={i} cx={cx} cy={cy} r={(radius / levels) * (i + 1)} fill="none" stroke="hsl(var(--muted))" strokeWidth="1" />
      ))}
      {dimensions.map((dim, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const labelX = cx + Math.cos(angle) * (radius + 20);
        const labelY = cy + Math.sin(angle) * (radius + 20);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(var(--muted))" strokeWidth="1" />
            <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" className="text-xs fill-foreground">{dim}</text>
          </g>
        );
      })}
      {products.map((product, pi) => {
        const points = product.values.map((v, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const r = (v / 100) * radius;
          return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
        }).join(' ');
        return <polygon key={pi} points={points} fill={product.color} fillOpacity="0.15" stroke={product.color} strokeWidth="2" />;
      })}
      {/* Legend */}
      {products.map((product, pi) => {
        const legendX = 10;
        const legendY = 10 + pi * 20;
        return (
          <g key={pi}>
            <circle cx={legendX} cy={legendY} r={4} fill={product.color} />
            <text x={legendX + 12} y={legendY} dominantBaseline="middle" className="text-xs fill-foreground">{product.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ComparePage() {
  const t = useTranslations('compare');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load products from URL params on mount
  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      setIsLoading(true);
      const idList = ids.split(',');
      fetch(`/api/products?limit=200`)
        .then((res) => res.json())
        .then((data) => {
          const allProducts = data.products || [];
          const matched = allProducts.filter((p: Product) => idList.includes(p.id));
          // Preserve the order from URL
          const ordered = idList
            .map((id) => matched.find((p: Product) => p.id === id))
            .filter(Boolean) as Product[];
          setProducts(ordered);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, []);

  const addProduct = async (product: Product) => {
    if (products.length >= 5) return;
    setProducts((prev) => [...prev, product]);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    updateShareUrl([...products, product]);
  };

  const removeProduct = (id: string) => {
    const newProducts = products.filter((p) => p.id !== id);
    setProducts(newProducts);
    updateShareUrl(newProducts);
  };

  const updateShareUrl = (currentProducts: Product[]) => {
    const ids = currentProducts.map((p) => p.id).join(',');
    const url = ids ? `/compare?ids=${ids}` : '/compare';
    router.replace(url, { scroll: false });
  };

  const handleExport = () => {
    exportToCSV(products);
  };

  const handleCopyLink = async () => {
    const ids = products.map((p) => p.id).join(',');
    const url = `${window.location.origin}/compare?ids=${ids}`;
    try {
      await navigator.clipboard.writeText(url);
      // Could show a toast here
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.products || []);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Compute best/worst values for diff highlighting
  const getDiffClass = (dimKey: string, value: number, productValues: number[]) => {
    if (!highlightDiffs || productValues.length < 2) return '';
    const valid = productValues.filter((v) => !isNaN(v));
    if (valid.length === 0) return '';
    const best = Math.max(...valid);
    const worst = Math.min(...valid);
    if (value === best && productValues.length > 1) return 'bg-green-100 dark:bg-green-900/30';
    if (value === worst && valid.length > 2) return 'bg-red-50 dark:bg-red-900/20';
    return '';
  };

  const compareDimensions = [
    'dimension_name',
    'dimension_category',
    'dimension_description',
    'dimension_pricing',
    'dimension_confidence',
    'dimension_status',
    'dimension_tech_stack',
    'dimension_github_stars',
    'dimension_launch_date',
    'dimension_last_updated',
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" label="Loading comparison..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
            <Search className="mr-2 h-4 w-4" /> {t('add_product')}
          </Button>
          {products.length >= 2 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> {t('export')}
            </Button>
          )}
          {products.length >= 2 && (
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Link className="mr-2 h-4 w-4" /> {t('copy_link')}
          </Button>
          )}
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('search_modal_title') || t('search_products')}</h3>
              <button onClick={() => setSearchOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <Input
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
            {isSearching && (
              <div className="mt-4 py-4 flex justify-center">
                <LoadingSpinner size="sm" label="Searching..." />
              </div>
            )}
            {!isSearching && searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {searchResults
                  .filter((p) => !products.find((sp) => sp.id === p.id))
                  .map((p) => (
                    <button
                      key={p.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                      onClick={() => addProduct(p)}
                    >
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        {p.logo_url ? (
                          <img src={p.logo_url} alt={p.name} className="h-8 w-8 object-cover rounded" />
                        ) : (
                          <span className="font-bold text-muted-foreground">{p.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.category}</p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Radar Chart */}
      {products.length >= 2 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Radar Comparison</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <RadarChart
              t={t}
              products={products.map((p, i) => ({
                name: p.name,
                color: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
                values: RADAR_DIMENSIONS.map((d) => d.normalize(p)),
              }))}
              dimensions={RADAR_DIMENSIONS.map((d) => t(d.labelKey) || d.labelKey)}
            />
          </CardContent>
        </Card>
      )}

      {/* Diff Highlight Toggle */}
      {products.length >= 2 && (
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant={highlightDiffs ? "default" : "outline"}
            size="sm"
            onClick={() => setHighlightDiffs(!highlightDiffs)}
          >
            <Highlighter className="mr-2 h-4 w-4" /> {highlightDiffs ? 'Diffs Highlighted' : 'Highlight Differences'}
          </Button>
        </div>
      )}

      {/* Comparison Table */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              {t('empty_desc')}
            </p>
            <Button onClick={() => setSearchOpen(true)}>
              <Search className="mr-2 h-4 w-4" /> {t('empty_btn') || t('add_product')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border-b bg-muted/50 min-w-[160px]">{t('dimension_header') || 'Dimension'}</th>
                {products.map((p) => (
                  <th key={p.id} className="p-4 border-b bg-muted/50 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          {p.logo_url ? (
                            <img src={p.logo_url} alt={p.name} className="h-6 w-6 object-cover rounded" />
                          ) : (
                            <span className="text-sm font-bold">{p.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <button onClick={() => removeProduct(p.id)}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareDimensions.map((dimKey) => {
                // Collect numeric values for diff highlighting
                const numericValues: number[] = [];
                if (dimKey === 'dimension_confidence') {
                  products.forEach((p) => numericValues.push(p.confidence_score ?? 0));
                } else if (dimKey === 'dimension_github_stars') {
                  products.forEach((p) => numericValues.push(p.github_stars ?? 0));
                }

                return (
                  <tr key={dimKey} className="border-b hover:bg-muted/30">
                    <td className="p-4 font-medium">{t(dimKey)}</td>
                    {products.map((p, pi) => {
                      let cellClass = '';
                      if (dimKey === 'dimension_confidence') {
                        cellClass = getDiffClass(dimKey, p.confidence_score ?? 0, numericValues);
                      } else if (dimKey === 'dimension_github_stars') {
                        cellClass = getDiffClass(dimKey, p.github_stars ?? 0, numericValues);
                      }

                      return (
                        <td key={p.id} className={`p-4 ${cellClass}`}>
                          {dimKey === 'dimension_name' && <span className="font-medium">{p.name}</span>}
                          {dimKey === 'dimension_category' && <Badge variant="outline">{p.category}</Badge>}
                          {dimKey === 'dimension_description' && (
                            <p className="text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                          )}
                          {dimKey === 'dimension_pricing' && (
                            <Badge variant="secondary">{p.pricing_model}</Badge>
                          )}
                          {dimKey === 'dimension_confidence' && (
                            <span className="font-semibold text-success">{p.confidence_score}%</span>
                          )}
                          {dimKey === 'dimension_status' && (
                            <Badge variant={p.availability_status === 'active' ? 'success' : 'warning'}>
                              {p.availability_status}
                            </Badge>
                          )}
                          {dimKey === 'dimension_tech_stack' && (
                            <div className="flex flex-wrap gap-1">
                              {p.tech_stack?.slice(0, 3).map((tech: string) => (
                                <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                              ))}
                            </div>
                          )}
                          {dimKey === 'dimension_github_stars' && <span>{p.github_stars ?? t('na')}</span>}
                          {dimKey === 'dimension_launch_date' && <span>{p.launch_date ?? t('na')}</span>}
                          {dimKey === 'dimension_last_updated' && <span>{p.last_seen ? new Date(p.last_seen).toLocaleDateString() : t('na')}</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

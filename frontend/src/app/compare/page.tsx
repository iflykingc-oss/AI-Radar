'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, X, Download } from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import { useTranslations } from 'next-intl';
import { exportToCSV } from '@/lib/export';

type Product = Database['public']['Tables']['products']['Row'];

export default function ComparePage() {
  const t = useTranslations('compare');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const addProduct = async (product: Product) => {
    if (products.length >= 5) return;
    setProducts((prev) => [...prev, product]);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleExport = () => {
    exportToCSV(products);
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
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('search_modal_title')}</h3>
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

      {/* Comparison Table */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              {t('empty_desc')}
            </p>
            <Button onClick={() => setSearchOpen(true)}>
              <Search className="mr-2 h-4 w-4" /> {t('empty_btn')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border-b bg-muted/50 min-w-[160px]">{t('dimension_header')}</th>
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
              {compareDimensions.map((dimKey) => (
                <tr key={dimKey} className="border-b hover:bg-muted/30">
                  <td className="p-4 font-medium">{t(dimKey)}</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4">
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
                      {dimKey === 'dimension_github_stars' && <span>{p.github_stars || 'N/A'}</span>}
                      {dimKey === 'dimension_launch_date' && <span>{p.launch_date || 'N/A'}</span>}
                      {dimKey === 'dimension_last_updated' && <span>{p.last_seen ? new Date(p.last_seen).toLocaleDateString() : 'N/A'}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

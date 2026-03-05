import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, MapPin, History, FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  title: string;
  type: 'place' | 'trip' | 'blog';
  description?: string;
  icon: typeof MapPin;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();

  // Örnek arama sonuçları (gerçek uygulamada API'den gelecek)
  const mockResults: SearchResult[] = [
    { id: '1', title: 'Göreme Açık Hava Müzesi', type: 'place', description: 'UNESCO Dünya Mirası', icon: MapPin },
    { id: '2', title: 'Kapadokya 3 Günlük Gezi', type: 'trip', description: 'Kayıtlı rotanız', icon: History },
    { id: '3', title: 'Kapadokya Gezi Rehberi', type: 'blog', description: 'Blog yazısı', icon: FileText },
  ];

  useEffect(() => {
    // Yerel depolamadan son aramaları yükle
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (query.trim()) {
      // Arama sonuçlarını filtrele
      const filtered = mockResults.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    // Son aramalara ekle
    const updated = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Sonuca göre yönlendir
    if (result.type === 'trip') {
      navigate(`/trip/${result.id}`);
    } else if (result.type === 'place') {
      navigate(`/explore?place=${result.id}`);
    }
    
    onOpenChange(false);
    setQuery('');
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mekan, rota, rehber ara..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {!query && recentSearches.length > 0 && (
            <div className="px-2 py-3">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Son Aramalar
              </h3>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearch(search)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors text-sm"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && results.length > 0 && (
            <div className="space-y-1">
              {results.map((result) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{result.title}</p>
                      {result.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{result.description}</p>
                      )}
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full shrink-0",
                      result.type === 'place' && "bg-primary/10 text-primary",
                      result.type === 'trip' && "bg-secondary/10 text-secondary",
                      result.type === 'blog' && "bg-muted text-muted-foreground"
                    )}>
                      {result.type === 'place' && 'Mekan'}
                      {result.type === 'trip' && 'Rota'}
                      {result.type === 'blog' && 'Blog'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">Sonuç bulunamadı</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

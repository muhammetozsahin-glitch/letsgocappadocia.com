import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Star, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Place } from '@/db/api';
import api from '@/db/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PlaceSearchProps {
  onPlaceSelect: (place: Place) => void;
  className?: string;
  placeholder?: string;
}

export function PlaceSearch({ onPlaceSelect, className, placeholder = "Yeni bir durak ara..." }: PlaceSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  // ── In-memory cache'ler — session boyunca aynı sorgu/yer için API'ye gitme ──
  const predictionsCache = useRef<Map<string, google.maps.places.AutocompletePrediction[]>>(new Map());
  const detailsCache = useRef<Map<string, Place>>(new Map());

  useEffect(() => {
    if (window.google && !autocompleteService.current) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      const dummyElement = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(dummyElement);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (!value || !autocompleteService.current) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const cacheKey = value.toLowerCase().trim();

    // 1. Autocomplete cache'te var mı?
    const cached = predictionsCache.current.get(cacheKey);
    if (cached) {
      setResults(cached);
      setIsOpen(true);
      return;
    }

    setLoading(true);
    autocompleteService.current.getPlacePredictions(
      { 
        input: value,
        locationBias: { lat: 38.6431, lng: 34.8347, radius: 50000 },
        componentRestrictions: { country: 'tr' }
      },
      (predictions, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          // 2. Sonuçları cache'e yaz
          predictionsCache.current.set(cacheKey, predictions);
          setResults(predictions);
          setIsOpen(true);
        } else {
          setResults([]);
          setIsOpen(false);
        }
      }
    );
  };

  const handleSelectResult = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    // 1. Details cache'te var mı?
    const cachedPlace = detailsCache.current.get(prediction.place_id);
    if (cachedPlace) {
      onPlaceSelect(cachedPlace);
      setQuery('');
      setIsOpen(false);
      setResults([]);
      return;
    }

    setLoading(true);
    placesService.current.getDetails(
      { 
        placeId: prediction.place_id,
        fields: ['name', 'formatted_address', 'geometry', 'rating', 'photos', 'types']
      },
      (place, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
          // photo_reference: doğrudan Google URL yerine Edge Function proxy URL kullan
          let photoRef: string | undefined;
          const rawPhotoUrl = place.photos?.[0]?.getUrl({ maxWidth: 800 });
          if (rawPhotoUrl) {
            photoRef = api.extractPhotoReference(rawPhotoUrl) || rawPhotoUrl;
          }

          const newPlace: Place = {
            place_id: prediction.place_id,
            name: place.name || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            rating: place.rating,
            formatted_address: place.formatted_address || '',
            photo_reference: photoRef,
            description: place.types?.join(', ') || 'Turistik Nokta',
            category: (place.types?.[0] || 'point_of_interest').replace(/_/g, ' '),
            estimated_duration_minutes: 60,
            start_time: '10:00',
            end_time: '11:00',
          };

          // 2. Details cache'e yaz — aynı yer tekrar seçilirse API'ye gitme
          detailsCache.current.set(prediction.place_id, newPlace);

          onPlaceSelect(newPlace);
          setQuery('');
          setIsOpen(false);
          setResults([]);
        }
      }
    );
  };

  return (
    <div ref={containerRef} className={cn("relative z-50", className)}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
        </div>
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="h-16 pl-14 pr-6 rounded-2xl bg-white dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-luxury text-lg font-medium italic"
        />
        {loading && (
          <div className="absolute inset-y-0 right-6 flex items-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-secondary border border-gray-100 dark:border-white/10 rounded-[2rem] shadow-3xl overflow-hidden z-50"
          >
            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {results.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelectResult(result)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-primary/5 rounded-2xl transition-luxury text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-100 dark:border-white/10 group-hover:bg-primary group-hover:text-white transition-luxury shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate">
                      {result.structured_formatting.main_text}
                    </div>
                    <div className="text-sm text-gray-400 font-medium italic truncate">
                      {result.structured_formatting.secondary_text}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-luxury">
                    <Plus className="h-5 w-5 text-primary group-hover:text-white" />
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 text-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Google Places Tarafından Desteklenmektedir
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
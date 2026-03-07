import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, Plus, Star, MapPin, X, Loader2,
  Compass, Landmark, Hotel, UtensilsCrossed, Ticket,
  Heart, Clock, ChevronLeft, ChevronRight, Filter,
  Sparkles, TrendingUp, Navigation, Coffee, Camera,
  Mountain, ShoppingBag, TreePine, Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Place } from '@/db/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
interface DiscoverPlace {
  place_id: string;
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
  rating?: number;
  user_ratings_total?: number;
  photo_url?: string;
  photos?: google.maps.places.PlacePhoto[];
  category: string;
  price_level?: number;
  is_open_now?: boolean;
  types?: string[];
}

interface AddToTripPanelProps {
  onAddPlace: (place: Place) => void;
  existingPlaceIds?: string[];
  isOpen: boolean;
  onClose: () => void;
}

// ────────────────────────────────────────────────────────────────────────────
// Category Tabs Config
// ────────────────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'for_you',
    label: 'Senin İçin',
    icon: Sparkles,
    query: 'popüler turistik yerler Kapadokya',
    types: ['tourist_attraction', 'point_of_interest'],
  },
  {
    id: 'things_to_do',
    label: 'Gezilecek',
    icon: Compass,
    query: 'gezilecek yerler aktiviteler Kapadokya',
    types: ['tourist_attraction', 'museum', 'park', 'amusement_park'],
  },
  {
    id: 'landmarks',
    label: 'Yerler',
    icon: Landmark,
    query: 'tarihi yerler müzeler Kapadokya',
    types: ['museum', 'church', 'city_hall', 'point_of_interest'],
  },
  {
    id: 'stays',
    label: 'Konaklama',
    icon: Hotel,
    query: 'oteller mağara oteli Kapadokya',
    types: ['lodging', 'hotel'],
  },
  {
    id: 'restaurants',
    label: 'Restoranlar',
    icon: UtensilsCrossed,
    query: 'restoranlar kafeler Kapadokya',
    types: ['restaurant', 'cafe', 'bakery', 'bar'],
  },
] as const;

type TabId = typeof TABS[number]['id'];

// ────────────────────────────────────────────────────────────────────────────
// Sub-filter chips per tab
// ────────────────────────────────────────────────────────────────────────────
const TAB_FILTERS: Record<TabId, { id: string; label: string; icon: any; query: string }[]> = {
  for_you: [
    { id: 'popular', label: 'Popüler', icon: TrendingUp, query: 'en popüler yerler Kapadokya' },
    { id: 'photo', label: 'Fotoğraf Noktaları', icon: Camera, query: 'en iyi fotoğraf noktaları manzara Kapadokya' },
    { id: 'unique', label: 'Eşsiz Deneyimler', icon: Sparkles, query: 'eşsiz deneyimler balon turu Kapadokya' },
  ],
  things_to_do: [
    { id: 'outdoor', label: 'Doğa & Vadiler', icon: Mountain, query: 'vadiler doğa yürüyüşü Kapadokya' },
    { id: 'culture', label: 'Kültür & Tarih', icon: Palette, query: 'kültürel yerler tarih Kapadokya' },
    { id: 'adventure', label: 'Macera', icon: Navigation, query: 'macera ATV at binme Kapadokya' },
    { id: 'shopping', label: 'Alışveriş', icon: ShoppingBag, query: 'alışveriş çömlekçilik Avanos Kapadokya' },
  ],
  landmarks: [
    { id: 'underground', label: 'Yeraltı Şehirleri', icon: Mountain, query: 'yeraltı şehri Derinkuyu Kaymaklı' },
    { id: 'museum', label: 'Müzeler', icon: Landmark, query: 'açık hava müzesi Göreme Zelve' },
    { id: 'castle', label: 'Kaleler', icon: Landmark, query: 'kale Uçhisar Ortahisar Kapadokya' },
    { id: 'valley', label: 'Vadiler', icon: TreePine, query: 'vadi Güvercinlik Aşk Vadisi Kapadokya' },
  ],
  stays: [
    { id: 'cave', label: 'Mağara Otelleri', icon: Hotel, query: 'mağara otel cave hotel Kapadokya' },
    { id: 'luxury', label: 'Lüks', icon: Star, query: 'lüks otel 5 yıldız Kapadokya' },
    { id: 'boutique', label: 'Butik', icon: Heart, query: 'butik otel Göreme Ürgüp' },
  ],
  restaurants: [
    { id: 'local', label: 'Yerel Lezzetler', icon: UtensilsCrossed, query: 'geleneksel restoran testi kebabı Kapadokya' },
    { id: 'cafe', label: 'Kafeler', icon: Coffee, query: 'kafe kahve Göreme Kapadokya' },
    { id: 'fine', label: 'Fine Dining', icon: Star, query: 'fine dining lüks restoran Kapadokya' },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// Helper: Category label from Google types
// ────────────────────────────────────────────────────────────────────────────
function getCategoryLabel(types?: string[]): string {
  if (!types?.length) return 'Turistik Yer';
  const map: Record<string, string> = {
    tourist_attraction: 'Turistik Yer',
    museum: 'Müze',
    restaurant: 'Restoran',
    cafe: 'Kafe',
    lodging: 'Otel',
    hotel: 'Otel',
    park: 'Park',
    church: 'Kilise',
    bakery: 'Fırın',
    bar: 'Bar',
    amusement_park: 'Eğlence',
    natural_feature: 'Doğal Alan',
    point_of_interest: 'Gezilecek Yer',
    establishment: 'İşletme',
  };
  for (const t of types) {
    if (map[t]) return map[t];
  }
  return 'Turistik Yer';
}

function getPriceLabel(level?: number): string | null {
  if (level === undefined || level === null) return null;
  return '₺'.repeat(level || 1);
}

// ────────────────────────────────────────────────────────────────────────────
// PlaceCard
// ────────────────────────────────────────────────────────────────────────────
function PlaceCard({
  place,
  onAdd,
  isAdded,
}: {
  place: DiscoverPlace;
  onAdd: () => void;
  isAdded: boolean;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  const photoUrls = useMemo(() => {
    if (place.photos && place.photos.length > 0) {
      return place.photos.slice(0, 4).map(p => p.getUrl({ maxWidth: 400, maxHeight: 300 }));
    }
    if (place.photo_url) return [place.photo_url];
    return ['https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80'];
  }, [place.photos, place.photo_url]);

  const priceLabel = getPriceLabel(place.price_level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300">
        {/* Photo */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          )}
          <img
            src={imgError
              ? 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80'
              : photoUrls[currentPhoto]}
            alt={place.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true); }}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Photo dots */}
          {photoUrls.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {photoUrls.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentPhoto(i); setImgLoaded(false); setImgError(false); }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === currentPhoto ? "bg-white w-3" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}

          {/* Add button overlay */}
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            disabled={isAdded}
            className={cn(
              "absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-lg backdrop-blur-sm",
              isAdded
                ? "bg-green-500 text-white cursor-default"
                : "bg-white/90 text-gray-800 hover:bg-white hover:shadow-xl active:scale-95"
            )}
          >
            {isAdded ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Eklendi
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                Ekle
              </>
            )}
          </button>

          {/* Open now badge */}
          {place.is_open_now !== undefined && (
            <div className={cn(
              "absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-sm",
              place.is_open_now
                ? "bg-green-500/90 text-white"
                : "bg-red-500/90 text-white"
            )}>
              {place.is_open_now ? 'Açık' : 'Kapalı'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
              {place.name}
            </h4>
            {place.rating && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{place.rating}</span>
                {place.user_ratings_total && (
                  <span className="text-[10px] text-gray-400">({place.user_ratings_total >= 1000 ? `${(place.user_ratings_total / 1000).toFixed(1)}k` : place.user_ratings_total})</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
              <MapPin className="w-2.5 h-2.5" />
              {getCategoryLabel(place.types)}
            </span>
            {priceLabel && (
              <span className="text-[10px] font-bold text-green-600">{priceLabel}</span>
            )}
          </div>

          <p className="text-[11px] text-gray-400 truncate">
            {place.formatted_address}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────────────
export function AddToTripPanel({
  onAddPlace,
  existingPlaceIds = [],
  isOpen,
  onClose,
}: AddToTripPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('for_you');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<DiscoverPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set(existingPlaceIds));

  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cappadocia center for biasing
  const CAPPADOCIA_CENTER = useMemo(() => {
    if (!window.google) return null;
    return new google.maps.LatLng(38.6431, 34.8347);
  }, []);

  // Keep addedIds in sync
  useEffect(() => {
    setAddedIds(new Set(existingPlaceIds));
  }, [existingPlaceIds]);

  // Init Places service
  useEffect(() => {
    if (window.google && !placesServiceRef.current) {
      const div = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(div);
    }
  }, [isOpen]);

  // Fetch places for current tab
  const fetchPlaces = useCallback((query: string, types?: string[]) => {
    if (!placesServiceRef.current || !CAPPADOCIA_CENTER) return;

    setLoading(true);
    setPlaces([]);

    const request: google.maps.places.TextSearchRequest = {
      query: query + ' Nevşehir Kapadokya',
      location: CAPPADOCIA_CENTER,
      radius: 50000,
    };

    placesServiceRef.current.textSearch(
      request,
      (results, status) => {
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const mapped: DiscoverPlace[] = results
            .filter(r => r.geometry?.location)
            .slice(0, 20)
            .map(r => ({
              place_id: r.place_id || '',
              name: r.name || '',
              formatted_address: r.formatted_address || '',
              lat: r.geometry!.location!.lat(),
              lng: r.geometry!.location!.lng(),
              rating: r.rating,
              user_ratings_total: r.user_ratings_total,
              photos: r.photos,
              photo_url: r.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }),
              category: getCategoryLabel(r.types),
              price_level: r.price_level,
              is_open_now: r.opening_hours?.isOpen?.(),
              types: r.types,
            }));
          setPlaces(mapped);
        }
      }
    );
  }, [CAPPADOCIA_CENTER]);

  // Tab change → fetch
  useEffect(() => {
    if (!isOpen) return;
    const tab = TABS.find(t => t.id === activeTab);
    if (tab) {
      setActiveFilter(null);
      setSearchQuery('');
      fetchPlaces(tab.query, tab.types as unknown as string[]);
    }
  }, [activeTab, isOpen, fetchPlaces]);

  // Filter change → fetch
  useEffect(() => {
    if (!isOpen || !activeFilter) return;
    const filters = TAB_FILTERS[activeTab];
    const filter = filters?.find(f => f.id === activeFilter);
    if (filter) {
      fetchPlaces(filter.query);
    }
  }, [activeFilter, isOpen, activeTab, fetchPlaces]);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) return;

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchPlaces(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, fetchPlaces]);

  // Handle adding place
  const handleAdd = useCallback((place: DiscoverPlace) => {
    const newPlace: Place = {
      place_id: place.place_id,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      rating: place.rating,
      formatted_address: place.formatted_address,
      photo_reference: place.photo_url || '',
      description: getCategoryLabel(place.types),
      category: getCategoryLabel(place.types),
      estimated_duration_minutes: place.types?.includes('restaurant') || place.types?.includes('cafe')
        ? 90
        : place.types?.includes('lodging')
          ? 0
          : 60,
      start_time: '10:00',
      end_time: '11:00',
    };

    onAddPlace(newPlace);
    setAddedIds(prev => new Set(prev).add(place.place_id));
  }, [onAddPlace]);

  const currentFilters = TAB_FILTERS[activeTab] || [];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="px-5 pt-5 pb-0 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Rotaya Ekle
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Kapadokya'daki yerleri keşfedin ve rotanıza ekleyin
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value) {
                    const tab = TABS.find(t => t.id === activeTab);
                    if (tab) fetchPlaces(tab.query);
                  }
                }}
                placeholder="Yer, restoran veya otel ara..."
                className="h-11 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    const tab = TABS.find(t => t.id === activeTab);
                    if (tab) fetchPlaces(tab.query);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300"
                >
                  <X className="h-3 w-3 text-gray-500" />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="relative">
              <div
                ref={tabScrollRef}
                className="flex gap-1 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1"
              >
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all shrink-0",
                        isActive
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-filters */}
            {currentFilters.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1">
                {currentFilters.map(filter => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(isActive ? null : filter.id)}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 border",
                        isActive
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                          : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Results ────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            {/* Loading */}
            {loading && (
              <div className="py-16 flex flex-col items-center gap-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-3 border-gray-100 border-t-orange-500 animate-spin" />
                </div>
                <p className="text-xs font-semibold text-gray-400">Yerler keşfediliyor...</p>
              </div>
            )}

            {/* Empty */}
            {!loading && places.length === 0 && (
              <div className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <Compass className="h-7 w-7 text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500">Sonuç bulunamadı</p>
                  <p className="text-xs text-gray-400 mt-1">Farklı bir arama terimi veya kategori deneyin</p>
                </div>
              </div>
            )}

            {/* Results Grid */}
            {!loading && places.length > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {places.map(place => (
                  <PlaceCard
                    key={place.place_id}
                    place={place}
                    onAdd={() => handleAdd(place)}
                    isAdded={addedIds.has(place.place_id)}
                  />
                ))}
              </div>
            )}

            {/* Footer */}
            {!loading && places.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Google Places tarafından desteklenmektedir
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
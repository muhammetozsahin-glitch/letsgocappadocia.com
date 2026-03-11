import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, Plus, Star, MapPin, X,
  Compass, Landmark, Hotel, UtensilsCrossed,
  Sparkles, TrendingUp, Navigation, Coffee, Camera,
  Mountain, ShoppingBag, TreePine, Palette, Heart,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Place, DiscoverPlace } from '@/db/api';
import api from '@/db/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ────────────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────────────
interface AddToTripPanelProps {
  onAddPlace: (place: Place) => void;
  existingPlaceIds?: string[];
  isOpen: boolean;
  onClose: () => void;
}

// ────────────────────────────────────────────────────────────────────────────
// Tab & Filter Config
// ────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'for_you',      label: 'Senin İçin',  icon: Sparkles,        query: 'popüler turistik yerler Kapadokya' },
  { id: 'things_to_do', label: 'Gezilecek',    icon: Compass,         query: 'gezilecek yerler aktiviteler Kapadokya' },
  { id: 'landmarks',    label: 'Yerler',       icon: Landmark,        query: 'tarihi yerler müzeler Kapadokya' },
  { id: 'stays',        label: 'Konaklama',    icon: Hotel,           query: 'oteller mağara oteli Kapadokya' },
  { id: 'restaurants',  label: 'Restoranlar',  icon: UtensilsCrossed, query: 'restoranlar kafeler Kapadokya' },
] as const;

type TabId = typeof TABS[number]['id'];

const TAB_FILTERS: Record<TabId, { id: string; label: string; icon: any; query: string }[]> = {
  for_you: [
    { id: 'popular', label: 'Popüler',           icon: TrendingUp, query: 'en popüler yerler Kapadokya' },
    { id: 'photo',   label: 'Fotoğraf Noktaları', icon: Camera,     query: 'en iyi fotoğraf noktaları manzara Kapadokya' },
    { id: 'unique',  label: 'Eşsiz Deneyimler',  icon: Sparkles,   query: 'eşsiz deneyimler balon turu Kapadokya' },
  ],
  things_to_do: [
    { id: 'outdoor',   label: 'Doğa & Vadiler', icon: Mountain,    query: 'vadiler doğa yürüyüşü Kapadokya' },
    { id: 'culture',   label: 'Kültür & Tarih',  icon: Palette,     query: 'kültürel yerler tarih Kapadokya' },
    { id: 'adventure', label: 'Macera',          icon: Navigation,  query: 'macera ATV at binme Kapadokya' },
    { id: 'shopping',  label: 'Alışveriş',       icon: ShoppingBag, query: 'alışveriş çömlekçilik Avanos Kapadokya' },
  ],
  landmarks: [
    { id: 'underground', label: 'Yeraltı Şehirleri', icon: Mountain, query: 'yeraltı şehri Derinkuyu Kaymaklı' },
    { id: 'museum',      label: 'Müzeler',           icon: Landmark, query: 'açık hava müzesi Göreme Zelve' },
    { id: 'castle',      label: 'Kaleler',            icon: Landmark, query: 'kale Uçhisar Ortahisar Kapadokya' },
    { id: 'valley',      label: 'Vadiler',            icon: TreePine, query: 'vadi Güvercinlik Aşk Vadisi Kapadokya' },
  ],
  stays: [
    { id: 'cave',     label: 'Mağara Otelleri', icon: Hotel, query: 'mağara otel cave hotel Kapadokya' },
    { id: 'luxury',   label: 'Lüks',            icon: Star,  query: 'lüks otel 5 yıldız Kapadokya' },
    { id: 'boutique', label: 'Butik',           icon: Heart, query: 'butik otel Göreme Ürgüp' },
  ],
  restaurants: [
    { id: 'local', label: 'Yerel Lezzetler', icon: UtensilsCrossed, query: 'geleneksel restoran testi kebabı Kapadokya' },
    { id: 'cafe',  label: 'Kafeler',          icon: Coffee,          query: 'kafe kahve Göreme Kapadokya' },
    { id: 'fine',  label: 'Fine Dining',      icon: Star,            query: 'fine dining lüks restoran Kapadokya' },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function normalizeName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/\s+/g, ' ');
}

function buildCacheKey(query: string, category: string): string {
  return `search:${category}:${normalizeName(query)}`;
}

function getCategoryLabel(types?: string[]): string {
  if (!types?.length) return 'Turistik Yer';
  const map: Record<string, string> = {
    tourist_attraction: 'Turistik Yer', museum: 'Müze', restaurant: 'Restoran',
    cafe: 'Kafe', lodging: 'Otel', hotel: 'Otel', park: 'Park',
    church: 'Kilise', bakery: 'Fırın', bar: 'Bar',
    natural_feature: 'Doğal Alan', point_of_interest: 'Gezilecek Yer',
  };
  for (const t of types) { if (map[t]) return map[t]; }
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
  place, onAdd, isAdded,
}: {
  place: DiscoverPlace;
  onAdd: () => void;
  isAdded: boolean;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const priceLabel = getPriceLabel(place.price_level);

  const photoSrc = place.photo_url
    || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80';

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
              : photoSrc}
            alt={place.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true); }}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
              imgLoaded ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Add button */}
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
                  <span className="text-[10px] text-gray-400">
                    ({place.user_ratings_total >= 1000
                      ? `${(place.user_ratings_total / 1000).toFixed(1)}k`
                      : place.user_ratings_total})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
              <MapPin className="w-2.5 h-2.5" />
              {place.category}
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
// Main Panel
// ────────────────────────────────────────────────────────────────────────────
export function AddToTripPanel({
  onAddPlace, existingPlaceIds = [], isOpen, onClose,
}: AddToTripPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('for_you');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<DiscoverPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set(existingPlaceIds));

  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cappadocia center
  const CAPPADOCIA_CENTER = useMemo(() => {
    if (!window.google?.maps) return null;
    return new google.maps.LatLng(38.6431, 34.8347);
  }, []);

  useEffect(() => {
    setAddedIds(new Set(existingPlaceIds));
  }, [existingPlaceIds]);

  // Init Google Places service
  useEffect(() => {
    if (isOpen && window.google?.maps && !placesServiceRef.current) {
      const div = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(div);
    }
  }, [isOpen]);

  // ── Core: Cache-first, then Google JS API ───────────────────────────────
  const fetchPlaces = useCallback(async (query: string, category: string = 'general') => {
    setLoading(true);
    setError(null);
    setPlaces([]);

    const cacheKey = buildCacheKey(query, category);

    try {
      // Step 1: Cache kontrol
      const cachedIds = await api.getCachedSearch(cacheKey);

      if (cachedIds && cachedIds.length > 0) {
        const cachedPlaces = await api.getCachedPlaces(cachedIds);
        if (cachedPlaces.length > 0) {
          setPlaces(cachedPlaces);
          setLoading(false);
          return; // Cache HIT — Google'a gitmeye gerek yok
        }
      }

      // Step 2: Cache MISS → Google Places JS API
      if (!placesServiceRef.current || !CAPPADOCIA_CENTER) {
        setError('Google Maps yüklenemedi');
        setLoading(false);
        return;
      }

      const request: google.maps.places.TextSearchRequest = {
        query: query + ' Nevşehir Kapadokya',
        location: CAPPADOCIA_CENTER,
        radius: 50000,
      };

      placesServiceRef.current.textSearch(request, async (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results?.length) {
          setError('Bu arama için sonuç bulunamadı');
          setLoading(false);
          return;
        }

        const placeIds: string[] = [];
        const mapped: DiscoverPlace[] = [];

        for (const r of results.slice(0, 20)) {
          if (!r.geometry?.location || !r.place_id) continue;

          const photoUrl = r.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }) || null;
          const photoReference = api.extractPhotoReference(photoUrl) || photoUrl || undefined;

          const item: DiscoverPlace = {
            place_id: r.place_id,
            name: r.name || '',
            formatted_address: r.formatted_address || '',
            lat: r.geometry.location.lat(),
            lng: r.geometry.location.lng(),
            rating: r.rating,
            user_ratings_total: r.user_ratings_total,
            photo_url: photoUrl || undefined,
            photo_reference: photoReference,
            category: getCategoryLabel(r.types),
            types: r.types,
            price_level: r.price_level,
          };

          placeIds.push(r.place_id);
          mapped.push(item);

          // Step 3: Her yeri places_cache'e kaydet (arka planda)
          api.savePlaceToCache({
            place_id: r.place_id,
            name: r.name || '',
            formatted_address: r.formatted_address || '',
            lat: r.geometry.location.lat(),
            lng: r.geometry.location.lng(),
            rating: r.rating,
            user_ratings_total: r.user_ratings_total,
            photo_reference: photoReference,
            types: r.types,
            price_level: r.price_level,
            category: getCategoryLabel(r.types),
          });
        }

        // Step 4: search_cache'e kaydet (arka planda)
        if (placeIds.length > 0) {
          api.saveSearchToCache(cacheKey, query, category, placeIds);
        }

        setPlaces(mapped);
        setLoading(false);
      });

    } catch (err) {
      console.error('Discover places error:', err);
      setError('Yerler yüklenirken hata oluştu');
      setLoading(false);
    }
  }, [CAPPADOCIA_CENTER]);

  // Tab change
  useEffect(() => {
    if (!isOpen) return;
    const tab = TABS.find(t => t.id === activeTab);
    if (tab) {
      setActiveFilter(null);
      setSearchQuery('');
      fetchPlaces(tab.query, tab.id);
    }
  }, [activeTab, isOpen, fetchPlaces]);

  // Filter change
  useEffect(() => {
    if (!isOpen || !activeFilter) return;
    const filters = TAB_FILTERS[activeTab];
    const filter = filters?.find(f => f.id === activeFilter);
    if (filter) {
      fetchPlaces(filter.query, `${activeTab}_${filter.id}`);
    }
  }, [activeFilter, isOpen, activeTab, fetchPlaces]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchPlaces(searchQuery, 'search');
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, fetchPlaces]);

  // Add handler
  const handleAdd = useCallback((place: DiscoverPlace) => {
    const isRestaurant = place.types?.some(t => ['restaurant', 'cafe', 'bakery', 'bar'].includes(t));
    const isHotel = place.types?.some(t => ['lodging', 'hotel'].includes(t));

    const newPlace: Place = {
      place_id: place.place_id,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      rating: place.rating,
      formatted_address: place.formatted_address,
      photo_reference: api.extractPhotoReference(place.photo_url) || place.photo_reference || place.photo_url || '',
      description: place.category,
      category: place.category,
      estimated_duration_minutes: isRestaurant ? 90 : isHotel ? 0 : 60,
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
          {/* Header */}
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
                    if (tab) fetchPlaces(tab.query, tab.id);
                  }
                }}
                placeholder="Yer, restoran veya otel ara..."
                className="h-11 pl-10 pr-10 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    const tab = TABS.find(t => t.id === activeTab);
                    if (tab) fetchPlaces(tab.query, tab.id);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300"
                >
                  <X className="h-3 w-3 text-gray-500" />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1">
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

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            {loading && (
              <div className="py-16 flex flex-col items-center gap-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-[3px] border-gray-100 border-t-orange-500 animate-spin" />
                </div>
                <p className="text-xs font-semibold text-gray-400">Yerler keşfediliyor...</p>
              </div>
            )}

            {!loading && (error || places.length === 0) && (
              <div className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <Compass className="h-7 w-7 text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500">{error || 'Sonuç bulunamadı'}</p>
                  <p className="text-xs text-gray-400 mt-1">Farklı bir arama terimi veya kategori deneyin</p>
                </div>
              </div>
            )}

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
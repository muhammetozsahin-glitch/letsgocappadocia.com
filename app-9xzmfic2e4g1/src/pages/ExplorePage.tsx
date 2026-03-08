import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search, Star, Clock, Sparkles, Heart, ArrowUpRight,
  Camera, MapPin, Loader2, Compass, Landmark, Hotel,
  UtensilsCrossed, Mountain, TreePine, Navigation,
  ShoppingBag, Coffee, Palette, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiscoverPlace } from '@/db/api';
import api from '@/db/api';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────────────────────────────
// Categories — her biri Google Places sorgusuna karşılık geliyor
// ────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',         label: 'Tümü',                icon: Sparkles,        query: 'en popüler turistik yerler Kapadokya Göreme' },
  { id: 'nature',      label: 'Doğa & Vadiler',      icon: TreePine,        query: 'vadiler doğa yürüyüşü manzara Kapadokya' },
  { id: 'museum',      label: 'Müzeler',             icon: Landmark,        query: 'müze açık hava müzesi Kapadokya Göreme' },
  { id: 'underground', label: 'Yeraltı Şehirleri',   icon: Mountain,        query: 'yeraltı şehri Derinkuyu Kaymaklı Kapadokya' },
  { id: 'adventure',   label: 'Macera & Aktivite',   icon: Navigation,      query: 'balon turu ATV at binme macera Kapadokya' },
  { id: 'restaurant',  label: 'Yemek & İçecek',      icon: UtensilsCrossed, query: 'restoran kafe yemek testi kebabı Kapadokya' },
  { id: 'hotel',       label: 'Konaklama',           icon: Hotel,           query: 'mağara otel butik otel Kapadokya Göreme' },
  { id: 'shopping',    label: 'Alışveriş',           icon: ShoppingBag,     query: 'çömlekçilik alışveriş hediyelik Avanos Kapadokya' },
  { id: 'photo',       label: 'Fotoğraf Noktaları',  icon: Camera,          query: 'en iyi fotoğraf noktaları panoramik manzara Kapadokya' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

// ────────────────────────────────────────────────────────────────────────────
// Cache key builder
// ────────────────────────────────────────────────────────────────────────────
function normalizeName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/\s+/g, ' ');
}

function buildCacheKey(query: string, category: string): string {
  return `explore:${category}:${normalizeName(query)}`;
}

function getCategoryLabel(types?: string[]): string {
  if (!types?.length) return 'Turistik Yer';
  const map: Record<string, string> = {
    tourist_attraction: 'Turistik Yer', museum: 'Müze', restaurant: 'Restoran',
    cafe: 'Kafe', lodging: 'Otel', hotel: 'Otel', park: 'Park',
    church: 'Kilise', natural_feature: 'Doğal Alan',
    point_of_interest: 'Gezilecek Yer',
  };
  for (const t of types) { if (map[t]) return map[t]; }
  return 'Turistik Yer';
}

// ────────────────────────────────────────────────────────────────────────────
// PlaceCard — Explore versiyonu (daha büyük kartlar)
// ────────────────────────────────────────────────────────────────────────────
function ExploreCard({ place, index }: { place: DiscoverPlace; index: number }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();

  const photoSrc = place.photo_url
    || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80';

  const categoryObj = CATEGORIES.find(c =>
    place.types?.some(t => t.includes(c.id)) || c.label === place.category
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className="group overflow-hidden border-2 border-gray-50 dark:border-white/5 bg-white dark:bg-white/5 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
        <CardContent className="p-0">
          {/* Image */}
          <div className="relative h-64 overflow-hidden">
            {!imgLoaded && !imgError && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            )}
            <img
              src={imgError
                ? 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80'
                : photoSrc}
              alt={place.name}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
              className={cn(
                "w-full h-full object-cover transition-all duration-700 group-hover:scale-105",
                imgLoaded ? "opacity-100" : "opacity-0"
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

            {/* Category badge */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 font-black uppercase tracking-widest text-[9px] px-3 py-0.5 rounded-full">
                {place.category}
              </Badge>
            </div>

            {/* Rating */}
            {place.rating && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-accent text-gray-900 border-none font-black text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-lg">
                  <Star className="h-3 w-3 fill-gray-900" />
                  {place.rating}
                </Badge>
              </div>
            )}

            {/* Hover actions */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                  className={cn(
                    "w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer",
                    liked ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-primary"
                  )}
                >
                  <Heart className={cn("h-4 w-4", liked && "fill-white")} />
                </button>
              </div>
              <Button
                onClick={() => navigate('/planner')}
                className="bg-primary text-white font-black uppercase tracking-widest text-[9px] rounded-full h-8 px-4"
              >
                Planla
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="p-6 md:p-8 space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors">
                {place.name}
              </h3>
              <p className="text-gray-500 font-medium italic leading-relaxed text-sm line-clamp-2">
                {place.formatted_address}
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-50 dark:border-white/5">
              <div className="flex flex-wrap items-center gap-4">
                {place.user_ratings_total && (
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <Star className="h-3.5 w-3.5 text-primary" />
                    <span>{place.user_ratings_total >= 1000
                      ? `${(place.user_ratings_total / 1000).toFixed(1)}k yorum`
                      : `${place.user_ratings_total} yorum`}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{place.category}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const url = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
                  window.open(url, '_blank');
                }}
                className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all duration-300 group/btn"
              >
                <ArrowUpRight className="h-5 w-5 group-hover/btn:rotate-45 transition-transform" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ExplorePage
// ────────────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<DiscoverPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CAPPADOCIA_CENTER = useMemo(() => {
    if (!window.google?.maps) return null;
    return new google.maps.LatLng(38.6431, 34.8347);
  }, []);

  // Init Google Places
  useEffect(() => {
    if (window.google?.maps && !placesServiceRef.current) {
      const div = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(div);
    }
  }, []);

  // ── Cache-first fetch ───────────────────────────────────────────────────
  const fetchPlaces = useCallback(async (query: string, category: string = 'all') => {
    setLoading(true);
    setError(null);

    const cacheKey = buildCacheKey(query, category);

    try {
      // Step 1: Cache check
      const cachedIds = await api.getCachedSearch(cacheKey);
      if (cachedIds && cachedIds.length > 0) {
        const cachedPlaces = await api.getCachedPlaces(cachedIds);
        if (cachedPlaces.length > 0) {
          setPlaces(cachedPlaces);
          setLoading(false);
          return;
        }
      }

      // Step 2: Cache MISS → Google Places JS API
      if (!placesServiceRef.current || !CAPPADOCIA_CENTER) {
        // Google henüz yüklenmediyse kısa bir bekleme
        setTimeout(() => {
          if (window.google?.maps) {
            const div = document.createElement('div');
            placesServiceRef.current = new google.maps.places.PlacesService(div);
            fetchFromGoogle(query, category, cacheKey);
          } else {
            setError('Google Maps yüklenemedi');
            setLoading(false);
          }
        }, 1500);
        return;
      }

      fetchFromGoogle(query, category, cacheKey);
    } catch (err) {
      console.error('Explore fetch error:', err);
      setError('Yerler yüklenirken hata oluştu');
      setLoading(false);
    }
  }, [CAPPADOCIA_CENTER]);

  const fetchFromGoogle = useCallback((query: string, category: string, cacheKey: string) => {
    if (!placesServiceRef.current) return;

    const center = new google.maps.LatLng(38.6431, 34.8347);

    placesServiceRef.current.textSearch(
      {
        query: query + ' Nevşehir Kapadokya',
        location: center,
        radius: 50000,
      },
      async (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results?.length) {
          setError('Bu kategori için sonuç bulunamadı');
          setPlaces([]);
          setLoading(false);
          return;
        }

        const placeIds: string[] = [];
        const mapped: DiscoverPlace[] = [];

        for (const r of results.slice(0, 20)) {
          if (!r.geometry?.location || !r.place_id) continue;

          // photo_reference'i URL'den çıkar — Edge Function proxy üzerinden cache'lenir
          const rawPhotoUrl = r.photos?.[0]?.getUrl({ maxWidth: 800, maxHeight: 600 }) || null;
          let photoRef: string | undefined;
          if (rawPhotoUrl) {
            try {
              const ref = new URL(rawPhotoUrl).searchParams.get('photo_reference');
              photoRef = ref || undefined;
            } catch {
              photoRef = undefined;
            }
          }
          // Anlık gösterim için getUrl() kullan, DB'ye kaydedilecek olan ise photoRef
          const photoUrl = rawPhotoUrl;

          const item: DiscoverPlace = {
            place_id: r.place_id,
            name: r.name || '',
            formatted_address: r.formatted_address || '',
            lat: r.geometry.location.lat(),
            lng: r.geometry.location.lng(),
            rating: r.rating,
            user_ratings_total: r.user_ratings_total,
            photo_url: photoUrl || undefined,
            photo_reference: photoRef,
            category: getCategoryLabel(r.types),
            types: r.types,
            price_level: r.price_level,
          };

          placeIds.push(r.place_id);
          mapped.push(item);

          // Arka planda cache'e yaz (photo_reference olarak extract edilen değeri sakla)
          api.savePlaceToCache({
            place_id: r.place_id,
            name: r.name || '',
            formatted_address: r.formatted_address || '',
            lat: r.geometry.location.lat(),
            lng: r.geometry.location.lng(),
            rating: r.rating,
            user_ratings_total: r.user_ratings_total,
            photo_reference: photoRef,
            types: r.types,
            price_level: r.price_level,
            category: getCategoryLabel(r.types),
          });
        }

        if (placeIds.length > 0) {
          api.saveSearchToCache(cacheKey, query, category, placeIds);
        }

        setPlaces(mapped);
        setLoading(false);
      }
    );
  }, []);

  // ── Initial load + category change ──────────────────────────────────────
  useEffect(() => {
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    if (cat) {
      setSearchQuery('');
      fetchPlaces(cat.query, cat.id);
    }
  }, [selectedCategory, fetchPlaces]);

  // ── Debounced search ────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchPlaces(searchQuery, 'search');
    }, 600);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, fetchPlaces]);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 pb-20">

      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden mb-12">
        <div className="absolute inset-0 z-0 scale-105">
          <img
            src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400"
            alt="Explore Hero"
            className="w-full h-full object-cover grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
        </div>

        <div className="container relative z-20 px-6 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Google Places ile Gerçek Zamanlı Keşif
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none uppercase"
          >
            KAPADOKYA <span className="text-primary uppercase">KEŞFİ</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto relative group"
          >
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Bir yer, restoran veya aktivite arayın..."
              className="w-full h-14 pl-12 pr-6 bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/40 rounded-2xl text-base font-bold focus:bg-white focus:text-gray-900 transition-all duration-500 shadow-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
        </div>
      </section>

      <div className="container px-6">

        {/* ── Categories ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-12 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <Button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] shrink-0 transition-all duration-300 gap-1.5",
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white/5 border-2 border-gray-100 dark:border-white/10 text-gray-400 hover:border-primary/40 hover:text-primary'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* ── Results ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {/* Loading */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 flex flex-col items-center gap-4"
            >
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-orange-500 animate-spin" />
                <Compass className="absolute inset-0 m-auto h-6 w-6 text-orange-500" />
              </div>
              <p className="text-sm font-bold text-gray-400">Kapadokya keşfediliyor...</p>
            </motion.div>
          )}

          {/* Results Grid */}
          {!loading && places.length > 0 && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Result count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {places.length} yer bulundu
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      const cat = CATEGORIES.find(c => c.id === selectedCategory);
                      if (cat) fetchPlaces(cat.query, cat.id);
                    }}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    Aramayı temizle
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {places.map((place, index) => (
                  <ExploreCard key={place.place_id} place={place} index={index} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty */}
          {!loading && places.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 text-center space-y-6"
            >
              <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-200 dark:border-white/10">
                <Search className="h-10 w-10 text-gray-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">
                  {error || 'BULUNAMADI'}
                </h3>
                <p className="text-base text-gray-500 font-medium italic max-w-xs mx-auto">
                  Farklı bir keşif terimi veya kategori deneyin.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
              >
                Tümünü Göster
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
// ════════════════════════════════════════════════════════════════════════════
// AddToTripPanel — Tur / Aktivite / Balon Entegrasyonu
// DOSYA: src/components/trip/AddToTripPanel.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, Plus, Star, MapPin, X,
  Compass, Landmark, Hotel, UtensilsCrossed,
  Sparkles, TrendingUp, Navigation, Coffee, Camera,
  Mountain, ShoppingBag, TreePine, Palette, Heart,
  Bus, Zap, Wind, ExternalLink, Clock,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Place, DiscoverPlace } from '@/db/api';
import api from '@/db/api';
import { toursApi, activitiesApi, balloonsApi } from '@/db/agency-api';
import type { Tour, Activity, BalloonFlight } from '@/types/agency';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

// ── Props ───────────────────────────────────────────────────────────────────
interface AddToTripPanelProps {
  onAddPlace: (place: Place) => void;
  existingPlaceIds?: string[];
  isOpen: boolean;
  onClose: () => void;
}

// ── Kapadokya merkezi ────────────────────────────────────────────────────────
const CAPPADOCIA_LAT = 38.6431;
const CAPPADOCIA_LNG = 34.8347;

// ── Google Places Tab config ─────────────────────────────────────────────────
const GOOGLE_TABS = [
  { id: 'for_you',      label: 'Senin İçin',  icon: Sparkles,        query: 'popüler turistik yerler Kapadokya' },
  { id: 'things_to_do', label: 'Gezilecek',    icon: Compass,         query: 'gezilecek yerler aktiviteler Kapadokya' },
  { id: 'landmarks',    label: 'Yerler',       icon: Landmark,        query: 'tarihi yerler müzeler Kapadokya' },
  { id: 'stays',        label: 'Konaklama',    icon: Hotel,           query: 'oteller mağara oteli Kapadokya' },
  { id: 'restaurants',  label: 'Restoranlar',  icon: UtensilsCrossed, query: 'restoranlar kafeler Kapadokya' },
] as const;

// ── Acenta Tab config ────────────────────────────────────────────────────────
const AGENCY_TABS = [
  { id: 'agency_tours',      label: 'Turlarımız',    icon: Bus,  color: 'from-orange-500 to-amber-500' },
  { id: 'agency_activities', label: 'Aktiviteler',   icon: Zap,  color: 'from-purple-500 to-pink-500' },
  { id: 'agency_balloons',   label: 'Balon Turları', icon: Wind, color: 'from-sky-500 to-blue-500' },
] as const;

type GoogleTabId = typeof GOOGLE_TABS[number]['id'];
type AgencyTabId = typeof AGENCY_TABS[number]['id'];
type TabId = GoogleTabId | AgencyTabId;

const AGENCY_TAB_IDS: string[] = AGENCY_TABS.map(t => t.id);

// ── Google Sub-filters ───────────────────────────────────────────────────────
type TabFilter = { id: string; label: string; icon: any; query: string };
const TAB_FILTERS: Partial<Record<string, TabFilter[]>> = {
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
    { id: 'cave',     label: 'Mağara Otelleri', icon: Hotel,      query: 'mağara otel cave hotel Kapadokya' },
    { id: 'luxury',   label: 'Lüks',            icon: Star,       query: 'lüks otel 5 yıldız Kapadokya' },
    { id: 'boutique', label: 'Butik',           icon: Heart,      query: 'butik otel Göreme Ürgüp' },
  ],
  restaurants: [
    { id: 'local', label: 'Yerel Lezzetler', icon: UtensilsCrossed, query: 'geleneksel restoran testi kebabı Kapadokya' },
    { id: 'cafe',  label: 'Kafeler',          icon: Coffee,          query: 'kafe kahve Göreme Kapadokya' },
    { id: 'fine',  label: 'Fine Dining',      icon: Star,            query: 'fine dining lüks restoran Kapadokya' },
  ],
};

// ── Yardımcı ─────────────────────────────────────────────────────────────────
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
function formatCurrency(currency: string) {
  if (currency === 'EUR') return '€';
  if (currency === 'USD') return '$';
  return '₺';
}
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ── Dönüştürücüler ────────────────────────────────────────────────────────────
function tourToPlace(tour: Tour): Place {
  const duration = Math.round(tour.duration_hours * 60);
  const start = tour.start_time || '09:00';
  return {
    place_id: `tour__${tour.id}`,
    name: tour.name,
    lat: tour.meeting_point_lat ?? CAPPADOCIA_LAT,
    lng: tour.meeting_point_lng ?? CAPPADOCIA_LNG,
    formatted_address: tour.meeting_point || 'Kapadokya, Nevşehir',
    photo_reference: tour.cover_image || '',
    description: tour.short_description || '',
    category: 'Tur',
    estimated_duration_minutes: duration,
    start_time: start,
    end_time: addMinutes(start, duration),
    why_visit: tour.short_description || undefined,
    agency_service: { type: 'tour', slug: tour.slug, price: tour.group_price_adult, currency: tour.currency || 'EUR' },
  };
}
function activityToPlace(activity: Activity): Place {
  const duration = activity.duration_minutes || 120;
  const start = activity.time_slots?.[0]?.time || '10:00';
  return {
    place_id: `activity__${activity.id}`,
    name: activity.name,
    lat: CAPPADOCIA_LAT,
    lng: CAPPADOCIA_LNG,
    formatted_address: activity.location || 'Kapadokya, Nevşehir',
    photo_reference: activity.cover_image || '',
    description: activity.short_description || '',
    category: 'Aktivite',
    estimated_duration_minutes: duration,
    start_time: start,
    end_time: addMinutes(start, duration),
    why_visit: activity.short_description || undefined,
    agency_service: { type: 'activity', slug: activity.slug, price: activity.sell_price_adult, currency: activity.currency || 'EUR' },
  };
}
function balloonToPlace(flight: BalloonFlight): Place {
  const duration = flight.duration_minutes || 60;
  const start = flight.flight_time || '05:30';
  return {
    place_id: `balloon__${flight.id}`,
    name: flight.name,
    lat: CAPPADOCIA_LAT,
    lng: CAPPADOCIA_LNG,
    formatted_address: 'Kapadokya, Nevşehir',
    photo_reference: flight.cover_image || '',
    description: flight.description || '',
    category: 'Balon Turu',
    estimated_duration_minutes: duration,
    start_time: start,
    end_time: addMinutes(start, duration),
    why_visit: flight.description || undefined,
    agency_service: { type: 'balloon', slug: flight.slug, price: flight.sell_price_adult, currency: flight.currency || 'EUR' },
  };
}

// ════════════════════════════════════════════════════════════════════════════
// AgencyServiceCard
// ════════════════════════════════════════════════════════════════════════════
function AgencyServiceCard({ name, imageUrl, price, currency, badgeLabel, badgeColor, detailHref, meta, onAdd, isAdded }: {
  name: string; imageUrl: string; price: number; currency: string;
  badgeLabel: string; badgeColor: string; detailHref: string; meta: string;
  onAdd: () => void; isAdded: boolean;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="group relative">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all duration-300">
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          {!imgLoaded && !imgError && <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />}
          <img
            src={imgError ? 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400&q=80' : imageUrl}
            alt={name}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true); }}
            className={cn('w-full h-full object-cover transition-all duration-500 group-hover:scale-105', imgLoaded ? 'opacity-100' : 'opacity-0')}
          />
          <span className={cn('absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow', badgeColor)}>
            {badgeLabel}
          </span>
          <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow">
            <span className="text-[9px] text-gray-500 block">Kişi başı</span>
            <p className="text-sm font-black text-primary leading-none">{price}{formatCurrency(currency)}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            disabled={isAdded}
            className={cn(
              'absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-lg backdrop-blur-sm',
              isAdded ? 'bg-green-500 text-white cursor-default' : 'bg-white/90 text-gray-800 hover:bg-white hover:shadow-xl active:scale-95'
            )}
          >
            {isAdded ? <><CheckCircle2 className="w-3 h-3" />Eklendi</> : <><Plus className="w-3 h-3" />Ekle</>}
          </button>
        </div>
        <div className="p-3 space-y-1.5">
          <h4 className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-2">{name}</h4>
          <p className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{meta}</p>
          <Link
            to={detailHref} target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />Detayları Gör
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PlaceCard — Google Places kartı
// ════════════════════════════════════════════════════════════════════════════
function PlaceCard({ place, onAdd, isAdded }: { place: DiscoverPlace; onAdd: () => void; isAdded: boolean }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const photoSrc = place.photo_url || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="group relative">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300">
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          {!imgLoaded && !imgError && <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />}
          <img
            src={imgError ? 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80' : photoSrc}
            alt={place.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true); }}
            className={cn('w-full h-full object-cover transition-all duration-500 group-hover:scale-105', imgLoaded ? 'opacity-100' : 'opacity-0')}
          />
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            disabled={isAdded}
            className={cn(
              'absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-lg backdrop-blur-sm',
              isAdded ? 'bg-green-500 text-white cursor-default' : 'bg-white/90 text-gray-800 hover:bg-white hover:shadow-xl active:scale-95'
            )}
          >
            {isAdded ? <><CheckCircle2 className="w-3 h-3" />Eklendi</> : <><Plus className="w-3 h-3" />Ekle</>}
          </button>
        </div>
        <div className="p-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">{place.name}</h4>
            {place.rating && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{place.rating}</span>
                {place.user_ratings_total && (
                  <span className="text-[10px] text-gray-400">
                    ({place.user_ratings_total >= 1000 ? `${(place.user_ratings_total / 1000).toFixed(1)}k` : place.user_ratings_total})
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
              <MapPin className="w-2.5 h-2.5" />{place.category}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 truncate">{place.formatted_address}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Boş durum ─────────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
        <Compass className="h-7 w-7 text-gray-300" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-500">{message}</p>
        <p className="text-xs text-gray-400 mt-1">Farklı bir sekme veya arama deneyin</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Ana Panel
// ════════════════════════════════════════════════════════════════════════════
export function AddToTripPanel({ onAddPlace, existingPlaceIds = [], isOpen, onClose }: AddToTripPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('for_you');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Google Places state
  const [googlePlaces, setGooglePlaces] = useState<DiscoverPlace[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Agency state
  const [tours, setTours] = useState<Tour[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [balloons, setBalloons] = useState<BalloonFlight[]>([]);
  const [agencyLoading, setAgencyLoading] = useState(false);

  const [addedIds, setAddedIds] = useState<Set<string>>(new Set(existingPlaceIds));

  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const CAPPADOCIA_CENTER = useMemo(() => {
    if (!window.google?.maps) return null;
    return new google.maps.LatLng(CAPPADOCIA_LAT, CAPPADOCIA_LNG);
  }, []);

  const isAgencyTab = AGENCY_TAB_IDS.includes(activeTab);

  useEffect(() => { setAddedIds(new Set(existingPlaceIds)); }, [existingPlaceIds]);

  useEffect(() => {
    if (isOpen && window.google?.maps && !placesServiceRef.current) {
      const div = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(div);
    }
  }, [isOpen]);

  // ── Google Places fetch ───────────────────────────────────────────────────
  const fetchGooglePlaces = useCallback(async (query: string, category: string = 'general') => {
    setGoogleLoading(true);
    setGoogleError(null);
    setGooglePlaces([]);
    const cacheKey = buildCacheKey(query, category);
    try {
      const cachedIds = await api.getCachedSearch(cacheKey);
      if (cachedIds?.length) {
        const cachedPlaces = await api.getCachedPlaces(cachedIds);
        if (cachedPlaces.length > 0) { setGooglePlaces(cachedPlaces); setGoogleLoading(false); return; }
      }
      if (!placesServiceRef.current || !CAPPADOCIA_CENTER) {
        setGoogleError('Google Maps yüklenemedi'); setGoogleLoading(false); return;
      }
      const request: google.maps.places.TextSearchRequest = {
        query: query + ' Nevşehir Kapadokya', location: CAPPADOCIA_CENTER, radius: 50000,
      };
      placesServiceRef.current.textSearch(request, async (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results?.length) {
          setGoogleError('Bu arama için sonuç bulunamadı'); setGoogleLoading(false); return;
        }
        const placeIds: string[] = [];
        const mapped: DiscoverPlace[] = [];
        for (const r of results.slice(0, 20)) {
          if (!r.geometry?.location || !r.place_id) continue;
          const photoUrl = r.photos?.[0]?.getUrl({ maxWidth: 400, maxHeight: 300 }) || null;
          const photoReference = api.extractPhotoReference(photoUrl) || photoUrl || undefined;
          const item: DiscoverPlace = {
            place_id: r.place_id, name: r.name || '', formatted_address: r.formatted_address || '',
            lat: r.geometry.location.lat(), lng: r.geometry.location.lng(), rating: r.rating,
            user_ratings_total: r.user_ratings_total, photo_url: photoUrl || undefined,
            photo_reference: photoReference, category: getCategoryLabel(r.types), types: r.types, price_level: r.price_level,
          };
          placeIds.push(r.place_id); mapped.push(item);
          api.savePlaceToCache({
            place_id: r.place_id, name: r.name || '', formatted_address: r.formatted_address || '',
            lat: r.geometry.location.lat(), lng: r.geometry.location.lng(), rating: r.rating,
            user_ratings_total: r.user_ratings_total, photo_reference: photoReference,
            types: r.types, price_level: r.price_level, category: getCategoryLabel(r.types),
          });
        }
        if (placeIds.length > 0) api.saveSearchToCache(cacheKey, query, category, placeIds);
        setGooglePlaces(mapped); setGoogleLoading(false);
      });
    } catch { setGoogleError('Yerler yüklenirken hata oluştu'); setGoogleLoading(false); }
  }, [CAPPADOCIA_CENTER]);

  // ── Acenta fetch ──────────────────────────────────────────────────────────
  const fetchAgencyServices = useCallback(async (tab: AgencyTabId) => {
    setAgencyLoading(true);
    try {
      if (tab === 'agency_tours') { setTours(await toursApi.getAll()); }
      else if (tab === 'agency_activities') { setActivities(await activitiesApi.getAll()); }
      else if (tab === 'agency_balloons') { setBalloons(await balloonsApi.getAll()); }
    } catch (err) { console.error('Agency fetch error:', err); }
    finally { setAgencyLoading(false); }
  }, []);

  // Tab değişimi
  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery(''); setActiveFilter(null);
    if (AGENCY_TAB_IDS.includes(activeTab)) { fetchAgencyServices(activeTab as AgencyTabId); }
    else {
      const tab = GOOGLE_TABS.find(t => t.id === activeTab);
      if (tab) fetchGooglePlaces(tab.query, tab.id);
    }
  }, [activeTab, isOpen, fetchGooglePlaces, fetchAgencyServices]);

  // Alt filtre değişimi
  useEffect(() => {
    if (!isOpen || !activeFilter || isAgencyTab) return;
    const filters = TAB_FILTERS[activeTab];
    const filter = filters?.find(f => f.id === activeFilter);
    if (filter) fetchGooglePlaces(filter.query, `${activeTab}_${filter.id}`);
  }, [activeFilter, isOpen, activeTab, isAgencyTab, fetchGooglePlaces]);

  // Debounced arama
  useEffect(() => {
    if (!searchQuery.trim() || isAgencyTab) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { fetchGooglePlaces(searchQuery, 'search'); }, 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, isAgencyTab, fetchGooglePlaces]);

  // ── Ekleme işlemleri ──────────────────────────────────────────────────────
  const handleAddGooglePlace = useCallback((place: DiscoverPlace) => {
    const isRestaurant = place.types?.some(t => ['restaurant', 'cafe', 'bakery', 'bar'].includes(t));
    const isHotel = place.types?.some(t => ['lodging', 'hotel'].includes(t));
    const newPlace: Place = {
      place_id: place.place_id, name: place.name, lat: place.lat, lng: place.lng, rating: place.rating,
      formatted_address: place.formatted_address,
      photo_reference: api.extractPhotoReference(place.photo_url) || place.photo_reference || place.photo_url || '',
      description: place.category, category: place.category,
      estimated_duration_minutes: isRestaurant ? 90 : isHotel ? 0 : 60,
      start_time: '10:00', end_time: '11:00',
    };
    onAddPlace(newPlace); setAddedIds(prev => new Set(prev).add(place.place_id));
  }, [onAddPlace]);

  const handleAddTour = useCallback((tour: Tour) => {
    const p = tourToPlace(tour); onAddPlace(p); setAddedIds(prev => new Set(prev).add(p.place_id));
  }, [onAddPlace]);

  const handleAddActivity = useCallback((activity: Activity) => {
    const p = activityToPlace(activity); onAddPlace(p); setAddedIds(prev => new Set(prev).add(p.place_id));
  }, [onAddPlace]);

  const handleAddBalloon = useCallback((flight: BalloonFlight) => {
    const p = balloonToPlace(flight); onAddPlace(p); setAddedIds(prev => new Set(prev).add(p.place_id));
  }, [onAddPlace]);

  // Arama filtresi (acenta)
  const filteredTours = useMemo(() =>
    searchQuery.trim() ? tours.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())) : tours,
    [tours, searchQuery]);
  const filteredActivities = useMemo(() =>
    searchQuery.trim() ? activities.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())) : activities,
    [activities, searchQuery]);
  const filteredBalloons = useMemo(() =>
    searchQuery.trim() ? balloons.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())) : balloons,
    [balloons, searchQuery]);

  const currentGoogleFilters = (!isAgencyTab && TAB_FILTERS[activeTab]) || [];
  const loading = isAgencyTab ? agencyLoading : googleLoading;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-0 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Rotaya Ekle</h2>
                <p className="text-xs text-gray-400 mt-0.5">Turlar, aktiviteler ve yerleri keşfedin</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 transition-all">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Arama */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAgencyTab ? 'İsme göre ara...' : 'Yer, restoran veya otel ara...'}
                className="h-11 pl-10 pr-10 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                  <X className="h-3 w-3 text-gray-500" />
                </button>
              )}
            </div>

            {/* ── Acenta Sekmeleri ───────────────────────────────────────── */}
            <div className="mb-2">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <span className="w-4 h-px bg-orange-300" />
                Acenta Servisleri
                <span className="w-4 h-px bg-orange-300" />
              </p>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {AGENCY_TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all shrink-0',
                        isActive
                          ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                          : 'bg-orange-50 dark:bg-gray-800 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-100'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Google Sekmeleri ───────────────────────────────────────── */}
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <span className="w-4 h-px bg-gray-300" />
                Keşfet
                <span className="w-4 h-px bg-gray-300" />
              </p>
              <div className="flex gap-1 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1">
                {GOOGLE_TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition-all shrink-0',
                        isActive
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {!isAgencyTab && currentGoogleFilters.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-3 -mx-1 px-1">
                  {currentGoogleFilters.map(filter => {
                    const Icon = filter.icon;
                    const isActive = activeFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setActiveFilter(isActive ? null : filter.id)}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 border',
                          isActive
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700'
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        <Icon className="h-3 w-3" />{filter.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* İçerik */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            {loading && (
              <div className="py-16 flex flex-col items-center gap-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-[3px] border-gray-100 border-t-orange-500 animate-spin" />
                </div>
                <p className="text-xs font-semibold text-gray-400">{isAgencyTab ? 'Yükleniyor...' : 'Yerler keşfediliyor...'}</p>
              </div>
            )}

            {/* ACENTA: Turlar */}
            {!loading && activeTab === 'agency_tours' && (
              filteredTours.length === 0
                ? <EmptyState message="Henüz aktif tur bulunmuyor" />
                : <div className="grid grid-cols-2 gap-3 pt-1">
                  {filteredTours.map(tour => (
                    <AgencyServiceCard
                      key={tour.id} name={tour.name}
                      imageUrl={tour.cover_image || 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=400&q=80'}
                      price={tour.group_price_adult} currency={tour.currency}
                      badgeLabel={tour.code === 'red' ? '🔴 Kırmızı Tur' : tour.code === 'green' ? '🟢 Yeşil Tur' : tour.code === 'blue' ? '🔵 Mavi Tur' : '⭐ Özel Tur'}
                      badgeColor={tour.code === 'red' ? 'bg-red-500' : tour.code === 'green' ? 'bg-emerald-500' : tour.code === 'blue' ? 'bg-blue-500' : 'bg-amber-500'}
                      detailHref={`/tur/${tour.slug}`}
                      meta={`${tour.duration_hours} saat · ${tour.group_max_participants || '?'} kişi`}
                      onAdd={() => handleAddTour(tour)} isAdded={addedIds.has(`tour__${tour.id}`)}
                    />
                  ))}
                </div>
            )}

            {/* ACENTA: Aktiviteler */}
            {!loading && activeTab === 'agency_activities' && (
              filteredActivities.length === 0
                ? <EmptyState message="Henüz aktif aktivite bulunmuyor" />
                : <div className="grid grid-cols-2 gap-3 pt-1">
                  {filteredActivities.map(activity => (
                    <AgencyServiceCard
                      key={activity.id} name={activity.name}
                      imageUrl={activity.cover_image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'}
                      price={activity.sell_price_adult} currency={activity.currency}
                      badgeLabel={activity.category === 'adventure' ? '🏍️ Macera' : activity.category === 'cultural' ? '🏺 Kültürel' : activity.category === 'entertainment' ? '🎭 Eğlence' : '⭐ Aktivite'}
                      badgeColor={activity.category === 'adventure' ? 'bg-orange-500' : activity.category === 'cultural' ? 'bg-purple-500' : activity.category === 'entertainment' ? 'bg-pink-500' : 'bg-amber-500'}
                      detailHref={`/aktivite/${activity.slug}`}
                      meta={`${activity.duration_minutes ? Math.floor(activity.duration_minutes / 60) + 's' : '?'} ${activity.min_age ? `· Min ${activity.min_age} yaş` : ''}`}
                      onAdd={() => handleAddActivity(activity)} isAdded={addedIds.has(`activity__${activity.id}`)}
                    />
                  ))}
                </div>
            )}

            {/* ACENTA: Balon Turları */}
            {!loading && activeTab === 'agency_balloons' && (
              filteredBalloons.length === 0
                ? <EmptyState message="Henüz aktif balon turu bulunmuyor" />
                : <div className="grid grid-cols-2 gap-3 pt-1">
                  {filteredBalloons.map(flight => (
                    <AgencyServiceCard
                      key={flight.id} name={flight.name}
                      imageUrl={flight.cover_image || 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400&q=80'}
                      price={flight.sell_price_adult} currency={flight.currency}
                      badgeLabel={flight.name.toLowerCase().includes('vip') ? '👑 VIP' : flight.name.toLowerCase().includes('deluxe') ? '✨ Deluxe' : '🎈 Standart'}
                      badgeColor={flight.name.toLowerCase().includes('vip') ? 'bg-amber-500' : flight.name.toLowerCase().includes('deluxe') ? 'bg-purple-500' : 'bg-sky-500'}
                      detailHref={`/balon/${flight.slug}`}
                      meta={`${flight.duration_minutes}dk · ⏰ ${flight.flight_time || '05:30'} · ${flight.passengers_per_basket || '?'} kişi/sepet`}
                      onAdd={() => handleAddBalloon(flight)} isAdded={addedIds.has(`balloon__${flight.id}`)}
                    />
                  ))}
                </div>
            )}

            {/* GOOGLE: Sonuçlar */}
            {!loading && !isAgencyTab && (
              <>
                {(googleError || googlePlaces.length === 0)
                  ? <EmptyState message={googleError || 'Sonuç bulunamadı'} />
                  : <div className="grid grid-cols-2 gap-3 pt-1">
                    {googlePlaces.map(place => (
                      <PlaceCard key={place.place_id} place={place} onAdd={() => handleAddGooglePlace(place)} isAdded={addedIds.has(place.place_id)} />
                    ))}
                  </div>
                }
                {!googleLoading && googlePlaces.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Google Places tarafından desteklenmektedir</span>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
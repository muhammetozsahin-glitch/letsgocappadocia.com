import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { ItineraryDay, Place } from '@/db/api';
import { initGoogleMaps } from '@/lib/google-maps-loader';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Plus, Star, Clock, ChevronRight, Lightbulb, CheckCircle2, Loader2, X, MessageSquare } from 'lucide-react';
import api from '@/db/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MapProps {
  itinerary: { days: ItineraryDay[] };
  activePlaceId: string | null;
  onMarkerClick: (id: string) => void;
  onAddPlace?: (place: Place) => void;
}

const DAY_COLORS = [
  '#EA580C',
  '#2563EB',
  '#059669',
  '#7C3AED',
  '#DB2777',
];

interface PlaceDetail {
  place_id: string;
  name: string;
  summary?: string;
  rating?: number;
  total_ratings?: number;
  is_open_now?: boolean | null;
  opening_hours?: string[] | null;
  why_visit: string[];
  tips: string[];
  reviews: { author: string; rating: number | undefined; text: string; time: string }[];
}

interface SelectedPOI {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  photoUrl: string;
  category: string;
  formatted_address?: string;
  rating?: number;
}

export function TripMap({ itinerary, activePlaceId, onMarkerClick, onAddPlace }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<{ [key: string]: { marker: google.maps.Marker; dayIndex: number } }>({});
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // ── In-memory cache: session boyunca tekrar çağrı yapılmaz ───────────────
  const placeDetailCacheRef = useRef<Map<string, PlaceDetail>>(new Map());

  // Detail panel state
  const [selectedPOI, setSelectedPOI] = useState<SelectedPOI | null>(null);
  const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about');

  const itineraryKey = useMemo(() =>
    JSON.stringify(itinerary.days.map(d => d.items.map(i => i.place_id))),
    [itinerary]
  );

  // ── Reset panel on itinerary change ──────────────────────────────────────
  useEffect(() => {
    setSelectedPOI(null);
    setPlaceDetail(null);
    setAdded(false);
  }, [itineraryKey]);

  // ── Detay nesnesini Google API yanıtından oluşturur ──────────────────────
  const buildPlaceDetail = useCallback((
    place: google.maps.places.PlaceResult,
    poi: SelectedPOI
  ): PlaceDetail => {
    const typeLabels: Record<string, string> = {
      tourist_attraction: 'Turistik bir cazibe noktası — ziyaret değer.',
      museum: 'Tarihi ve kültürel bir müze deneyimi sunar.',
      restaurant: 'Yerel lezzetleri keşfetmek için harika bir mekan.',
      park: 'Doğayla iç içe dinlenme ve yürüyüş imkânı.',
      lodging: 'Konforlu konaklama seçeneği.',
      natural_feature: 'Eşsiz doğal güzelliğiyle öne çıkan bir yer.',
      church: 'Tarihi ve mimari açıdan ilgi çekici bir yapı.',
      mosque: 'Tarihi ve mimari açıdan ilgi çekici bir yapı.',
      point_of_interest: 'Bölgenin önemli ilgi noktalarından biri.',
    };

    const whyVisit: string[] = [];
    if ((poi as any).why_visit) {
      whyVisit.push((poi as any).why_visit);
    } else {
      for (const t of (place.types || [])) {
        const label = typeLabels[t];
        if (label) { whyVisit.push(label); break; }
      }
    }

    const tips: string[] = [];
    if ((poi as any).personal_tip) tips.push((poi as any).personal_tip);
    const reviewTips = (place.reviews || [])
      .filter(r => (r.rating ?? 0) >= 4 && r.text?.length > 30)
      .slice(0, tips.length > 0 ? 1 : 2)
      .map(r => `"${r.text.slice(0, 120).trim()}…"`);
    tips.push(...reviewTips);

    const rawSummary = (place as any).editorial_summary?.overview || '';
    const isTurkish = /[çğışöüÇĞİŞÖÜ]/.test(rawSummary) || !/[a-zA-Z]{4,}/.test(rawSummary);
    const summary = isTurkish ? rawSummary : '';

    return {
      place_id: place.place_id || poi.place_id,
      name: place.name || poi.name,
      summary,
      rating: place.rating,
      total_ratings: place.user_ratings_total,
      is_open_now: place.opening_hours?.isOpen?.() ?? null,
      opening_hours: place.opening_hours?.weekday_text || null,
      why_visit: whyVisit,
      tips,
      reviews: (place.reviews || []).map(r => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.relative_time_description,
      })),
    };
  }, []);

  // ── Fetch rich details — önce memory cache, yoksa Google API ─────────────
  const fetchPlaceDetail = useCallback((poi: SelectedPOI) => {
    if (!placesServiceRef.current) return;

    // 1. Memory cache'te var mı?
    const cached = placeDetailCacheRef.current.get(poi.place_id);
    if (cached) {
      setPlaceDetail(cached);
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    setPlaceDetail(null);
    setActiveTab('about');

    placesServiceRef.current.getDetails(
      {
        placeId: poi.place_id,
        fields: [
          'place_id', 'name', 'editorial_summary', 'rating', 'user_ratings_total',
          'opening_hours', 'reviews', 'types', 'formatted_address',
        ],
        language: 'tr',
      } as any,
      (place, status) => {
        setDetailLoading(false);
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) return;

        const detail = buildPlaceDetail(place, poi);

        // 2. Cache'e yaz — aynı yer tekrar açılırsa API çağrısı yapılmaz
        placeDetailCacheRef.current.set(poi.place_id, detail);
        setPlaceDetail(detail);
      }
    );
  }, [buildPlaceDetail]);

  // ── Handle add ────────────────────────────────────────────────────────────
  const handleAdd = useCallback(() => {
    if (!selectedPOI || !onAddPlace) return;
    const place: Place = {
      place_id: selectedPOI.place_id,
      name: selectedPOI.name,
      lat: selectedPOI.lat,
      lng: selectedPOI.lng,
      rating: selectedPOI.rating,
      formatted_address: selectedPOI.formatted_address || '',
      photo_reference: selectedPOI.photoUrl,
      description: selectedPOI.category,
      category: selectedPOI.category,
      estimated_duration_minutes: 60,
      start_time: '09:00',
      end_time: '10:00',
    };
    onAddPlace(place);
    setAdded(true);
    setTimeout(() => {
      setSelectedPOI(null);
      setPlaceDetail(null);
      setAdded(false);
    }, 1500);
  }, [selectedPOI, onAddPlace]);

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadMap = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
          setError('Google Maps API anahtarı eksik.');
          return;
        }
        await initGoogleMaps(apiKey);

        if (mapRef.current && !googleMap) {
          const map = new google.maps.Map(mapRef.current, {
            center: { lat: 38.6431, lng: 34.8347 },
            zoom: 12,
            styles: [
              { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
              { featureType: 'poi.park', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: false,
            clickableIcons: true,
          });

          placesServiceRef.current = new google.maps.places.PlacesService(map);

          // ── POI tıklama ───────────────────────────────────────────────────
          // TEK getDetails çağrısı: tüm alanlar bir arada isteniyor (önceden 2 ayrı çağrıydı)
          map.addListener('click', (e: google.maps.MapMouseEvent & { placeId?: string }) => {
            if (!e.placeId) return;
            e.stop?.();

            const placeId = e.placeId;
            setAdded(false);

            // Memory cache'te varsa API'ye gitme
            const cached = placeDetailCacheRef.current.get(placeId);
            if (cached) {
              setSelectedPOI({
                place_id: placeId,
                name: cached.name,
                lat: 0,
                lng: 0,
                photoUrl: '',
                category: cached.why_visit[0] || '',
                rating: cached.rating,
              });
              setPlaceDetail(cached);
              setActiveTab('about');
              return;
            }

            setDetailLoading(true);
            setPlaceDetail(null);
            setActiveTab('about');

            // Tüm alanlar tek çağrıda — eski 2 çağrı birleştirildi
            placesServiceRef.current?.getDetails(
              {
                placeId,
                fields: [
                  'place_id', 'name', 'editorial_summary', 'rating', 'user_ratings_total',
                  'opening_hours', 'reviews', 'types', 'formatted_address', 'geometry', 'photos',
                ],
                language: 'tr',
              } as any,
              (place, status) => {
                setDetailLoading(false);
                if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) return;

                const photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 600 }) || '';
                const category = (place.types?.[0] || 'point_of_interest').replace(/_/g, ' ');

                const poi: SelectedPOI = {
                  place_id: place.place_id || placeId,
                  name: place.name || '',
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                  photoUrl,
                  category,
                  formatted_address: place.formatted_address || '',
                  rating: place.rating,
                };

                // Detay nesnesini de aynı yanıttan oluştur — ikinci çağrı yok
                const detail = buildPlaceDetail(place, poi);
                placeDetailCacheRef.current.set(poi.place_id, detail);

                setSelectedPOI(poi);
                setPlaceDetail(detail);
              }
            );
          });

          setGoogleMap(map);
        }
      } catch {
        setError('Google Maps yüklenemedi.');
      }
    };

    if (!googleMap) loadMap();
  }, [googleMap, onAddPlace, fetchPlaceDetail]);

  // ── Markers & polylines ───────────────────────────────────────────────────
  useEffect(() => {
    if (!googleMap || !itinerary?.days) return;

    Object.values(markersRef.current).forEach(({ marker }) => marker.setMap(null));
    markersRef.current = {};
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    itinerary.days.forEach((day, dayIndex) => {
      const dayColor = DAY_COLORS[dayIndex % DAY_COLORS.length];
      const dayPath: google.maps.LatLngLiteral[] = [];

      day.items.forEach((item, itemIndex) => {
        const position = { lat: item.lat, lng: item.lng };
        dayPath.push(position);
        const isActive = item.place_id === activePlaceId;

        const marker = new google.maps.Marker({
          position,
          map: googleMap,
          title: item.name,
          zIndex: isActive ? 1000 : 1,
          label: { text: (itemIndex + 1).toString(), color: 'white', fontSize: '11px', fontWeight: '900' },
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
            fillColor: dayColor,
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
            scale: isActive ? 1.8 : 1.4,
            anchor: new google.maps.Point(12, 22),
            labelOrigin: new google.maps.Point(12, 9),
          },
          animation: isActive ? google.maps.Animation.BOUNCE : undefined,
        });

        marker.addListener('click', () => {
          onMarkerClick(item.place_id);

          // Sağ paneli aç — itinerary item'dan tüm veriyi taşı
          const photoUrl = item.photo_reference
            ? (item.photo_reference.startsWith('http') ? item.photo_reference : api.getPhotoUrl(item.photo_reference))
            : '';

          const poi: SelectedPOI & { why_visit?: string; personal_tip?: string } = {
            place_id: item.place_id,
            name: item.name,
            lat: item.lat,
            lng: item.lng,
            photoUrl,
            category: item.category || 'point_of_interest',
            formatted_address: item.formatted_address || '',
            rating: item.rating ?? undefined,
            why_visit: (item as any).why_visit,
            personal_tip: (item as any).personal_tip,
          };

          setSelectedPOI(poi);
          fetchPlaceDetail(poi);
        });

        markersRef.current[item.place_id] = { marker, dayIndex };
        bounds.extend(position);
      });

      if (dayPath.length > 1) {
        const polyline = new google.maps.Polyline({
          path: dayPath, geodesic: true,
          strokeColor: dayColor, strokeOpacity: 0.8, strokeWeight: 3,
        });
        polyline.setMap(googleMap);
        polylinesRef.current.push(polyline);
      }
    });

    if (Object.keys(markersRef.current).length > 0) {
      googleMap.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
    }
  }, [googleMap, itineraryKey]);

  // ── Active marker highlight ───────────────────────────────────────────────
  useEffect(() => {
    if (!googleMap || !activePlaceId || !markersRef.current[activePlaceId]) return;
    const { marker } = markersRef.current[activePlaceId];
    googleMap.panTo(marker.getPosition()!);
    Object.keys(markersRef.current).forEach(id => {
      const { marker: m, dayIndex: dIdx } = markersRef.current[id];
      const color = DAY_COLORS[dIdx % DAY_COLORS.length];
      const isActive = id === activePlaceId;
      m.setIcon({
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
        fillColor: color, fillOpacity: 1,
        strokeWeight: isActive ? 3 : 2,
        strokeColor: isActive ? '#000000' : '#ffffff',
        scale: isActive ? 1.8 : 1.4,
        anchor: new google.maps.Point(12, 22),
        labelOrigin: new google.maps.Point(12, 9),
      });
      m.setZIndex(isActive ? 1000 : 1);
      m.setAnimation(isActive ? google.maps.Animation.BOUNCE : null);
    });
  }, [activePlaceId, googleMap]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden">
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm font-medium text-gray-500">{error}</p>
        </div>
      ) : (
        <>
          <div ref={mapRef} className="absolute inset-0 w-full h-full" />

          {/* İpucu */}
          {onAddPlace && !selectedPOI && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/60 flex items-center gap-2">
                <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-[11px] font-bold text-gray-600">Haritada bir yere tıklayarak detayları görün</span>
              </div>
            </div>
          )}

          {/* Zoom */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <div className="flex flex-col bg-white border rounded-lg shadow-sm overflow-hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-b"
                onClick={() => googleMap?.setZoom((googleMap.getZoom() || 12) + 1)}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none"
                onClick={() => googleMap?.setZoom((googleMap.getZoom() || 12) - 1)}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-white shadow-sm"
              onClick={() => {
                if (googleMap && Object.keys(markersRef.current).length > 0) {
                  const bounds = new google.maps.LatLngBounds();
                  Object.values(markersRef.current).forEach(({ marker }) => bounds.extend(marker.getPosition()!));
                  googleMap.fitBounds(bounds);
                }
              }}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* ── Detay Paneli ───────────────────────────────────────────────── */}
          <AnimatePresence>
            {selectedPOI && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="absolute top-0 right-0 bottom-0 w-[340px] bg-white shadow-2xl z-20 flex flex-col overflow-hidden"
              >
                {/* Fotoğraf header */}
                <div className="relative h-44 shrink-0 bg-gray-100">
                  {selectedPOI.photoUrl ? (
                    <img
                      src={selectedPOI.photoUrl}
                      alt={selectedPOI.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                      <span className="text-4xl">🗺️</span>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Kapat */}
                  <button
                    onClick={() => { setSelectedPOI(null); setPlaceDetail(null); setAdded(false); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Açık/Kapalı badge */}
                  {placeDetail?.is_open_now != null && (
                    <div className={cn(
                      'absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black backdrop-blur-sm',
                      placeDetail.is_open_now
                        ? 'bg-green-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                    )}>
                      {placeDetail.is_open_now ? '● Açık' : '● Kapalı'}
                    </div>
                  )}

                  {/* İsim */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-0.5">
                      {selectedPOI.category}
                    </p>
                    <h3 className="text-lg font-black text-white leading-tight line-clamp-2">
                      {selectedPOI.name}
                    </h3>
                  </div>
                </div>

                {/* Rating + tabs */}
                <div className="px-4 pt-3 pb-0 border-b shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    {(selectedPOI.rating || placeDetail?.rating) && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i}
                              className={cn('h-3.5 w-3.5', i <= Math.round(selectedPOI.rating || placeDetail?.rating || 0)
                                ? 'fill-accent text-accent'
                                : 'text-gray-200 fill-gray-200'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-black text-gray-800">
                          {(selectedPOI.rating || placeDetail?.rating)?.toFixed(1)}
                        </span>
                        {placeDetail?.total_ratings && (
                          <span className="text-xs text-gray-400">({placeDetail.total_ratings.toLocaleString()})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1">
                    {(['about', 'reviews'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          'px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-t-lg transition-all border-b-2',
                          activeTab === tab
                            ? 'text-primary border-primary/50'
                            : 'text-gray-400 border-transparent hover:text-gray-600'
                        )}
                      >
                        {tab === 'about' ? 'Hakkında' : 'Yorumlar'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* İçerik */}
                <div className="flex-1 overflow-y-auto">
                  {detailLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <p className="text-xs font-bold text-gray-400">Detaylar yükleniyor...</p>
                    </div>
                  ) : placeDetail ? (
                    <AnimatePresence mode="wait">
                      {activeTab === 'about' ? (
                        <motion.div
                          key="about"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-4 space-y-5"
                        >
                          {/* Özet */}
                          {placeDetail.summary && (
                            <p className="text-sm text-gray-600 leading-relaxed">{placeDetail.summary}</p>
                          )}

                          {/* Neden gitmelisiniz */}
                          {placeDetail.why_visit?.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                                <ChevronRight className="h-3.5 w-3.5 text-primary" />
                                Neden gitmelisiniz?
                              </h4>
                              <div className="space-y-2">
                                {placeDetail.why_visit.map((reason, i) => (
                                  <div key={i} className="flex items-start gap-2.5">
                                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                                      {i + 1}
                                    </div>
                                    <p className="text-[12px] text-gray-700 leading-relaxed">{reason}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Gitmeden önce */}
                          {placeDetail.tips?.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                                <Lightbulb className="h-3.5 w-3.5 text-accent" />
                                Gitmeden önce bilin
                              </h4>
                              <div className="space-y-1.5 bg-accent/10 rounded-xl p-3 border border-accent/10">
                                {placeDetail.tips.map((tip, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <span className="text-accent mt-0.5 shrink-0 text-xs">•</span>
                                    <p className="text-[12px] text-gray-700 leading-relaxed">{tip}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Çalışma saatleri */}
                          {(placeDetail.opening_hours?.length ?? 0) > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-blue-500" />
                                Çalışma Saatleri
                              </h4>
                              <div className="space-y-1">
                                {(placeDetail.opening_hours ?? []).map((h, i) => (
                                  <p key={i} className="text-[11px] text-gray-500">{h}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="reviews"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="p-4 space-y-4"
                        >
                          {placeDetail.reviews?.length > 0 ? (
                            placeDetail.reviews.map((review, i) => (
                              <div key={i} className="space-y-2 pb-4 border-b border-gray-100 last:border-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                      {review.author?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-gray-800">{review.author}</p>
                                      <p className="text-[10px] text-gray-400">{review.time}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    {[1,2,3,4,5].map(s => (
                                      <Star key={s}
                                        className={cn('h-3 w-3', s <= (review.rating ?? 0)
                                          ? 'fill-accent text-accent'
                                          : 'text-gray-200 fill-gray-200'
                                        )}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-4">{review.text}</p>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
                              <MessageSquare className="h-8 w-8 opacity-30" />
                              <p className="text-xs font-medium">Yorum bulunamadı</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ) : null}
                </div>

                {/* Adres + Plana ekle butonu */}
                <div className="p-4 border-t bg-white shrink-0 space-y-3">
                  {selectedPOI.formatted_address && (
                    <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">
                      📍 {selectedPOI.formatted_address}
                    </p>
                  )}
                  {onAddPlace && (
                    <Button
                      onClick={handleAdd}
                      disabled={added}
                      className={cn(
                        'w-full h-11 rounded-xl font-black text-sm gap-2 transition-all',
                        added
                          ? 'bg-green-500 hover:bg-green-500 text-white'
                          : 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20'
                      )}
                    >
                      {added ? (
                        <><CheckCircle2 className="h-4 w-4" /> Plana Eklendi!</>
                      ) : (
                        <><Plus className="h-4 w-4" /> Güne Ekle</>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

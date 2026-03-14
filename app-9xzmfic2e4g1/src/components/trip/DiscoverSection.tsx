// src/components/trip/DiscoverSection.tsx
// Wanderlog tarzı Keşfet bölümü — Rehber planları + popüler yerler entegrasyonu
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Eye, MapPin, Calendar, Copy, ArrowRight,
  Compass, Sparkles, ChevronRight, Plus, CheckCircle2,
  Star, Clock, Loader2, BookOpen, Lightbulb, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/db/api';
import type { Place } from '@/db/api';
import { format, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// ── Kapadokya'da öne çıkan sabit yerler ─────────────────────────────────────
const FEATURED_SPOTS: { name: string; category: string; desc: string; img: string; duration: number; tip?: string }[] = [
  { name: 'Göreme Açık Hava Müzesi', category: 'Müze', desc: 'UNESCO mirası, Bizans kaya kiliseleri', img: 'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=400&q=80', duration: 120, tip: 'Sabah erken gidin, öğleden sonra kalabalık olur' },
  { name: 'Uçhisar Kalesi', category: 'Landmark', desc: 'Bölgenin en yüksek noktası, panoramik manzara', img: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=400&q=80', duration: 90, tip: 'Gün batımından 1 saat önce gidin' },
  { name: 'Paşabağ Vadisi', category: 'Doğa', desc: 'Üç başlı mantar kayalar, seyir terası', img: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80', duration: 60 },
  { name: 'Güvercinlik Vadisi', category: 'Doğa', desc: 'Uçhisar\'dan Göreme\'ye yürüyüş rotası', img: 'https://images.unsplash.com/photo-1442520468003-f5f334cd2f53?w=400&q=80', duration: 90, tip: 'Sabah yürüyüşü için idealdir' },
  { name: 'Avanos Çömlek Atölyesi', category: 'Kültür', desc: 'Kızılırmak kilinden çömlek yapımı', img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80', duration: 60 },
  { name: 'Derinkuyu Yeraltı Şehri', category: 'Tarih', desc: '85 metre derinlikte, 8 katlı antik şehir', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', duration: 120, tip: 'Sabah erken gidin, dar alanda kalabalık olur' },
];

// ─── Props ───────────────────────────────────────────────────────────────────
interface DiscoverSectionProps {
  /** Mevcut gezi planındaki yer ID'leri (eklendi/eklenmedi kontrolü için) */
  existingPlaceIds: string[];
  /** Yer eklendiğinde çağrılır — hangi günde olduğunu kullanıcı seçer */
  onAddPlace: (place: Place) => void;
  /** Rehber planı kopyalandığında */
  onGuideCloned?: (tripId: string) => void;
  /** Şu an planlanan gezi ID'si (kendini gösterme) */
  currentTripId?: string;
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────
function spotToPlace(spot: typeof FEATURED_SPOTS[0]): Place {
  return {
    place_id: `spot__${spot.name.toLowerCase().replace(/\s+/g, '_')}`,
    name: spot.name, category: spot.category,
    lat: 38.6431, lng: 34.8347,
    formatted_address: 'Kapadokya, Nevşehir',
    photo_reference: spot.img,
    description: spot.desc,
    estimated_duration_minutes: spot.duration,
    start_time: '09:00',
    end_time: `${String(9 + Math.floor(spot.duration / 60)).padStart(2,'0')}:${String(spot.duration % 60).padStart(2,'0')}`,
    personal_tip: spot.tip,
  };
}

function guideCoverPhoto(guide: any): string {
  const first = guide?.itinerary?.days?.[0]?.items?.[0];
  if (first?.photo_reference) {
    const resolved = api.resolvePlacePhoto(first.photo_reference);
    if (resolved) return resolved;
    if (first.photo_reference.startsWith('http')) return first.photo_reference;
  }
  return 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80';
}

function guideDays(guide: any): number {
  if (!guide?.start_date || !guide?.end_date) return guide?.itinerary?.days?.length || 0;
  try { return differenceInDays(new Date(guide.end_date), new Date(guide.start_date)) + 1; }
  catch { return guide?.itinerary?.days?.length || 0; }
}

function guideStops(guide: any): number {
  return guide?.itinerary?.days?.reduce((s: number, d: any) => s + (d.items?.length || 0), 0) || 0;
}

// ════════════════════════════════════════════════════════════════════════════
// Ana Bileşen
// ════════════════════════════════════════════════════════════════════════════
export function DiscoverSection({ existingPlaceIds, onAddPlace, onGuideCloned, currentTripId }: DiscoverSectionProps) {
  const { user } = useAuth();
  const [guides, setGuides] = useState<any[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(true);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [addedSpots, setAddedSpots] = useState<Set<string>>(new Set(existingPlaceIds));
  const [activeView, setActiveView] = useState<'spots' | 'guides'>('spots');
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());

  useEffect(() => { setAddedSpots(new Set(existingPlaceIds)); }, [existingPlaceIds]);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      const [data, likes] = await Promise.all([
        api.getPublicGuides(8),
        user ? api.getMyLikes() : Promise.resolve([]),
      ]);
      // Kendini gösterme
      setGuides(data.filter((g: any) => g.id !== currentTripId));
      setMyLikes(new Set(likes));
    } catch {
      /* sessiz */
    } finally {
      setGuidesLoading(false);
    }
  };

  const handleAddSpot = useCallback((spot: typeof FEATURED_SPOTS[0]) => {
    const place = spotToPlace(spot);
    onAddPlace(place);
    setAddedSpots(prev => new Set(prev).add(place.place_id));
    toast.success(`${spot.name} rotaya eklendi`);
  }, [onAddPlace]);

  const handleCloneGuide = async (guide: any) => {
    if (!user) { toast.error('Kopyalamak için giriş yapın'); return; }
    setCloningId(guide.id);
    try {
      const newTrip = await api.cloneGuide(guide.id);
      toast.success(`"${guide.title}" planı kopyalandı!`, {
        description: 'Gezilerim bölümünden düzenleyebilirsiniz.',
        duration: 5000,
      });
      onGuideCloned?.(newTrip.id);
    } catch {
      toast.error('Kopyalama başarısız');
    } finally {
      setCloningId(null);
    }
  };

  const handleLike = async (e: React.MouseEvent, guideId: string) => {
    e.stopPropagation();
    if (!user) return;
    const wasLiked = myLikes.has(guideId);
    setMyLikes(prev => { const n = new Set(prev); wasLiked ? n.delete(guideId) : n.add(guideId); return n; });
    setGuides(prev => prev.map(g => g.id === guideId
      ? { ...g, likes_count: g.likes_count + (wasLiked ? -1 : 1) }
      : g));
    try { await api.toggleLike(guideId); } catch { /* revert not critical */ }
  };

  // Rehber genişletilince yerlerini göster — eklenebilir
  const handleAddGuidePlace = useCallback((place: any) => {
    const p: Place = {
      place_id: place.place_id || `guide_place__${place.name}`,
      name: place.name || place.place_name,
      category: place.category || 'Yer',
      lat: place.lat || 38.6431,
      lng: place.lng || 34.8347,
      formatted_address: place.formatted_address || 'Kapadokya, Nevşehir',
      photo_reference: place.photo_reference || '',
      description: place.description || '',
      estimated_duration_minutes: place.estimated_duration_minutes || 60,
      start_time: place.start_time || '09:00',
      end_time: place.end_time || '10:00',
    };
    onAddPlace(p);
    setAddedSpots(prev => new Set(prev).add(p.place_id));
    toast.success(`${p.name} rotaya eklendi`);
  }, [onAddPlace]);

  return (
    <div className="pb-2">
      {/* ── Görünüm seçici ────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 flex gap-1 border-b border-gray-50">
        <button
          onClick={() => setActiveView('spots')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all',
            activeView === 'spots' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          )}
        >
          <Sparkles className="h-3 w-3" />Önerilen Yerler
        </button>
        <button
          onClick={() => setActiveView('guides')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all',
            activeView === 'guides' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          )}
        >
          <BookOpen className="h-3 w-3" />Rehber Planları
          {guides.length > 0 && (
            <span className={cn('text-[10px] font-black px-1.5 py-0.5 rounded-full',
              activeView === 'guides' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary')}>
              {guides.length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ── ÖNERİLEN YERLER ───────────────────────────────────────────── */}
        {activeView === 'spots' && (
          <motion.div key="spots" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.18 }}>
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Compass className="h-3 w-3" />Kapadokya\'da keşfedilecek yerler
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {FEATURED_SPOTS.map(spot => {
                  const placeId = `spot__${spot.name.toLowerCase().replace(/\s+/g, '_')}`;
                  const isAdded = addedSpots.has(placeId) || existingPlaceIds.some(id => id.includes(spot.name.toLowerCase().replace(/\s+/g, '_')));
                  return (
                    <motion.div key={spot.name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="group relative">
                      <div className="rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all bg-white">
                        {/* Görsel */}
                        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                          <img src={spot.img} alt={spot.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          {/* Ekle butonu */}
                          <button
                            onClick={() => !isAdded && handleAddSpot(spot)}
                            disabled={isAdded}
                            className={cn(
                              'absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shadow-lg backdrop-blur-sm transition-all',
                              isAdded
                                ? 'bg-green-500 text-white cursor-default'
                                : 'bg-white/90 text-gray-800 hover:bg-white hover:shadow-xl active:scale-95'
                            )}
                          >
                            {isAdded ? <><CheckCircle2 className="w-2.5 h-2.5" />Eklendi</> : <><Plus className="w-2.5 h-2.5" />Ekle</>}
                          </button>
                          {/* Süre */}
                          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 text-white px-1.5 py-0.5 rounded-full">
                            <Clock className="h-2.5 w-2.5" />
                            <span className="text-[9px] font-bold">{Math.floor(spot.duration / 60)}s{spot.duration % 60 ? ` ${spot.duration % 60}dk` : ''}</span>
                          </div>
                        </div>
                        {/* İçerik */}
                        <div className="p-2.5">
                          <h4 className="text-[12px] font-black text-gray-900 leading-tight line-clamp-1">{spot.name}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{spot.desc}</p>
                          {spot.tip && (
                            <div className="mt-1.5 flex items-start gap-1">
                              <Lightbulb className="h-2.5 w-2.5 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-amber-700 leading-snug line-clamp-2">{spot.tip}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {/* Daha fazlasını keşfet */}
              <Link
                to="/explore"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-primary hover:text-primary transition-all group"
              >
                <Compass className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />
                Tüm yerleri keşfet
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── REHBER PLANLARI ───────────────────────────────────────────── */}
        {activeView === 'guides' && (
          <motion.div key="guides" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
            <div className="px-4 pt-3 pb-1">
              {guidesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                </div>
              ) : guides.length === 0 ? (
                <div className="py-10 text-center">
                  <BookOpen className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-400">Henüz yayınlanmış rehber yok</p>
                  <p className="text-xs text-gray-300 mt-1">İlk rehberi siz oluşturun!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3" />Topluluk gezi rehberleri
                  </p>
                  {guides.map(guide => {
                    const isExpanded = expandedGuide === guide.id;
                    const coverPhoto = guideCoverPhoto(guide);
                    const days = guideDays(guide);
                    const stops = guideStops(guide);
                    const isLiked = myLikes.has(guide.id);

                    return (
                      <motion.div key={guide.id} layout className="border border-gray-100 rounded-2xl overflow-hidden bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                        {/* Kart başlığı */}
                        <button
                          onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                          className="w-full text-left"
                        >
                          <div className="flex gap-3 p-3">
                            {/* Kapak fotoğraf */}
                            <div className="w-16 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                              <img src={coverPhoto} alt={guide.title} className="w-full h-full object-cover" />
                            </div>
                            {/* Bilgi */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[13px] font-black text-gray-900 line-clamp-1">{guide.title}</h4>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-bold">
                                  <Calendar className="h-2.5 w-2.5" />{days} gün
                                </span>
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-400 font-bold">
                                  <MapPin className="h-2.5 w-2.5" />{stops} durak
                                </span>
                              </div>
                              {guide.guide_intro && (
                                <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-snug">{guide.guide_intro}</p>
                              )}
                            </div>
                            {/* Sağ ok */}
                            <div className="shrink-0 self-center">
                              {isExpanded
                                ? <X className="h-4 w-4 text-gray-300" />
                                : <ChevronRight className="h-4 w-4 text-gray-300" />}
                            </div>
                          </div>
                        </button>

                        {/* Genişletilmiş — yerler listesi */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-t border-gray-50"
                            >
                              <div className="px-3 py-2 space-y-1 max-h-52 overflow-y-auto">
                                {guide.itinerary?.days?.flatMap((d: any) => d.items || []).slice(0, 12).map((item: any, i: number) => {
                                  const pid = item.place_id || `guide_place__${item.name || item.place_name}`;
                                  const isItemAdded = addedSpots.has(pid) || existingPlaceIds.includes(pid);
                                  return (
                                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-black text-gray-500 shrink-0">{i+1}</div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-gray-800 truncate">{item.name || item.place_name}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{item.category}</p>
                                      </div>
                                      <button
                                        onClick={() => !isItemAdded && handleAddGuidePlace(item)}
                                        disabled={isItemAdded}
                                        className={cn(
                                          'flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all shrink-0',
                                          isItemAdded
                                            ? 'bg-green-50 text-green-600 cursor-default'
                                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                                        )}
                                      >
                                        {isItemAdded ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                                        {isItemAdded ? 'Eklendi' : 'Ekle'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Alt butonlar */}
                              <div className="px-3 py-2.5 bg-gray-50 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <button onClick={e => handleLike(e, guide.id)} className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors">
                                    <Heart className={cn('h-3 w-3', isLiked && 'fill-red-500 text-red-500')} />
                                    {guide.likes_count || 0}
                                  </button>
                                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Eye className="h-3 w-3" />{guide.views_count || 0}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/rehber/${guide.id}`}
                                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                                  >
                                    Tüm planı gör <ArrowRight className="h-2.5 w-2.5" />
                                  </Link>
                                  <button
                                    onClick={() => handleCloneGuide(guide)}
                                    disabled={cloningId === guide.id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary text-white text-[10px] font-bold hover:bg-primary/90 transition-all disabled:opacity-60"
                                  >
                                    {cloningId === guide.id
                                      ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                      : <Copy className="h-2.5 w-2.5" />}
                                    Planı Kopyala
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Kapalı halindeki meta bilgi */}
                        {!isExpanded && (
                          <div className="px-3 pb-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button onClick={e => handleLike(e, guide.id)} className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors">
                                <Heart className={cn('h-3 w-3', isLiked && 'fill-red-500 text-red-500')} />
                                {guide.likes_count || 0}
                              </button>
                              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                <Eye className="h-3 w-3" />{guide.views_count || 0}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold">Tıkla · detayları gör</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  <Link
                    to="/rehberler"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-xs font-bold text-gray-400 hover:border-primary hover:text-primary transition-all group"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Tüm rehberlere bak
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
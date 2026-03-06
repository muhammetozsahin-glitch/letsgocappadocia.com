import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/db/api';
import { TripMap } from '@/components/trip/Map';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Eye, MapPin, Calendar, Copy, Loader2,
  ChevronLeft, Clock, Lightbulb, User, ChevronDown, ChevronUp
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DAY_COLORS = ['#EA580C', '#9333EA', '#2563EB', '#059669', '#D97706'];

export default function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [liked, setLiked] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [tipsExpanded, setTipsExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  const load = async () => {
    try {
      const [data, likes] = await Promise.all([
        api.getPublicGuide(id!),
        user ? api.getMyLikes() : Promise.resolve([]),
      ]);
      setGuide(data);
      setLiked(likes.includes(id!));
    } catch {
      toast.error('Rehber bulunamadı');
      navigate('/rehberler');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setGuide((g: any) => ({ ...g, likes_count: g.likes_count + (wasLiked ? -1 : 1) }));
    try { await api.toggleLike(id!); }
    catch { setLiked(wasLiked); }
  };

  const handleClone = async () => {
    if (!user) { navigate('/login'); return; }
    setCloning(true);
    try {
      const newTrip = await api.cloneGuide(id!);
      toast.success('Rota kopyalandı! Düzenlemeye başlayabilirsiniz.');
      navigate(`/trip/${newTrip.id}`);
    } catch {
      toast.error('Kopyalama başarısız');
    } finally {
      setCloning(false);
    }
  };

  const getCoverPhoto = () => {
    const first = guide?.itinerary?.days?.[0]?.items?.[0];
    if (first?.photo_reference) {
      return first.photo_reference.startsWith('http')
        ? first.photo_reference
        : api.getPhotoUrl(first.photo_reference);
    }
    return 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&q=80&w=1600';
  };

  const getDayDate = (idx: number) => {
    if (!guide?.start_date) return `Gün ${idx + 1}`;
    try {
      return format(addDays(new Date(guide.start_date), idx), 'd MMM', { locale: tr });
    } catch { return `Gün ${idx + 1}`; }
  };

  const getTripDuration = () => {
    if (!guide?.start_date || !guide?.end_date) return null;
    try {
      return differenceInDays(new Date(guide.end_date), new Date(guide.start_date)) + 1;
    } catch { return null; }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
      </div>
    );
  }

  if (!guide) return null;

  const days = guide.itinerary?.days || [];
  const currentDay = days[selectedDay];
  const tips: string[] = guide.guide_tips || [];
  const duration = getTripDuration();

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <div className="relative h-80 md:h-[420px] overflow-hidden bg-gray-900">
        <img
          src={getCoverPhoto()}
          alt={guide.title}
          className="w-full h-full object-cover opacity-70"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=1600&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <button onClick={() => navigate('/rehberler')}
          className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold transition-colors bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5">
          <ChevronLeft className="h-3.5 w-3.5" /> Rehberler
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {duration && (
                <Badge className="bg-orange-600 text-white border-0 font-black text-[9px] px-2.5">
                  {duration} GÜN
                </Badge>
              )}
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm font-black text-[9px] px-2.5">
                {days.reduce((s: number, d: any) => s + (d.items?.length || 0), 0)} DURAK
              </Badge>
              {guide.destination && (
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm font-black text-[9px] px-2.5">
                  📍 {guide.destination}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-3">
              {guide.title}
            </h1>
            <div className="flex items-center gap-4 text-white/60 text-xs font-bold">
              {guide.profiles?.full_name && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {guide.profiles.full_name}
                </span>
              )}
              {guide.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(guide.published_at), 'd MMMM yyyy', { locale: tr })}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                {guide.views_count || 0} görüntülenme
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 text-xs font-bold transition-all px-3 py-1.5 rounded-full',
                liked
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              )}>
              <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
              {guide.likes_count || 0}
            </button>
          </div>
          <Button onClick={handleClone} disabled={cloning}
            className="h-9 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 font-black text-xs gap-2">
            {cloning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
            Bu Planı Kullan
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {guide.guide_intro && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <p className="text-xs font-black text-orange-700 uppercase tracking-widest mb-2">Gezgin Notu</p>
            <p className="text-sm text-gray-700 leading-relaxed italic">"{guide.guide_intro}"</p>
          </motion.div>
        )}

        {tips.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
            <button
              onClick={() => setTipsExpanded(!tipsExpanded)}
              className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-black text-gray-900">Genel İpuçları</span>
                <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px] font-black">
                  {tips.length} ipucu
                </Badge>
              </div>
              {tipsExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            <AnimatePresence>
              {tipsExpanded && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((day: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className={cn(
                  'flex flex-col items-center px-4 py-2.5 rounded-xl transition-all shrink-0 min-w-[72px]',
                  selectedDay === idx
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
                style={selectedDay === idx ? { backgroundColor: DAY_COLORS[idx % DAY_COLORS.length] } : {}}
              >
                <span className="text-[9px] font-black uppercase tracking-wider">Gün {day.day}</span>
                <span className="text-[8px] font-semibold opacity-70 mt-0.5">{getDayDate(idx)}</span>
                <Badge className={cn(
                  'mt-1 text-[7px] px-1.5 h-3.5 font-black border-0',
                  selectedDay === idx ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-400'
                )}>
                  {day.items?.length || 0}
                </Badge>
              </button>
            ))}
          </div>

          {currentDay && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {(currentDay.items || []).map((item: any, idx: number) => (
                  <motion.div
                    key={item.place_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => setActivePlaceId(item.place_id)}
                    className={cn(
                      'flex gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all',
                      activePlaceId === item.place_id
                        ? 'border-orange-400 bg-orange-50'
                        : 'border-gray-100 bg-white hover:border-orange-200'
                    )}
                  >
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5"
                      style={{ backgroundColor: DAY_COLORS[selectedDay % DAY_COLORS.length] }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-black text-gray-900 leading-tight">{item.name}</h4>
                        {item.rating && (
                          <span className="text-[10px] font-black text-amber-600 shrink-0">
                            ★ {item.rating}
                          </span>
                        )}
                      </div>
                      {item.start_time && (
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {item.start_time} – {item.end_time}
                        </p>
                      )}
                      {item.why_visit && (
                        <p className="text-[11px] text-blue-700 mt-1.5 leading-snug flex items-start gap-1">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-blue-500" />
                          {item.why_visit}
                        </p>
                      )}
                      {item.personal_tip && (
                        <p className="text-[11px] text-amber-700 mt-1 leading-snug flex items-start gap-1">
                          <Lightbulb className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                          {item.personal_tip}
                        </p>
                      )}
                    </div>
                    {item.photo_reference && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                        <img
                          src={item.photo_reference.startsWith('http') ? item.photo_reference : api.getPhotoUrl(item.photo_reference)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&q=80'; }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="h-96 lg:h-auto lg:min-h-[400px] rounded-3xl overflow-hidden shadow-xl">
                <TripMap
                  itinerary={{ days: [currentDay] }}
                  activePlaceId={activePlaceId}
                  onMarkerClick={setActivePlaceId}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-3xl p-8 text-center space-y-4">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Bu rotayı beğendiniz mi?</h3>
          <p className="text-gray-500 text-sm italic">Bir tıkla kendi planınıza kopyalayın ve özelleştirin.</p>
          <Button onClick={handleClone} disabled={cloning}
            className="h-12 px-10 rounded-xl bg-orange-600 hover:bg-orange-700 font-black gap-2 shadow-lg">
            {cloning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
            Bu Planı Kullan
          </Button>
          {!user && (
            <p className="text-xs text-gray-400">
              Kopyalamak için{' '}
              <Link to="/login" className="text-orange-600 font-bold hover:underline">giriş yapın</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
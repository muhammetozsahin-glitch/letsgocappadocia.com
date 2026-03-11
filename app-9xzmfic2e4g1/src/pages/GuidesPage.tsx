import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/db/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Heart, Eye, MapPin, Calendar, ArrowRight, Compass, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function GuidesPage() {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myLikes, setMyLikes] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [data, likes] = await Promise.all([
        api.getPublicGuides(50),
        user ? api.getMyLikes() : Promise.resolve([]),
      ]);
      setGuides(data);
      setMyLikes(new Set(likes));
    } catch (err) {
      console.error('Rehberler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, guideId: string) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    const wasLiked = myLikes.has(guideId);
    setMyLikes(prev => {
      const next = new Set(prev);
      wasLiked ? next.delete(guideId) : next.add(guideId);
      return next;
    });
    setGuides(prev => prev.map(g => g.id === guideId
      ? { ...g, likes_count: g.likes_count + (wasLiked ? -1 : 1) }
      : g
    ));
    try {
      await api.toggleLike(guideId);
    } catch {
      setMyLikes(prev => {
        const next = new Set(prev);
        wasLiked ? next.add(guideId) : next.delete(guideId);
        return next;
      });
    }
  };

  const getGuidePhoto = (guide: any) => {
    const first = guide.itinerary?.days?.[0]?.items?.[0];
    if (first?.photo_reference) {
      return api.resolvePlacePhoto(first.photo_reference) || undefined;
    }
    return 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800';
  };

  const getDayCount = (guide: any) => guide.itinerary?.days?.length || 0;
  const getPlaceCount = (guide: any) =>
    (guide.itinerary?.days || []).reduce((s: number, d: any) => s + (d.items?.length || 0), 0);

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <div className="relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&q=80&w=2400"
            className="w-full h-full object-cover"
            alt=""
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/80 to-secondary" />
        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Compass className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Topluluk Rehberleri</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none mb-4">
              REHBERLERİM
            </h1>
            <p className="text-white/50 text-lg font-medium italic max-w-md">
              Gerçek gezginlerin oluşturduğu Kapadokya rotaları. Beğen, kopyala, yola çık.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Rehberler yükleniyor...</p>
          </div>
        ) : guides.length === 0 ? (
          <div className="text-center py-24 space-y-6">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border-2 border-dashed border-primary/20">
              <Compass className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Henüz rehber yok</h3>
              <p className="text-gray-400 text-sm mt-2 italic">İlk rehberi siz oluşturun.</p>
            </div>
            <Button className="bg-primary hover:bg-primary-dark h-12 px-8 rounded-xl font-black" asChild>
              <Link to="/planner">Rota Oluştur</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-sm font-bold text-gray-400">{guides.length} rehber</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {guides.map((guide, idx) => (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link to={`/rehber/${guide.id}`} className="group block">
                    <div className="bg-white rounded-3xl overflow-hidden border-2 border-gray-50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

                      <div className="relative h-52 overflow-hidden bg-gray-100">
                        <img
                          src={getGuidePhoto(guide)}
                          alt={guide.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <Badge className="bg-black/40 text-white border-0 backdrop-blur-sm text-[9px] font-black px-2">
                            {getDayCount(guide)} GÜN
                          </Badge>
                          <Badge className="bg-black/40 text-white border-0 backdrop-blur-sm text-[9px] font-black px-2">
                            {getPlaceCount(guide)} DURAK
                          </Badge>
                        </div>

                        <button
                          onClick={(e) => handleLike(e, guide.id)}
                          className={cn(
                            'absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all',
                            myLikes.has(guide.id)
                              ? 'bg-red-500 text-white'
                              : 'bg-black/30 text-white hover:bg-red-500'
                          )}
                        >
                          <Heart className={cn('h-4 w-4', myLikes.has(guide.id) && 'fill-current')} />
                        </button>

                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="text-base font-black text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {guide.title}
                          </h3>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {guide.guide_intro && (
                          <p className="text-xs text-gray-500 italic leading-relaxed line-clamp-2">
                            "{guide.guide_intro}"
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            {guide.destination || 'Kapadokya'}
                          </span>
                          {guide.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-primary" />
                              {format(new Date(guide.start_date), 'd MMM yyyy', { locale: tr })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {guide.likes_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {guide.views_count || 0}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] font-black text-primary group-hover:gap-2 transition-all">
                            İncele <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
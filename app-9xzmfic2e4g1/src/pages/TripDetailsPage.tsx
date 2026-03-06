import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { Trip, Place, ItineraryDay } from '@/db/api';
import { Timeline } from '@/components/trip/Timeline';
import { TripMap } from '@/components/trip/Map';
import {
  Loader2, Share2, MapPin, Trash2,
  Plus, LayoutGrid, RotateCcw, RotateCw,
  CheckCircle2, Clock, Navigation, Globe, GlobeLock, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// ────────────────────────────────────────────────────────────────────────────
// Undo / Redo hook
// ────────────────────────────────────────────────────────────────────────────
function useUndoRedo<T>(initial: T) {
  const stack = useRef<T[]>([initial]);
  const [ptr, setPtr] = useState(0);

  const current = stack.current[ptr];
  const canUndo = ptr > 0;
  const canRedo = ptr < stack.current.length - 1;

  const push = useCallback((next: T) => {
    stack.current = stack.current.slice(0, ptr + 1);
    stack.current.push(next);
    setPtr(p => p + 1);
  }, [ptr]);

  const undo = useCallback(() => { if (canUndo) setPtr(p => p - 1); }, [canUndo]);
  const redo = useCallback(() => { if (canRedo) setPtr(p => p + 1); }, [canRedo]);

  const jumpTo = useCallback((index: number) => {
    if (index >= 0 && index < stack.current.length) setPtr(index);
  }, []);

  return { current, push, undo, redo, canUndo, canRedo, jumpTo, ptr };
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────
export default function TripDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [isMapSheetOpen, setIsMapSheetOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Publish modal
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [guideIntro, setGuideIntro] = useState('');
  const [guideTips, setGuideTips] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // History operates on the full itinerary object
  const history = useUndoRedo<Trip['itinerary'] | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await api.getTripById(id);
        if (data) {
          setTrip(data);
          history.push(data.itinerary);
          setIsPublic(!!(data as any).is_public);
          setGuideIntro((data as any).guide_intro || '');
          setGuideTips(((data as any).guide_tips || []).join('\n'));
        } else {
          toast.error('Gezi bulunamadı');
          navigate('/explore');
        }
      } catch {
        toast.error('Gezi yüklenemedi');
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Persist (debounced) ───────────────────────────────────────────────────
  const scheduleWrite = useCallback((t: Trip) => {
    setSaveStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await api.updateTrip(t.id, { itinerary: t.itinerary });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('unsaved');
        toast.error('Değişiklikler kaydedilemedi');
      }
    }, 1500);
  }, []);

  // ── Apply an itinerary snapshot (used by all mutators + undo/redo) ────────
  const applyItinerary = useCallback((itinerary: Trip['itinerary'], pushToHistory = true) => {
    setTrip(prev => {
      if (!prev) return prev;
      const next = { ...prev, itinerary };
      scheduleWrite(next);
      return next;
    });
    if (pushToHistory) history.push(itinerary);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleWrite]);

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (!history.canUndo) return;
    history.undo();
    const prev = history.current;
    if (prev) applyItinerary(prev, false);
  }, [history, applyItinerary]);

  const handleRedo = useCallback(() => {
    if (!history.canRedo) return;
    history.redo();
    const next = history.current;
    if (next) applyItinerary(next, false);
  }, [history, applyItinerary]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  // ── Itinerary mutators ────────────────────────────────────────────────────
  const withDays = useCallback((fn: (days: ItineraryDay[]) => ItineraryDay[]) => {
    if (!trip) return;
    applyItinerary({ ...trip.itinerary, days: fn([...trip.itinerary.days]) });
  }, [trip, applyItinerary]);

  const handleReorder = (dayIndex: number, newItems: Place[]) => {
    withDays(days => {
      days[dayIndex] = { ...days[dayIndex], items: newItems };
      return days;
    });
  };

  const handleAddPlace = (dayIndex: number, place: Place) => {
    withDays(days => {
      const day = days[dayIndex];
      const last = day.items[day.items.length - 1];

      // Auto-schedule start_time after last item ends
      let startMin = 9 * 60;
      if (last) {
        const [h, m] = (last.start_time || '09:00').split(':').map(Number);
        startMin = h * 60 + m + (last.estimated_duration_minutes || 60) + 20;
      }
      const toHHMM = (mins: number) =>
        `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

      const newPlace = {
        ...place,
        start_time: toHHMM(startMin),
        end_time: toHHMM(startMin + (place.estimated_duration_minutes || 60)),
      };
      days[dayIndex] = { ...day, items: [...day.items, newPlace] };
      return days;
    });
    toast.success(`${place.name} rotaya eklendi`);
  };

  const handleDeletePlace = (dayIndex: number, placeId: string) => {
    withDays(days => {
      days[dayIndex] = { ...days[dayIndex], items: days[dayIndex].items.filter(i => i.place_id !== placeId) };
      return days;
    });
    toast.success('Durak kaldırıldı');
  };

  const handleUpdatePlaceNote = (dayIndex: number, placeId: string, note: string) => {
    withDays(days => {
      const items = [...days[dayIndex].items];
      const idx = items.findIndex(i => i.place_id === placeId);
      if (idx > -1) items[idx] = { ...items[idx], notes: note };
      days[dayIndex] = { ...days[dayIndex], items };
      return days;
    });
  };

  const handleUpdateDayNote = (dayIndex: number, note: string) => {
    withDays(days => {
      days[dayIndex] = { ...days[dayIndex], notes: note };
      return days;
    });
  };

  const handleAddDay = () => {
    if (!trip) return;
    const nextNum = trip.itinerary.days.length + 1;
    withDays(days => [...days, { day: nextNum, items: [] }]);
    toast.success(`Gün ${nextNum} eklendi`);
    setSelectedDayIndex(trip.itinerary.days.length); // new day
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link panoya kopyalandı');
    } catch {
      toast.error('Kopyalama başarısız');
    }
  };

  const handlePublish = async () => {
    if (!trip) return;
    setPublishLoading(true);
    try {
      const tips = guideTips.split('\n').map(t => t.trim()).filter(Boolean);
      await api.publishGuide(trip.id, { guide_intro: guideIntro, guide_tips: tips });
      setIsPublic(true);
      setShowPublishModal(false);
      toast.success('Rehber yayınlandı! Toplulukta görünüyor.');
    } catch {
      toast.error('Yayınlama başarısız');
    } finally {
      setPublishLoading(false);
    }
  };

  const handleUnpublish = async () => {
    if (!trip) return;
    try {
      await api.unpublishGuide(trip.id);
      setIsPublic(false);
      toast.success('Rehber yayından kaldırıldı');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async () => {
    if (!trip) return;
    try {
      await api.deleteTrip(trip.id);
      toast.success('Gezi silindi');
      navigate('/account');
    } catch {
      toast.error('Gezi silinemedi');
    }
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const getDayDate = useCallback((idx: number) => {
    if (!trip) return '';
    try {
      return format(addDays(new Date(trip.start_date), idx), 'd MMM', { locale: tr });
    } catch {
      return '';
    }
  }, [trip]);

  const dayStats = useMemo(() => {
    if (!trip) return null;
    const day = trip.itinerary.days[selectedDayIndex];
    if (!day) return null;
    const mins = day.items.reduce((s, p) => s + (p.estimated_duration_minutes || 60), 0);
    const h = Math.floor(mins / 60), m = mins % 60;
    return {
      places: day.items.length,
      duration: h > 0 ? `${h}s${m > 0 ? ` ${m}dk` : ''}` : `${m}dk`,
    };
  }, [trip, selectedDayIndex]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4 bg-background">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-orange-100 border-t-orange-600 animate-spin" />
          <Navigation className="absolute inset-0 m-auto h-6 w-6 text-orange-600" />
        </div>
        <p className="text-sm font-semibold text-gray-400">Rota yükleniyor...</p>
      </div>
    );
  }

  if (!trip) return null;

  const selectedDay = trip.itinerary.days[selectedDayIndex];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">

      {/* ── Publish Modal ────────────────────────────────────────────────── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Rehber Olarak Yayınla</h2>
                <p className="text-xs text-gray-400 mt-0.5">Rotanız toplulukla paylaşılacak</p>
              </div>
              <button onClick={() => setShowPublishModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-1.5">
                  Kişisel Notunuz
                </label>
                <textarea
                  value={guideIntro}
                  onChange={e => setGuideIntro(e.target.value)}
                  placeholder="Kapadokya'ya kaç kez gittiğinizi, gezi deneyiminizi kısaca anlatın..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-700 uppercase tracking-wider block mb-1.5">
                  Genel İpuçları <span className="text-gray-400 font-normal">(her satır ayrı ipucu)</span>
                </label>
                <textarea
                  value={guideTips}
                  onChange={e => setGuideTips(e.target.value)}
                  placeholder={"Sabah erken çıkın, turist kalabalığından kaçınırsınız\nBalon turu için 3 ay önceden rezervasyon yapın\nNevşehir'den araç kiralamak en pratik seçenek"}
                  rows={4}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold"
                onClick={() => setShowPublishModal(false)}>
                Vazgeç
              </Button>
              <Button className="flex-1 h-11 rounded-xl font-black bg-orange-600 hover:bg-orange-700 gap-2"
                onClick={handlePublish} disabled={publishLoading}>
                {publishLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Yayınla
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-header ──────────────────────────────────────────────────── */}
      <div className="h-14 border-b bg-white flex items-center px-4 gap-3 shrink-0 shadow-sm">

        {/* Left */}
        <div className="flex items-center gap-3 flex-1 min-w-0">

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={handleUndo}
              disabled={!history.canUndo}
              title="Geri al (Ctrl+Z)"
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                history.canUndo
                  ? "text-gray-700 hover:bg-white hover:shadow-sm cursor-pointer"
                  : "text-gray-300 cursor-not-allowed"
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!history.canRedo}
              title="İleri al (Ctrl+Shift+Z)"
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                history.canRedo
                  ? "text-gray-700 hover:bg-white hover:shadow-sm cursor-pointer"
                  : "text-gray-300 cursor-not-allowed"
              )}
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">{trip.title}</h1>
            <LayoutGrid className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          </div>

          {/* Save indicator */}
          <AnimatePresence mode="wait">
            {saveStatus === 'saving' && (
              <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest"
              >
                <Loader2 className="h-3 w-3 animate-spin" /> Kaydediliyor...
              </motion.span>
            )}
            {saveStatus === 'saved' && (
              <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-[10px] font-bold text-green-500"
              >
                <CheckCircle2 className="h-3 w-3" /> Kaydedildi
              </motion.span>
            )}
            {saveStatus === 'unsaved' && (
              <motion.div key="dot" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-2 h-2 rounded-full bg-orange-400"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!user && (
            <Button size="sm" onClick={() => navigate('/login')}
              className="bg-orange-600 hover:bg-orange-700 h-8 px-4 rounded-full text-xs font-bold gap-1.5">
              Kaydetmek için giriş yap
            </Button>
          )}

          {user && (
            isPublic ? (
              <Button variant="outline" size="sm"
                className="h-8 px-3 rounded-xl border-green-200 text-green-700 bg-green-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs font-bold gap-1.5 transition-all"
                onClick={handleUnpublish}>
                <Globe className="h-3.5 w-3.5" />
                Yayında
              </Button>
            ) : (
              <Button variant="outline" size="sm"
                className="h-8 px-3 rounded-xl border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 text-xs font-bold gap-1.5"
                onClick={() => setShowPublishModal(true)}>
                <GlobeLock className="h-3.5 w-3.5" />
                Yayınla
              </Button>
            )
          )}

          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-bold">Geziyi sil?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>"{trip.title}"</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-xl font-bold">
                  Evet, Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">

        {/* Day sidebar */}
        <aside className="w-16 md:w-[72px] border-r bg-gray-50/50 flex flex-col shrink-0 overflow-y-auto">
          <div className="py-4 flex flex-col items-center gap-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Günler</span>
            <div className="flex flex-col gap-2 w-full px-2 mt-1">
              {trip.itinerary.days.map((day, idx) => (
                <motion.button
                  key={day.day}
                  onClick={() => setSelectedDayIndex(idx)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 rounded-xl transition-all",
                    selectedDayIndex === idx
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                      : "text-gray-400 hover:bg-white hover:text-gray-900 hover:shadow-sm"
                  )}
                >
                  <span className="text-[9px] font-black uppercase tracking-tighter">Gün {day.day}</span>
                  <span className={cn("text-[8px] font-semibold mt-0.5",
                    selectedDayIndex === idx ? "text-orange-200" : "text-gray-400"
                  )}>
                    {getDayDate(idx)}
                  </span>
                  <Badge className={cn(
                    "mt-1.5 text-[8px] px-1.5 py-0 h-4 font-black border-0 rounded-full",
                    selectedDayIndex === idx ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                  )}>
                    {day.items.length}
                  </Badge>
                </motion.button>
              ))}

              <button
                onClick={handleAddDay}
                className="flex flex-col items-center justify-center py-3 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span className="text-[8px] font-black uppercase mt-1">Ekle</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Timeline panel */}
        <section className="w-full lg:w-[45%] xl:w-[40%] overflow-y-auto bg-white border-r flex flex-col">
          {/* Sticky day header */}
          <div className="px-6 py-4 border-b sticky top-0 bg-white/95 backdrop-blur-sm z-30">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-black text-gray-900">Gün {selectedDay.day}</h2>
                  <span className="text-sm font-semibold text-gray-400">{getDayDate(selectedDayIndex)}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                    <MapPin className="h-3 w-3 text-orange-500" />
                    {dayStats?.places || 0} durak
                  </span>
                  {dayStats && dayStats.places > 0 && (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                      <Clock className="h-3 w-3 text-orange-500" />
                      ~{dayStats.duration}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-orange-600 hover:bg-orange-700"
                  onClick={() => {
                    document.getElementById(`place-search-day-0`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => (document.querySelector(`#place-search-day-0 input`) as HTMLInputElement)?.focus(), 400);
                  }}>
                  <Plus className="h-3 w-3" />Yer Ekle
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <Timeline
              itinerary={{ days: [selectedDay] }}
              onReorder={(_, items) => handleReorder(selectedDayIndex, items)}
              onAddPlace={(_, place) => handleAddPlace(selectedDayIndex, place)}
              onDeletePlace={(_, id) => handleDeletePlace(selectedDayIndex, id)}
              onUpdatePlaceNote={(_, id, note) => handleUpdatePlaceNote(selectedDayIndex, id, note)}
              onUpdateDayNote={(_, note) => handleUpdateDayNote(selectedDayIndex, note)}
              onPlaceClick={setActivePlaceId}
              activePlaceId={activePlaceId}
            />
          </div>
        </section>

        {/* Map panel */}
        <section className="hidden lg:block flex-1 relative bg-gray-100">
          <TripMap
            itinerary={{ days: [selectedDay] }}
            activePlaceId={activePlaceId}
            onMarkerClick={(id) => {
              setActivePlaceId(id);
              document.getElementById(`place-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onAddPlace={(place) => handleAddPlace(selectedDayIndex, place)}
          />

          {/* Stats overlay */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/50">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Özet</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-black text-gray-900 leading-none">{selectedDay.items.length}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Durak</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-2xl font-black text-gray-900 leading-none">{dayStats?.duration || '—'}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Süre</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile map sheet */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Sheet open={isMapSheetOpen} onOpenChange={setIsMapSheetOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="h-12 px-6 rounded-full shadow-2xl bg-orange-600 hover:bg-orange-700 font-black text-[10px] uppercase tracking-wider gap-2">
                <MapPin className="h-4 w-4" />
                Haritayı Aç
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-3xl overflow-hidden">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-base font-bold">Rota — Gün {selectedDay.day}</SheetTitle>
              </SheetHeader>
              <div className="h-full relative">
                <TripMap
                  itinerary={{ days: [selectedDay] }}
                  activePlaceId={activePlaceId}
                  onMarkerClick={(id) => {
                    setActivePlaceId(id);
                    setIsMapSheetOpen(false);
                    document.getElementById(`place-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  onAddPlace={(place) => {
                    handleAddPlace(selectedDayIndex, place);
                    setIsMapSheetOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>
    </div>
  );
}
// ════════════════════════════════════════════════════════════════════════════
// TripDetailsPage — Wanderlog tarzı tek sayfa planlayıcı
// DOSYA: src/pages/TripDetailsPage.tsx
// ════════════════════════════════════════════════════════════════════════════
import { TripBookingPanel } from '@/components/trip/TripBookingPanel';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, {
  Trip, Place, ItineraryDay,
  TripSection, SavedPlace, BudgetItem, BudgetCategory,
} from '@/db/api';
import { Timeline } from '@/components/trip/Timeline';
import { TripMap } from '@/components/trip/Map';
import { AddToTripPanel } from '@/components/trip/AddToTripPanel';
import {
  Loader2, Share2, MapPin, Trash2, Plus,
  RotateCcw, RotateCw, CheckCircle2, Clock,
  Navigation, Globe, GlobeLock, X,
  ChevronDown, ChevronRight,
  MessageSquare, Wallet, Hotel, UtensilsCrossed,
  Compass, Star, ShoppingBag, Plane, Car, Train,
  PiggyBank, CalendarDays, Users, Wind, Bus, Zap,
  ExternalLink, Edit3, Euro,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format, addDays, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// ── Bütçe kategorileri ───────────────────────────────────────────────────────
const BUDGET_CATS: { id: BudgetCategory; label: string; icon: any; color: string }[] = [
  { id: 'flight',     label: 'Uçuş',      icon: Plane,           color: 'bg-sky-100 text-sky-700' },
  { id: 'lodging',    label: 'Konaklama', icon: Hotel,           color: 'bg-purple-100 text-purple-700' },
  { id: 'rental_car', label: 'Araç',      icon: Car,             color: 'bg-emerald-100 text-emerald-700' },
  { id: 'train',      label: 'Ulaşım',    icon: Train,           color: 'bg-blue-100 text-blue-700' },
  { id: 'food',       label: 'Yiyecek',   icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-700' },
  { id: 'activities', label: 'Aktivite',  icon: Star,            color: 'bg-amber-100 text-amber-700' },
  { id: 'other',      label: 'Diğer',     icon: ShoppingBag,     color: 'bg-gray-100 text-gray-600' },
];

const SECTION_TYPES = [
  { id: 'places' as const,      label: 'Gezilecek',   icon: Compass,         color: 'text-blue-500' },
  { id: 'hotels' as const,      label: 'Konaklama',   icon: Hotel,           color: 'text-purple-500' },
  { id: 'restaurants' as const, label: 'Restoranlar', icon: UtensilsCrossed, color: 'text-orange-500' },
  { id: 'activities' as const,  label: 'Aktiviteler', icon: Star,            color: 'text-amber-500' },
  { id: 'custom' as const,      label: 'Özel',        icon: ShoppingBag,     color: 'text-gray-500' },
];

// ── Undo/Redo ────────────────────────────────────────────────────────────────
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
  return { current, push, undo, redo, canUndo, canRedo };
}

// ════════════════════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════════════════════
export default function TripDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(null);
  const [isMapSheetOpen, setIsMapSheetOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hangi günler açık
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  // Aktif gün (harita için)
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  // Discover panel
  const [showDiscoverPanel, setShowDiscoverPanel] = useState(false);
  const [discoverDayIndex, setDiscoverDayIndex] = useState(0);
  // Publish modal
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [guideIntro, setGuideIntro] = useState('');
  const [guideTips, setGuideTips] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Sol panel accordion state
  const [notesOpen, setNotesOpen] = useState(true);
  const [placesOpen, setPlacesOpen] = useState(true);
  const [itineraryOpen, setItineraryOpen] = useState(true);
  const [budgetOpen, setBudgetOpen] = useState(false);

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  // Budget form
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState<Partial<BudgetItem>>({ category: 'other', currency: 'EUR', amount: 0, name: '' });
  const [budgetTotalDraft, setBudgetTotalDraft] = useState('');

  // Sections form
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionType, setNewSectionType] = useState<TripSection['type']>('places');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [quickAddValues, setQuickAddValues] = useState<Record<string, string>>({});

  // History
  const history = useUndoRedo<Trip['itinerary'] | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────
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
          setNoteDraft(data.trip_notes || '');
          setBudgetTotalDraft(String(data.budget_total || ''));
          // İlk günü aç
          setExpandedDays(new Set([0]));
        } else {
          toast.error('Gezi bulunamadı');
          navigate('/explore');
        }
      } catch { toast.error('Gezi yüklenemedi'); }
      finally { setLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Persist ───────────────────────────────────────────────────────────────
  const scheduleWrite = useCallback((t: Trip) => {
    setSaveStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await api.updateTrip(t.id, {
          itinerary: t.itinerary,
          trip_notes: t.trip_notes,
          sections: t.sections,
          budget_items: t.budget_items,
          budget_total: t.budget_total,
          budget_currency: t.budget_currency,
        } as any);
        setSaveStatus('saved');
      } catch { setSaveStatus('unsaved'); toast.error('Değişiklikler kaydedilemedi'); }
    }, 1500);
  }, []);

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

  const updateTrip = useCallback((updater: (t: Trip) => Trip) => {
    setTrip(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      scheduleWrite(next);
      return next;
    });
  }, [scheduleWrite]);

  // ── Undo/Redo ─────────────────────────────────────────────────────────────
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  // ── Itinerary mutators ─────────────────────────────────────────────────────
  const withDays = useCallback((fn: (days: ItineraryDay[]) => ItineraryDay[]) => {
    if (!trip) return;
    applyItinerary({ ...trip.itinerary, days: fn([...trip.itinerary.days]) });
  }, [trip, applyItinerary]);

  // ── Çakışma kontrolü ──────────────────────────────────────────────────────
  const validateAddToDay = useCallback((day: ItineraryDay, place: Place): string | null => {
    const agencyType = place.agency_service?.type;
    const hasBalloon = day.items.some(i => i.agency_service?.type === 'balloon');
    const hasTour    = day.items.some(i => i.agency_service?.type === 'tour');

    if (agencyType === 'balloon' && hasTour)
      return '🎈 Balon günü tur eklenmez. Balonu ayrı bir güne taşıyın.';
    if (agencyType === 'balloon' && hasBalloon)
      return '🎈 Bu güne zaten bir balon turu eklenmiş.';
    if (agencyType === 'tour' && hasBalloon)
      return '🗺 Balon günü tur eklenmez. Turu ayrı bir güne ekleyin.';
    if (agencyType === 'tour' && hasTour)
      return '🗺 Bu güne zaten bir tur eklenmiş. Kapadokya’da günde en fazla 1 tur yapılabilir.';
    return null;
  }, []);

  const handleAddPlace = useCallback((dayIndex: number, place: Place) => {
    withDays(days => {
      const day = days[dayIndex];

      // Çakışma kontrolü
      const conflict = validateAddToDay(day, place);
      if (conflict) {
        toast.error(conflict, { duration: 4000 });
        return days; // değiştirme
      }

      const toHHMM = (mins: number) =>
        `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

      // Agency servisler için saati koru — genel yer ekleme mantığı ezmesin
      const agencyType = place.agency_service?.type;
      let startTime = place.start_time;
      let endTime   = place.end_time;

      if (!agencyType) {
        // Genel Google Places yeri → son öğeden sonraya koy
        const last = day.items.filter(i => !i.agency_service?.type.match(/balloon/)).at(-1);
        let startMin = 9 * 60;
        if (last) {
          const [h, m] = (last.start_time || '09:00').split(':').map(Number);
          startMin = h * 60 + m + (last.estimated_duration_minutes || 60) + 20;
        }
        startTime = toHHMM(startMin);
        endTime   = toHHMM(startMin + (place.estimated_duration_minutes || 60));
      } else if (agencyType === 'balloon') {
        // Balon her zaman 05:30
        startTime = '05:30';
        endTime   = toHHMM(5 * 60 + 30 + (place.estimated_duration_minutes || 90));
      } else if (agencyType === 'tour') {
        // Tur kendi start_time değerini korur (genellikle 09:00)
        startTime = place.start_time || '09:00';
        endTime = toHHMM(parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]) + (place.estimated_duration_minutes || 480));
      } else if (agencyType === 'activity') {
        // Aktivite kendi time_slot'unu korur
        startTime = place.start_time || '10:00';
        endTime = toHHMM(parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]) + (place.estimated_duration_minutes || 120));
        );
      }

      const newPlace = { ...place, start_time: startTime, end_time: endTime };
      days[dayIndex] = { ...day, items: [...day.items, newPlace] };
      return days;
    });

    const agencyType = place.agency_service?.type;
    if (agencyType === 'balloon') {
      toast.success(`${place.name} eklendi — ⏰ 05:30 kalkış! Bir önceki gece erken yatmanız önerilir.`, { duration: 5000 });
    } else if (agencyType === 'tour') {
      toast.success(`${place.name} rotaya eklendi — kalkış: ${place.start_time || '09:00'}`);
    } else {
      toast.success(`${place.name} rotaya eklendi`);
    }
  }, [withDays, validateAddToDay]);

  const handleDeletePlace = useCallback((dayIndex: number, placeId: string) => {
    withDays(days => {
      days[dayIndex] = { ...days[dayIndex], items: days[dayIndex].items.filter(i => i.place_id !== placeId) };
      return days;
    });
    toast.success('Durak kaldırıldı');
  }, [withDays]);

  const handleUpdatePlaceNote = useCallback((dayIndex: number, placeId: string, note: string) => {
    withDays(days => {
      const items = [...days[dayIndex].items];
      const idx = items.findIndex(i => i.place_id === placeId);
      if (idx > -1) items[idx] = { ...items[idx], notes: note };
      days[dayIndex] = { ...days[dayIndex], items };
      return days;
    });
  }, [withDays]);

  const handleUpdateDayNote = useCallback((dayIndex: number, note: string) => {
    withDays(days => { days[dayIndex] = { ...days[dayIndex], notes: note }; return days; });
  }, [withDays]);

  const handleReorder = useCallback((dayIndex: number, newItems: Place[]) => {
    withDays(days => { days[dayIndex] = { ...days[dayIndex], items: newItems }; return days; });
  }, [withDays]);

  const handleAddDay = useCallback(() => {
    if (!trip) return;
    const nextNum = trip.itinerary.days.length + 1;
    withDays(days => [...days, { day: nextNum, items: [] }]);
    toast.success(`Gün ${nextNum} eklendi`);
    const newIdx = trip.itinerary.days.length;
    setExpandedDays(prev => new Set([...prev, newIdx]));
    setActiveDayIndex(newIdx);
  }, [trip, withDays]);

  // ── Notes ────────────────────────────────────────────────────────────────
  const handleSaveNotes = () => {
    updateTrip(t => ({ ...t, trip_notes: noteDraft }));
    setEditingNotes(false);
    toast.success('Not kaydedildi');
  };

  // ── Sections ──────────────────────────────────────────────────────────────
  const handleAddSection = () => {
    const typeMeta = SECTION_TYPES.find(t => t.id === newSectionType);
    const sectionId = `section_${Date.now()}`;
    updateTrip(t => ({
      ...t,
      sections: [...(t.sections || []), {
        id: sectionId,
        title: newSectionTitle.trim() || typeMeta?.label || 'Yeni Bölüm',
        type: newSectionType,
        items: [],
      }],
    }));
    setShowAddSection(false);
    setNewSectionTitle('');
    toast.success('Bölüm eklendi');
  };

  const handleDeleteSection = (sectionId: string) => {
    updateTrip(t => ({ ...t, sections: (t.sections || []).filter(s => s.id !== sectionId) }));
  };

  const handleQuickAddPlace = (sectionId: string) => {
    const name = (quickAddValues[sectionId] || '').trim();
    if (!name) return;
    updateTrip(t => ({
      ...t,
      sections: (t.sections || []).map(s =>
        s.id === sectionId ? {
          ...s, items: [...s.items, {
            id: `saved_${Date.now()}`,
            place_id: `manual_${Date.now()}`,
            name, lat: 38.6431, lng: 34.8347, category: 'Yer',
          }]
        } : s
      ),
    }));
    setQuickAddValues(prev => ({ ...prev, [sectionId]: '' }));
  };

  const handleDeleteSavedPlace = (sectionId: string, placeId: string) => {
    updateTrip(t => ({
      ...t,
      sections: (t.sections || []).map(s =>
        s.id === sectionId ? { ...s, items: s.items.filter(i => i.id !== placeId) } : s
      ),
    }));
  };

  // ── Budget ─────────────────────────────────────────────────────────────────
  const handleAddBudgetItem = () => {
    if (!budgetForm.name?.trim() || !budgetForm.amount) return;
    updateTrip(t => ({
      ...t, budget_items: [...(t.budget_items || []), {
        id: `budget_${Date.now()}`,
        category: budgetForm.category || 'other',
        name: budgetForm.name!,
        amount: Number(budgetForm.amount),
        currency: budgetForm.currency || 'EUR',
      }],
    }));
    setBudgetForm({ category: 'other', currency: 'EUR', amount: 0, name: '' });
    setShowBudgetForm(false);
  };

  const handleDeleteBudgetItem = (itemId: string) => {
    updateTrip(t => ({ ...t, budget_items: (t.budget_items || []).filter(i => i.id !== itemId) }));
  };

  // ── Share/Publish/Delete ──────────────────────────────────────────────────
  const handleShare = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success('Link kopyalandı'); }
    catch { toast.error('Kopyalama başarısız'); }
  };

  const handlePublish = async () => {
    if (!trip) return;
    setPublishLoading(true);
    try {
      const tips = guideTips.split('\n').map(t => t.trim()).filter(Boolean);
      await api.publishGuide(trip.id, { guide_intro: guideIntro, guide_tips: tips });
      setIsPublic(true); setShowPublishModal(false);
      toast.success('Rehber yayınlandı!');
    } catch { toast.error('Yayınlama başarısız'); }
    finally { setPublishLoading(false); }
  };

  const handleUnpublish = async () => {
    if (!trip) return;
    try { await api.unpublishGuide(trip.id); setIsPublic(false); toast.success('Yayından kaldırıldı'); }
    catch { toast.error('İşlem başarısız'); }
  };

  const handleDelete = async () => {
    if (!trip) return;
    try { await api.deleteTrip(trip.id); toast.success('Gezi silindi'); navigate('/account'); }
    catch { toast.error('Gezi silinemedi'); }
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const getDayDate = useCallback((idx: number) => {
    if (!trip) return '';
    try { return format(addDays(new Date(trip.start_date), idx), 'd MMM EEE', { locale: tr }); }
    catch { return ''; }
  }, [trip]);

  const tripDays = useMemo(() => {
    if (!trip) return 0;
    try { return differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1; }
    catch { return trip.itinerary.days.length; }
  }, [trip]);

  const budgetStats = useMemo(() => {
    const items = trip?.budget_items || [];
    const total = items.reduce((s, i) => s + (i.amount || 0), 0);
    const byCategory: Record<string, number> = {};
    items.forEach(i => { byCategory[i.category] = (byCategory[i.category] || 0) + i.amount; });
    const sym = (trip?.budget_currency || 'EUR') === 'EUR' ? '€' : (trip?.budget_currency || 'EUR') === 'USD' ? '$' : '₺';
    return { total, byCategory, sym };
  }, [trip]);

  const totalPlaces = useMemo(() =>
    trip?.itinerary.days.reduce((s, d) => s + d.items.length, 0) || 0,
    [trip]
  );

  const existingPlaceIds = useMemo(() =>
    trip?.itinerary.days.flatMap(d => d.items.map(i => i.place_id)) || [],
    [trip]
  );

  const activeDay = useMemo(() =>
    trip?.itinerary.days[activeDayIndex] || trip?.itinerary.days[0],
    [trip, activeDayIndex]
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          <Navigation className="absolute inset-0 m-auto h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-semibold text-gray-400">Rota yükleniyor...</p>
      </div>
    );
  }
  if (!trip) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">

      {/* ── Publish Modal ──────────────────────────────────────────────── */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-black text-gray-900">Rehber Olarak Yayınla</h2></div>
              <button onClick={() => setShowPublishModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <textarea value={guideIntro} onChange={e => setGuideIntro(e.target.value)} placeholder="Kapadokya deneyiminizi anlatın..." rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea value={guideTips} onChange={e => setGuideTips(e.target.value)} placeholder={"Sabah erken çıkın\nBalon için önceden rezervasyon yapın"} rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold" onClick={() => setShowPublishModal(false)}>Vazgeç</Button>
              <Button className="flex-1 h-11 rounded-xl font-black bg-primary gap-2" onClick={handlePublish} disabled={publishLoading}>
                {publishLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Yayınla
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <div className="h-14 border-b bg-white flex items-center px-4 gap-3 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button onClick={handleUndo} disabled={!history.canUndo}
              className={cn('h-7 w-7 rounded-md flex items-center justify-center transition-all',
                history.canUndo ? 'text-gray-700 hover:bg-white hover:shadow-sm' : 'text-gray-300 cursor-not-allowed')}>
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleRedo} disabled={!history.canRedo}
              className={cn('h-7 w-7 rounded-md flex items-center justify-center transition-all',
                history.canRedo ? 'text-gray-700 hover:bg-white hover:shadow-sm' : 'text-gray-300 cursor-not-allowed')}>
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <h1 className="text-sm font-bold text-gray-900 truncate">{trip.title}</h1>
          <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
            {tripDays} gün · {totalPlaces} durak
          </span>
          <AnimatePresence mode="wait">
            {saveStatus === 'saving' && (
              <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />Kaydediliyor
              </motion.span>
            )}
            {saveStatus === 'saved' && (
              <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                <CheckCircle2 className="h-3 w-3" />Kaydedildi
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!user && (
            <Button size="sm" onClick={() => navigate('/login')} className="bg-primary h-8 px-4 rounded-full text-xs font-bold gap-1.5">
              Giriş yap
            </Button>
          )}
          {user && (isPublic ? (
            <Button variant="outline" size="sm" onClick={handleUnpublish}
              className="h-8 px-3 rounded-xl border-green-200 text-green-700 bg-green-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs font-bold gap-1.5 transition-all">
              <Globe className="h-3.5 w-3.5" />Yayında
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowPublishModal(true)}
              className="h-8 px-3 rounded-xl border-primary/20 text-primary bg-primary/10 hover:bg-primary/20 text-xs font-bold gap-1.5">
              <GlobeLock className="h-3.5 w-3.5" />Yayınla
            </Button>
          ))}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500" onClick={handleShare}>
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
                <AlertDialogDescription>"{trip.title}" kalıcı olarak silinecek.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-xl font-bold">Sil</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">

        {/* ═══════════════════════════════════════════════════════════════
            SOL PANEL — TEK SAYFA KAYDIRMA
        ════════════════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[420px] xl:w-[460px] flex flex-col border-r bg-white shrink-0 overflow-y-auto">

          {/* ─── Trip Hero ──────────────────────────────────────────────── */}
          <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 border-b px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-300/40 shrink-0">
                <Navigation className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black text-gray-900 truncate">{trip.title}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-gray-600">
                    <CalendarDays className="h-3 w-3 text-primary" />
                    {trip.start_date && format(new Date(trip.start_date), 'd MMM', { locale: tr })}
                    {' – '}
                    {trip.end_date && format(new Date(trip.end_date), 'd MMM yyyy', { locale: tr })}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-gray-600">
                    <Clock className="h-3 w-3 text-primary" />
                    {tripDays} gün
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-gray-600">
                    <MapPin className="h-3 w-3 text-primary" />
                    {totalPlaces} durak
                  </span>
                </div>
              </div>
            </div>

            {/* Hızlı stats */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { icon: Wind, label: 'Balon', count: trip.itinerary.days.flatMap(d => d.items).filter(i => i.agency_service?.type === 'balloon').length, color: 'text-sky-500' },
                { icon: Bus, label: 'Tur', count: trip.itinerary.days.flatMap(d => d.items).filter(i => i.agency_service?.type === 'tour').length, color: 'text-orange-500' },
                { icon: Zap, label: 'Aktivite', count: trip.itinerary.days.flatMap(d => d.items).filter(i => i.agency_service?.type === 'activity').length, color: 'text-purple-500' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-1.5 bg-white/70 rounded-xl px-2.5 py-2 border border-white/80">
                  <stat.icon className={cn('h-3.5 w-3.5 shrink-0', stat.color)} />
                  <div>
                    <p className="text-[11px] font-black text-gray-800">{stat.count}</p>
                    <p className="text-[9px] text-gray-400 font-semibold">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── NOTLAR ─────────────────────────────────────────────────── */}
          <SectionAccordion
            title="Notlar"
            icon={<MessageSquare className="h-3.5 w-3.5 text-amber-500" />}
            isOpen={notesOpen}
            onToggle={() => setNotesOpen(v => !v)}
          >
            {editingNotes ? (
              <div className="px-4 py-3 space-y-2">
                <Textarea
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                  placeholder="Ulaşım notları, otel bilgileri, önemli hatırlatmalar..."
                  className="min-h-[90px] text-sm rounded-xl bg-amber-50 border-amber-200 resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs font-bold" onClick={() => setEditingNotes(false)}>Vazgeç</Button>
                  <Button size="sm" className="h-7 text-xs font-bold bg-primary" onClick={handleSaveNotes}>Kaydet</Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setEditingNotes(true); setNoteDraft(trip.trip_notes || ''); }}
                className="w-full text-left px-4 py-3 hover:bg-amber-50/50 transition-colors group min-h-[56px]"
              >
                {trip.trip_notes ? (
                  <p className="text-sm text-gray-600 leading-relaxed">{trip.trip_notes}</p>
                ) : (
                  <p className="text-sm text-gray-400 group-hover:text-gray-500 italic">
                    Ulaşım notları, otel bilgileri, önemli hatırlatmalar...
                  </p>
                )}
              </button>
            )}
          </SectionAccordion>

          {/* ─── GEZİLECEK YERLER / BÖLÜMLER ───────────────────────────── */}
          <SectionAccordion
            title="Gezilecek Yerler"
            icon={<Compass className="h-3.5 w-3.5 text-blue-500" />}
            isOpen={placesOpen}
            onToggle={() => setPlacesOpen(v => !v)}
          >
            {/* Her bölüm */}
            {(trip.sections || []).map(section => {
              const typeMeta = SECTION_TYPES.find(t => t.id === section.type);
              const SIcon = typeMeta?.icon || Compass;
              return (
                <div key={section.id} className="border-b border-gray-50">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/80">
                    <SIcon className={cn('h-3.5 w-3.5', typeMeta?.color)} />
                    <span className="text-[12px] font-bold text-gray-700 flex-1">{section.title}</span>
                    <button onClick={() => handleDeleteSection(section.id)} className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-400 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {section.items.map(place => (
                    <div key={place.id} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 group">
                      <MapPin className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{place.name}</span>
                      <button onClick={() => handleDeleteSavedPlace(section.id, place.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all">
                        <X className="h-3 w-3 text-gray-300" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 px-4 py-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    <input
                      value={quickAddValues[section.id] || ''}
                      onChange={e => setQuickAddValues(prev => ({ ...prev, [section.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleQuickAddPlace(section.id); }}
                      placeholder="Yer ekle..."
                      className="flex-1 text-sm text-gray-600 placeholder:text-gray-300 bg-transparent outline-none py-0.5"
                    />
                    {quickAddValues[section.id] && (
                      <button onClick={() => handleQuickAddPlace(section.id)}
                        className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20">
                        <Plus className="h-3 w-3 text-primary" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Yeni bölüm ekle */}
            <div className="px-4 py-3">
              {showAddSection ? (
                <div className="space-y-2 bg-gray-50 rounded-xl p-3">
                  <div className="grid grid-cols-5 gap-1">
                    {SECTION_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <button key={type.id} onClick={() => setNewSectionType(type.id)}
                          className={cn('flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-[9px] font-bold transition-all',
                            newSectionType === type.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white text-gray-500')}>
                          <Icon className={cn('h-4 w-4', newSectionType === type.id ? 'text-primary' : type.color)} />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                  <Input value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)}
                    placeholder="Bölüm adı (isteğe bağlı)" className="h-8 text-sm rounded-lg"
                    onKeyDown={e => { if (e.key === 'Enter') handleAddSection(); }} />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs font-bold" onClick={() => setShowAddSection(false)}>Vazgeç</Button>
                    <Button size="sm" className="flex-1 h-8 text-xs font-bold bg-primary" onClick={handleAddSection}>Ekle</Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddSection(true)}
                  className="w-full flex items-center gap-2 py-1.5 text-xs font-bold text-gray-400 hover:text-primary transition-colors group">
                  <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 group-hover:border-primary flex items-center justify-center transition-colors">
                    <Plus className="h-3 w-3" />
                  </div>
                  Başlık ekle (örn: "Restoranlar")
                </button>
              )}
            </div>
          </SectionAccordion>

          {/* ─── ITINERARY — GÜN GÜN ────────────────────────────────────── */}
          <SectionAccordion
            title="Itinerary"
            icon={<CalendarDays className="h-3.5 w-3.5 text-teal-500" />}
            isOpen={itineraryOpen}
            onToggle={() => setItineraryOpen(v => !v)}
            badge={<span className="text-[10px] font-black text-gray-400">{tripDays} gün</span>}
          >
            {trip.itinerary.days.map((day, idx) => {
              const isExpanded = expandedDays.has(idx);
              const date = getDayDate(idx);
              const agencyCount = day.items.filter(i => i.agency_service).length;
              const hasBalloon = day.items.some(i => i.agency_service?.type === 'balloon');
              const tourItem = day.items.find(i => i.agency_service?.type === 'tour');

              return (
                <div key={day.day} className="border-b border-gray-50 last:border-0">
                  {/* Gün başlığı */}
                  <button
                    onClick={() => {
                      setExpandedDays(prev => {
                        const next = new Set(prev);
                        if (next.has(idx)) next.delete(idx);
                        else next.add(idx);
                        return next;
                      });
                      setActiveDayIndex(idx);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group text-left"
                  >
                    {/* Gün numarası */}
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0 transition-all',
                      activeDayIndex === idx ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                    )}>
                      <span className="text-[9px] font-black uppercase leading-none">Gün</span>
                      <span className="text-sm font-black leading-none">{day.day}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">{date}</span>
                        {hasBalloon && (
                          <span className="flex items-center gap-0.5 text-[9px] font-black text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">
                            <Wind className="h-2.5 w-2.5" />Balon
                          </span>
                        )}
                        {tourItem && (
                          <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
                            {tourItem.name.split(' ').slice(0, 2).join(' ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">{day.items.length} durak</span>
                        {agencyCount > 0 && <span className="text-[10px] font-bold text-primary">{agencyCount} servis</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        onClick={e => { e.stopPropagation(); setDiscoverDayIndex(idx); setShowDiscoverPanel(true); }}
                        className="h-7 px-2.5 text-[10px] font-bold bg-primary rounded-lg gap-1 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Plus className="h-3 w-3" />Ekle
                      </Button>
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-gray-400" />
                        : <ChevronRight className="h-4 w-4 text-gray-400" />
                      }
                    </div>
                  </button>

                  {/* Gün içeriği — Timeline */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-gray-50"
                      >
                        {/* Balon özel banner */}
                        {hasBalloon && (
                          <div className="mx-4 mt-3 flex items-center gap-2.5 px-3 py-2 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl">
                            <Wind className="h-4 w-4 text-sky-500 shrink-0" />
                            <div>
                              <p className="text-[11px] font-black text-sky-700">Balon günü! ⏰ 05:30 kalkış</p>
                              <p className="text-[10px] text-sky-500">Bir gün öncesinden hazırlık yapın. Transfer sabah 04:45'te.</p>
                            </div>
                          </div>
                        )}

                        <Timeline
                          itinerary={{ days: [day] }}
                          onReorder={(_, items) => handleReorder(idx, items)}
                          onAddPlace={(_, place) => handleAddPlace(idx, place)}
                          onDeletePlace={(_, placeId) => handleDeletePlace(idx, placeId)}
                          onUpdatePlaceNote={(_, placeId, note) => handleUpdatePlaceNote(idx, placeId, note)}
                          onUpdateDayNote={(_, note) => handleUpdateDayNote(idx, note)}
                          onPlaceClick={(placeId) => { setActivePlaceId(placeId); setActiveDayIndex(idx); }}
                          activePlaceId={activePlaceId}
                          onOpenDiscover={() => { setDiscoverDayIndex(idx); setShowDiscoverPanel(true); }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Yeni gün ekle */}
            <button
              onClick={handleAddDay}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group text-left"
            >
              <div className="w-9 h-9 rounded-xl border-2 border-dashed border-gray-200 group-hover:border-primary flex items-center justify-center transition-colors">
                <Plus className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-bold text-gray-400 group-hover:text-primary transition-colors">
                Yeni gün ekle
              </span>
            </button>
          </SectionAccordion>

          {/* ─── BÜTÇE ──────────────────────────────────────────────────── */}
          <SectionAccordion
            title="Bütçe"
            icon={<Wallet className="h-3.5 w-3.5 text-emerald-500" />}
            isOpen={budgetOpen}
            onToggle={() => setBudgetOpen(v => !v)}
            badge={
              (trip.budget_items?.length || 0) > 0 ? (
                <span className={cn(
                  'text-[10px] font-black px-1.5 py-0.5 rounded-full',
                  trip.budget_total && budgetStats.total > trip.budget_total
                    ? 'bg-red-50 text-red-500'
                    : 'bg-emerald-50 text-emerald-600'
                )}>
                  {budgetStats.sym}{budgetStats.total.toFixed(0)}
                </span>
              ) : undefined
            }
          >
            <div className="px-4 py-3 space-y-3">
              {/* Hedef bütçe */}
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Hedef:</span>
                <div className="flex items-center gap-1 bg-gray-50 border rounded-lg px-2 py-1">
                  <input
                    type="number"
                    value={budgetTotalDraft}
                    onChange={e => setBudgetTotalDraft(e.target.value)}
                    onBlur={() => updateTrip(t => ({ ...t, budget_total: Number(budgetTotalDraft), budget_currency: 'EUR' }))}
                    className="w-20 text-sm font-bold bg-transparent outline-none"
                    placeholder="0"
                  />
                  <span className="text-xs font-bold text-gray-400">€</span>
                </div>
                {trip.budget_total && budgetStats.total > 0 && (
                  <span className={cn('text-[11px] font-bold ml-auto', budgetStats.total > trip.budget_total ? 'text-red-500' : 'text-emerald-600')}>
                    {budgetStats.total > trip.budget_total
                      ? `${budgetStats.sym}${(budgetStats.total - trip.budget_total).toFixed(0)} aşıldı`
                      : `${budgetStats.sym}${(trip.budget_total - budgetStats.total).toFixed(0)} kaldı`
                    }
                  </span>
                )}
              </div>

              {/* Harcama listesi */}
              {(trip.budget_items || []).map(item => {
                const catMeta = BUDGET_CATS.find(c => c.id === item.category);
                const CatIcon = catMeta?.icon || ShoppingBag;
                return (
                  <div key={item.id} className="flex items-center gap-2 py-1.5 group">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', catMeta?.color || 'bg-gray-100 text-gray-500')}>
                      <CatIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-gray-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400">{catMeta?.label}</p>
                    </div>
                    <span className="text-sm font-black text-gray-700 shrink-0">
                      {item.currency === 'EUR' ? '€' : item.currency === 'USD' ? '$' : '₺'}{item.amount}
                    </span>
                    <button onClick={() => handleDeleteBudgetItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all">
                      <X className="h-3.5 w-3.5 text-gray-300" />
                    </button>
                  </div>
                );
              })}

              {/* Harcama ekle */}
              {showBudgetForm ? (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-4 gap-1">
                    {BUDGET_CATS.slice(0, 4).map(cat => {
                      const Icon = cat.icon;
                      return (
                        <button key={cat.id} onClick={() => setBudgetForm(p => ({ ...p, category: cat.id }))}
                          className={cn('flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-[9px] font-bold transition-all',
                            budgetForm.category === cat.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white text-gray-500')}>
                          <Icon className="h-3.5 w-3.5" />{cat.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {BUDGET_CATS.slice(4).map(cat => {
                      const Icon = cat.icon;
                      return (
                        <button key={cat.id} onClick={() => setBudgetForm(p => ({ ...p, category: cat.id }))}
                          className={cn('flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-[9px] font-bold transition-all',
                            budgetForm.category === cat.id ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-white text-gray-500')}>
                          <Icon className="h-3.5 w-3.5" />{cat.label}
                        </button>
                      );
                    })}
                  </div>
                  <Input placeholder="Harcama adı..." value={budgetForm.name || ''} onChange={e => setBudgetForm(p => ({ ...p, name: e.target.value }))} className="h-9 text-sm rounded-lg" />
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center border rounded-lg overflow-hidden">
                      <input type="number" placeholder="0" value={budgetForm.amount || ''}
                        onChange={e => setBudgetForm(p => ({ ...p, amount: Number(e.target.value) }))}
                        className="flex-1 px-3 py-2 text-sm outline-none bg-transparent" />
                      <select value={budgetForm.currency || 'EUR'} onChange={e => setBudgetForm(p => ({ ...p, currency: e.target.value }))}
                        className="border-l px-2 py-2 text-xs bg-gray-50 outline-none">
                        <option>EUR</option><option>USD</option><option>TRY</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs font-bold" onClick={() => setShowBudgetForm(false)}>Vazgeç</Button>
                    <Button size="sm" className="flex-1 h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700" onClick={handleAddBudgetItem}>Ekle</Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowBudgetForm(true)}
                  className="w-full flex items-center gap-2 py-2 text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors group">
                  <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 group-hover:border-emerald-400 flex items-center justify-center transition-colors">
                    <Plus className="h-3 w-3" />
                  </div>
                  Harcama ekle
                </button>
              )}
            </div>
          </SectionAccordion>

          {/* Alt boşluk */}
          <div className="h-24" />
        </aside>

        {/* ═══════════════════════════════════════════════════════════════
            SAĞ PANEL — SABİT HARİTA
        ════════════════════════════════════════════════════════════════ */}
        <section className="hidden lg:block flex-1 relative bg-gray-100 sticky top-0">
          <TripMap
            itinerary={{ days: activeDay ? [activeDay] : [] }}
            activePlaceId={activePlaceId}
            onMarkerClick={(placeId) => {
              setActivePlaceId(placeId);
              document.getElementById(`place-${placeId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onAddPlace={(place) => handleAddPlace(activeDayIndex, place)}
          />

          {/* Harita üstü: Gün seçici hızlı butonlar */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {trip.itinerary.days.map((day, idx) => (
              <button
                key={day.day}
                onClick={() => { setActiveDayIndex(idx); if (!expandedDays.has(idx)) { setExpandedDays(prev => new Set([...prev, idx])); } }}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shadow-sm',
                  activeDayIndex === idx
                    ? 'bg-primary text-white shadow-primary/30'
                    : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white'
                )}
              >
                Gün {day.day}
                <Badge className={cn('text-[8px] h-4 px-1 font-black border-0 rounded-full',
                  activeDayIndex === idx ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600')}>
                  {day.items.length}
                </Badge>
              </button>
            ))}
          </div>

          {/* Harita stats overlay */}
          <div className="absolute bottom-6 left-4 z-10">
            <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/50">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Gün {(activeDay?.day) || 1}</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-black text-gray-900 leading-none">{activeDay?.items.length || 0}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Durak</p>
                </div>
                {activeDay && activeDay.items.some(i => i.agency_service) && (
                  <>
                    <div className="w-px h-8 bg-gray-200" />
                    <div>
                      <p className="text-2xl font-black text-gray-900 leading-none">
                        {activeDay.items.filter(i => i.agency_service).length}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">Servis</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Mobil harita butonu */}
        <div className="lg:hidden fixed bottom-24 right-6 z-40">
          <Sheet open={isMapSheetOpen} onOpenChange={setIsMapSheetOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="h-12 px-5 rounded-full shadow-2xl bg-primary font-black text-[10px] uppercase tracking-wider gap-2">
                <MapPin className="h-4 w-4" />Harita
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-3xl overflow-hidden">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-base font-bold">Rota Haritası</SheetTitle>
              </SheetHeader>
              <div className="h-full relative">
                <TripMap
                  itinerary={{ days: activeDay ? [activeDay] : [] }}
                  activePlaceId={activePlaceId}
                  onMarkerClick={(placeId) => { setActivePlaceId(placeId); setIsMapSheetOpen(false); }}
                  onAddPlace={(place) => { handleAddPlace(activeDayIndex, place); setIsMapSheetOpen(false); }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>

      {/* Discover Panel */}
      <AddToTripPanel
        isOpen={showDiscoverPanel}
        onClose={() => setShowDiscoverPanel(false)}
        onAddPlace={(place) => handleAddPlace(discoverDayIndex, place)}
        existingPlaceIds={existingPlaceIds}
      />

      {/* Teklif Paneli */}
      {trip && (
        <TripBookingPanel
          tripTitle={trip.title}
          tripDays={trip.itinerary.days.length}
          tripPlaces={totalPlaces}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Accordion sarmalayıcı
// ════════════════════════════════════════════════════════════════════════════
function SectionAccordion({
  title, icon, isOpen, onToggle, children, badge,
}: {
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        {icon}
        <span className="flex-1 text-sm font-bold text-gray-800">{title}</span>
        {badge && <span className="mr-1">{badge}</span>}
        {isOpen
          ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        }
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
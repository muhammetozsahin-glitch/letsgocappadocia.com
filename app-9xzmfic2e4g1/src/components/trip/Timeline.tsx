import { ItineraryDay, Place, AssignedTour, AssignedBalloon } from '@/db/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star, Clock, MapPin, GripVertical, Car, Trash2, Edit3,
  MessageSquare, MoreVertical, Sun, Sunset, Coffee,
  Package, Wand2, Plus, Lock, ChevronDown, ChevronRight,
  Bus, Zap, Wind, ExternalLink, Euro, Sunrise, AlertCircle,
} from 'lucide-react';
import api from '@/db/api';
import { useState, useMemo } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlaceSearch } from './PlaceSearch';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}
function formatTime(mins: number): string {
  return `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}
function calcEndTime(item: Place): string {
  return formatTime(parseMinutes(item.start_time || '09:00') + (item.estimated_duration_minutes || 60));
}
function getSegment(time: string): 'morning' | 'afternoon' | 'evening' {
  const m = parseMinutes(time);
  if (m < 12 * 60) return 'morning';
  if (m < 18 * 60) return 'afternoon';
  return 'evening';
}
const SEGMENT_META = {
  morning:   { label: 'Sabah',         icon: Sun,    color: 'text-amber-500' },
  afternoon: { label: 'Öğleden Sonra', icon: Coffee, color: 'text-orange-500' },
  evening:   { label: 'Akşam',         icon: Sunset, color: 'text-rose-500' },
};
const AGENCY_META = {
  tour:     { label: 'Tur',       icon: Bus,  badgeBg: 'bg-orange-100', badgeText: 'text-orange-700', cardBorder: 'border-orange-300', cardBg: 'bg-gradient-to-br from-orange-50/60 to-white', dotBg: 'bg-orange-500 border-orange-500', priceBg: 'bg-orange-500' },
  activity: { label: 'Aktivite',  icon: Zap,  badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', cardBorder: 'border-purple-300', cardBg: 'bg-gradient-to-br from-purple-50/60 to-white', dotBg: 'bg-purple-500 border-purple-500', priceBg: 'bg-purple-500' },
  balloon:  { label: 'Balon Turu',icon: Wind, badgeBg: 'bg-sky-100',    badgeText: 'text-sky-700',    cardBorder: 'border-sky-300',    cardBg: 'bg-gradient-to-br from-sky-50/60 to-white',    dotBg: 'bg-sky-500 border-sky-500',    priceBg: 'bg-sky-500'    },
} as const;
function formatCurrency(c: string) { return c === 'EUR' ? '€' : c === 'USD' ? '$' : '₺'; }

// Turun renk paleti (kod'a göre)
const TOUR_COLOR: Record<string, { bg: string; border: string; badge: string; text: string; dot: string }> = {
  red:     { bg: 'bg-red-50',     border: 'border-red-300',     badge: 'bg-red-100 text-red-800',     text: 'text-red-800',     dot: 'bg-red-500' },
  green:   { bg: 'bg-emerald-50', border: 'border-emerald-300', badge: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-300',    badge: 'bg-blue-100 text-blue-800',   text: 'text-blue-800',   dot: 'bg-blue-500' },
  default: { bg: 'bg-orange-50',  border: 'border-orange-300',  badge: 'bg-orange-100 text-orange-800', text: 'text-orange-800', dot: 'bg-orange-500' },
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface TimelineProps {
  itinerary: { days: ItineraryDay[] };
  onReorder: (dayIndex: number, newItems: Place[]) => void;
  onAddPlace: (dayIndex: number, place: Place) => void;
  onDeletePlace: (dayIndex: number, placeId: string) => void;
  onUpdatePlaceNote: (dayIndex: number, placeId: string, note: string) => void;
  onUpdateDayNote: (dayIndex: number, note: string) => void;
  onPlaceClick: (id: string) => void;
  activePlaceId: string | null;
  onOpenDiscover?: () => void;
  onRemoveTour?: (dayIndex: number) => void;
  onRemoveBalloon?: (dayIndex: number) => void;
}

// ════════════════════════════════════════════════════════════════════════════
// Timeline root
// ════════════════════════════════════════════════════════════════════════════
export function Timeline(props: TimelineProps) {
  return (
    <div className="p-4 md:p-6 space-y-8">
      {props.itinerary.days.map((day, dayIndex) => (
        <DaySection key={day.day} {...props} day={day} dayIndex={dayIndex} />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DaySection
// ════════════════════════════════════════════════════════════════════════════
function DaySection({
  day, dayIndex,
  onReorder, onAddPlace, onDeletePlace,
  onUpdatePlaceNote, onUpdateDayNote,
  onPlaceClick, activePlaceId, onOpenDiscover,
  onRemoveTour, onRemoveBalloon,
}: TimelineProps & { day: ItineraryDay; dayIndex: number }) {

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(day.notes || '');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = day.items.findIndex(i => i.place_id === active.id);
      const newIdx = day.items.findIndex(i => i.place_id === over.id);
      onReorder(dayIndex, arrayMove(day.items, oldIdx, newIdx));
    }
  };

  // Serbest öğelerin segment grupları (tur bloğu dışındaki akşam vb.)
  const grouped = useMemo(() => {
    const segments: Record<string, Place[]> = {};
    for (const item of day.items) {
      const seg = getSegment(item.start_time || '09:00');
      if (!segments[seg]) segments[seg] = [];
      segments[seg].push(item);
    }
    return segments;
  }, [day.items]);

  const segmentOrder: Array<'morning' | 'afternoon' | 'evening'> = ['morning', 'afternoon', 'evening'];
  const dayType = day.day_type || 'free';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

      {/* Gün notu */}
      <div className="px-1">
        {isEditingNote ? (
          <div className="space-y-2">
            <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Bugün için notlarınızı yazın..." className="bg-amber-50 border-amber-200 rounded-xl text-sm font-medium min-h-[72px] resize-none" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditingNote(false)} className="h-7 text-[10px] font-bold">Vazgeç</Button>
              <Button size="sm" className="h-7 bg-orange-600 text-white text-[10px] font-bold px-3 rounded-lg" onClick={() => { onUpdateDayNote(dayIndex, noteText); setIsEditingNote(false); }}>Kaydet</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsEditingNote(true)} className="w-full flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all group text-left">
            <MessageSquare className="h-4 w-4 text-gray-300 group-hover:text-orange-500 mt-0.5 shrink-0" />
            {day.notes ? <p className="text-sm font-medium text-gray-600 italic">"{day.notes}"</p> : <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-orange-500">Bugüne not ekle...</span>}
          </button>
        )}
      </div>

      {/* AI hikayesi */}
      {day.day_story && (
        <div className="mx-1 flex items-start gap-2.5 px-3 py-2.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl">
          <Wand2 className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-orange-800 font-medium leading-relaxed italic">{day.day_story}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TUR GÜNÜ — Kilitli blok + akşam serbest
      ══════════════════════════════════════════════════ */}
      {dayType === 'tour' && day.assigned_tour && (
        <TourDayBlock
          tour={day.assigned_tour}
          onRemove={onRemoveTour ? () => onRemoveTour(dayIndex) : undefined}
        />
      )}

      {/* ══════════════════════════════════════════════════
          BALON GÜNÜ — Balon bloğu + öğleden sonra serbest
      ══════════════════════════════════════════════════ */}
      {dayType === 'balloon' && day.assigned_balloon && (
        <BalloonDayBlock
          balloon={day.assigned_balloon}
          onRemove={onRemoveBalloon ? () => onRemoveBalloon(dayIndex) : undefined}
        />
      )}

      {/* ══════════════════════════════════════════════════
          SERBEST ÖĞELER (tüm gün tiplerinde görünür)
          Tur günüyse akşam etiketiyle, serbest günse tam
      ══════════════════════════════════════════════════ */}
      {day.items.length > 0 && (
        <>
          {/* Tur/Balon günü ise "Akşam Aktiviteleri" başlığı */}
          {(dayType === 'tour' || dayType === 'balloon') && (
            <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-500">
              <Sunset className="h-3.5 w-3.5" />
              Akşam Aktiviteleri
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={day.items.map(i => i.place_id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1 relative">
                <div className="absolute left-[28px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-200 via-gray-100 to-transparent -z-10" />
                {/* Tur/Balon günüyse segment başlıkları gösterme, direkt listele */}
                {(dayType === 'tour' || dayType === 'balloon')
                  ? day.items.map((item, gi) => (
                    <div key={item.place_id} id={`place-${item.place_id}`} className="relative group">
                      <div className={cn('absolute left-6 top-6 w-3 h-3 rounded-full border-2 z-10 transition-all duration-200',
                        activePlaceId === item.place_id ? 'bg-rose-500 border-rose-500 scale-150 shadow-lg' : 'bg-white border-gray-300 group-hover:border-rose-400'
                      )} />
                      <div className="pl-12 pr-2">
                        <SortableItem item={item} index={gi} isActive={activePlaceId === item.place_id} onClick={() => onPlaceClick(item.place_id)} onDelete={() => onDeletePlace(dayIndex, item.place_id)} onUpdateNote={note => onUpdatePlaceNote(dayIndex, item.place_id, note)} />
                      </div>
                    </div>
                  ))
                  : segmentOrder.map(seg => {
                    const items = grouped[seg];
                    if (!items?.length) return null;
                    const meta = SEGMENT_META[seg];
                    const SegIcon = meta.icon;
                    return (
                      <div key={seg} className="space-y-3">
                        <div className={cn('flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest', meta.color)}>
                          <SegIcon className="h-3.5 w-3.5" />{meta.label}
                        </div>
                        {items.map(item => {
                          const gi = day.items.findIndex(i => i.place_id === item.place_id);
                          return (
                            <div key={item.place_id} id={`place-${item.place_id}`} className="relative group">
                              <div className={cn('absolute left-6 top-6 w-3 h-3 rounded-full border-2 z-10 transition-all duration-200',
                                activePlaceId === item.place_id
                                  ? (item.agency_service ? `${AGENCY_META[item.agency_service.type].dotBg} scale-150 shadow-lg` : 'bg-orange-600 border-orange-600 scale-150 shadow-lg')
                                  : 'bg-white border-gray-300 group-hover:border-orange-400'
                              )} />
                              <div className="pl-12 pr-2">
                                <SortableItem item={item} index={gi} isActive={activePlaceId === item.place_id} onClick={() => onPlaceClick(item.place_id)} onDelete={() => onDeletePlace(dayIndex, item.place_id)} onUpdateNote={note => onUpdatePlaceNote(dayIndex, item.place_id, note)} />
                                {gi < day.items.length - 1 && (
                                  <div className="my-3 ml-1 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <Car className="h-3.5 w-3.5" /><span>~15 dk sürüş</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                }
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      {/* Boş serbest gün */}
      {day.items.length === 0 && dayType === 'free' && (
        <div className="mx-2 py-10 flex flex-col items-center gap-3 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
            <Package className="h-6 w-6 text-orange-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-500">Henüz durak yok</p>
            <p className="text-xs text-gray-400 mt-1">Aşağıdan yer ekleyerek başlayın</p>
          </div>
        </div>
      )}

      {/* Tur günü ise akşam slot mesajı göster (item yoksa) */}
      {day.items.length === 0 && (dayType === 'tour' || dayType === 'balloon') && (
        <div className="mx-2 py-6 flex items-center gap-3 px-4 border border-dashed border-rose-200 rounded-2xl bg-rose-50/30">
          <Sunset className="h-5 w-5 text-rose-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-rose-600">Akşam serbest</p>
            <p className="text-xs text-rose-400 mt-0.5">Hamam, Türk gecesi veya restoran ekleyebilirsiniz</p>
          </div>
        </div>
      )}

      {/* Yer ekle (tur/balon günü ise sadece akşam için) */}
      <div className="mx-2 space-y-3" id={`place-search-day-${dayIndex}`}>
        {onOpenDiscover && (
          <button onClick={onOpenDiscover}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border-2 border-dashed border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 hover:border-orange-400 hover:from-orange-100 hover:to-amber-100 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-gray-800 block">
                {(dayType === 'tour' || dayType === 'balloon') ? 'Akşam Aktivitesi Ekle' : 'Yer, Aktivite veya Tur Ekle'}
              </span>
              <span className="text-[10px] text-gray-500">
                {(dayType === 'tour' || dayType === 'balloon') ? 'Hamam, Türk gecesi, restoran...' : 'Acenta turları, aktiviteler, balon turları...'}
              </span>
            </div>
          </button>
        )}
        <PlaceSearch onPlaceSelect={place => onAddPlace(dayIndex, place)} placeholder="veya doğrudan yer adı ile ara..." />
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TourDayBlock — Kilitli tur bloğu, içi açılır/kapanır
// ════════════════════════════════════════════════════════════════════════════
function TourDayBlock({ tour, onRemove }: { tour: AssignedTour; onRemove?: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const colors = TOUR_COLOR[tour.code] || TOUR_COLOR.default;
  const tourLabel = { red: '🔴 Kırmızı Tur', green: '🟢 Yeşil Tur', blue: '🔵 Mavi Tur' }[tour.code] || '⭐ Özel Tur';

  const totalEntranceFees = (tour.entrance_fees || []).reduce((s, f) => s + f.price, 0);

  return (
    <div className={cn('rounded-2xl border-2 overflow-hidden', colors.border)}>
      {/* Başlık */}
      <div className={cn('flex items-center gap-3 px-4 py-3', colors.bg)}>
        <button onClick={() => setExpanded(v => !v)} className="flex-1 flex items-center gap-3 text-left">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', colors.badge)}>
            <Bus className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-sm font-black', colors.text)}>{tour.name}</span>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', colors.badge)}>{tourLabel}</span>
              <Lock className={cn('h-3 w-3', colors.text, 'opacity-50')} />
            </div>
            <div className={cn('flex items-center gap-3 mt-0.5 text-[11px] font-bold opacity-75', colors.text)}>
              <span>⏰ {tour.start_time} – {tour.end_time}</span>
              <span>·</span>
              <span>{tour.duration_hours}s</span>
              <span>·</span>
              <span>{tour.price_adult}{formatCurrency(tour.currency)}/kişi</span>
            </div>
          </div>
          {expanded ? <ChevronDown className={cn('h-4 w-4 shrink-0', colors.text)} /> : <ChevronRight className={cn('h-4 w-4 shrink-0', colors.text)} />}
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <Link to={`/tur/${tour.slug}`} target="_blank" onClick={e => e.stopPropagation()}
            className={cn('flex items-center gap-1 text-[10px] font-bold hover:underline px-2 py-1 rounded-lg hover:bg-white/30 transition-colors', colors.text)}>
            <ExternalLink className="h-3 w-3" />Detay
          </Link>
          {onRemove && (
            <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors" title="Turu kaldır">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Giriş ücreti uyarısı */}
      {totalEntranceFees > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-t border-amber-100">
          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] font-bold text-amber-700">
            Tura dahil olmayan giriş ücretleri: {tour.entrance_fees?.map(f => `${f.name} ${f.price}€`).join(', ')} — yaklaşık {totalEntranceFees}€ ekstra
          </span>
        </div>
      )}

      {/* Tur durağı listesi (kilitli) */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden bg-white">
            <div className="divide-y divide-gray-50">
              {tour.itinerary.map((stop, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 group">
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5', colors.badge)}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{stop.time}</span>
                      <span className="text-sm font-bold text-gray-800">{stop.title}</span>
                    </div>
                    {stop.description && <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{stop.description}</p>}
                    {stop.duration_minutes && (
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                        <Clock className="h-2.5 w-2.5" />{stop.duration_minutes}dk
                      </span>
                    )}
                  </div>
                  <Lock className="h-3 w-3 text-gray-300 shrink-0 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Tur programı acentanız tarafından belirlenir ve değiştirilemez
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BalloonDayBlock — Kilitli balon bloğu
// ════════════════════════════════════════════════════════════════════════════
function BalloonDayBlock({ balloon, onRemove }: { balloon: AssignedBalloon; onRemove?: () => void }) {
  const endMins = 5 * 60 + 30 + balloon.duration_minutes;
  const endTime = `${String(Math.floor(endMins / 60)).padStart(2,'0')}:${String(endMins % 60).padStart(2,'0')}`;

  return (
    <div className="rounded-2xl border-2 border-sky-300 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-sky-50">
        <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
          <Wind className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-sky-800">{balloon.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">🎈 Balon Turu</span>
            <Lock className="h-3 w-3 text-sky-400" />
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[11px] font-bold text-sky-600 opacity-75">
            <span>⏰ 05:30 – {endTime}</span>
            <span>·</span>
            <span>{balloon.duration_minutes}dk</span>
            <span>·</span>
            <span>{balloon.price_adult}{formatCurrency(balloon.currency)}/kişi</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Link to={`/balon/${balloon.slug}`} target="_blank"
            className="flex items-center gap-1 text-[10px] font-bold text-sky-600 hover:underline px-2 py-1 rounded-lg hover:bg-white/30">
            <ExternalLink className="h-3 w-3" />Detay
          </Link>
          {onRemove && (
            <button onClick={onRemove} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600" title="Balonu kaldır">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {/* Sabit program */}
      <div className="bg-white divide-y divide-gray-50">
        {[
          { time: '04:45', title: 'Otel transferi', desc: 'Servis aracı otelden alır' },
          { time: '05:30', title: 'Balon kalkışı', desc: `Şafak uçuşu başlar — ${balloon.duration_minutes}dk` },
          { time: endTime, title: 'İniş ve sertifika', desc: 'Belgelenmiş iniş töreni' },
          { time: `${String(Math.floor((endMins + 45) / 60)).padStart(2,'0')}:${String((endMins + 45) % 60).padStart(2,'0')}`, title: 'Otele dönüş', desc: 'Kahvaltı için hazır' },
        ].map((s, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-2.5">
            <span className="text-[11px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md mt-0.5 shrink-0">{s.time}</span>
            <div>
              <p className="text-sm font-bold text-gray-800">{s.title}</p>
              <p className="text-[11px] text-gray-400">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
        <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Hava durumuna bağlı iptal olabilir. Önceki gece erken yatmanız önerilir.
        </p>
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 flex items-center gap-1.5"><Lock className="h-3 w-3" />Balon programı değiştirilemez</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SortableItem (aynı, sadece agency bloğu temizlendi)
// ════════════════════════════════════════════════════════════════════════════
function SortableItem({ item, index, isActive, onClick, onDelete, onUpdateNote }: {
  item: Place; index: number; isActive: boolean;
  onClick: () => void; onDelete: () => void; onUpdateNote: (n: string) => void;
}) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [note, setNote] = useState(item.notes || '');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.place_id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.4 : 1 };

  const agencyService = item.agency_service;
  const agencyMeta = agencyService ? AGENCY_META[agencyService.type] : null;
  const AgencyIcon = agencyMeta?.icon;

  const photoUrl = useMemo(() => {
    if (item.photo_reference) {
      if (item.photo_reference.startsWith('http')) return item.photo_reference;
      return api.resolvePlacePhoto(item.photo_reference) || undefined;
    }
    const fb: Record<string, string> = {
      'Aktivite': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      'Balon Turu': 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400&q=80',
      museum: 'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=400&q=80',
      nature: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80',
    };
    return fb[item.category] ?? 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80';
  }, [item.photo_reference, item.category]);

  const endTime = calcEndTime(item);

  return (
    <div ref={setNodeRef} style={style}>
      <Card onClick={onClick} className={cn(
        'overflow-hidden cursor-pointer transition-all duration-200 rounded-2xl border',
        isDragging && 'opacity-50 border-dashed',
        agencyMeta && !isActive && `${agencyMeta.cardBorder} ${agencyMeta.cardBg}`,
        isActive ? (agencyMeta ? `${agencyMeta.cardBorder} shadow-lg ring-2 ring-current/10` : 'border-orange-500 shadow-lg shadow-orange-500/15') : (!agencyMeta && 'border-gray-100 hover:border-gray-200 hover:shadow-md')
      )}>
        <CardContent className="p-3">
          {/* Agency banner */}
          {agencyMeta && AgencyIcon && (
            <div className={cn('flex items-center justify-between mb-2 px-2 py-1.5 rounded-lg', agencyMeta.badgeBg)}>
              <div className="flex items-center gap-1.5">
                <AgencyIcon className={cn('h-3.5 w-3.5', agencyMeta.badgeText)} />
                <span className={cn('text-[10px] font-black uppercase tracking-wide', agencyMeta.badgeText)}>{agencyMeta.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-[12px] font-black', agencyMeta.badgeText)}>{agencyService!.price}{formatCurrency(agencyService!.currency)} <span className="text-[9px] font-bold opacity-70">/ kişi</span></span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5',
              agencyMeta ? `${agencyMeta.priceBg} text-white` : 'bg-orange-100 text-orange-700')}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-gray-900 truncate">{item.name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {item.start_time && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{item.start_time} – {endTime}</span>}
                <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[9px] font-bold px-1.5 py-0 h-4 border-0">{item.category}</Badge>
                {item.estimated_duration_minutes > 0 && <span className="flex items-center gap-0.5 text-[9px] font-bold text-gray-400"><Clock className="h-2.5 w-2.5" />{item.estimated_duration_minutes}dk</span>}
                {item.rating && <span className="flex items-center gap-0.5 text-[9px] font-bold text-gray-400"><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />{item.rating}</span>}
              </div>
            </div>

            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {!imgLoaded && <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />}
              <img src={imgError ? 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80' : photoUrl} alt={item.name} onLoad={() => setImgLoaded(true)} onError={() => { setImgError(true); setImgLoaded(true); }} className={cn('w-full h-full object-cover transition-opacity duration-300', imgLoaded ? 'opacity-100' : 'opacity-0')} />
            </div>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
              <div {...attributes} {...listeners} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 cursor-grab active:cursor-grabbing" onClick={e => e.stopPropagation()}>
                <GripVertical className="h-3.5 w-3.5" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><MoreVertical className="h-3.5 w-3.5 text-gray-400" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 rounded-xl p-1">
                  <DropdownMenuItem onClick={e => { e.stopPropagation(); setIsEditingNote(true); }} className="text-xs font-bold gap-2 rounded-lg"><Edit3 className="h-3.5 w-3.5 text-orange-500" />Not Düzenle</DropdownMenuItem>
                  <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }} className="text-xs font-bold gap-2 text-red-500 rounded-lg focus:text-red-600 focus:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Kaldır</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <AnimatePresence>
            {isEditingNote && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2 overflow-hidden" onClick={e => e.stopPropagation()}>
                <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Not ekle..." className="bg-gray-50 border-gray-200 rounded-xl text-xs font-medium min-h-[60px]" autoFocus />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingNote(false)} className="h-6 text-[10px] font-bold">Vazgeç</Button>
                  <Button size="sm" className="h-6 bg-orange-600 text-white text-[10px] font-bold px-3 rounded-lg" onClick={() => { onUpdateNote(note); setIsEditingNote(false); }}>Kaydet</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isEditingNote && item.notes && (
            <div className="mt-2.5 p-2 bg-orange-50 rounded-xl border-l-2 border-orange-500">
              <p className="text-[11px] font-medium italic text-orange-800">{item.notes}</p>
            </div>
          )}
          {item.why_visit && (
            <div className="mt-2 flex items-start gap-2 px-2 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
              <MapPin className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 font-medium leading-snug">{item.why_visit}</p>
            </div>
          )}
          {item.personal_tip && (
            <div className="mt-1.5 flex items-start gap-2 px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
              <Star className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 font-medium leading-snug">{item.personal_tip}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
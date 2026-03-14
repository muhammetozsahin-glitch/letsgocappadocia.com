import { ItineraryDay, Place } from '@/db/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star, Clock, MapPin, GripVertical, Car, Trash2, Edit3,
  MessageSquare, MoreVertical, Sun, Sunset, Moon, Coffee,
  Package, Wand2, Plus, ChevronDown, ChevronUp, CheckCircle2,
  Navigation, Footprints, Zap,
} from 'lucide-react';
import api from '@/db/api';
import { useState, useMemo, useCallback, memo, CSSProperties } from 'react';
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
} from "@/components/ui/dropdown-menu";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
type Segment = 'morning' | 'afternoon' | 'evening';

// ────────────────────────────────────────────────────────────────────────────
// Constants (module-level — no re-creation on render)
// ────────────────────────────────────────────────────────────────────────────
const SEGMENT_ORDER: Segment[] = ['morning', 'afternoon', 'evening'];

const SEGMENT_META: Record<Segment, {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  dot: string;
  timeRange: string;
}> = {
  morning: {
    label: 'Sabah',
    sublabel: 'Güne enerjik başla',
    icon: Sun,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-100',
    dot: 'bg-amber-400',
    timeRange: '06:00 – 12:00',
  },
  afternoon: {
    label: 'Öğleden Sonra',
    sublabel: 'Günün ortası',
    icon: Coffee,
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-100',
    dot: 'bg-orange-400',
    timeRange: '12:00 – 18:00',
  },
  evening: {
    label: 'Akşam',
    sublabel: 'Günü tamamla',
    icon: Sunset,
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-100',
    dot: 'bg-rose-400',
    timeRange: '18:00 – 24:00',
  },
};

const CATEGORY_FALLBACKS: Record<string, string> = {
  museum:     'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=400&q=80',
  nature:     'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80',
  history:    'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&q=80',
  landmark:   'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80',
  gastronomy: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=400&q=80',
  culture:    'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=400&q=80',
  activity:   'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80',
  wellness:   'https://images.unsplash.com/photo-1544833316-64d88e00182a?w=400&q=80',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80';

// ────────────────────────────────────────────────────────────────────────────
// Pure utility functions
// ────────────────────────────────────────────────────────────────────────────
function parseMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(mins: number): string {
  return `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

function calcEndTime(item: Place): string {
  const start = parseMinutes(item.start_time || '09:00');
  return formatTime(start + (item.estimated_duration_minutes || 60));
}

function getSegment(time: string): Segment {
  const mins = parseMinutes(time);
  if (mins < 12 * 60) return 'morning';
  if (mins < 18 * 60) return 'afternoon';
  return 'evening';
}

function getTotalDayMinutes(items: Place[]): number {
  return items.reduce((acc, item) => acc + (item.estimated_duration_minutes || 60), 0);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}dk`;
  if (m === 0) return `${h}sa`;
  return `${h}sa ${m}dk`;
}

function resolvePhotoUrl(item: Place): string {
  if (item.photo_reference) {
    return api.resolvePlacePhoto(item.photo_reference) || FALLBACK_IMAGE;
  }
  return CATEGORY_FALLBACKS[item.category] ?? FALLBACK_IMAGE;
}

// ────────────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────────────
interface TimelineProps {
  itinerary: { days: ItineraryDay[] };
  onReorder: (dayIndex: number, newItems: Place[]) => void;
  onAddPlace: (dayIndex: number, place: Place) => void;
  onDeletePlace: (dayIndex: number, placeId: string) => void;
  onUpdatePlaceNote: (dayIndex: number, placeId: string, note: string) => void;
  onUpdateDayNote: (dayIndex: number, note: string) => void;
  onPlaceClick: (id: string) => void;
  activePlaceId: string | null;
  dayStartDate?: string;
  onOpenDiscover?: () => void;
}

// ────────────────────────────────────────────────────────────────────────────
// Timeline root
// ────────────────────────────────────────────────────────────────────────────
export function Timeline(props: TimelineProps) {
  return (
    <div className="px-3 py-5 md:px-6 md:py-8 space-y-10">
      {props.itinerary.days.map((day, dayIndex) => (
        <DaySection key={day.day} {...props} day={day} dayIndex={dayIndex} />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DayHeader — Gün özeti bandı
// ────────────────────────────────────────────────────────────────────────────
interface DayHeaderProps {
  day: ItineraryDay;
  dayStartDate?: string;
  totalMinutes: number;
  placeCount: number;
}

const DayHeader = memo(function DayHeader({
  day, dayStartDate, totalMinutes, placeCount,
}: DayHeaderProps) {
  const dateLabel = useMemo(() => {
    if (!dayStartDate) return null;
    const base = new Date(dayStartDate);
    base.setDate(base.getDate() + (day.day - 1));
    return base.toLocaleDateString('tr-TR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  }, [dayStartDate, day.day]);

  return (
    <div className="relative mb-6">
      {/* Dekoratif arka plan şeridi */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/8 via-amber-500/5 to-transparent rounded-2xl" />

      <div className="relative flex items-center justify-between px-4 py-3.5">
        {/* Sol: Gün numarası + tarih */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <span className="text-white font-black text-lg leading-none">{day.day}</span>
            </div>
            {/* Küçük "GÜN" etiketi */}
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-1.5 rounded-full whitespace-nowrap">
              GÜN
            </span>
          </div>

          <div className="space-y-0.5">
            {dateLabel && (
              <p className="text-xs font-bold text-gray-500 capitalize">{dateLabel}</p>
            )}
            <h3 className="text-base font-black text-gray-900 leading-tight">
              {day.title || `${day.day}. Gün`}
            </h3>
          </div>
        </div>

        {/* Sağ: Özet istatistikler */}
        <div className="flex items-center gap-3">
          {placeCount > 0 && (
            <>
              <Stat icon={<MapPin className="h-3 w-3" />} label={`${placeCount} durak`} />
              <div className="w-px h-6 bg-gray-200" />
              <Stat icon={<Clock className="h-3 w-3" />} label={formatDuration(totalMinutes)} />
            </>
          )}
        </div>
      </div>

      {/* Alt çizgi aksanı */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-orange-200 via-amber-100 to-transparent" />
    </div>
  );
});

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
      <span className="text-orange-400">{icon}</span>
      {label}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DaySection
// ────────────────────────────────────────────────────────────────────────────
function DaySection({
  day, dayIndex, dayStartDate,
  onReorder, onAddPlace, onDeletePlace,
  onUpdatePlaceNote, onUpdateDayNote,
  onPlaceClick, activePlaceId, onOpenDiscover,
}: TimelineProps & { day: ItineraryDay; dayIndex: number }) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(day.notes || '');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sensörler module düzeyinde oluşturmak mümkün değil (hook kuralı),
  // ama en azından useMemo yerine doğru hook kullanıyoruz.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = day.items.findIndex(i => i.place_id === active.id);
      const newIdx = day.items.findIndex(i => i.place_id === over.id);
      onReorder(dayIndex, arrayMove(day.items, oldIdx, newIdx));
    }
  }, [day.items, dayIndex, onReorder]);

  const grouped = useMemo<Partial<Record<Segment, Place[]>>>(() => {
    const result: Partial<Record<Segment, Place[]>> = {};
    for (const item of day.items) {
      const seg = getSegment(item.start_time || '09:00');
      (result[seg] ??= []).push(item);
    }
    return result;
  }, [day.items]);

  const totalMinutes = useMemo(() => getTotalDayMinutes(day.items), [day.items]);

  const saveNote = useCallback(() => {
    onUpdateDayNote(dayIndex, noteText);
    setIsEditingNote(false);
  }, [dayIndex, noteText, onUpdateDayNote]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden"
    >
      {/* Gün başlığı */}
      <DayHeader
        day={day}
        dayStartDate={dayStartDate}
        totalMinutes={totalMinutes}
        placeCount={day.items.length}
      />

      {/* Daralt/Genişlet toggle */}
      <div className="px-4 pb-1">
        <button
          onClick={() => setIsCollapsed(v => !v)}
          className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-500 transition-colors"
        >
          {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          {isCollapsed ? 'Genişlet' : 'Daralt'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-6 space-y-5 pt-2">

              {/* Gün notu */}
              <DayNoteEditor
                notes={day.notes}
                isEditing={isEditingNote}
                noteText={noteText}
                onStartEdit={() => setIsEditingNote(true)}
                onCancelEdit={() => setIsEditingNote(false)}
                onChangeText={setNoteText}
                onSave={saveNote}
              />

              {/* AI hikayesi */}
              {day.day_story && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl">
                  <Wand2 className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-orange-800 font-medium leading-relaxed italic">
                    {day.day_story}
                  </p>
                </div>
              )}

              {/* Boş durum */}
              {day.items.length === 0 && <EmptyDayState />}

              {/* Gruplu duraklar */}
              {day.items.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={day.items.map(i => i.place_id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 relative">
                      {/* Timeline dikey çizgi */}
                      <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-orange-300 via-amber-200 to-transparent pointer-events-none" />

                      {SEGMENT_ORDER.map(seg => {
                        const items = grouped[seg];
                        if (!items?.length) return null;

                        return (
                          <SegmentGroup
                            key={seg}
                            seg={seg}
                            items={items}
                            allItems={day.items}
                            dayIndex={dayIndex}
                            activePlaceId={activePlaceId}
                            onPlaceClick={onPlaceClick}
                            onDeletePlace={onDeletePlace}
                            onUpdatePlaceNote={onUpdatePlaceNote}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Yer ekle aksiyonları */}
              <AddPlaceSection
                dayIndex={dayIndex}
                onAddPlace={onAddPlace}
                onOpenDiscover={onOpenDiscover}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DayNoteEditor
// ────────────────────────────────────────────────────────────────────────────
interface DayNoteEditorProps {
  notes?: string;
  isEditing: boolean;
  noteText: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeText: (v: string) => void;
  onSave: () => void;
}

const DayNoteEditor = memo(function DayNoteEditor({
  notes, isEditing, noteText, onStartEdit, onCancelEdit, onChangeText, onSave,
}: DayNoteEditorProps) {
  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <Textarea
          value={noteText}
          onChange={e => onChangeText(e.target.value)}
          placeholder="Bugün için notlarınızı yazın..."
          className="bg-amber-50 border-amber-200 rounded-xl text-sm font-medium min-h-[72px] focus:ring-orange-600/20 focus:border-orange-600"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancelEdit} className="h-7 text-[10px] font-black">
            Vazgeç
          </Button>
          <Button size="sm" onClick={onSave}
            className="h-7 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black px-3 rounded-lg">
            Kaydet
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <button
      onClick={onStartEdit}
      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all group text-left"
    >
      <MessageSquare className="h-4 w-4 text-gray-300 group-hover:text-orange-500 mt-0.5 transition-colors shrink-0" />
      {notes ? (
        <p className="text-sm font-medium text-gray-600 italic">"{notes}"</p>
      ) : (
        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-orange-500 transition-colors">
          Bugüne not ekle...
        </span>
      )}
    </button>
  );
});

// ────────────────────────────────────────────────────────────────────────────
// SegmentGroup — Sabah / Öğleden Sonra / Akşam
// ────────────────────────────────────────────────────────────────────────────
interface SegmentGroupProps {
  seg: Segment;
  items: Place[];
  allItems: Place[];
  dayIndex: number;
  activePlaceId: string | null;
  onPlaceClick: (id: string) => void;
  onDeletePlace: (dayIndex: number, placeId: string) => void;
  onUpdatePlaceNote: (dayIndex: number, placeId: string, note: string) => void;
}

const SegmentGroup = memo(function SegmentGroup({
  seg, items, allItems, dayIndex,
  activePlaceId, onPlaceClick, onDeletePlace, onUpdatePlaceNote,
}: SegmentGroupProps) {
  const meta = SEGMENT_META[seg];
  const SegIcon = meta.icon;
  const segMinutes = items.reduce((a, i) => a + (i.estimated_duration_minutes || 60), 0);

  return (
    <div className="space-y-2.5">
      {/* Segment başlığı */}
      <div className={cn(
        "flex items-center justify-between mx-1 px-3 py-2 rounded-xl border",
        meta.bg
      )}>
        <div className={cn("flex items-center gap-2", meta.color)}>
          <SegIcon className="h-3.5 w-3.5" />
          <span className="text-[11px] font-black uppercase tracking-widest">{meta.label}</span>
          <span className="text-[9px] font-bold opacity-60">{meta.timeRange}</span>
        </div>
        <span className={cn("text-[10px] font-bold opacity-70", meta.color)}>
          {formatDuration(segMinutes)}
        </span>
      </div>

      {/* Duraklar */}
      {items.map(item => {
        const globalIndex = allItems.findIndex(i => i.place_id === item.place_id);
        const isLast = globalIndex === allItems.length - 1;

        return (
          <div key={item.place_id} id={`place-${item.place_id}`} className="relative group/item">
            {/* Timeline nokta */}
            <TimelineDot isActive={activePlaceId === item.place_id} segColor={meta.dot} />

            <div className="pl-10">
              <SortableItem
                item={item}
                index={globalIndex}
                isActive={activePlaceId === item.place_id}
                onClick={() => onPlaceClick(item.place_id)}
                onDelete={() => onDeletePlace(dayIndex, item.place_id)}
                onUpdateNote={note => onUpdatePlaceNote(dayIndex, item.place_id, note)}
              />

              {/* Seyahat süresi köprüsü */}
              {!isLast && <TravelConnector />}
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ────────────────────────────────────────────────────────────────────────────
// TimelineDot
// ────────────────────────────────────────────────────────────────────────────
const TimelineDot = memo(function TimelineDot({
  isActive, segColor,
}: { isActive: boolean; segColor: string }) {
  return (
    <div className={cn(
      "absolute left-3.5 top-5 w-2.5 h-2.5 rounded-full border-2 z-10 transition-all duration-200",
      isActive
        ? "bg-orange-500 border-orange-500 scale-[1.8] shadow-md shadow-orange-500/40"
        : cn("bg-white border-gray-300 group-hover/item:scale-125", `group-hover/item:${segColor.replace('bg-', 'border-')}`)
    )} />
  );
});

// ────────────────────────────────────────────────────────────────────────────
// TravelConnector — Duraklar arası süre köprüsü
// ────────────────────────────────────────────────────────────────────────────
function TravelConnector() {
  return (
    <div className="my-2.5 ml-0.5 flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full">
        <Car className="h-3 w-3 text-gray-400" />
        <span className="text-[10px] font-bold text-gray-400">~15 dk sürüş</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// EmptyDayState
// ────────────────────────────────────────────────────────────────────────────
const EmptyDayState = memo(function EmptyDayState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-12 flex flex-col items-center gap-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gradient-to-b from-gray-50/80 to-white"
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center">
          <Package className="h-7 w-7 text-orange-300" />
        </div>
        {/* Dekoratif halkalar */}
        <div className="absolute -inset-2 rounded-3xl border border-orange-100 border-dashed animate-pulse" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-black text-gray-600">Bu gün henüz boş</p>
        <p className="text-xs text-gray-400 max-w-[180px] leading-relaxed">
          Aşağıdaki butonu kullanarak gezi duraklarını ekleyin
        </p>
      </div>
    </motion.div>
  );
});

// ────────────────────────────────────────────────────────────────────────────
// AddPlaceSection
// ────────────────────────────────────────────────────────────────────────────
interface AddPlaceSectionProps {
  dayIndex: number;
  onAddPlace: (dayIndex: number, place: Place) => void;
  onOpenDiscover?: () => void;
}

const AddPlaceSection = memo(function AddPlaceSection({
  dayIndex, onAddPlace, onOpenDiscover,
}: AddPlaceSectionProps) {
  return (
    <div className="space-y-3 pt-2" id={`place-search-day-${dayIndex}`}>
      {onOpenDiscover && (
        <button
          onClick={onOpenDiscover}
          className="w-full group flex items-center gap-3 py-3.5 px-4 rounded-2xl border-2 border-dashed border-orange-200 bg-gradient-to-r from-orange-50/80 to-amber-50/80 hover:border-orange-400 hover:from-orange-100 hover:to-amber-100 transition-all duration-200"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/25 group-hover:scale-110 group-hover:shadow-orange-500/40 transition-all duration-200 shrink-0">
            <Plus className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="text-left">
            <span className="text-sm font-black text-gray-800 block leading-tight">Yer Keşfet ve Ekle</span>
            <span className="text-[10px] font-medium text-gray-500">Restoranlar, oteller, gezilecek yerler...</span>
          </div>
          <Zap className="ml-auto h-4 w-4 text-orange-300 group-hover:text-orange-500 transition-colors" />
        </button>
      )}

      <PlaceSearch
        onPlaceSelect={place => onAddPlace(dayIndex, place)}
        placeholder="veya doğrudan yer adı ile ara..."
      />
    </div>
  );
});

// ────────────────────────────────────────────────────────────────────────────
// SortableItem
// ────────────────────────────────────────────────────────────────────────────
interface SortableItemProps {
  item: Place;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onUpdateNote: (note: string) => void;
}

const SortableItem = memo(function SortableItem({
  item, index, isActive, onClick, onDelete, onUpdateNote,
}: SortableItemProps) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [note, setNote] = useState(item.notes || '');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: item.place_id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.35 : 1,
  };

  const photoUrl = useMemo(() => resolvePhotoUrl(item), [item.photo_reference, item.category]);
  const endTime = useMemo(() => calcEndTime(item), [item.start_time, item.estimated_duration_minutes]);

  const handleSaveNote = useCallback(() => {
    onUpdateNote(note);
    setIsEditingNote(false);
  }, [note, onUpdateNote]);

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        onClick={onClick}
        className={cn(
          "overflow-hidden cursor-pointer transition-all duration-200 rounded-2xl border select-none",
          isDragging && "shadow-2xl shadow-orange-500/20 border-orange-300 rotate-1",
          isActive
            ? "border-orange-400 shadow-lg shadow-orange-500/15 ring-2 ring-orange-400/20 bg-orange-50/30"
            : "border-gray-100 hover:border-gray-200 hover:shadow-md bg-white"
        )}
      >
        <CardContent className="p-0">
          {/* Aktif gösterge çizgisi — üst kenar */}
          {isActive && (
            <div className="h-0.5 bg-gradient-to-r from-orange-400 to-amber-400" />
          )}

          <div className="p-3">
            {/* Ana satır */}
            <div className="flex items-start gap-2.5">

              {/* İndeks rozeti */}
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5 transition-colors",
                isActive
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                  : "bg-orange-100 text-orange-700"
              )}>
                {index + 1}
              </div>

              {/* Bilgi alanı */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-gray-900 truncate leading-tight">{item.name}</h4>

                {/* Meta şerit */}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {item.start_time && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md">
                      <Clock className="h-2.5 w-2.5 text-gray-400" />
                      {item.start_time} – {endTime}
                    </span>
                  )}
                  <Badge variant="secondary"
                    className="bg-orange-50 text-orange-600 border border-orange-100 text-[9px] font-bold px-1.5 py-0 h-4">
                    {item.category}
                  </Badge>
                  {item.rating && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                      {item.rating}
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail */}
              <div className="relative w-[68px] h-[68px] rounded-xl overflow-hidden bg-gray-100 shrink-0 shadow-sm">
                {!imgLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
                )}
                <img
                  src={imgError ? FALLBACK_IMAGE : photoUrl}
                  alt={item.name}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => { setImgError(true); setImgLoaded(true); }}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    imgLoaded ? "opacity-100" : "opacity-0"
                  )}
                />
                {/* Thumbnail üstü gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Aksiyon butonları */}
              <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                {/* Sürükle tutacağı */}
                <div
                  {...attributes} {...listeners}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors"
                  onClick={e => e.stopPropagation()}
                  title="Sürükle"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-gray-100">
                      <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5 shadow-xl shadow-black/10">
                    <DropdownMenuItem
                      onClick={e => { e.stopPropagation(); setIsEditingNote(true); }}
                      className="text-xs font-bold gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-orange-500" />
                      Not Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={e => { e.stopPropagation(); onDelete(); }}
                      className="text-xs font-bold gap-2.5 rounded-lg px-2.5 py-2 text-red-500 cursor-pointer focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Kaldır
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Not düzenleme */}
            <AnimatePresence>
              {isEditingNote && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 space-y-2 overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Bu durak için not ekle..."
                    className="bg-gray-50 border-gray-200 rounded-xl text-xs font-medium min-h-[56px] focus:ring-orange-600/20 focus:border-orange-400"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm"
                      onClick={() => setIsEditingNote(false)}
                      className="h-6 text-[10px] font-black px-2">
                      Vazgeç
                    </Button>
                    <Button size="sm" onClick={handleSaveNote}
                      className="h-6 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black px-3 rounded-lg">
                      Kaydet
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mevcut not gösterimi */}
            {!isEditingNote && item.notes && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2.5 flex items-start gap-2 p-2.5 bg-orange-50 rounded-xl border-l-[3px] border-orange-400"
              >
                <MessageSquare className="h-3 w-3 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-[11px] font-medium italic text-orange-800 leading-snug">{item.notes}</p>
              </motion.div>
            )}

            {/* why_visit */}
            {item.why_visit && (
              <div className="mt-2 flex items-start gap-2 px-2.5 py-2 bg-blue-50 rounded-xl border border-blue-100">
                <Navigation className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 font-medium leading-snug">{item.why_visit}</p>
              </div>
            )}

            {/* personal_tip */}
            {item.personal_tip && (
              <div className="mt-1.5 flex items-start gap-2 px-2.5 py-2 bg-amber-50 rounded-xl border border-amber-100">
                <Star className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 font-medium leading-snug">{item.personal_tip}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
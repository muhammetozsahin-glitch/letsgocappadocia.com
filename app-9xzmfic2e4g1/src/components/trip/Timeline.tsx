import { ItineraryDay, Place } from '@/db/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star, Clock, MapPin, GripVertical, Car, Trash2, Edit3,
  MessageSquare, MoreVertical, Sun, Sunset, Moon, Coffee,
  Package, Wand2
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
} from "@/components/ui/dropdown-menu";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
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

function getSegment(time: string): 'morning' | 'afternoon' | 'evening' {
  const mins = parseMinutes(time);
  if (mins < 12 * 60) return 'morning';
  if (mins < 18 * 60) return 'afternoon';
  return 'evening';
}

const SEGMENT_META = {
  morning:   { label: 'Sabah',         icon: Sun,     color: 'text-amber-500' },
  afternoon: { label: 'Öğleden Sonra', icon: Coffee,  color: 'text-orange-500' },
  evening:   { label: 'Akşam',         icon: Sunset,  color: 'text-rose-500' },
};

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
}

// ────────────────────────────────────────────────────────────────────────────
// Timeline root
// ────────────────────────────────────────────────────────────────────────────
export function Timeline(props: TimelineProps) {
  return (
    <div className="p-4 md:p-6 space-y-8">
      {props.itinerary.days.map((day, dayIndex) => (
        <DaySection key={day.day} {...props} day={day} dayIndex={dayIndex} />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DaySection
// ────────────────────────────────────────────────────────────────────────────
function DaySection({
  day, dayIndex,
  onReorder, onAddPlace, onDeletePlace,
  onUpdatePlaceNote, onUpdateDayNote,
  onPlaceClick, activePlaceId,
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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* Day note */}
      <div className="px-1">
        {isEditingNote ? (
          <div className="space-y-2">
            <Textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Bugün için notlarınızı yazın..."
              className="bg-amber-50 border-amber-200 rounded-xl text-sm font-medium min-h-[72px] focus:ring-orange-600/20 focus:border-orange-600"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditingNote(false)} className="h-7 text-[10px] font-bold">Vazgeç</Button>
              <Button size="sm" className="h-7 bg-orange-600 text-white text-[10px] font-bold px-3 rounded-lg"
                onClick={() => { onUpdateDayNote(dayIndex, noteText); setIsEditingNote(false); }}>
                Kaydet
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingNote(true)}
            className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all group text-left"
          >
            <MessageSquare className="h-4 w-4 text-gray-300 group-hover:text-orange-500 mt-0.5 transition-colors shrink-0" />
            {day.notes ? (
              <p className="text-sm font-medium text-gray-600 italic">"{day.notes}"</p>
            ) : (
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-orange-500 transition-colors">
                Bugüne not ekle...
              </span>
            )}
          </button>
        )}
      </div>

      {/* Empty state */}
      {day.items.length === 0 && (
        <div className="mx-2 py-12 flex flex-col items-center gap-3 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
            <Package className="h-6 w-6 text-orange-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-500">Henüz durak yok</p>
            <p className="text-xs text-gray-400 mt-1">Aşağıdan bir yer ekleyerek başlayın</p>
          </div>
        </div>
      )}

      {/* Grouped items */}
      {day.items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={day.items.map(i => i.place_id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1 relative">
              {/* Vertical line */}
              <div className="absolute left-[28px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-200 via-gray-100 to-transparent -z-10" />

              {segmentOrder.map(seg => {
                const items = grouped[seg];
                if (!items?.length) return null;
                const meta = SEGMENT_META[seg];
                const SegIcon = meta.icon;

                return (
                  <div key={seg} className="space-y-3">
                    {/* Segment label */}
                    <div className={cn("flex items-center gap-2 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest", meta.color)}>
                      <SegIcon className="h-3.5 w-3.5" />
                      {meta.label}
                    </div>

                    {items.map((item) => {
                      const globalIndex = day.items.findIndex(i => i.place_id === item.place_id);
                      return (
                        <div key={item.place_id} id={`place-${item.place_id}`} className="relative group">
                          {/* Timeline dot */}
                          <div className={cn(
                            "absolute left-6 top-6 w-3 h-3 rounded-full border-2 z-10 transition-all duration-200",
                            activePlaceId === item.place_id
                              ? "bg-orange-600 border-orange-600 scale-150 shadow-lg shadow-orange-600/40"
                              : "bg-white border-gray-300 group-hover:border-orange-400"
                          )} />

                          <div className="pl-12 pr-2">
                            <SortableItem
                              item={item}
                              index={globalIndex}
                              isActive={activePlaceId === item.place_id}
                              onClick={() => onPlaceClick(item.place_id)}
                              onDelete={() => onDeletePlace(dayIndex, item.place_id)}
                              onUpdateNote={note => onUpdatePlaceNote(dayIndex, item.place_id, note)}
                            />

                            {/* Travel time connector */}
                            {globalIndex < day.items.length - 1 && (
                              <div className="my-3 ml-1 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <Car className="h-3.5 w-3.5" />
                                <span>~15 dk sürüş</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* AI suggestion card */}
      <div className="mx-2">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 space-y-3 relative overflow-hidden group">
          <div className="absolute -right-3 -top-3 opacity-5">
            <Wand2 className="h-20 w-20 text-orange-600" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-orange-800">Akıllı Tur Önerisi</span>
            <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 border-0 text-[9px] font-black">%82 Uyum</Badge>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Planınız Green Tour rotasıyla %82 uyumlu. Yeraltı şehri ve Ihlara Vadisi eklenebilir.
          </p>
          <Button className="w-full bg-orange-600 hover:bg-orange-700 h-8 rounded-xl text-[10px] font-black gap-1.5">
            <Wand2 className="h-3.5 w-3.5" />
            Seçenekleri İncele
          </Button>
        </div>
      </div>

      {/* Add place search */}
      <div className="mx-2">
        <PlaceSearch
          onPlaceSelect={place => onAddPlace(dayIndex, place)}
          placeholder="Yeni bir durak ekle..."
        />
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SortableItem — Wanderlog stili küçük thumbnail
// ────────────────────────────────────────────────────────────────────────────
function SortableItem({
  item, index, isActive, onClick, onDelete, onUpdateNote
}: {
  item: Place;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onUpdateNote: (note: string) => void;
}) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [note, setNote] = useState(item.notes || '');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.place_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.4 : 1,
  };

  const photoUrl = useMemo(() => {
    if (!item.photo_reference) return null;
    return item.photo_reference.startsWith('http')
      ? item.photo_reference
      : api.getPhotoUrl(item.photo_reference);
  }, [item.photo_reference]);

  const endTime = calcEndTime(item);

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        onClick={onClick}
        className={cn(
          "overflow-hidden cursor-pointer transition-all duration-200 rounded-2xl border",
          isDragging && "opacity-50 border-dashed",
          isActive
            ? "border-orange-500 shadow-lg shadow-orange-500/15 ring-2 ring-orange-500/10"
            : "border-gray-100 hover:border-gray-200 hover:shadow-md"
        )}
      >
        <CardContent className="p-3">
          {/* Ana satır */}
          <div className="flex items-start gap-2">

            {/* Index numarası */}
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-black text-[10px] shrink-0 mt-0.5">
              {index + 1}
            </div>

            {/* Bilgi alanı */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-gray-900 truncate">{item.name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {item.start_time && (
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                    {item.start_time} – {endTime}
                  </span>
                )}
                <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[9px] font-bold px-1.5 py-0 h-4 border-0">
                  {item.category}
                </Badge>
                {item.estimated_duration_minutes && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-gray-400">
                    <Clock className="h-2.5 w-2.5" />
                    {item.estimated_duration_minutes}dk
                  </span>
                )}
                {item.rating && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-gray-400">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    {item.rating}
                  </span>
                )}
              </div>
            </div>

            {/* Küçük thumbnail */}
            {photoUrl && !imgError && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                {!imgLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
                )}
                <img
                  src={photoUrl}
                  alt={item.name}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    imgLoaded ? "opacity-100" : "opacity-0"
                  )}
                />
              </div>
            )}

            {/* Aksiyonlar (hover'da görünür) */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
              <div
                {...attributes} {...listeners}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 cursor-grab active:cursor-grabbing"
                onClick={e => e.stopPropagation()}
              >
                <GripVertical className="h-3.5 w-3.5" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                    <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 rounded-xl p-1">
                  <DropdownMenuItem
                    onClick={e => { e.stopPropagation(); setIsEditingNote(true); }}
                    className="text-xs font-bold gap-2 rounded-lg"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-orange-500" />Not Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={e => { e.stopPropagation(); onDelete(); }}
                    className="text-xs font-bold gap-2 text-red-500 rounded-lg focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />Kaldır
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Not düzenleme alanı */}
          <AnimatePresence>
            {isEditingNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <Textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Not ekle..."
                  className="bg-gray-50 border-gray-200 rounded-xl text-xs font-medium min-h-[60px]"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingNote(false)} className="h-6 text-[10px] font-bold">Vazgeç</Button>
                  <Button size="sm" className="h-6 bg-orange-600 text-white text-[10px] font-bold px-3 rounded-lg"
                    onClick={() => { onUpdateNote(note); setIsEditingNote(false); }}>
                    Kaydet
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mevcut not gösterimi */}
          {!isEditingNote && item.notes && (
            <div className="mt-2.5 p-2 bg-orange-50 rounded-xl border-l-2 border-orange-500">
              <p className="text-[11px] font-medium italic text-orange-800">{item.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
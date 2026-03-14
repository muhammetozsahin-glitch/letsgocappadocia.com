// ════════════════════════════════════════════════════════════════════════════
// TripSectionsPanel — Wanderlog tarzı sol panel
// DOSYA: src/components/trip/TripSectionsPanel.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from 'react';
import {
  Trip, TripSection, SavedPlace, BudgetItem, BudgetCategory,
} from '@/db/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown, ChevronRight, Plus, Trash2, Edit3, X,
  Hotel, UtensilsCrossed, Compass, Star, MapPin, MessageSquare,
  Plane, Train, Car, ShoppingBag, Wallet, PiggyBank, Receipt,
  DollarSign, Euro, TurkishLira, Grip, ExternalLink,
  CalendarDays, BarChart3,
} from 'lucide-react';

// ── Sabitler ──────────────────────────────────────────────────────────────────
const SECTION_TYPES: { id: TripSection['type']; label: string; icon: any; color: string }[] = [
  { id: 'places',      label: 'Gezilecek Yerler', icon: Compass,        color: 'text-blue-500' },
  { id: 'hotels',      label: 'Konaklama',         icon: Hotel,          color: 'text-purple-500' },
  { id: 'restaurants', label: 'Restoranlar',        icon: UtensilsCrossed,color: 'text-orange-500' },
  { id: 'activities',  label: 'Aktiviteler',        icon: Star,           color: 'text-amber-500' },
  { id: 'custom',      label: 'Özel Liste',         icon: ShoppingBag,   color: 'text-gray-500' },
];

const BUDGET_CATEGORIES: { id: BudgetCategory; label: string; icon: any; color: string }[] = [
  { id: 'flight',     label: 'Uçuş',       icon: Plane,          color: 'bg-sky-100 text-sky-700' },
  { id: 'lodging',    label: 'Konaklama',  icon: Hotel,          color: 'bg-purple-100 text-purple-700' },
  { id: 'rental_car', label: 'Araç',       icon: Car,            color: 'bg-emerald-100 text-emerald-700' },
  { id: 'train',      label: 'Ulaşım',     icon: Train,          color: 'bg-blue-100 text-blue-700' },
  { id: 'food',       label: 'Yiyecek',    icon: UtensilsCrossed,color: 'bg-orange-100 text-orange-700' },
  { id: 'activities', label: 'Aktivite',   icon: Star,           color: 'bg-amber-100 text-amber-700' },
  { id: 'other',      label: 'Diğer',      icon: ShoppingBag,    color: 'bg-gray-100 text-gray-700' },
];

// ── Props ────────────────────────────────────────────────────────────────────
interface TripSectionsPanelProps {
  trip: Trip;
  onUpdateNotes: (notes: string) => void;
  onAddSection: (section: TripSection) => void;
  onDeleteSection: (sectionId: string) => void;
  onRenameSectionTitle: (sectionId: string, title: string) => void;
  onAddSavedPlace: (sectionId: string, place: SavedPlace) => void;
  onDeleteSavedPlace: (sectionId: string, placeId: string) => void;
  onAddBudgetItem: (item: BudgetItem) => void;
  onDeleteBudgetItem: (id: string) => void;
  onSetBudgetTotal: (total: number, currency: string) => void;
}

// ════════════════════════════════════════════════════════════════════════════
// Ana bileşen
// ════════════════════════════════════════════════════════════════════════════
export function TripSectionsPanel({
  trip,
  onUpdateNotes, onAddSection, onDeleteSection, onRenameSectionTitle,
  onAddSavedPlace, onDeleteSavedPlace,
  onAddBudgetItem, onDeleteBudgetItem, onSetBudgetTotal,
}: TripSectionsPanelProps) {

  // Hangi accordion açık
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    notes: true,
    places: true,
    budget: false,
  });

  const toggle = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Not düzenleme
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState(trip.trip_notes || '');

  // Bütçe formu
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState<Partial<BudgetItem>>({
    category: 'other', currency: 'EUR', amount: 0, name: '',
  });
  const [budgetTotalDraft, setBudgetTotalDraft] = useState(String(trip.budget_total || ''));

  // Yeni bölüm ekleme
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionType, setNewSectionType] = useState<TripSection['type']>('places');
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Bölüm başlığı düzenleme
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');

  // Bütçe hesapları
  const budgetStats = useMemo(() => {
    const items = trip.budget_items || [];
    const total = items.reduce((s, i) => s + (i.amount || 0), 0);
    const byCategory: Record<string, number> = {};
    items.forEach(i => { byCategory[i.category] = (byCategory[i.category] || 0) + i.amount; });
    const currency = trip.budget_currency || 'EUR';
    const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '₺';
    return { total, byCategory, currency, sym };
  }, [trip.budget_items, trip.budget_currency]);

  const handleAddSection = () => {
    const typeMeta = SECTION_TYPES.find(t => t.id === newSectionType);
    const id = `section_${Date.now()}`;
    onAddSection({
      id,
      title: newSectionTitle.trim() || typeMeta?.label || 'Yeni Bölüm',
      type: newSectionType,
      items: [],
    });
    setShowAddSection(false);
    setNewSectionTitle('');
    setNewSectionType('places');
    // Yeni bölümü aç
    setOpenSections(prev => ({ ...prev, [id]: true }));
  };

  const handleAddBudgetItem = () => {
    if (!budgetForm.name?.trim() || !budgetForm.amount) return;
    onAddBudgetItem({
      id: `budget_${Date.now()}`,
      category: budgetForm.category || 'other',
      name: budgetForm.name,
      amount: Number(budgetForm.amount),
      currency: budgetForm.currency || 'EUR',
    });
    setBudgetForm({ category: 'other', currency: 'EUR', amount: 0, name: '' });
    setShowBudgetForm(false);
  };

  const currencySymbol = (c: string) => c === 'EUR' ? '€' : c === 'USD' ? '$' : '₺';

  return (
    <div className="divide-y divide-gray-100">

      {/* ── NOTLAR ──────────────────────────────────────────────────────── */}
      <AccordionSection
        title="Notlar"
        icon={<MessageSquare className="h-3.5 w-3.5 text-gray-500" />}
        isOpen={openSections['notes']}
        onToggle={() => toggle('notes')}
      >
        {editingNotes ? (
          <div className="p-3 space-y-2">
            <Textarea
              value={noteDraft}
              onChange={e => setNoteDraft(e.target.value)}
              placeholder="Gezi notlarınızı buraya yazın — ulaşım ipuçları, önemli hatırlatmalar..."
              className="min-h-[100px] text-sm rounded-xl bg-amber-50 border-amber-200 focus:border-amber-400 resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs font-bold" onClick={() => { setEditingNotes(false); setNoteDraft(trip.trip_notes || ''); }}>Vazgeç</Button>
              <Button size="sm" className="h-7 text-xs font-bold bg-primary" onClick={() => { onUpdateNotes(noteDraft); setEditingNotes(false); }}>Kaydet</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setEditingNotes(true); setNoteDraft(trip.trip_notes || ''); }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors group"
          >
            {trip.trip_notes ? (
              <p className="text-sm text-gray-600 leading-relaxed">{trip.trip_notes}</p>
            ) : (
              <p className="text-sm text-gray-400 group-hover:text-gray-500 transition-colors italic">
                Notlarınızı buraya yazın — ulaşım ipuçları, önemli hatırlatmalar...
              </p>
            )}
          </button>
        )}
      </AccordionSection>

      {/* ── GEZİLECEK YERLER BÖLÜMLER ──────────────────────────────────── */}
      {(trip.sections || []).map(section => {
        const typeMeta = SECTION_TYPES.find(t => t.id === section.type);
        const SectionIcon = typeMeta?.icon || Compass;

        return (
          <AccordionSection
            key={section.id}
            title={
              editingSectionId === section.id ? (
                <input
                  value={editingSectionTitle}
                  onChange={e => setEditingSectionTitle(e.target.value)}
                  onBlur={() => { onRenameSectionTitle(section.id, editingSectionTitle); setEditingSectionId(null); }}
                  onKeyDown={e => { if (e.key === 'Enter') { onRenameSectionTitle(section.id, editingSectionTitle); setEditingSectionId(null); } }}
                  className="text-sm font-bold bg-transparent border-b border-primary outline-none w-40"
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              ) : section.title
            }
            icon={<SectionIcon className={cn("h-3.5 w-3.5", typeMeta?.color)} />}
            isOpen={openSections[section.id] ?? true}
            onToggle={() => toggle(section.id)}
            rightActions={
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                  onClick={e => { e.stopPropagation(); setEditingSectionId(section.id); setEditingSectionTitle(section.title); }}
                >
                  <Edit3 className="h-3 w-3" />
                </button>
                <button
                  className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
                  onClick={e => { e.stopPropagation(); onDeleteSection(section.id); }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            }
          >
            {/* Kayıtlı yer listesi */}
            <div className="divide-y divide-gray-50">
              {section.items.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <SectionIcon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Henüz yer eklenmedi</p>
                </div>
              )}
              {section.items.map(place => (
                <SavedPlaceRow
                  key={place.id}
                  place={place}
                  onDelete={() => onDeleteSavedPlace(section.id, place.id)}
                />
              ))}
            </div>

            {/* Yer ekle butonu */}
            <div className="px-4 py-2 border-t border-dashed border-gray-100">
              <QuickAddPlaceInput
                onAdd={(place) => onAddSavedPlace(section.id, place)}
                placeholder={`${section.title} ekle...`}
              />
            </div>
          </AccordionSection>
        );
      })}

      {/* ── YENİ BÖLÜM EKLE ────────────────────────────────────────────── */}
      <div className="px-4 py-3">
        {showAddSection ? (
          <div className="space-y-3 bg-gray-50 rounded-xl p-3">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Yeni Bölüm</p>
            <div className="grid grid-cols-3 gap-1.5">
              {SECTION_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setNewSectionType(type.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all',
                      newSectionType === type.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    )}
                  >
                    <Icon className={cn("h-4 w-4", newSectionType === type.id ? 'text-primary' : type.color)} />
                    <span className="text-[9px] font-bold leading-tight">{type.label}</span>
                  </button>
                );
              })}
            </div>
            <Input
              value={newSectionTitle}
              onChange={e => setNewSectionTitle(e.target.value)}
              placeholder={`Bölüm adı (isteğe bağlı)`}
              className="h-9 text-sm rounded-lg"
              onKeyDown={e => { if (e.key === 'Enter') handleAddSection(); }}
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs font-bold" onClick={() => setShowAddSection(false)}>Vazgeç</Button>
              <Button size="sm" className="flex-1 h-8 text-xs font-bold bg-primary" onClick={handleAddSection}>Ekle</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddSection(true)}
            className="w-full flex items-center gap-2 py-2.5 text-sm font-bold text-gray-400 hover:text-primary transition-colors group"
          >
            <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 group-hover:border-primary flex items-center justify-center transition-colors">
              <Plus className="h-3 w-3" />
            </div>
            Başlık ekle (ör: "Restoranlar")
          </button>
        )}
      </div>

      {/* ── BÜTÇE ───────────────────────────────────────────────────────── */}
      <AccordionSection
        title="Bütçe"
        icon={<Wallet className="h-3.5 w-3.5 text-emerald-500" />}
        isOpen={openSections['budget']}
        onToggle={() => toggle('budget')}
        badge={
          (trip.budget_items?.length || 0) > 0 ? (
            <span className="text-[10px] font-black text-emerald-600">
              {budgetStats.sym}{budgetStats.total.toFixed(0)}
            </span>
          ) : undefined
        }
      >
        <div className="px-4 py-3 space-y-4">

          {/* Hedef bütçe */}
          <div className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-emerald-500 shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Hedef bütçe:</span>
              <div className="flex items-center gap-1 bg-gray-50 border rounded-lg px-2 py-1">
                <input
                  type="number"
                  value={budgetTotalDraft}
                  onChange={e => setBudgetTotalDraft(e.target.value)}
                  onBlur={() => onSetBudgetTotal(Number(budgetTotalDraft), trip.budget_currency || 'EUR')}
                  className="w-20 text-sm font-bold text-gray-800 bg-transparent outline-none"
                  placeholder="0"
                />
                <span className="text-xs font-bold text-gray-400">{budgetStats.sym}</span>
              </div>
            </div>
          </div>

          {/* Özet çubuklar */}
          {(trip.budget_items?.length || 0) > 0 && (
            <div className="space-y-2">
              {BUDGET_CATEGORIES.filter(c => budgetStats.byCategory[c.id]).map(cat => {
                const amount = budgetStats.byCategory[cat.id] || 0;
                const percent = trip.budget_total ? Math.min(100, (amount / trip.budget_total) * 100) : 0;
                const Icon = cat.icon;
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-gray-400" />
                        <span className="font-semibold text-gray-600">{cat.label}</span>
                      </div>
                      <span className="font-bold text-gray-700">{budgetStats.sym}{amount.toFixed(0)}</span>
                    </div>
                    {trip.budget_total ? (
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-xs font-black text-gray-700">Toplam Harcama</span>
                <span className="text-sm font-black text-gray-900">{budgetStats.sym}{budgetStats.total.toFixed(0)}</span>
              </div>

              {trip.budget_total ? (
                <div className={cn(
                  "px-3 py-2 rounded-xl text-[11px] font-bold text-center",
                  budgetStats.total > trip.budget_total
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-600"
                )}>
                  {budgetStats.total > trip.budget_total
                    ? `Bütçe ${budgetStats.sym}${(budgetStats.total - trip.budget_total).toFixed(0)} aşıldı`
                    : `Bütçede ${budgetStats.sym}${(trip.budget_total - budgetStats.total).toFixed(0)} kaldı`
                  }
                </div>
              ) : null}
            </div>
          )}

          {/* Harcama kalemleri */}
          {(trip.budget_items || []).map(item => {
            const catMeta = BUDGET_CATEGORIES.find(c => c.id === item.category);
            const CatIcon = catMeta?.icon || ShoppingBag;
            return (
              <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 group">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", catMeta?.color || 'bg-gray-100 text-gray-500')}>
                  <CatIcon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-gray-800 truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400">{catMeta?.label}</p>
                </div>
                <span className="text-sm font-black text-gray-700 shrink-0">
                  {currencySymbol(item.currency)}{item.amount}
                </span>
                <button
                  onClick={() => onDeleteBudgetItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-400 transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {/* Harcama ekle formu */}
          {showBudgetForm ? (
            <div className="bg-gray-50 rounded-xl p-3 space-y-3">
              <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Harcama Ekle</p>

              {/* Kategori seçimi */}
              <div className="grid grid-cols-4 gap-1">
                {BUDGET_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setBudgetForm(p => ({ ...p, category: cat.id }))}
                      className={cn(
                        'flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-all',
                        budgetForm.category === cat.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", budgetForm.category === cat.id ? 'text-primary' : 'text-gray-400')} />
                      <span className="text-[8px] font-bold text-gray-500 leading-tight text-center">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              <Input
                placeholder="Harcama adı..."
                value={budgetForm.name || ''}
                onChange={e => setBudgetForm(p => ({ ...p, name: e.target.value }))}
                className="h-9 text-sm rounded-lg"
              />

              <div className="flex gap-2">
                <div className="flex-1 flex items-center border rounded-lg overflow-hidden">
                  <input
                    type="number"
                    placeholder="0"
                    value={budgetForm.amount || ''}
                    onChange={e => setBudgetForm(p => ({ ...p, amount: Number(e.target.value) }))}
                    className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                  />
                  <select
                    value={budgetForm.currency || 'EUR'}
                    onChange={e => setBudgetForm(p => ({ ...p, currency: e.target.value }))}
                    className="border-l px-2 py-2 text-xs bg-gray-50 outline-none"
                  >
                    <option value="EUR">EUR €</option>
                    <option value="USD">USD $</option>
                    <option value="TRY">TRY ₺</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs font-bold" onClick={() => setShowBudgetForm(false)}>Vazgeç</Button>
                <Button size="sm" className="flex-1 h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700" onClick={handleAddBudgetItem}>Ekle</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowBudgetForm(true)}
              className="w-full flex items-center gap-2 py-2 text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors group"
            >
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 group-hover:border-emerald-400 flex items-center justify-center transition-colors">
                <Plus className="h-3 w-3" />
              </div>
              Harcama ekle
            </button>
          )}
        </div>
      </AccordionSection>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Accordion bölüm sarmalayıcısı
// ════════════════════════════════════════════════════════════════════════════
function AccordionSection({
  title, icon, isOpen, onToggle, children, rightActions, badge,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  rightActions?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors group text-left"
      >
        {icon}
        <span className="flex-1 text-sm font-bold text-gray-800">{title}</span>
        {badge && <span className="mr-1">{badge}</span>}
        {rightActions}
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

// ════════════════════════════════════════════════════════════════════════════
// Kayıtlı yer satırı
// ════════════════════════════════════════════════════════════════════════════
function SavedPlaceRow({ place, onDelete }: { place: SavedPlace; onDelete: () => void }) {
  const [imgError, setImgError] = useState(false);
  const hasPhoto = place.photo_reference && !imgError;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group">
      {/* Fotoğraf veya placeholder */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
        {hasPhoto ? (
          <img
            src={place.photo_reference?.startsWith('http')
              ? place.photo_reference
              : `https://maps.googleapis.com/maps/api/place/photo?maxwidth=80&photo_reference=${place.photo_reference}`}
            alt={place.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <MapPin className="h-4 w-4 text-gray-300" />
        )}
      </div>

      {/* Bilgi */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-gray-800 truncate">{place.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {place.rating && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
              <Star className="h-2.5 w-2.5 fill-amber-400" />
              {place.rating}
            </span>
          )}
          <span className="text-[10px] text-gray-400 truncate">{place.formatted_address || place.category}</span>
        </div>
        {place.notes && (
          <p className="text-[11px] text-gray-500 italic mt-0.5 truncate">"{place.notes}"</p>
        )}
      </div>

      {/* Sil */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-all shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Hızlı yer ekleme input (basit metin girişi)
// ════════════════════════════════════════════════════════════════════════════
function QuickAddPlaceInput({
  onAdd, placeholder,
}: {
  onAdd: (place: SavedPlace) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd({
      id: `saved_${Date.now()}`,
      place_id: `manual_${Date.now()}`,
      name: trimmed,
      lat: 38.6431,
      lng: 34.8347,
      category: 'Yer',
    });
    setValue('');
  };

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-3.5 w-3.5 text-gray-300 shrink-0" />
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        placeholder={placeholder || 'Yer ekle...'}
        className="flex-1 text-sm text-gray-600 placeholder:text-gray-300 bg-transparent outline-none py-1"
      />
      {value && (
        <button
          onClick={handleAdd}
          className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-primary" />
        </button>
      )}
    </div>
  );
}
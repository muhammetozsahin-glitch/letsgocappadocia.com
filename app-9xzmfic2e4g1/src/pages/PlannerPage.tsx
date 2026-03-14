// src/pages/PlannerPage.tsx
import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/db/api';
import { toast } from 'sonner';
import { format, differenceInDays, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { parseApiError } from '@/utils/errorHandler';
import { retryWithBackoff, withTimeout } from '@/utils/retryWithBackoff';
import { toursApi, balloonsApi, activitiesApi } from '@/db/agency-api';
import type { Tour, BalloonFlight, Activity } from '@/types/agency';
import {
  Calendar, Users, MapPin, ArrowRight, ArrowLeft,
  Wind, Bus, Zap, CheckCircle2, Clock,
  Sparkles, Loader2, Home, Mountain,
  Info, AlertCircle, Minus, Plus,
} from 'lucide-react';
import { DateSelector } from '@/components/planner/DateSelector';

// ─── Adımlar ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'dates',    title: 'Tarih & Kişi',       icon: Calendar, desc: 'Ne zaman, kaç kişi?' },
  { id: 'services', title: 'Tur & Aktiviteler',  icon: Bus,      desc: 'Ne yapmak istiyorsunuz?' },
  { id: 'prefs',    title: 'Konaklama',           icon: Home,     desc: 'Nasıl bir konaklama?' },
] as const;

type StepId = typeof STEPS[number]['id'];

// Konaklama seçenekleri
const ACCOMMODATION_OPTIONS = [
  { id: 'cave',     label: 'Mağara Otel',    desc: 'Eşsiz Kapadokya deneyimi',     icon: Mountain },
  { id: 'center',   label: 'Merkez Otel',    desc: 'Göreme veya Ürgüp merkezi',     icon: MapPin },
  { id: 'boutique', label: 'Butik Otel',     desc: 'Küçük, şık tesis',             icon: Home },
];

// ─── Yükleme mesajları ──────────────────────────────────────────────────────
const LOADING_STEPS = [
  { label: 'Seçimleriniz hazırlanıyor...', pct: 20 },
  { label: 'Günler planlanıyor...',         pct: 45 },
  { label: 'Haritalar doğrulanıyor...',     pct: 65 },
  { label: 'Rotanız oluşturuluyor!',       pct: 100 },
];

// ─── Bileşen ────────────────────────────────────────────────────────────────
export default memo(function PlannerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [dateOpen, setDateOpen] = useState(false);

  // Adım 1
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [travelers, setTravelers] = useState(2);
  const [dateError, setDateError] = useState('');

  // Adım 2 — veritabanından çekilecek
  const [tours, setTours] = useState<Tour[]>([]);
  const [balloons, setBalloons] = useState<BalloonFlight[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Seçimler
  const [selectedTours, setSelectedTours] = useState<string[]>([]);   // tour.id[]
  const [selectedBalloon, setSelectedBalloon] = useState<string>(''); // balloon.id
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]); // activity.id[]

  // Adım 3
  const [accommodation, setAccommodation] = useState('center');

  // Adım 2'ye geçince servisleri yükle
  useEffect(() => {
    if (step === 1 && tours.length === 0) loadServices();
  }, [step]);

  const loadServices = async () => {
    setServicesLoading(true);
    try {
      const [t, b, a] = await Promise.all([
        toursApi.getAll(),
        balloonsApi.getAll(),
        activitiesApi.getAll(),
      ]);
      setTours(t);
      setBalloons(b);
      setActivities(a);
    } catch { toast.error('Servisler yüklenemedi'); }
    finally { setServicesLoading(false); }
  };

  // Gün sayısı hesapla
  const numDays = dateRange.from && dateRange.to
    ? differenceInDays(dateRange.to, dateRange.from) + 1
    : 0;

  // Adım 1 validasyon
  const validateStep1 = () => {
    if (!dateRange.from || !dateRange.to) { setDateError('Lütfen tarih seçin'); return false; }
    if (numDays < 1 || numDays > 14) { setDateError('Seyahat süresi 1–14 gün olmalı'); return false; }
    if (dateRange.from < new Date(new Date().setHours(0,0,0,0))) { setDateError('Başlangıç tarihi bugünden önce olamaz'); return false; }
    setDateError('');
    return true;
  };

  const nextStep = () => {
    if (step === 0 && !validateStep1()) return;
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const prevStep = () => { if (step > 0) setStep(s => s - 1); };

  const toggleTour = (id: string) => setSelectedTours(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleActivity = (id: string) => setSelectedActivities(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleBalloon = (id: string) => setSelectedBalloon(p => p === id ? '' : id);

  // Kaç tur seçilebilir (gün sayısına göre)
  const maxTours = Math.max(1, numDays - (selectedBalloon ? 1 : 0) - 1); // 1 gün varış/ayrılış

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!dateRange.from || !dateRange.to) return;
    setLoading(true);
    setLoadingStep(0);

    const iv = setInterval(() => {
      setLoadingStep(p => p < LOADING_STEPS.length - 1 ? p + 1 : p);
    }, 1800);

    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate   = format(dateRange.to,   'yyyy-MM-dd');

      // Seçilen servisleri gönder
      const selectedTourObjects = tours.filter(t => selectedTours.includes(t.id));
      const selectedBalloonObject = balloons.find(b => b.id === selectedBalloon) || null;
      const selectedActivityObjects = activities.filter(a => selectedActivities.includes(a.id));

      const result: any = await retryWithBackoff(
        () => withTimeout(
          api.generateItinerary({
            startDate, endDate,
            travelers,
            accommodation,
            // Yeni: direkt seçilen servisler
            selectedTours: selectedTourObjects.map(t => ({
              id: t.id, code: t.code, name: t.name, slug: t.slug,
              start_time: t.start_time, end_time: t.end_time,
              duration_hours: t.duration_hours, price_adult: t.group_price_adult,
              currency: t.currency, cover_image: t.cover_image,
              itinerary: t.itinerary || [],
            })),
            selectedBalloon: selectedBalloonObject ? {
              id: selectedBalloonObject.id, name: selectedBalloonObject.name,
              slug: selectedBalloonObject.slug, flight_time: selectedBalloonObject.flight_time || '05:30',
              duration_minutes: selectedBalloonObject.duration_minutes,
              price_adult: selectedBalloonObject.sell_price_adult,
              currency: selectedBalloonObject.currency, cover_image: selectedBalloonObject.cover_image,
            } : null,
            selectedActivities: selectedActivityObjects.map(a => ({
              id: a.id, name: a.name, slug: a.slug,
              duration_minutes: a.duration_minutes, price_adult: a.sell_price_adult,
              currency: a.currency, cover_image: a.cover_image,
              start_time: a.time_slots?.[0]?.time || '10:00',
            })),
            // Legacy (backward compat)
            interests: [
              ...(selectedBalloon ? ['balloon'] : []),
              ...(selectedTourObjects.some(t => t.code === 'red') ? ['history'] : []),
              'nature',
            ],
            travelType: 'couple', budget: 'moderate', transport: 'mixed',
            dailySchedule: 'moderate',
          }),
          60000,
          new Error('Sunucu yanıt vermiyor, lütfen tekrar deneyin.')
        ),
        { maxRetries: 2, initialDelay: 1000, maxDelay: 5000 }
      );

      clearInterval(iv);

      const tripTitle = buildTripTitle(selectedTourObjects, !!selectedBalloon);
      const itinerary = { days: result.days };

      if (user) {
        const saved = await api.saveTrip({
          user_id: user.id, title: tripTitle,
          destination: 'Cappadocia', start_date: startDate, end_date: endDate,
          preferences: { startDate, endDate, travelers, accommodation,
            selectedTourIds: selectedTours, selectedBalloonId: selectedBalloon,
            selectedActivityIds: selectedActivities },
          itinerary,
        });
        navigate(`/trip/${saved.id}`);
        toast.success('Planınız hazır!');
      } else {
        sessionStorage.setItem('pending_trip', JSON.stringify({
          title: tripTitle, destination: 'Cappadocia', start_date: startDate, end_date: endDate,
          preferences: {}, itinerary,
        }));
        navigate('/trip/preview');
      }
    } catch (err) {
      clearInterval(iv);
      toast.error('Hata oluştu', { description: parseApiError(err).userMessage });
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const buildTripTitle = (selTours: Tour[], hasBalloon: boolean) => {
    const parts: string[] = [];
    if (hasBalloon) parts.push('Balon');
    selTours.forEach(t => parts.push(t.name.split(' ')[0]));
    if (parts.length === 0) return 'Kapadokya Gezisi';
    return `Kapadokya: ${parts.join(' + ')}`;
  };

  // ── Loading ekranı ──────────────────────────────────────────────────────
  if (loading) {
    const prog = LOADING_STEPS[loadingStep]?.pct ?? 0;
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <img src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400" alt="" className="w-full h-full object-cover grayscale" />
        </div>
        <div className="absolute inset-0 bg-secondary/60" />
        <div className="relative z-10 max-w-md w-full px-8 text-center space-y-10">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-primary rounded-2xl animate-pulse opacity-30 scale-110" />
            <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30">
              <Loader2 className="h-11 w-11 text-white animate-spin" />
            </div>
          </div>
          <div className="space-y-5">
            <AnimatePresence mode="wait">
              <motion.h2 key={loadingStep} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="text-3xl font-black text-white tracking-tighter uppercase">
                {LOADING_STEPS[loadingStep]?.label}
              </motion.h2>
            </AnimatePresence>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${prog}%` }} transition={{ duration: 0.6 }} />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">
              <span>Hazırlanıyor</span><span>{prog}%</span>
            </div>
          </div>
          <p className="text-white/30 text-xs font-medium italic">Kapadokya planınız hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      {/* ── Sol sidebar ─────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[300px] xl:w-[360px] bg-secondary flex flex-col relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full p-8 lg:p-10 gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="text-base font-black text-white tracking-tight uppercase">
              Kapadokya <span className="text-primary">Planı</span>
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl xl:text-4xl font-black text-white leading-none tracking-tighter uppercase">
              GEZİNİZİ<br /><span className="text-primary">TASARLAYIN</span>
            </h1>
            <p className="text-white/35 text-sm font-medium italic">Turlarınızı seçin, plan hazır olsun.</p>
          </div>

          {/* Adım listesi */}
          <div className="flex-1 space-y-1.5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <motion.div key={s.id} animate={{ opacity: isActive || isDone ? 1 : 0.35 }}
                  className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all', isActive && 'bg-white/8')}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300',
                    isActive ? 'bg-primary text-white shadow-md shadow-primary/30 scale-110'
                    : isDone ? 'bg-white/10 text-primary' : 'bg-white/5 text-white/20')}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[9px] font-black uppercase tracking-[.15em]', isActive ? 'text-primary' : 'text-white/25')}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className={cn('text-sm font-bold leading-tight', isActive ? 'text-white' : isDone ? 'text-white/60' : 'text-white/30')}>
                      {s.title}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Özet — seçilen turlar */}
          {(selectedTours.length > 0 || selectedBalloon) && step > 0 && (
            <div className="space-y-2 p-3 rounded-xl bg-white/8">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Seçimleriniz</p>
              {selectedBalloon && (
                <div className="flex items-center gap-2 text-xs text-sky-300 font-bold">
                  <Wind className="h-3 w-3" /> Balon turu
                </div>
              )}
              {tours.filter(t => selectedTours.includes(t.id)).map(t => (
                <div key={t.id} className="flex items-center gap-2 text-xs text-orange-300 font-bold">
                  <Bus className="h-3 w-3" /> {t.name}
                </div>
              ))}
              {activities.filter(a => selectedActivities.includes(a.id)).map(a => (
                <div key={a.id} className="flex items-center gap-2 text-xs text-purple-300 font-bold">
                  <Zap className="h-3 w-3" /> {a.name}
                </div>
              ))}
            </div>
          )}

          {/* İlerleme */}
          <div className="space-y-2 pt-2 border-t border-white/8">
            <div className="flex justify-between text-[10px] font-bold text-white/25 uppercase tracking-widest">
              <span>İlerleme</span><span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sağ içerik ──────────────────────────────────────────────────── */}
      <div className="flex-1 bg-white dark:bg-card overflow-y-auto">
        <div className="max-w-2xl mx-auto min-h-full flex flex-col px-8 py-10 lg:py-14 lg:px-16">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }} className="flex-1 flex flex-col gap-8">

              {/* Başlık */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[.2em]">
                  <span>Adım {step + 1}/{STEPS.length}</span>
                  <span className="w-12 h-0.5 bg-primary/20 rounded-full" />
                  <span>{STEPS[step].title}</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight uppercase">
                  {STEPS[step].desc}
                </h2>
              </div>

              {/* ─── ADIM 1: Tarih + Kişi ─────────────────────────────── */}
              {step === 0 && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[.2em] text-primary">Tarihler</label>
                    <DateSelector date={dateRange as any} onDateChange={setDateRange as any}
                      isOpen={dateOpen} onOpenChange={setDateOpen} />
                    {dateError && <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle className="h-4 w-4" />{dateError}</p>}
                    {numDays > 0 && (
                      <div className="flex items-center gap-2 text-sm text-primary font-bold bg-primary/8 rounded-xl px-4 py-3">
                        <Clock className="h-4 w-4" />
                        {numDays} günlük Kapadokya gezisi
                        {numDays >= 4 && ' — Tüm büyük turlar için ideal'}
                        {numDays === 3 && ' — Balon + Kırmızı Tur için ideal'}
                        {numDays <= 2 && ' — Kısa kaçamak'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[.2em] text-primary">Kaç Kişi?</label>
                    <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                      {[{ label: 'Yetişkin', sub: '13+ yaş', val: travelers, set: setTravelers, min: 1 }].map(p => (
                        <div key={p.label} className="flex items-center justify-between w-full">
                          <div><p className="font-bold text-gray-800 dark:text-white">{p.label}</p><p className="text-xs text-gray-500">{p.sub}</p></div>
                          <div className="flex items-center gap-4">
                            <button onClick={() => p.set(Math.max(p.min, p.val - 1))} disabled={p.val <= p.min}
                              className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-all disabled:opacity-30">
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-xl font-black text-gray-900 dark:text-white">{p.val}</span>
                            <button onClick={() => p.set(p.val + 1)}
                              className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-all">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── ADIM 2: Tur & Aktivite Seçimi ───────────────────── */}
              {step === 1 && (
                <div className="space-y-8">
                  {servicesLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {/* Balon */}
                      {balloons.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Wind className="h-4 w-4 text-sky-500" />
                            <label className="text-[10px] font-black uppercase tracking-[.2em] text-sky-600">Balon Turu</label>
                          </div>
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-700">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>Balon turları <b>sabah 05:30'da</b> başlar. Bir gece önce hazırlık önerilir. İptal olabilir — ücretsiz iade uygulanır.</span>
                          </div>
                          <div className="grid gap-3">
                            {balloons.map(b => (
                              <ServiceCard key={b.id} selected={selectedBalloon === b.id}
                                onClick={() => toggleBalloon(b.id)}
                                icon={<Wind className="h-5 w-5 text-sky-500" />}
                                color="sky"
                                title={b.name}
                                meta={`05:30 kalkış · ${b.duration_minutes}dk · ${b.sell_price_adult}€/kişi`}
                                badge="🎈 Balon"
                                image={b.cover_image}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Günlük Turlar */}
                      {tours.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Bus className="h-4 w-4 text-orange-500" />
                              <label className="text-[10px] font-black uppercase tracking-[.2em] text-orange-600">Günlük Turlar</label>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold">
                              {numDays > 0 ? `${maxTours} güne kadar seçebilirsiniz` : 'Tarih seçin'}
                            </span>
                          </div>
                          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2 text-xs text-orange-700">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>Her tur <b>tam günlük</b> — sabah 09:00'dan akşam 17:30'a kadar. Aynı güne iki tur konmaz.</span>
                          </div>
                          <div className="grid gap-3">
                            {tours.map(t => {
                              const tourLabel: Record<string,string> = { red:'🔴 Kırmızı Tur', green:'🟢 Yeşil Tur', blue:'🔵 Mavi Tur' };
                              const isDisabled = !selectedTours.includes(t.id) && selectedTours.length >= maxTours;
                              return (
                                <ServiceCard key={t.id} selected={selectedTours.includes(t.id)}
                                  onClick={() => !isDisabled && toggleTour(t.id)}
                                  disabled={isDisabled}
                                  icon={<Bus className="h-5 w-5 text-orange-500" />}
                                  color="orange"
                                  title={t.name}
                                  meta={`${t.start_time} kalkış · ${t.duration_hours}s · ${t.group_price_adult}€/kişi`}
                                  badge={tourLabel[t.code] || '⭐ Özel Tur'}
                                  image={t.cover_image}
                                  desc={t.short_description}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Aktiviteler */}
                      {activities.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-purple-500" />
                            <label className="text-[10px] font-black uppercase tracking-[.2em] text-purple-600">Aktiviteler</label>
                            <span className="text-[10px] text-gray-400">(İsteğe bağlı)</span>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {activities.map(a => (
                              <ServiceCard key={a.id} selected={selectedActivities.includes(a.id)}
                                onClick={() => toggleActivity(a.id)}
                                icon={<Zap className="h-5 w-5 text-purple-500" />}
                                color="purple"
                                title={a.name}
                                meta={`${a.duration_minutes}dk · ${a.sell_price_adult}€/kişi`}
                                image={a.cover_image}
                                compact
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedTours.length === 0 && !selectedBalloon && (
                        <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Hiçbir şey seçmeden de devam edebilirsiniz — serbest gezi planı oluşturulur.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ─── ADIM 3: Konaklama ───────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-4">
                  {ACCOMMODATION_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const sel = accommodation === opt.id;
                    return (
                      <button key={opt.id} onClick={() => setAccommodation(opt.id)}
                        className={cn(
                          'w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all',
                          sel ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'
                        )}>
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', sel ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400')}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <p className={cn('font-black text-base', sel ? 'text-primary' : 'text-gray-900 dark:text-white')}>{opt.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                        </div>
                        {sel && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                      </button>
                    );
                  })}

                  {/* Özet */}
                  {(selectedTours.length > 0 || selectedBalloon || selectedActivities.length > 0) && (
                    <div className="mt-6 p-5 bg-gray-50 dark:bg-white/5 rounded-2xl space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Plan özeti</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{numDays} gün · {travelers} kişi</span>
                      </div>
                      {selectedBalloon && (
                        <div className="flex items-center gap-2 text-sm text-sky-600 font-bold">
                          <Wind className="h-4 w-4" />
                          {balloons.find(b => b.id === selectedBalloon)?.name} — 05:30 kalkış
                        </div>
                      )}
                      {tours.filter(t => selectedTours.includes(t.id)).map(t => (
                        <div key={t.id} className="flex items-center gap-2 text-sm text-orange-600 font-bold">
                          <Bus className="h-4 w-4" /> {t.name}
                        </div>
                      ))}
                      {activities.filter(a => selectedActivities.includes(a.id)).map(a => (
                        <div key={a.id} className="flex items-center gap-2 text-sm text-purple-600 font-bold">
                          <Zap className="h-4 w-4" /> {a.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigasyon */}
              <div className="pt-8 mt-auto flex items-center justify-between gap-4 border-t border-gray-100 dark:border-white/8">
                <Button type="button" variant="ghost" size="lg" onClick={prevStep} disabled={step === 0}
                  className="h-13 px-7 text-sm font-bold rounded-xl hover:bg-gray-50 group disabled:opacity-30">
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />Geri
                </Button>

                {step < STEPS.length - 1 ? (
                  <Button type="button" size="lg" onClick={nextStep}
                    className="h-13 px-10 text-sm font-black bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 group uppercase tracking-widest">
                    Devam Et<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <Button type="button" size="lg" onClick={handleSubmit}
                    className="h-13 px-12 text-sm font-black bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 uppercase tracking-widest">
                    Planı Oluştur<Sparkles className="ml-2 h-4 w-4 animate-pulse" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

// ── ServiceCard bileşeni ─────────────────────────────────────────────────────
function ServiceCard({ selected, onClick, disabled, icon, color, title, meta, badge, image, desc, compact }: {
  selected: boolean; onClick: () => void; disabled?: boolean;
  icon: React.ReactNode; color: string; title: string; meta: string;
  badge?: string; image?: string; desc?: string; compact?: boolean;
}) {
  const colorMap: Record<string, string> = {
    sky:    'border-sky-400 bg-sky-50 dark:bg-sky-950/30',
    orange: 'border-orange-400 bg-orange-50 dark:bg-orange-950/30',
    purple: 'border-purple-400 bg-purple-50 dark:bg-purple-950/30',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all',
        selected ? colorMap[color] || 'border-primary bg-primary/5' : 'border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-200',
        disabled && 'opacity-40 cursor-not-allowed'
      )}>
      {image && !compact && (
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      {!image && (
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gray-100 dark:bg-white/10', selected && `bg-${color}-100`)}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('font-black text-sm', selected ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200')}>{title}</span>
          {badge && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">{meta}</p>
        {desc && !compact && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{desc}</p>}
      </div>
      <div className={cn('w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
        selected ? 'border-primary bg-primary' : 'border-gray-300 dark:border-white/30')}>
        {selected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
      </div>
    </button>
  );
}
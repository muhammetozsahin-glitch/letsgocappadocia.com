import { useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/db/api';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod';
import { format, differenceInDays } from 'date-fns';
import {
  Loader2, ArrowRight, ArrowLeft, Sparkles,
  MapPin, Calendar, Users, Coffee, Heart,
  Car, Wallet, CheckCircle2, ChevronRight,
  PersonStanding,
} from 'lucide-react';
import { parseApiError } from '@/utils/errorHandler';
import { retryWithBackoff, withTimeout } from '@/utils/retryWithBackoff';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { LOADING_STEPS, TRAVEL_TYPE_OPTIONS, BUDGET_OPTIONS, TRANSPORT_OPTIONS, ACCOMMODATION_OPTIONS, INTEREST_OPTIONS } from '@/constants/planner';
import { DateSelector } from '@/components/planner/DateSelector';
import { TravelerInput } from '@/components/planner/TravelerInput';
import { AccommodationSelector } from '@/components/planner/AccommodationSelector';
import { InterestsGrid } from '@/components/planner/InterestsGrid';
import { TravelTypeSelector } from '@/components/planner/TravelTypeSelector';
import { TransportSelector } from '@/components/planner/TransportSelector';
import { BudgetSelector } from '@/components/planner/BudgetSelector';

// ─── Schema ───────────────────────────────────────────────────────────────────
const formSchema = z.object({
  dateRange: z.object({
    from: z.date({ required_error: 'Başlangıç tarihi gereklidir' }),
    to: z.date({ required_error: 'Bitiş tarihi gereklidir' }),
  })
    .refine(d => d.from >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: 'Başlangıç tarihi bugünden önce olamaz',
    })
    .refine(d => d.to > d.from, {
      message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır',
    })
    .refine(d => {
      const days = differenceInDays(d.to, d.from) + 1;
      return days >= 1 && days <= 14;
    }, { message: 'Seyahat süresi 1–14 gün arasında olmalıdır' }),
  travelType: z.string().min(1, 'Seyahat tipi seçiniz'),
  travelers: z.number().min(1).max(15),
  accommodation: z.string(),
  transport: z.string().min(1, 'Ulaşım tercihi seçiniz'),
  budget: z.string().min(1, 'Bütçe aralığı seçiniz'),
  interests: z.array(z.string()).min(1, 'En az 1 ilgi alanı seçiniz').max(6),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'dates',         title: 'Tarihler',       icon: Calendar,       description: 'Ne zaman gidiyorsunuz?' },
  { id: 'travelType',    title: 'Seyahat Tipi',   icon: PersonStanding, description: 'Nasıl bir seyahat?' },
  { id: 'travelers',     title: 'Grup & Konaklama', icon: Users,         description: 'Kiminle, nerede kalıyorsunuz?' },
  { id: 'transport',     title: 'Ulaşım',          icon: Car,            description: 'Nasıl seyahat edeceksiniz?' },
  { id: 'budget',        title: 'Bütçe',           icon: Wallet,         description: 'Ne kadar harcamayı planlıyorsunuz?' },
  { id: 'interests',     title: 'İlgi Alanları',   icon: Heart,          description: 'Neleri keşfetmek istersiniz?' },
] as const;

// ─── Summary label helpers ────────────────────────────────────────────────────
function getSummaryLabel(stepId: string, values: Partial<FormValues>): string | null {
  switch (stepId) {
    case 'dates':
      if (values.dateRange?.from && values.dateRange?.to)
        return `${format(values.dateRange.from, 'd MMM')} – ${format(values.dateRange.to, 'd MMM')}`;
      return null;
    case 'travelType':
      return TRAVEL_TYPE_OPTIONS.find(o => o.id === values.travelType)?.label ?? null;
    case 'travelers':
      return values.travelers ? `${values.travelers} kişi` : null;
    case 'transport':
      return TRANSPORT_OPTIONS.find(o => o.id === values.transport)?.label ?? null;
    case 'budget':
      return BUDGET_OPTIONS.find(o => o.id === values.budget)?.label ?? null;
    case 'interests':
      return values.interests?.length ? `${values.interests.length} seçildi` : null;
    default:
      return null;
  }
}

// ─── PlannerPage ──────────────────────────────────────────────────────────────
const PlannerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateRange: { from: undefined, to: undefined },
      travelType: '',
      travelers: 2,
      accommodation: 'center',
      transport: '',
      budget: '',
      interests: [],
    },
  });

  const watchedValues = form.watch();

  // ── Navigation ──────────────────────────────────────────────────────────────
  const nextStep = async () => {
    const stepId = STEPS[currentStep].id;
    const fieldMap: Record<string, keyof FormValues | (keyof FormValues)[]> = {
      dates: 'dateRange',
      travelType: 'travelType',
      travelers: ['travelers', 'accommodation'],
      transport: 'transport',
      budget: 'budget',
      interests: 'interests',
    };
    const fields = fieldMap[stepId];
    const isValid = await form.trigger(Array.isArray(fields) ? fields : [fields]);
    if (isValid && currentStep < STEPS.length - 1) setCurrentStep(p => p + 1);
  };

  const prevStep = () => { if (currentStep > 0) setCurrentStep(p => p - 1); };

  const handleInterestToggle = useCallback((id: string) => {
    const current = form.getValues('interests');
    const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
    form.setValue('interests', next, { shouldValidate: true });
  }, [form]);

  const simulateLoadingSteps = useCallback(() => {
    setLoadingStep(0);
    const iv = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        clearInterval(iv);
        return prev;
      });
    }, 2500);
    return iv;
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const iv = simulateLoadingSteps();
    try {
      const startDate = format(data.dateRange.from, 'yyyy-MM-dd');
      const endDate   = format(data.dateRange.to,   'yyyy-MM-dd');
      const result = await retryWithBackoff(
        () => withTimeout(
          api.generateItinerary({
            startDate,
            endDate,
            interests: data.interests,
            dailySchedule: data.travelType === 'family' ? 'relaxed' : data.budget === 'luxury' ? 'relaxed' : 'moderate',
            travelType: data.travelType,
            accommodation: data.accommodation,
            transport: data.transport,
            budget: data.budget,
            travelers: data.travelers,
          }),
          45000,
          new Error('Sunucu yanıt vermiyor, lütfen tekrar deneyin.')
        ),
        { maxRetries: 2, initialDelay: 1000, maxDelay: 5000 }
      );
      clearInterval(iv);

      // Kullanıcıya AI/mock durumunu bildir
      if (!result.ai_used) {
        toast.warning('Demo rota oluşturuldu', {
          description: result.ai_error ?? 'AI kullanılamadı, örnek rota gösteriliyor.',
          duration: 10000,
        });
      }

      const itinerary = { days: result.days };
      if (user) {
        const saved = await api.saveTrip({
          user_id: user.id,
          title: 'Kapadokya Gezisi',
          destination: 'Cappadocia',
          start_date: startDate,
          end_date: endDate,
          preferences: {
              startDate,
              endDate,
              interests: data.interests,
              travelType: data.travelType,
              accommodation: data.accommodation,
              transport: data.transport,
              budget: data.budget,
              travelers: data.travelers,
            },
          itinerary,
        });
        navigate(`/trip/${saved.id}`);
        toast.success('Rotanız hazır!');
      } else {
        sessionStorage.setItem('pending_trip', JSON.stringify(itinerary));
        navigate('/login', { state: { from: '/planner', message: 'Planınızı kaydetmek için giriş yapın' } });
      }
    } catch (err) {
      clearInterval(iv);
      if (err instanceof Error && err.name === 'AbortError') return;
      toast.error('Hata oluştu', { description: parseApiError(err).userMessage });
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <img
            src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400"
            alt=""
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <div className="absolute inset-0 bg-secondary/60" />

        <div className="relative z-10 max-w-md w-full px-8 text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mx-auto w-24 h-24"
          >
            <div className="absolute inset-0 bg-primary rounded-2xl animate-pulse opacity-30 scale-110" />
            <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30">
              <Loader2 className="h-11 w-11 text-white animate-spin" />
            </div>
          </motion.div>

          <div className="space-y-5">
            <AnimatePresence mode="wait">
              <motion.h2
                key={loadingStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="text-3xl font-black text-white tracking-tighter uppercase"
              >
                {LOADING_STEPS[loadingStep].label}
              </motion.h2>
            </AnimatePresence>

            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${LOADING_STEPS[loadingStep].progress}%` }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            </div>

            <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">
              <span>Hazırlanıyor</span>
              <span>{LOADING_STEPS[loadingStep].progress}%</span>
            </div>
          </div>

          <p className="text-white/30 text-xs font-medium italic">
            Size özel Kapadokya efsanesi kurguluyoruz...
          </p>
        </div>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[300px] xl:w-[360px] bg-secondary flex flex-col relative overflow-hidden shrink-0">
        {/* Decorative orbs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-8 lg:p-10 gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="text-base font-black text-white tracking-tight uppercase">
              Kapadokya <span className="text-primary">Efsanesi</span>
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl xl:text-4xl font-black text-white leading-none tracking-tighter uppercase">
              ROTANIZI<br /><span className="text-primary">TASARLAYIN</span>
            </h1>
            <p className="text-white/35 text-sm font-medium italic">
              "Size özel kurgulanmış seyahat mimarisi."
            </p>
          </div>

          {/* Step list */}
          <div className="flex-1 space-y-1.5">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isCompleted = i < currentStep;
              const summaryLabel = getSummaryLabel(step.id, watchedValues);

              return (
                <motion.div
                  key={step.id}
                  animate={{ opacity: isActive || isCompleted ? 1 : 0.35 }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                    isActive && 'bg-white/8'
                  )}
                >
                  {/* Step indicator */}
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300',
                    isActive    ? 'bg-primary text-white shadow-md shadow-primary/30 scale-110'
                    : isCompleted ? 'bg-white/10 text-primary'
                    : 'bg-white/5 text-white/20'
                  )}>
                    {isCompleted
                      ? <CheckCircle2 className="h-4 w-4" />
                      : <Icon className="h-4 w-4" />
                    }
                  </div>

                  {/* Labels */}
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'text-[9px] font-black uppercase tracking-[0.15em]',
                      isActive ? 'text-primary' : 'text-white/25'
                    )}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className={cn(
                      'text-sm font-bold leading-tight truncate',
                      isActive ? 'text-white' : isCompleted ? 'text-white/60' : 'text-white/30'
                    )}>
                      {step.title}
                    </div>
                  </div>

                  {/* Summary pill */}
                  {isCompleted && summaryLabel && (
                    <span className="text-[9px] font-black text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full shrink-0 max-w-[80px] truncate">
                      {summaryLabel}
                    </span>
                  )}

                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="space-y-2 pt-2 border-t border-white/8">
            <div className="flex justify-between text-[10px] font-bold text-white/25 uppercase tracking-widest">
              <span>İlerleme</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Form Area ──────────────────────────────────────────────────── */}
      <div className="flex-1 bg-white dark:bg-card overflow-y-auto">
        <div className="max-w-2xl mx-auto min-h-full flex flex-col px-8 py-10 lg:py-14 lg:px-16">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="flex-1 space-y-10"
                >
                  {/* Step header */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                      <span>Adım {currentStep + 1}/{STEPS.length}</span>
                      <span className="w-12 h-0.5 bg-primary/20 rounded-full" />
                      <span>{STEPS[currentStep].title}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl xl:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.95] uppercase">
                      {STEPS[currentStep].description}
                    </h2>
                  </div>

                  {/* Step content */}
                  <div className="pt-2">

                    {/* Step 0 — Dates */}
                    {currentStep === 0 && (
                      <FormField control={form.control} name="dateRange" render={({ field }) => (
                        <FormItem className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Seyahat Takvimi</Label>
                          <DateSelector
                            date={field.value}
                            onDateChange={field.onChange}
                            isOpen={datePickerOpen}
                            onOpenChange={setDatePickerOpen}
                          />
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {/* Step 1 — Travel Type */}
                    {currentStep === 1 && (
                      <FormField control={form.control} name="travelType" render={({ field }) => (
                        <FormItem className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Seyahat Tarzı</Label>
                          <TravelTypeSelector selectedId={field.value} onSelect={field.onChange} />
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {/* Step 2 — Travelers & Accommodation */}
                    {currentStep === 2 && (
                      <div className="space-y-8">
                        <FormField control={form.control} name="travelers" render={({ field }) => (
                          <FormItem className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Grup Büyüklüğü</Label>
                            <TravelerInput value={field.value} onChange={field.onChange} />
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="accommodation" render={({ field }) => (
                          <FormItem className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Konaklama Tarzı</Label>
                            <AccommodationSelector selectedId={field.value} onSelect={field.onChange} />
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    )}

                    {/* Step 3 — Transport */}
                    {currentStep === 3 && (
                      <FormField control={form.control} name="transport" render={({ field }) => (
                        <FormItem className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ulaşım Tercihi</Label>
                          <TransportSelector selectedId={field.value} onSelect={field.onChange} />
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {/* Step 4 — Budget */}
                    {currentStep === 4 && (
                      <FormField control={form.control} name="budget" render={({ field }) => (
                        <FormItem className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Günlük Bütçe</Label>
                          <BudgetSelector selectedId={field.value} onSelect={field.onChange} />
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {/* Step 5 — Interests */}
                    {currentStep === 5 && (
                      <FormField control={form.control} name="interests" render={({ field }) => (
                        <FormItem className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">İlgi Alanları</Label>
                            <span className="text-[10px] font-bold text-gray-400">{field.value.length}/6 Seçildi</span>
                          </div>
                          <InterestsGrid selectedInterests={field.value} onToggle={handleInterestToggle} />
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="pt-10 mt-auto flex items-center justify-between gap-4 border-t border-gray-100 dark:border-white/8">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="h-13 px-7 text-sm font-bold rounded-xl hover:bg-gray-50 group disabled:opacity-30"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Geri
                </Button>

                {currentStep < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={nextStep}
                    className="h-13 px-10 text-sm font-black bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 group uppercase tracking-widest"
                  >
                    Devam Et
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    className="h-13 px-12 text-sm font-black bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 uppercase tracking-widest"
                  >
                    Rotayı Oluştur
                    <Sparkles className="ml-2 h-4 w-4 animate-pulse" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default memo(PlannerPage);
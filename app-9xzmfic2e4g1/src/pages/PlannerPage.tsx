import { useState, useCallback, memo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/db/api';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod';
import { format, differenceInDays } from 'date-fns';
import {
  Loader2, ArrowRight, ArrowLeft, Sparkles,
  MapPin, Calendar, Users, Heart,
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

const PLANNER_ARTWORK_URL = 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dcf363ec-bac4-4f85-8e2e-6f520d316a07.jpg';

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

function getOptionLabel<T extends { id: string; label: string }>(options: readonly T[], id?: string) {
  if (!id) return null;
  return options.find(option => option.id === id)?.label ?? null;
}

function StepFieldSection({
  label,
  hint,
  children,
  trailing,
}: {
  label: string;
  hint: string;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,242,255,0.94))] p-5 shadow-[0_20px_46px_rgba(109,69,221,0.10)] ring-1 ring-[#f3ebff] sm:p-7 dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#eadbff] blur-3xl dark:bg-primary/20" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#7d55eb] shadow-sm dark:bg-white/10 dark:text-white">
            {label}
          </span>
          <p className="max-w-[32rem] text-sm leading-6 text-[#7e79a7] dark:text-muted-foreground">{hint}</p>
        </div>
        {trailing}
      </div>
      <div className="relative mt-6">{children}</div>
    </div>
  );
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
    console.log("onSubmit called", data);
    toast("onSubmit called");
    const iv = simulateLoadingSteps();
    try {
      const startDate = format(data.dateRange.from, 'yyyy-MM-dd');
      const endDate   = format(data.dateRange.to,   'yyyy-MM-dd');
      console.log("Calling API generateItinerary with:", { startDate, endDate, interests: data.interests });
      const result: any = await retryWithBackoff(
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
        sessionStorage.setItem('pending_trip', JSON.stringify({
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
        }));
        navigate('/trip/preview');
        toast.success('Rotanız hazır!', {
          description: 'Önizleme açıldı. İsterseniz daha sonra giriş yapıp hesabınıza kaydedebilirsiniz.',
        });
      }
    } catch (err) {
    console.log("onSubmit error:", err);
      clearInterval(iv);
      if (err instanceof Error && err.name === 'AbortError') return;
      toast.error('Hata oluştu', { description: parseApiError(err).userMessage });
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];
  const currentSummaryLabel = getSummaryLabel(currentStepData.id, watchedValues);
  const isFinalStep = currentStep === STEPS.length - 1;
  const loadingConfig = LOADING_STEPS[loadingStep];
  const LoadingStepIcon = loadingConfig.icon;
  const tripLength = watchedValues.dateRange?.from && watchedValues.dateRange?.to
    ? differenceInDays(watchedValues.dateRange.to, watchedValues.dateRange.from) + 1
    : null;
  const selectedTravelType = getOptionLabel(TRAVEL_TYPE_OPTIONS, watchedValues.travelType);
  const selectedAccommodation = getOptionLabel(ACCOMMODATION_OPTIONS, watchedValues.accommodation);
  const selectedTransport = getOptionLabel(TRANSPORT_OPTIONS, watchedValues.transport);
  const selectedBudget = getOptionLabel(BUDGET_OPTIONS, watchedValues.budget);
  const selectedInterests = INTEREST_OPTIONS.filter(option => watchedValues.interests?.includes(option.id));
  const summaryCards = [
    {
      icon: Calendar,
      label: 'Takvim',
      value: watchedValues.dateRange?.from && watchedValues.dateRange?.to
        ? `${format(watchedValues.dateRange.from, 'd MMM')} – ${format(watchedValues.dateRange.to, 'd MMM')}`
        : 'Tarih seçimi bekleniyor',
      detail: tripLength ? `${tripLength} gün` : 'Sezon ve tempo buna göre ayarlanır',
    },
    {
      icon: PersonStanding,
      label: 'Seyahat kurgusu',
      value: selectedTravelType ?? 'Tarz seçimi bekleniyor',
      detail: `${watchedValues.travelers ?? 0} kişi • ${selectedAccommodation ?? 'Konaklama seçimi bekleniyor'}`,
    },
    {
      icon: Car,
      label: 'Ulaşım & bütçe',
      value: selectedTransport ?? 'Ulaşım seçimi bekleniyor',
      detail: selectedBudget ?? 'Bütçe seçimi bekleniyor',
    },
    {
      icon: Heart,
      label: 'Deneyim odağı',
      value: selectedInterests.length
        ? selectedInterests.slice(0, 2).map(option => option.label).join(' • ')
        : 'İlgi alanı seçimi bekleniyor',
      detail: selectedInterests.length > 2
        ? `+${selectedInterests.length - 2} ilgi alanı daha`
        : `${selectedInterests.length}/6 seçim`,
    },
  ];

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f7f3ff] dark:bg-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-violet-200/50 blur-3xl dark:bg-primary/15" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-[1320px] items-center px-4 py-6 lg:px-6">
          <div className="grid w-full gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#6d45dd] via-[#7a58e6] to-[#8b67f0] text-white shadow-[0_30px_80px_rgba(109,69,221,0.32)]">
              <div className="absolute inset-0">
                <img
                  src={PLANNER_ARTWORK_URL}
                  alt="Kapadokya balonları"
                  className="h-full w-full object-cover opacity-55"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-[#4f21c6]/85" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_38%)]" />
              </div>

              <div className="relative flex h-full min-h-[620px] flex-col p-5 sm:p-6">
                <div className="flex items-center gap-3 px-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16 ring-1 ring-white/20 backdrop-blur-md">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="leading-none">
                    <p className="text-lg font-black uppercase tracking-[0.08em]">Kapadokya</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/72">AI oluşturuyor</p>
                  </div>
                </div>

                <div className="mt-20 rounded-[28px] border border-white/14 bg-white/10 p-5 backdrop-blur-xl sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/16">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-[2rem] font-black leading-[0.95] tracking-[-0.04em]">
                        Rotanızı
                        <br />
                        Hazırlıyoruz
                      </h1>
                      <p className="max-w-[220px] text-base font-medium leading-7 text-white/82">
                        Tercihlerinize göre premium bir seyahat akışı kuruluyor.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    {LOADING_STEPS.map((step, index) => {
                      const StepIcon = step.icon;
                      const isActive = index === loadingStep;
                      const isCompleted = index < loadingStep;

                      return (
                        <motion.div
                          key={step.label}
                          animate={{ opacity: isActive || isCompleted ? 1 : 0.56 }}
                          className={cn(
                            'flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200',
                            isActive
                              ? 'bg-[#5d31d3]/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                              : isCompleted
                                ? 'bg-white/10'
                                : 'bg-transparent'
                          )}
                        >
                          <div className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1',
                            isActive
                              ? 'bg-white text-[#6d45dd] ring-white/35'
                              : isCompleted
                                ? 'bg-white/18 text-white ring-white/14'
                                : 'bg-white/8 text-white/75 ring-white/12'
                          )}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold tracking-[-0.02em] text-white">{step.label}</p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/62">%{step.progress} tamamlandı</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-auto rounded-[24px] border border-white/14 bg-white/10 px-4 py-4 backdrop-blur-md">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.26em] text-white/72">
                    <span>Canlı Durum</span>
                    <span>%{loadingConfig.progress}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/16">
                    <motion.div
                      className="h-full rounded-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${loadingConfig.progress}%` }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </aside>

            <section className="relative overflow-hidden rounded-[34px] bg-white/82 shadow-[0_20px_60px_rgba(86,48,166,0.10)] ring-1 ring-white/70 backdrop-blur-xl dark:bg-card/92 dark:ring-white/10">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-y-0 left-0 hidden w-[44%] xl:block">
                  <img
                    src={PLANNER_ARTWORK_URL}
                    alt=""
                    className="h-full w-full object-cover opacity-[0.12] saturate-75"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#f7f0ff]/40 via-[#fbf9ff]/88 to-white dark:from-primary/10 dark:to-card" />
                </div>
                <div className="absolute left-[10%] top-[30%] hidden h-16 w-16 rounded-full bg-[#9f7cff]/18 blur-sm xl:block" />
                <div className="absolute left-[13%] top-[35%] hidden h-4 w-4 rounded-full bg-[#c4a4ff]/80 xl:block" />
                <div className="absolute bottom-[22%] left-[18%] hidden h-6 w-6 rounded-full bg-[#d8c0ff]/70 xl:block" />
              </div>

              <div className="relative flex min-h-[620px] flex-col justify-center px-6 py-8 sm:px-10 lg:px-14 lg:py-12 xl:pl-[18rem] xl:pr-16">
                <div className="max-w-[760px] space-y-8">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.24em] text-[#8b67f0] dark:text-primary">
                    <span>AI rota motoru</span>
                    <span className="h-px w-16 bg-[#8b67f0]/25 dark:bg-primary/30" />
                    <span>Hazırlık aşaması</span>
                  </div>

                  <div className="space-y-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#7f5cf0] to-[#6d45dd] text-white shadow-[0_24px_48px_rgba(109,69,221,0.28)]">
                      <motion.div
                        key={loadingStep}
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                      >
                        <LoadingStepIcon className="h-9 w-9" />
                      </motion.div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={loadingStep}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        className="space-y-4"
                      >
                        <h2 className="max-w-[640px] text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] text-[#20244f] sm:text-5xl lg:text-6xl dark:text-white">
                          {loadingConfig.label}
                        </h2>
                        <p className="max-w-[560px] text-sm leading-7 text-[#7e79a7] dark:text-muted-foreground">
                          Kapadokya için günlük akış, mesafeler, deneyim yoğunluğu ve sahne önerileri tek bir rota içinde birleştiriliyor.
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,242,255,0.94))] p-5 shadow-[0_20px_46px_rgba(109,69,221,0.10)] ring-1 ring-[#f3ebff] sm:p-7 dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#eadbff] blur-3xl dark:bg-primary/20" />
                    <div className="relative space-y-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#7d55eb] shadow-sm dark:bg-white/10 dark:text-white">
                            Oluşturma İlerlemesi
                          </span>
                          <p className="mt-3 text-sm font-medium leading-6 text-[#7e79a7] dark:text-muted-foreground">
                            Son kalite kontrol ve sahne eşleştirmeleri tamamlanıyor.
                          </p>
                        </div>
                        <div className="rounded-full bg-[#f3ebff] px-4 py-2 text-sm font-black text-[#7150d7] dark:bg-primary/10 dark:text-white">
                          %{loadingConfig.progress}
                        </div>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-[#efe7ff] dark:bg-white/10">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[#7f5cf0] to-[#6d45dd]"
                          initial={{ width: 0 }}
                          animate={{ width: `${loadingConfig.progress}%` }}
                          transition={{ duration: 0.6, ease: 'easeInOut' }}
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[24px] border border-[#efe6ff] bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b67f0]">Tempo</p>
                          <p className="mt-2 text-lg font-black tracking-[-0.04em] text-[#20244f] dark:text-white">Dengeli akış</p>
                        </div>
                        <div className="rounded-[24px] border border-[#efe6ff] bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b67f0]">Veri Kaynağı</p>
                          <p className="mt-2 text-lg font-black tracking-[-0.04em] text-[#20244f] dark:text-white">AI + harita</p>
                        </div>
                        <div className="rounded-[24px] border border-[#efe6ff] bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b67f0]">Son Dokunuş</p>
                          <p className="mt-2 text-lg font-black tracking-[-0.04em] text-[#20244f] dark:text-white">Görsel detaylar</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-medium italic tracking-[0.02em] text-[#7e79a7] dark:text-muted-foreground">
                    Size özel Kapadokya efsanesi kurgulanıyor; rota hazır olduğunda otomatik olarak yönlendirileceksiniz.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#f7f3ff] dark:bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-violet-200/50 blur-3xl dark:bg-primary/15" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6 xl:flex-row">
        <aside className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#6d45dd] via-[#7a58e6] to-[#8b67f0] text-white shadow-[0_30px_80px_rgba(109,69,221,0.32)] xl:w-[320px] xl:min-w-[320px]">
          <div className="absolute inset-0">
            <img
              src={PLANNER_ARTWORK_URL}
              alt="Kapadokya balonları"
              className="h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-[#4f21c6]/85" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_38%)]" />
          </div>

          <div className="relative flex h-full min-h-[340px] flex-col p-4 sm:p-5">
            <div className="flex items-center gap-3 px-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/16 ring-1 ring-white/20 backdrop-blur-md">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="leading-none">
                <p className="text-lg font-black uppercase tracking-[0.08em]">Kapadokya</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/72">Efsanesi</p>
              </div>
            </div>

            <div className="mt-24 rounded-[28px] border border-white/14 bg-white/10 p-5 backdrop-blur-xl sm:mt-28 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/14 ring-1 ring-white/16">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-[2rem] font-black leading-[0.95] tracking-[-0.04em]">
                    Rotanızı
                    <br />
                    Tasarlayın
                  </h1>
                  <p className="max-w-[220px] text-base font-medium leading-7 text-white/82">
                    Size özel kurgulanmış seyahat mimarisi.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {STEPS.map((step, i) => {
                  const isActive = i === currentStep;
                  const isCompleted = i < currentStep;

                  return (
                    <motion.button
                      key={step.id}
                      type="button"
                      disabled={i > currentStep}
                      onClick={() => {
                        if (i <= currentStep) {
                          setCurrentStep(i);
                        }
                      }}
                      animate={{ opacity: isActive || isCompleted ? 1 : 0.56 }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200',
                        isActive
                          ? 'bg-[#5d31d3]/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                          : isCompleted
                            ? 'bg-white/10 hover:bg-white/14'
                            : 'cursor-default bg-transparent'
                      )}
                    >
                      <div className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ring-1 transition-all duration-200',
                        isActive
                          ? 'bg-white text-[#6d45dd] ring-white/35'
                          : isCompleted
                            ? 'bg-white/18 text-white ring-white/14'
                            : 'bg-white/8 text-white/75 ring-white/12'
                      )}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>

                      <span className={cn(
                        'flex-1 text-base font-bold tracking-[-0.02em]',
                        isActive ? 'text-white' : 'text-white/78'
                      )}>
                        {step.title}
                      </span>

                      {isActive && <ChevronRight className="h-4 w-4 text-white/70" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto px-1 pt-5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.26em] text-white/72">
                <span>İlerleme</span>
                <span>%{Math.round(progress)}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/16">
                <motion.div
                  className="h-full rounded-full bg-white"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </aside>

        <section className="relative flex-1 overflow-hidden rounded-[34px] bg-white/82 shadow-[0_20px_60px_rgba(86,48,166,0.10)] ring-1 ring-white/70 backdrop-blur-xl dark:bg-card/92 dark:ring-white/10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-y-0 left-0 hidden w-[40%] xl:block">
              <img
                src={PLANNER_ARTWORK_URL}
                alt=""
                className="h-full w-full object-cover opacity-[0.14] saturate-75"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#f7f0ff]/40 via-[#fbf9ff]/88 to-white dark:from-primary/10 dark:to-card" />
            </div>
            <div className="absolute left-[9%] top-[34%] hidden h-14 w-14 rounded-full bg-[#9f7cff]/18 blur-sm xl:block" />
            <div className="absolute left-[12%] top-[38%] hidden h-4 w-4 rounded-full bg-[#c4a4ff]/80 xl:block" />
            <div className="absolute bottom-[24%] left-[18%] hidden h-5 w-5 rounded-full bg-[#d8c0ff]/70 xl:block" />
          </div>

          <div className="relative flex min-h-[calc(100vh-120px)] flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto flex min-h-full w-full max-w-[1080px] flex-col px-6 py-8 sm:px-10 lg:px-14 lg:py-12 xl:pl-[18rem] xl:pr-16">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.32, ease: 'easeOut' }}
                        className="flex-1 space-y-10 lg:space-y-14"
                      >
                        <div className="space-y-5 pt-2 lg:pt-10">
                          <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.24em] text-[#8b67f0] dark:text-primary">
                            <span>Adım {currentStep + 1}/{STEPS.length}</span>
                            <span className="h-px w-16 bg-[#8b67f0]/25 dark:bg-primary/30" />
                            <span>{currentStepData.title}</span>
                          </div>

                          <div className="max-w-[560px] space-y-4">
                            <h2 className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] text-[#20244f] sm:text-5xl lg:text-6xl dark:text-white">
                              {currentStepData.description}
                            </h2>
                            {currentSummaryLabel ? (
                              <div className="inline-flex items-center rounded-full bg-[#f3ebff] px-4 py-2 text-sm font-semibold text-[#7150d7] shadow-sm dark:bg-primary/10 dark:text-primary-foreground">
                                {currentSummaryLabel}
                              </div>
                            ) : (
                              <p className="max-w-[440px] text-sm leading-7 text-[#7e79a7] dark:text-muted-foreground">
                                Birkaç kısa adımda tercihlerinizi toplayıp size özel rota oluşturuyoruz.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="max-w-[760px]">
                          {currentStep === 0 && (
                            <StepFieldSection
                              label="Seyahat Takvimi"
                              hint="Gidiş ve dönüş aralığını seçin; öneriler sezon, yoğunluk ve günlük tempoya göre uyarlansın."
                            >
                              <FormField control={form.control} name="dateRange" render={({ field }) => (
                                <FormItem className="space-y-4">
                                  <DateSelector
                                    date={field.value}
                                    onDateChange={field.onChange}
                                    isOpen={datePickerOpen}
                                    onOpenChange={setDatePickerOpen}
                                  />
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </StepFieldSection>
                          )}

                          {currentStep === 1 && (
                            <StepFieldSection
                              label="Seyahat Tarzı"
                              hint="Rahat, romantik ya da hareketli bir akış mı istediğinizi seçin; tüm rota önerileri buna göre şekillensin."
                              trailing={<span className="rounded-full bg-[#f3ebff] px-3 py-2 text-xs font-bold text-[#7150d7] dark:bg-primary/10 dark:text-white">Tek seçim</span>}
                            >
                              <FormField control={form.control} name="travelType" render={({ field }) => (
                                <FormItem className="space-y-4">
                                  <TravelTypeSelector selectedId={field.value} onSelect={field.onChange} />
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </StepFieldSection>
                          )}

                          {currentStep === 2 && (
                            <div className="space-y-8">
                              <StepFieldSection
                                label="Grup Büyüklüğü"
                                hint="Kaç kişi seyahat edeceğinizi belirleyin; günlük plan ve rezervasyon önerileri buna göre dengelensin."
                              >
                                <FormField control={form.control} name="travelers" render={({ field }) => (
                                  <FormItem className="space-y-4">
                                    <TravelerInput value={field.value} onChange={field.onChange} />
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </StepFieldSection>
                              <StepFieldSection
                                label="Konaklama Tarzı"
                                hint="Hangi konaklama hissini istediğinizi seçin; rota merkezleri ve mola önerileri bu tona göre düzenlensin."
                              >
                                <FormField control={form.control} name="accommodation" render={({ field }) => (
                                  <FormItem className="space-y-4">
                                    <AccommodationSelector selectedId={field.value} onSelect={field.onChange} />
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </StepFieldSection>
                            </div>
                          )}

                          {currentStep === 3 && (
                            <StepFieldSection
                              label="Ulaşım Tercihi"
                              hint="En rahat hareket edeceğiniz ulaşım modelini seçin; gün içi rota akışı ve mesafeler buna göre kurgulansın."
                            >
                              <FormField control={form.control} name="transport" render={({ field }) => (
                                <FormItem className="space-y-4">
                                  <TransportSelector selectedId={field.value} onSelect={field.onChange} />
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </StepFieldSection>
                          )}

                          {currentStep === 4 && (
                            <StepFieldSection
                              label="Günlük Bütçe"
                              hint="Harcamak istediğiniz günlük aralığı belirleyin; konaklama, deneyim ve tempo önerileri buna göre optimize edilsin."
                            >
                              <FormField control={form.control} name="budget" render={({ field }) => (
                                <FormItem className="space-y-4">
                                  <BudgetSelector selectedId={field.value} onSelect={field.onChange} />
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </StepFieldSection>
                          )}

                          {currentStep === 5 && (
                            <FormField control={form.control} name="interests" render={({ field }) => (
                              <StepFieldSection
                                label="İlgi Alanları"
                                hint="En fazla altı ilgi alanı seçin; rota önerileri gerçekten görmek istediğiniz deneyimlere odaklansın."
                                trailing={<span className="rounded-full bg-[#f3ebff] px-3 py-2 text-xs font-bold text-[#7150d7] dark:bg-primary/10 dark:text-white">{field.value.length}/6 seçildi</span>}
                              >
                                <FormItem className="space-y-4">
                                  <InterestsGrid selectedInterests={field.value} onToggle={handleInterestToggle} />
                                  <FormMessage />
                                </FormItem>
                              </StepFieldSection>
                            )} />
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    <div className="mt-10 border-t border-[#ebe2fb] pt-8 dark:border-white/10">
                      {isFinalStep ? (
                        <div className="space-y-5">
                          <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,242,255,0.94))] p-5 shadow-[0_20px_46px_rgba(109,69,221,0.10)] ring-1 ring-[#f3ebff] sm:p-7 dark:border-white/10 dark:bg-white/5 dark:ring-white/10">
                            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#eadbff] blur-3xl dark:bg-primary/20" />
                            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                              <div className="space-y-5">
                                <div className="space-y-3">
                                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#7d55eb] shadow-sm dark:bg-white/10 dark:text-white">
                                    Final Özet
                                  </span>
                                  <h3 className="text-3xl font-black uppercase leading-[0.96] tracking-[-0.05em] text-[#20244f] sm:text-[2.4rem] dark:text-white">
                                    Tercihleriniz rota oluşturmaya hazır.
                                  </h3>
                                  <p className="max-w-[620px] text-sm leading-7 text-[#7e79a7] dark:text-muted-foreground">
                                    Aşağıdaki özet üzerinden son kez kontrol edin; oluşturma sonrası size en uygun günlük akış, deneyimler ve önerilen duraklar hazırlanacak.
                                  </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  {summaryCards.map(({ icon: Icon, label, value, detail }) => (
                                    <div
                                      key={label}
                                      className="rounded-[24px] border border-[#efe6ff] bg-white/82 p-4 shadow-[0_10px_30px_rgba(95,66,171,0.06)] dark:border-white/10 dark:bg-white/5"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f3ebff] text-[#7150d7] dark:bg-primary/10 dark:text-white">
                                          <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b67f0] dark:text-primary">{label}</p>
                                          <p className="text-base font-black tracking-[-0.03em] text-[#20244f] dark:text-white">{value}</p>
                                          <p className="text-sm leading-6 text-[#7e79a7] dark:text-muted-foreground">{detail}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-[28px] bg-gradient-to-br from-[#6d45dd] via-[#7a58e6] to-[#8b67f0] p-[1px] shadow-[0_24px_60px_rgba(109,69,221,0.28)]">
                                <div className="h-full rounded-[27px] bg-[linear-gradient(180deg,rgba(88,48,197,0.94),rgba(64,27,160,0.96))] p-5 text-white sm:p-6">
                                  <span className="inline-flex rounded-full bg-white/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/90">
                                    Hazır olduğunda başlat
                                  </span>
                                  <h4 className="mt-4 text-2xl font-black uppercase leading-tight tracking-[-0.05em]">
                                    AI rota üretimini şimdi tetikleyin.
                                  </h4>
                                  <p className="mt-3 text-sm leading-7 text-white/78">
                                    Oluşturma süreci birkaç saniye sürebilir; rota hazır olduğunda detay sayfasına yönlendirilirsiniz.
                                  </p>

                                  <div className="mt-5 space-y-3 rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur-md">
                                    <div className="flex items-center gap-3">
                                      <CheckCircle2 className="h-4 w-4 text-white" />
                                      <span className="text-sm font-semibold text-white/90">Gün gün akış ve önerilen duraklar</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <CheckCircle2 className="h-4 w-4 text-white" />
                                      <span className="text-sm font-semibold text-white/90">Tercihlere göre tempo ve bütçe dengesi</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <CheckCircle2 className="h-4 w-4 text-white" />
                                      <span className="text-sm font-semibold text-white/90">Harita uyumlu rota ve deneyim önerileri</span>
                                    </div>
                                  </div>

                                  <Button
                                    type="button" onClick={form.handleSubmit(onSubmit)}
                                    size="lg"
                                    className="mt-6 h-13 w-full rounded-full bg-white px-8 text-sm font-black uppercase tracking-[0.18em] text-[#6d45dd] shadow-[0_18px_36px_rgba(26,6,84,0.24)] hover:bg-white/95"
                                  >
                                    Rotayı Oluştur
                                    <Sparkles className="ml-2 h-4 w-4 animate-pulse" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                              type="button"
                              variant="ghost"
                              size="lg"
                              onClick={prevStep}
                              className="h-12 rounded-full border border-[#ece6fb] bg-white px-7 text-sm font-bold text-[#7b68b4] shadow-[0_10px_30px_rgba(95,66,171,0.08)] hover:bg-[#faf7ff] hover:text-[#6d45dd] dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground"
                            >
                              <ArrowLeft className="mr-2 h-4 w-4" />
                              Düzenlemeye Dön
                            </Button>

                            <p className="text-sm font-medium leading-6 text-[#7e79a7] dark:text-muted-foreground">
                              Devam ederek tercihleriniz doğrultusunda otomatik rota oluşturulmasını onaylamış olursunuz.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="h-12 rounded-full border border-[#ece6fb] bg-white px-7 text-sm font-bold text-[#7b68b4] shadow-[0_10px_30px_rgba(95,66,171,0.08)] hover:bg-[#faf7ff] hover:text-[#6d45dd] disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground"
                          >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Geri
                          </Button>

                          <Button
                            type="button"
                            size="lg"
                            onClick={nextStep}
                            className="h-12 rounded-full bg-gradient-to-r from-[#7f5cf0] to-[#6d45dd] px-9 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_36px_rgba(109,69,221,0.28)] hover:opacity-95"
                          >
                            Devam Et
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default memo(PlannerPage);

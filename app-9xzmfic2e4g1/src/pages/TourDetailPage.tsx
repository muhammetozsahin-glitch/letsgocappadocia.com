import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock, Users, MapPin, Star, ChevronRight, ChevronLeft,
  Check, X, Calendar, Minus, Plus, AlertCircle,
  Send, MapPinPlus, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toursApi } from '@/db/agency-api';
import api from '@/db/api';
import type { Tour } from '@/types/agency';
import type { Trip } from '@/db/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const getDefaultImages = (_code: string) => [
  'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800',
  'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800',
  'https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?w=800',
];

export default function TourDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bookingType, setBookingType] = useState<'group' | 'private'>('group');

  // Teklif formu
  const [selectedDate, setSelectedDate] = useState('');
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);

  // Planıma Ekle
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [addingToTrip, setAddingToTrip] = useState<string | null>(null);

  useEffect(() => { if (slug) loadTour(slug); }, [slug]);
  useEffect(() => { if (user && showTripSelector) loadMyTrips(); }, [user, showTripSelector]);

  const loadTour = async (tourSlug: string) => {
    try {
      setLoading(true);
      const data = await toursApi.getBySlug(tourSlug);
      if (data) {
        setTour(data);
        setBookingType(data.group_enabled ? 'group' : 'private');
      } else { setError('Tur bulunamadı'); }
    } catch { setError('Tur yüklenirken bir hata oluştu'); }
    finally { setLoading(false); }
  };

  const loadMyTrips = async () => {
    try {
      const data = await api.getTrips();
      setMyTrips(data || []);
    } catch { /* sessiz */ }
  };

  const handleAddToTrip = async (tripId: string) => {
    if (!tour) return;
    setAddingToTrip(tripId);
    try {
      const tripData = await api.getTripById(tripId);
      if (!tripData) throw new Error('Gezi bulunamadı');

      const days = tripData.itinerary?.days || [];
      if (days.length === 0) throw new Error('Geziде gün yok');

      // Tura uygun boş gün bul (balon veya başka tur olmayan ilk gün)
      let targetDayIdx = days.findIndex(d =>
        !d.items.some(i => i.agency_service?.type === 'tour') &&
        !d.items.some(i => i.agency_service?.type === 'balloon')
      );
      if (targetDayIdx === -1) targetDayIdx = 0;

      const targetDay = days[targetDayIdx];
      const durationMins = Math.round(tour.duration_hours * 60);
      const startTime = tour.start_time || '09:00';
      const [sh, sm] = startTime.split(':').map(Number);
      const endTotalM = sh * 60 + sm + durationMins;
      const endTime = `${String(Math.floor(endTotalM / 60) % 24).padStart(2, '0')}:${String(endTotalM % 60).padStart(2, '0')}`;

      const newPlace = {
        place_id: `tour__${tour.id}`,
        name: tour.name,
        lat: tour.meeting_point_lat ?? 38.6431,
        lng: tour.meeting_point_lng ?? 34.8347,
        formatted_address: tour.meeting_point || 'Kapadokya, Nevşehir',
        photo_reference: tour.cover_image || '',
        description: tour.short_description || '',
        category: 'Tur',
        estimated_duration_minutes: durationMins,
        start_time: startTime,
        end_time: endTime,
        why_visit: tour.short_description || undefined,
        agency_service: { type: 'tour' as const, slug: tour.slug, price: tour.group_price_adult, currency: tour.currency || 'EUR' },
      };

      // Çakışma kontrolü
      const hasTour = targetDay.items.some(i => i.agency_service?.type === 'tour');
      const hasBalloon = targetDay.items.some(i => i.agency_service?.type === 'balloon');
      if (hasTour || hasBalloon) {
        const otherDay = days.find((d, i) =>
          i !== targetDayIdx &&
          !d.items.some(i => i.agency_service?.type === 'tour') &&
          !d.items.some(i => i.agency_service?.type === 'balloon')
        );
        if (!otherDay) {
          toast.warning('Tüm günlerde zaten tur veya balon var. Yeni bir gün ekleyerek deneyebilirsiniz.');
          setShowTripSelector(false);
          setAddingToTrip(null);
          return;
        }
        targetDayIdx = days.indexOf(otherDay);
      }

      const updatedDays = days.map((d, i) =>
        i === targetDayIdx
          ? { ...d, items: [...d.items, newPlace] }
          : d
      );

      await api.updateTrip(tripId, { itinerary: { days: updatedDays } } as any);
      toast.success(`${tour.name} — Gün ${days[targetDayIdx].day}'e eklendi!`);
      setShowTripSelector(false);
      navigate(`/trip/${tripId}`);
    } catch (err: any) {
      toast.error(err.message || 'Eklenemedi');
    } finally { setAddingToTrip(null); }
  };

  const handlePlanlaClick = () => {
    if (!user) { navigate('/login', { state: { from: `/tur/${slug}` } }); return; }
    setShowTripSelector(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  if (error || !tour) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Tur Bulunamadı</h1>
      <Button asChild><Link to="/turlar">Turlara Dön</Link></Button>
    </div>
  );

  const images = tour.gallery_images?.length
    ? [tour.cover_image, ...tour.gallery_images].filter(Boolean) as string[]
    : getDefaultImages(tour.code);

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const estTotal = tour.group_price_adult * adultCount + (tour.group_price_child || tour.group_price_adult * 0.7) * childCount;

  return (
    <div className="min-h-screen bg-background">
      {/* Trip seçici modal */}
      {showTripSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Hangi geziye ekleyelim?</h3>
              <button onClick={() => setShowTripSelector(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            {myTrips.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-4">Henüz bir gezi planınız yok.</p>
                <Button onClick={() => { setShowTripSelector(false); navigate('/planner'); }} className="bg-primary">
                  Yeni Gezi Planla
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {myTrips.map(t => (
                  <button key={t.id} onClick={() => handleAddToTrip(t.id)}
                    disabled={addingToTrip === t.id}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all',
                      addingToTrip === t.id && 'opacity-50'
                    )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{t.title}</p>
                        <p className="text-xs text-gray-400">{t.start_date} · {t.itinerary?.days?.length || 0} gün</p>
                      </div>
                      {addingToTrip === t.id
                        ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        : <MapPinPlus className="h-4 w-4 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => { setShowTripSelector(false); navigate('/planner'); }}>
              + Yeni Gezi Oluştur
            </Button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/turlar" className="hover:text-primary">Turlar</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{tour.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon */}
          <div className="lg:col-span-2 space-y-8">
            {/* Galeri */}
            <div className="relative">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                <img src={images[currentImageIndex]} alt={tour.name} className="w-full h-full object-cover" />
              </div>
              {images.length > 1 && (
                <>
                  <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={() => setCurrentImageIndex(p => p === 0 ? images.length - 1 : p - 1)}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={() => setCurrentImageIndex(p => p === images.length - 1 ? 0 : p + 1)}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Başlık */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{tour.name}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                <div className="flex items-center gap-1.5"><Clock className="w-5 h-5" /><span>{tour.duration_hours} saat</span></div>
                <div className="flex items-center gap-1.5"><Users className="w-5 h-5" /><span>Max {tour.group_max_participants} kişi</span></div>
                <div className="flex items-center gap-1.5"><MapPin className="w-5 h-5" /><span>Göreme</span></div>
                <div className="flex items-center gap-1.5"><Star className="w-5 h-5 text-amber-500 fill-amber-500" /><span>4.9</span></div>
              </div>
              <p className="text-lg text-muted-foreground">{tour.short_description}</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="itinerary">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="itinerary">Güzergah</TabsTrigger>
                <TabsTrigger value="includes">Dahil / Hariç</TabsTrigger>
                <TabsTrigger value="info">Bilgiler</TabsTrigger>
              </TabsList>
              <TabsContent value="itinerary" className="mt-6">
                <Card>
                  <CardHeader><CardTitle>Günlük Program</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tour.itinerary.map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-16 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">{item.time}</div>
                          <div><h4 className="font-semibold">{item.title}</h4>{item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="includes" className="mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-emerald-600 flex items-center gap-2"><Check className="w-5 h-5" />Dahil</CardTitle></CardHeader>
                    <CardContent><ul className="space-y-2">{tour.includes?.map((item, i) => <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />{item}</li>)}</ul></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><X className="w-5 h-5" />Hariç</CardTitle></CardHeader>
                    <CardContent><ul className="space-y-2">{tour.excludes?.map((item, i) => <li key={i} className="flex items-center gap-2"><X className="w-4 h-4 text-red-500" />{item}</li>)}</ul></CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="info" className="mt-6">
                <Card><CardContent className="pt-6"><div dangerouslySetInnerHTML={{ __html: tour.description || '' }} /></CardContent></Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sağ Kolon */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Kişi başı başlangıç fiyatı</p>
                    <div className="text-3xl font-bold text-primary">{tour.group_price_adult}€</div>
                  </div>
                  {tour.private_enabled && <Badge variant="outline" className="text-xs">Özel tur mevcut</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* ── YENİ: Planıma Ekle butonu ── */}
                <Button
                  className="w-full h-11 gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-bold"
                  variant="outline"
                  onClick={handlePlanlaClick}
                >
                  <MapPinPlus className="w-4 h-4" />
                  Gezi Planıma Ekle
                </Button>

                <Separator />

                {/* Tarih */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <Calendar className="w-4 h-4" /> Tercih edilen tarih
                  </Label>
                  <Input type="date" min={minDate} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-10" />
                  <p className="text-xs text-muted-foreground mt-1">Kesin tarih teklifte netleşir</p>
                </div>

                {/* Kişi sayısı */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Katılımcılar</Label>
                  {[{ label: 'Yetişkin', sub: '13+ yaş', val: adultCount, set: setAdultCount, min: 1 },
                    { label: 'Çocuk',    sub: '7–12 yaş', val: childCount, set: setChildCount, min: 0 }].map(p => (
                    <div key={p.label} className="flex items-center justify-between">
                      <div><div className="font-medium text-sm">{p.label}</div><div className="text-xs text-muted-foreground">{p.sub}</div></div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => p.set(Math.max(p.min, p.val - 1))} disabled={p.val <= p.min}><Minus className="w-4 h-4" /></Button>
                        <span className="w-8 text-center font-semibold">{p.val}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => p.set(p.val + 1)}><Plus className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Tahmini fiyat */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Yetişkin x {adultCount}</span><span>{(tour.group_price_adult * adultCount).toFixed(0)}€~</span></div>
                  {childCount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Çocuk x {childCount}</span><span>{((tour.group_price_child || tour.group_price_adult * 0.7) * childCount).toFixed(0)}€~</span></div>}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold"><span>Tahmini toplam</span><span className="text-primary">{estTotal.toFixed(0)}€~</span></div>
                  <p className="text-xs text-muted-foreground">Kesin fiyat size özel teklifte yer alır</p>
                </div>

                {/* Teklif Al */}
                <Button className="w-full h-12 text-base gap-2" size="lg"
                  onClick={() => navigate('/teklif', { state: { items: [{ item_type: 'tour', service_id: tour.id, service_name: tour.name, service_slug: tour.slug, service_date: selectedDate, service_time: tour.start_time, adult_count: adultCount, child_count: childCount, unit_price: tour.group_price_adult, total_price: estTotal, cover_image: tour.cover_image }], traveler_count: adultCount + childCount } })}>
                  <Send className="w-4 h-4" />Ücretsiz Teklif Al
                </Button>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {['24 saat içinde yanıt', 'Kredi kartı gerekmez', 'Kişiye özel fiyat'].map(t => (
                    <div key={t} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />{t}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
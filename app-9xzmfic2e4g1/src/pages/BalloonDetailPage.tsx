import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock, Send, Users, ChevronRight, ChevronLeft, Check, X,
  Calendar, Minus, Plus, AlertCircle, Sunrise, Award, Camera,
  MapPinPlus, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { balloonsApi } from '@/db/agency-api';
import api from '@/db/api';
import type { BalloonFlight } from '@/types/agency';
import type { Trip } from '@/db/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
];

export default function BalloonDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [flight, setFlight] = useState<BalloonFlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [selectedDate, setSelectedDate] = useState('');
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);

  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [addingToTrip, setAddingToTrip] = useState<string | null>(null);

  useEffect(() => { if (slug) loadFlight(slug); }, [slug]);
  useEffect(() => { if (user && showTripSelector) loadMyTrips(); }, [user, showTripSelector]);

  const loadFlight = async (s: string) => {
    try {
      setLoading(true);
      const data = await balloonsApi.getBySlug(s);
      if (data) setFlight(data); else setError('Balon turu bulunamadı');
    } catch { setError('Yüklenirken bir hata oluştu'); }
    finally { setLoading(false); }
  };

  const loadMyTrips = async () => {
    try { setMyTrips(await api.getTrips() || []); } catch { /* sessiz */ }
  };

  const calculateTotal = () => {
    if (!flight) return 0;
    return flight.sell_price_adult * adultCount + (flight.sell_price_child || flight.sell_price_adult * 0.8) * childCount;
  };

  const handleAddToTrip = async (tripId: string) => {
    if (!flight) return;
    setAddingToTrip(tripId);
    try {
      const tripData = await api.getTripById(tripId);
      if (!tripData) throw new Error('Gezi bulunamadı');
      const days = tripData.itinerary?.days || [];
      if (days.length === 0) throw new Error('Gezide gün yok');

      // Balon için uygun gün: balon veya tur olmayan ilk gün
      let targetDayIdx = days.findIndex(d =>
        !d.items.some(i => i.agency_service?.type === 'balloon') &&
        !d.items.some(i => i.agency_service?.type === 'tour')
      );
      if (targetDayIdx === -1) targetDayIdx = 0;

      const duration = flight.duration_minutes || 90;
      const endTotalM = 5 * 60 + 30 + duration;
      const endTime = `${String(Math.floor(endTotalM / 60) % 24).padStart(2,'0')}:${String(endTotalM % 60).padStart(2,'0')}`;

      const newPlace = {
        place_id: `balloon__${flight.id}`,
        name: flight.name,
        lat: 38.6431, lng: 34.8347,
        formatted_address: 'Kapadokya, Nevşehir',
        photo_reference: flight.cover_image || '',
        description: flight.description || '',
        category: 'Balon Turu',
        estimated_duration_minutes: duration,
        start_time: '05:30',
        end_time: endTime,
        why_visit: flight.description || undefined,
        agency_service: { type: 'balloon' as const, slug: flight.slug, price: flight.sell_price_adult, currency: flight.currency || 'EUR' },
      };

      if (days[targetDayIdx].items.some(i => i.agency_service?.type === 'balloon')) {
        toast.warning('Bu günde zaten balon turu var. Lütfen başka bir gün seçin.');
        setAddingToTrip(null);
        return;
      }

      const updatedDays = days.map((d, i) => i === targetDayIdx ? { ...d, items: [...d.items, newPlace] } : d);
      await api.updateTrip(tripId, { itinerary: { days: updatedDays } } as any);
      toast.success(`${flight.name} — Gün ${days[targetDayIdx].day}'e eklendi! ⏰ 05:30 kalkış`);
      setShowTripSelector(false);
      navigate(`/trip/${tripId}`);
    } catch (err: any) {
      toast.error(err.message || 'Eklenemedi');
    } finally { setAddingToTrip(null); }
  };

  const handlePlanlaClick = () => {
    if (!user) { navigate('/login', { state: { from: `/balon/${slug}` } }); return; }
    setShowTripSelector(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  if (error || !flight) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Bulunamadı</h1>
      <Button asChild><Link to="/balon">Balon Turlarına Dön</Link></Button>
    </div>
  );

  const images = flight.gallery_images?.length
    ? [flight.cover_image, ...flight.gallery_images].filter(Boolean) as string[]
    : DEFAULT_IMAGES;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Trip seçici modal */}
      {showTripSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Hangi geziye ekleyelim?</h3>
                <p className="text-xs text-amber-600 mt-0.5">⏰ Otomatik olarak 05:30'a ayarlanır</p>
              </div>
              <button onClick={() => setShowTripSelector(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            {myTrips.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-4">Henüz bir gezi planınız yok.</p>
                <Button onClick={() => { setShowTripSelector(false); navigate('/planner'); }} className="bg-primary">Yeni Gezi Planla</Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {myTrips.map(t => (
                  <button key={t.id} onClick={() => handleAddToTrip(t.id)} disabled={addingToTrip === t.id}
                    className={cn('w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all', addingToTrip === t.id && 'opacity-50')}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{t.title}</p>
                        <p className="text-xs text-gray-400">{t.start_date} · {t.itinerary?.days?.length || 0} gün</p>
                      </div>
                      {addingToTrip === t.id ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <MapPinPlus className="h-4 w-4 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => { setShowTripSelector(false); navigate('/planner'); }}>+ Yeni Gezi Oluştur</Button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/balon" className="hover:text-primary">Balon Turları</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{flight.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Galeri */}
            <div className="relative">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                <img src={images[currentImageIndex]} alt={flight.name} className="w-full h-full object-cover" />
              </div>
              {images.length > 1 && (
                <>
                  <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full" onClick={() => setCurrentImageIndex(p => p === 0 ? images.length - 1 : p - 1)}><ChevronLeft className="w-5 h-5" /></Button>
                  <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full" onClick={() => setCurrentImageIndex(p => p === images.length - 1 ? 0 : p + 1)}><ChevronRight className="w-5 h-5" /></Button>
                </>
              )}
              <Badge className="absolute top-4 left-4 bg-amber-500 text-white">🎈 Balon Turu</Badge>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{flight.name}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                <div className="flex items-center gap-1.5"><Sunrise className="w-5 h-5 text-amber-500" /><span>Şafak Uçuşu (05:30)</span></div>
                <div className="flex items-center gap-1.5"><Clock className="w-5 h-5" /><span>{flight.duration_minutes} dakika</span></div>
                <div className="flex items-center gap-1.5"><Users className="w-5 h-5" /><span>{flight.passengers_per_basket} kişi/sepet</span></div>
              </div>
              <p className="text-lg text-muted-foreground">{flight.description}</p>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-emerald-600 flex items-center gap-2"><Check className="w-5 h-5" />Tura Dahil</CardTitle></CardHeader>
              <CardContent><ul className="grid grid-cols-1 md:grid-cols-2 gap-3">{flight.includes?.map((item, i) => <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />{item}</li>)}</ul></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Önemli Bilgiler</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[{ Icon: Sunrise, color: 'text-amber-500', title: 'Uçuş Saati', desc: 'Uçuşlar gün doğumunda yapılır. Otel alımı 04:30–05:00 arasıdır.' },
                  { Icon: Award, color: 'text-blue-500', title: 'Güvenlik', desc: 'Tüm pilotlarımız SHGM lisanslıdır. Balonlar yıllık bakımdan geçer.' },
                  { Icon: Camera, color: 'text-purple-500', title: 'Fotoğraf', desc: 'Telefonunuzu veya kameranızı yanınıza alabilirsiniz.' }].map(({ Icon, color, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${color} mt-0.5`} />
                    <div><h4 className="font-medium">{title}</h4><p className="text-sm text-muted-foreground">{desc}</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sağ Kolon */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">Kişi başı</p><div className="text-3xl font-bold text-primary">{flight.sell_price_adult}€</div></div>
                  {flight.supplier && <Badge variant="outline">{flight.supplier.name}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* ── YENİ: Planıma Ekle butonu ── */}
                <Button className="w-full h-11 gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold" variant="outline" onClick={handlePlanlaClick}>
                  <MapPinPlus className="w-4 h-4" />
                  Gezi Planıma Ekle
                </Button>
                <Separator />

                <div>
                  <Label className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4" />Tarih Seçin</Label>
                  <Input type="date" min={minDate} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>

                <div className="space-y-4">
                  <Label>Katılımcılar</Label>
                  {[{ label: 'Yetişkin', sub: '13+ yaş', val: adultCount, set: setAdultCount, min: 1 },
                    { label: 'Çocuk', sub: '6–12 yaş', val: childCount, set: setChildCount, min: 0 }].map(p => (
                    <div key={p.label} className="flex items-center justify-between">
                      <div><div className="font-medium">{p.label}</div><div className="text-sm text-muted-foreground">{p.sub}</div></div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => p.set(Math.max(p.min, p.val - 1))} disabled={p.val <= p.min}><Minus className="w-4 h-4" /></Button>
                        <span className="w-8 text-center font-medium">{p.val}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => p.set(p.val + 1)}><Plus className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Yetişkin x {adultCount}</span><span>{(flight.sell_price_adult * adultCount).toFixed(2)}€</span></div>
                  {childCount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Çocuk x {childCount}</span><span>{((flight.sell_price_child || flight.sell_price_adult * 0.8) * childCount).toFixed(2)}€</span></div>}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg"><span>Toplam</span><span className="text-primary">{calculateTotal().toFixed(2)}€</span></div>
                </div>

                <Button className="w-full h-12 text-base gap-2" size="lg"
                  onClick={() => navigate('/teklif', { state: { items: [{ item_type: 'balloon', service_id: flight.id, service_name: flight.name, service_slug: flight.slug, service_date: selectedDate, adult_count: adultCount, child_count: childCount, unit_price: flight.sell_price_adult, total_price: calculateTotal(), cover_image: flight.cover_image }], traveler_count: adultCount + childCount } })}>
                  <Send className="w-4 h-4" />Ücretsiz Teklif Al
                </Button>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {['Hava durumuna bağlı ücretsiz iptal', 'Kişiye özel fiyat', '24 saat içinde yanıt'].map(t => (
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
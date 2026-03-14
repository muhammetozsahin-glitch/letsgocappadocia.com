import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock, Send, Users, ChevronRight, ChevronLeft, Check, X,
  Calendar, Minus, Plus, AlertCircle, MapPin, Info,
  MapPinPlus, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { activitiesApi } from '@/db/agency-api';
import api from '@/db/api';
import type { Activity } from '@/types/agency';
import type { Trip } from '@/db/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const getDefaultImage = (slug: string) => {
  const imgs: Record<string, string> = {
    'atv-safari': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'at-binme':   'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800',
    'turk-gecesi':'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=800',
    'comlekcil-atolyesi':'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
  };
  return imgs[slug] || 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800';
};

const getCategoryLabel = (cat?: string) => {
  switch (cat) {
    case 'adventure':     return { icon: '🏍️', label: 'Macera',   color: 'bg-orange-500' };
    case 'cultural':      return { icon: '🏺', label: 'Kültürel', color: 'bg-purple-500' };
    case 'entertainment': return { icon: '🎭', label: 'Eğlence',  color: 'bg-pink-500' };
    default:              return { icon: '⭐', label: 'Aktivite', color: 'bg-amber-500' };
  }
};

export default function ActivityDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);

  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [addingToTrip, setAddingToTrip] = useState<string | null>(null);

  useEffect(() => { if (slug) loadActivity(slug); }, [slug]);
  useEffect(() => { if (user && showTripSelector) loadMyTrips(); }, [user, showTripSelector]);

  const loadActivity = async (s: string) => {
    try {
      setLoading(true);
      const data = await activitiesApi.getBySlug(s);
      if (data) { setActivity(data); if (data.time_slots?.[0]) setSelectedTime(data.time_slots[0].time); }
      else setError('Aktivite bulunamadı');
    } catch { setError('Yüklenirken bir hata oluştu'); }
    finally { setLoading(false); }
  };

  const loadMyTrips = async () => {
    try { setMyTrips(await api.getTrips() || []); } catch { /* sessiz */ }
  };

  const calculateTotal = () => {
    if (!activity) return 0;
    return activity.sell_price_adult * adultCount + (activity.sell_price_child || activity.sell_price_adult * 0.7) * childCount;
  };

  const handleAddToTrip = async (tripId: string) => {
    if (!activity) return;
    setAddingToTrip(tripId);
    try {
      const tripData = await api.getTripById(tripId);
      if (!tripData) throw new Error('Gezi bulunamadı');
      const days = tripData.itinerary?.days || [];
      if (days.length === 0) throw new Error('Gezide gün yok');

      const duration = activity.duration_minutes || 120;
      const startTime = selectedTime || activity.time_slots?.[0]?.time || '10:00';
      const [sh, sm] = startTime.split(':').map(Number);
      const endTotalM = sh * 60 + sm + duration;
      const endTime = `${String(Math.floor(endTotalM / 60) % 24).padStart(2,'0')}:${String(endTotalM % 60).padStart(2,'0')}`;

      // En uygun günü bul: balonun olduğu güne aktivite eklenebilir (öğleden sonra)
      // ama birden fazla tur olan güne eklememe
      let targetDayIdx = 0;

      const newPlace = {
        place_id: `activity__${activity.id}`,
        name: activity.name,
        lat: 38.6431, lng: 34.8347,
        formatted_address: activity.location || 'Kapadokya, Nevşehir',
        photo_reference: activity.cover_image || '',
        description: activity.short_description || '',
        category: 'Aktivite',
        estimated_duration_minutes: duration,
        start_time: startTime,
        end_time: endTime,
        why_visit: activity.short_description || undefined,
        agency_service: { type: 'activity' as const, slug: activity.slug, price: activity.sell_price_adult, currency: activity.currency || 'EUR' },
      };

      const updatedDays = days.map((d, i) => i === targetDayIdx ? { ...d, items: [...d.items, newPlace] } : d);
      await api.updateTrip(tripId, { itinerary: { days: updatedDays } } as any);
      toast.success(`${activity.name} — Gün ${days[targetDayIdx].day}'e eklendi!`);
      setShowTripSelector(false);
      navigate(`/trip/${tripId}`);
    } catch (err: any) {
      toast.error(err.message || 'Eklenemedi');
    } finally { setAddingToTrip(null); }
  };

  const handlePlanlaClick = () => {
    if (!user) { navigate('/login', { state: { from: `/aktivite/${slug}` } }); return; }
    setShowTripSelector(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  if (error || !activity) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Bulunamadı</h1>
      <Button asChild><Link to="/aktiviteler">Aktivitelere Dön</Link></Button>
    </div>
  );

  const catStyle = getCategoryLabel(activity.category);
  const coverImage = activity.cover_image || getDefaultImage(activity.slug);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

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
            <Link to="/aktiviteler" className="hover:text-primary">Aktiviteler</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{activity.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="relative">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                <img src={coverImage} alt={activity.name} className="w-full h-full object-cover" />
              </div>
              <Badge className={`absolute top-4 left-4 ${catStyle.color} text-white`}>{catStyle.icon} {catStyle.label}</Badge>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{activity.name}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                {activity.duration_minutes && <div className="flex items-center gap-1.5"><Clock className="w-5 h-5" /><span>{Math.floor(activity.duration_minutes / 60)}s {activity.duration_minutes % 60 ? activity.duration_minutes % 60 + 'dk' : ''}</span></div>}
                {activity.min_age && <div className="flex items-center gap-1.5"><Users className="w-5 h-5" /><span>Min {activity.min_age} yaş</span></div>}
                {activity.location && <div className="flex items-center gap-1.5"><MapPin className="w-5 h-5" /><span>{activity.location}</span></div>}
              </div>
              <p className="text-lg text-muted-foreground">{activity.short_description}</p>
            </div>

            {activity.time_slots && activity.time_slots.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Mevcut Seanslar</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {activity.time_slots.map(slot => (
                      <div key={slot.time} className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium">{slot.label}</span>
                        <span className="text-muted-foreground text-sm">({slot.time})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {activity.includes && activity.includes.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-emerald-600 flex items-center gap-2"><Check className="w-5 h-5" />Dahil</CardTitle></CardHeader>
                  <CardContent><ul className="space-y-2">{activity.includes.map((item, i) => <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />{item}</li>)}</ul></CardContent>
                </Card>
              )}
              {activity.requirements && activity.requirements.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-amber-600 flex items-center gap-2"><Info className="w-5 h-5" />Gereksinimler</CardTitle></CardHeader>
                  <CardContent><ul className="space-y-2">{activity.requirements.map((item, i) => <li key={i} className="flex items-center gap-2"><Info className="w-4 h-4 text-amber-500" />{item}</li>)}</ul></CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-2">
              <CardHeader className="pb-4">
                <div><p className="text-sm text-muted-foreground">Kişi başı</p><div className="text-3xl font-bold text-primary">{activity.sell_price_adult}€</div></div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* ── YENİ: Planıma Ekle butonu ── */}
                <Button className="w-full h-11 gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold" variant="outline" onClick={handlePlanlaClick}>
                  <MapPinPlus className="w-4 h-4" />
                  Gezi Planıma Ekle
                </Button>
                <Separator />

                <div>
                  <Label className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4" />Tarih Seçin</Label>
                  <Input type="date" min={minDate} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>

                {activity.time_slots && activity.time_slots.length > 0 && (
                  <div>
                    <Label className="mb-3 block">Saat Seçin</Label>
                    <RadioGroup value={selectedTime} onValueChange={setSelectedTime} className="space-y-2">
                      {activity.time_slots.map(slot => (
                        <div key={slot.time} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value={slot.time} id={slot.time} />
                          <Label htmlFor={slot.time} className="flex-1 cursor-pointer">
                            <span className="font-medium">{slot.label}</span>
                            <span className="text-muted-foreground ml-2">({slot.time})</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                <div className="space-y-4">
                  <Label>Katılımcılar</Label>
                  {[{ label: 'Yetişkin', sub: '13+ yaş', val: adultCount, set: setAdultCount, min: 1 },
                    { label: 'Çocuk', sub: '7–12 yaş', val: childCount, set: setChildCount, min: 0 }].map(p => (
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
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Yetişkin x {adultCount}</span><span>{(activity.sell_price_adult * adultCount).toFixed(2)}€</span></div>
                  {childCount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Çocuk x {childCount}</span><span>{((activity.sell_price_child || activity.sell_price_adult * 0.7) * childCount).toFixed(2)}€</span></div>}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg"><span>Toplam</span><span className="text-primary">{calculateTotal().toFixed(2)}€</span></div>
                </div>

                <Button className="w-full h-12 text-base gap-2" size="lg"
                  onClick={() => navigate('/teklif', { state: { items: [{ item_type: 'activity', service_id: activity.id, service_name: activity.name, service_slug: activity.slug, service_date: selectedDate, adult_count: adultCount, child_count: childCount, unit_price: activity.sell_price_adult, total_price: calculateTotal(), cover_image: activity.cover_image }], traveler_count: adultCount + childCount } })}>
                  <Send className="w-4 h-4" />Ücretsiz Teklif Al
                </Button>

                <div className="space-y-2 text-sm text-muted-foreground">
                  {['24 saat içinde yanıt', 'Kredi kartı gerekmez'].map(t => (
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
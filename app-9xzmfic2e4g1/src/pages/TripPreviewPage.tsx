// src/pages/TripPreviewPage.tsx
// Kayıtsız kullanıcılar için plan önizleme sayfası
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Calendar, LogIn, Save, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/db/api';
import { toast } from 'sonner';

export default function TripPreviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingTrip, setPendingTrip] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('pending_trip');
    if (!raw) { navigate('/planner'); return; }
    try { setPendingTrip(JSON.parse(raw)); }
    catch { navigate('/planner'); }
  }, [navigate]);

  // Kullanıcı giriş yaparsa otomatik kaydet
  useEffect(() => {
    if (user && pendingTrip) saveAndRedirect();
  }, [user]);

  const saveAndRedirect = async () => {
    if (!pendingTrip || !user) return;
    setSaving(true);
    try {
      const saved = await api.saveTrip({ user_id: user.id, ...pendingTrip });
      sessionStorage.removeItem('pending_trip');
      toast.success('Planınız kaydedildi!');
      navigate(`/trip/${saved.id}`);
    } catch {
      toast.error('Kayıt sırasında hata oluştu');
    } finally { setSaving(false); }
  };

  if (!pendingTrip) return null;

  const days = pendingTrip.itinerary?.days || [];
  const totalStops = days.reduce((s: number, d: any) => s + (d.items?.length || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero bar */}
      <div className="bg-secondary text-white">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate('/planner')} className="text-white/60 hover:text-white flex items-center gap-1 text-sm">
              <ArrowLeft className="h-4 w-4" />Tekrar planla
            </button>
          </div>
          <h1 className="text-2xl font-black text-white">{pendingTrip.title || 'Kapadokya Planınız'}</h1>
          <div className="flex items-center gap-4 mt-2 text-white/60 text-sm">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{pendingTrip.start_date} – {pendingTrip.end_date}</span>
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{days.length} gün · {totalStops} durak</span>
          </div>
        </div>
      </div>

      {/* Giriş yapma CTA */}
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-bold text-gray-900">Bu planı kaydetmek ister misiniz?</p>
            <p className="text-sm text-gray-500">Ücretsiz hesap açın, planınızı düzenleyin ve teklif alın.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/login?from=preview"><LogIn className="h-4 w-4" />Giriş Yap</Link>
            </Button>
            <Button asChild className="gap-2 bg-primary">
              <Link to="/login?from=preview&mode=register"><Save className="h-4 w-4" />Kaydet</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Plan özeti */}
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        {days.map((day: any, idx: number) => (
          <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
            {/* Gün başlığı */}
            <div className={`px-5 py-3 flex items-center justify-between ${
              day.day_type === 'balloon' ? 'bg-sky-50 border-b border-sky-100' :
              day.day_type === 'tour' ? 'bg-orange-50 border-b border-orange-100' :
              'bg-gray-50 border-b border-gray-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black uppercase leading-none">Gün</span>
                  <span className="text-sm font-black leading-none">{day.day}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {day.day_type === 'balloon' && (
                      <Badge className="bg-sky-100 text-sky-800 border-0 text-[10px]">🎈 Balon Günü</Badge>
                    )}
                    {day.day_type === 'tour' && day.assigned_tour && (
                      <Badge className="bg-orange-100 text-orange-800 border-0 text-[10px]">{day.assigned_tour.name}</Badge>
                    )}
                    {(!day.day_type || day.day_type === 'free') && (
                      <span className="text-sm font-bold text-gray-700">Serbest Gün</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{day.items?.length || 0} durak</p>
                </div>
              </div>
            </div>

            {/* Balon bloğu */}
            {day.day_type === 'balloon' && day.assigned_balloon && (
              <div className="px-5 py-3 flex items-center gap-3 border-b border-sky-50 bg-sky-50/50">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  <span className="text-base">🎈</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-sky-800">{day.assigned_balloon.name}</p>
                  <p className="text-xs text-sky-500">⏰ 05:30 kalkış · {day.assigned_balloon.duration_minutes}dk · {day.assigned_balloon.price_adult}€/kişi</p>
                </div>
              </div>
            )}

            {/* Tur bloğu */}
            {day.day_type === 'tour' && day.assigned_tour && (
              <div className="px-5 py-3 border-b border-orange-50 bg-orange-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-orange-800">{day.assigned_tour.name}</p>
                    <p className="text-xs text-orange-500">⏰ {day.assigned_tour.start_time} – {day.assigned_tour.end_time} · {day.assigned_tour.price_adult}€/kişi</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 border-0 text-[9px]">
                    {day.assigned_tour.itinerary?.length || 0} durak</Badge>
                </div>
              </div>
            )}

            {/* Serbest öğeler */}
            {day.items?.length > 0 && (
              <div className="divide-y divide-gray-50">
                {day.items.map((item: any, i: number) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-black text-gray-500 shrink-0">{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{item.name || item.place_name}</p>
                      <p className="text-[11px] text-gray-400">{item.category} {item.start_time ? `· ${item.start_time}` : ''}</p>
                    </div>
                    {item.agency_service && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {item.agency_service.price}€
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Alt CTA */}
        <div className="text-center py-8 space-y-4">
          <Sparkles className="h-8 w-8 text-primary mx-auto" />
          <h3 className="text-lg font-black text-gray-900">Planınızı kaydedin, teklif alın</h3>
          <p className="text-sm text-gray-500">Ücretsiz hesap açın, planı düzenleyin, fiyat teklifi isteyin.</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" asChild><Link to="/login?from=preview">Giriş Yap</Link></Button>
            <Button asChild className="bg-primary"><Link to="/login?from=preview&mode=register">Ücretsiz Kayıt Ol</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
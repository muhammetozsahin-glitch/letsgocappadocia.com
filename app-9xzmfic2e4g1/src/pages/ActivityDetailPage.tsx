// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/ActivityDetailPage.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Clock, Send, Users, ChevronRight, ChevronLeft, Check, X,
  Calendar, Minus, Plus, AlertCircle, MapPin, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { activitiesApi } from '@/db/agency-api';
import type { Activity } from '@/types/agency';

const getDefaultImage = (slug: string) => {
  const images: Record<string, string> = {
    'atv-safari': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'at-binme': 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800',
    'turk-gecesi': 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=800',
    'comlekcil-atolyesi': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
  };
  return images[slug] || 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800';
};

const getCategoryLabel = (category?: string) => {
  switch (category) {
    case 'adventure': return { icon: '🏍️', label: 'Macera', color: 'bg-orange-500' };
    case 'cultural': return { icon: '🏺', label: 'Kültürel', color: 'bg-purple-500' };
    case 'entertainment': return { icon: '🎭', label: 'Eğlence', color: 'bg-pink-500' };
    default: return { icon: '⭐', label: 'Aktivite', color: 'bg-amber-500' };
  }
};

export default function ActivityDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);

  useEffect(() => {
    if (slug) loadActivity(slug);
  }, [slug]);

  const loadActivity = async (activitySlug: string) => {
    try {
      setLoading(true);
      const data = await activitiesApi.getBySlug(activitySlug);
      if (data) {
        setActivity(data);
        if (data.time_slots && data.time_slots.length > 0) {
          setSelectedTime(data.time_slots[0].time);
        }
      } else {
        setError('Aktivite bulunamadı');
      }
    } catch (err) {
      setError('Yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!activity) return 0;
    const adultTotal = activity.sell_price_adult * adultCount;
    const childTotal = (activity.sell_price_child || activity.sell_price_adult * 0.7) * childCount;
    return adultTotal + childTotal;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Bulunamadı</h1>
        <Button asChild><Link to="/aktiviteler">Aktivitelere Dön</Link></Button>
      </div>
    );
  }

  const categoryStyle = getCategoryLabel(activity.category);
  const imageUrl = activity.cover_image || getDefaultImage(activity.slug);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background">
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
          
          {/* Sol Kolon */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Görsel */}
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
              <img src={imageUrl} alt={activity.name} className="w-full h-full object-cover" />
              <Badge className={`absolute top-4 left-4 ${categoryStyle.color} text-white`}>
                {categoryStyle.icon} {categoryStyle.label}
              </Badge>
            </div>

            {/* Başlık */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{activity.name}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                {activity.duration_minutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-5 h-5" />
                    <span>{Math.floor(activity.duration_minutes / 60)} saat</span>
                  </div>
                )}
                {activity.min_age && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-5 h-5" />
                    <span>Min {activity.min_age} yaş</span>
                  </div>
                )}
                {activity.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-5 h-5" />
                    <span>{activity.location}</span>
                  </div>
                )}
              </div>
              <p className="text-lg text-muted-foreground">{activity.short_description}</p>
            </div>

            {/* Açıklama */}
            {activity.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Detaylı Bilgi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div dangerouslySetInnerHTML={{ __html: activity.description }} />
                </CardContent>
              </Card>
            )}

            {/* Dahil / Hariç */}
            <div className="grid md:grid-cols-2 gap-6">
              {activity.includes && activity.includes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-emerald-600 flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Dahil
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {activity.includes.map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {activity.requirements && activity.requirements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-amber-600 flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Gereksinimler
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {activity.requirements.map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-amber-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sağ Kolon - Rezervasyon */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-2">
              <CardHeader className="pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Kişi başı</p>
                  <div className="text-3xl font-bold text-primary">{activity.sell_price_adult}€</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Tarih */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Tarih Seçin
                  </Label>
                  <Input 
                    type="date" 
                    min={minDate} 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                  />
                </div>

                {/* Saat */}
                {activity.time_slots && activity.time_slots.length > 0 && (
                  <div>
                    <Label className="mb-3 block">Saat Seçin</Label>
                    <RadioGroup value={selectedTime} onValueChange={setSelectedTime} className="space-y-2">
                      {activity.time_slots.map((slot) => (
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

                {/* Kişi Sayısı */}
                <div className="space-y-4">
                  <Label>Katılımcılar</Label>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Yetişkin</div>
                      <div className="text-sm text-muted-foreground">13+ yaş</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" className="h-8 w-8" 
                        onClick={() => setAdultCount(Math.max(1, adultCount - 1))} 
                        disabled={adultCount <= 1}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{adultCount}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" 
                        onClick={() => setAdultCount(adultCount + 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Çocuk</div>
                      <div className="text-sm text-muted-foreground">7-12 yaş</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" className="h-8 w-8" 
                        onClick={() => setChildCount(Math.max(0, childCount - 1))} 
                        disabled={childCount <= 0}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{childCount}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" 
                        onClick={() => setChildCount(childCount + 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Fiyat */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Yetişkin x {adultCount}</span>
                    <span>{(activity.sell_price_adult * adultCount).toFixed(2)}€</span>
                  </div>
                  {childCount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Çocuk x {childCount}</span>
                      <span>{((activity.sell_price_child || activity.sell_price_adult * 0.7) * childCount).toFixed(2)}€</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Toplam</span>
                    <span className="text-primary">{calculateTotal().toFixed(2)}€</span>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-base gap-2"
                  size="lg"
                  onClick={() => navigate('/teklif', {
                    state: {
                      items: [{
                        item_type: 'activity',
                        service_id: activity.id,
                        service_name: activity.name,
                        service_slug: activity.slug,
                        service_date: selectedDate,
                        adult_count: adultCount,
                        child_count: childCount,
                        unit_price: activity.sell_price_adult,
                        total_price: activity.sell_price_adult * adultCount,
                        cover_image: activity.cover_image,
                      }],
                      traveler_count: adultCount + childCount,
                    }
                  })}
                >
                  <Send className="w-4 h-4" />
                  Ücretsiz Teklif Al
                </Button>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    24 saat içinde yanıt
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Kredi kartı gerekmez
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
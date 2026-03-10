// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/BalloonDetailPage.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Clock, Users, ChevronRight, ChevronLeft, Check, X,
  Calendar, Minus, Plus, AlertCircle, Sunrise, Award, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { balloonsApi } from '@/db/agency-api';
import type { BalloonFlight } from '@/types/agency';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
];

export default function BalloonDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const [flight, setFlight] = useState<BalloonFlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);

  useEffect(() => {
    if (slug) loadFlight(slug);
  }, [slug]);

  const loadFlight = async (flightSlug: string) => {
    try {
      setLoading(true);
      const data = await balloonsApi.getBySlug(flightSlug);
      if (data) {
        setFlight(data);
      } else {
        setError('Balon turu bulunamadı');
      }
    } catch (err) {
      setError('Yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!flight) return 0;
    const adultTotal = flight.sell_price_adult * adultCount;
    const childTotal = (flight.sell_price_child || flight.sell_price_adult * 0.8) * childCount;
    return adultTotal + childTotal;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !flight) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Bulunamadı</h1>
        <Button asChild><Link to="/balon">Balon Turlarına Dön</Link></Button>
      </div>
    );
  }

  const images = flight.gallery_images?.length 
    ? [flight.cover_image, ...flight.gallery_images].filter(Boolean) as string[]
    : DEFAULT_IMAGES;

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
            <Link to="/balon" className="hover:text-primary">Balon Turları</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{flight.name}</span>
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
                <img src={images[currentImageIndex]} alt={flight.name} className="w-full h-full object-cover" />
              </div>
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary" size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="secondary" size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}

              <Badge className="absolute top-4 left-4 bg-amber-500 text-white">
                🎈 Balon Turu
              </Badge>
            </div>

            {/* Başlık */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{flight.name}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                <div className="flex items-center gap-1.5">
                  <Sunrise className="w-5 h-5 text-amber-500" />
                  <span>Şafak Uçuşu (05:30)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-5 h-5" />
                  <span>{flight.duration_minutes} dakika</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-5 h-5" />
                  <span>{flight.passengers_per_basket} kişi/sepet</span>
                </div>
              </div>
              <p className="text-lg text-muted-foreground">{flight.description}</p>
            </div>

            {/* Dahil Olanlar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-emerald-600 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Tura Dahil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {flight.includes?.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Önemli Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle>Önemli Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Sunrise className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Uçuş Saati</h4>
                    <p className="text-sm text-muted-foreground">Uçuşlar gün doğumunda yapılır. Otel alımı 04:30-05:00 arasıdır.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Güvenlik</h4>
                    <p className="text-sm text-muted-foreground">Tüm pilotlarımız SHGM lisanslıdır. Balonlar yıllık bakımdan geçer.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Fotoğraf</h4>
                    <p className="text-sm text-muted-foreground">Telefonunuzu veya kameranızı yanınıza alabilirsiniz.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Kolon - Rezervasyon */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Kişi başı</p>
                    <div className="text-3xl font-bold text-primary">{flight.sell_price_adult}€</div>
                  </div>
                  {flight.supplier && (
                    <Badge variant="outline">{flight.supplier.name}</Badge>
                  )}
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
                      <div className="text-sm text-muted-foreground">6-12 yaş</div>
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
                    <span>{(flight.sell_price_adult * adultCount).toFixed(2)}€</span>
                  </div>
                  {childCount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Çocuk x {childCount}</span>
                      <span>{((flight.sell_price_child || flight.sell_price_adult * 0.8) * childCount).toFixed(2)}€</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Toplam</span>
                    <span className="text-primary">{calculateTotal().toFixed(2)}€</span>
                  </div>
                </div>

                <Button className="w-full h-12 text-lg" size="lg">
                  Rezervasyon Yap
                </Button>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Hava durumuna bağlı ücretsiz iptal
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Anında onay
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
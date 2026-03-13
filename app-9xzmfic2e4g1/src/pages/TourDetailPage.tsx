// ═══════════════════════════════════════════════════════════════════════════════
// TUR DETAY SAYFASI
// Bu dosyayı src/pages/TourDetailPage.tsx olarak kaydedin
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Clock, Users, MapPin, Star, ChevronRight, ChevronLeft,
  Check, X, Calendar, Info, Minus, Plus, AlertCircle,
  Send, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toursApi } from '@/db/agency-api';
import type { Tour } from '@/types/agency';
import { useNavigate } from 'react-router-dom';

// Varsayılan görseller
const getDefaultImages = (code: string) => {
  return [
    'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800',
    'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800',
    'https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?w=800',
  ];
};

export default function TourDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const navigate = useNavigate();
  // Teklif formu
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);

  useEffect(() => {
    if (slug) loadTour(slug);
  }, [slug]);

  const loadTour = async (tourSlug: string) => {
    try {
      setLoading(true);
      const data = await toursApi.getBySlug(tourSlug);
      if (data) {
        setTour(data);
        if (data.group_enabled) setBookingType('group');
        else if (data.private_enabled) setBookingType('private');
      } else {
        setError('Tur bulunamadı');
      }
    } catch (err) {
      setError('Tur yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Error
  if (error || !tour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Tur Bulunamadı</h1>
        <Button asChild><Link to="/turlar">Turlara Dön</Link></Button>
      </div>
    );
  }

  const images = tour.gallery_images?.length 
    ? [tour.cover_image, ...tour.gallery_images].filter(Boolean) as string[]
    : getDefaultImages(tour.code);

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
                      {tour.itinerary.map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="w-16 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {item.time}
                          </div>
                          <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                          </div>
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
                    <CardContent>
                      <ul className="space-y-2">
                        {tour.includes?.map((item, i) => (
                          <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><X className="w-5 h-5" />Hariç</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {tour.excludes?.map((item, i) => (
                          <li key={i} className="flex items-center gap-2"><X className="w-4 h-4 text-red-500" />{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="info" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div dangerouslySetInnerHTML={{ __html: tour.description || '' }} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sağ Kolon - Teklif Al */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Kişi başı başlangıç fiyatı</p>
                    <div className="text-3xl font-bold text-primary">{tour.group_price_adult}€</div>
                  </div>
                  {tour.private_enabled && (
                    <Badge variant="outline" className="text-xs">Özel tur mevcut</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Tercih edilen tarih */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <Calendar className="w-4 h-4" /> Tercih edilen tarih
                  </Label>
                  <Input
                    type="date"
                    min={minDate}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Kesin tarih teklifte netleşir</p>
                </div>

                {/* Kişi sayısı */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Katılımcılar</Label>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Yetişkin</div>
                      <div className="text-xs text-muted-foreground">13+ yaş</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                        disabled={adultCount <= 1}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{adultCount}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setAdultCount(adultCount + 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Çocuk</div>
                      <div className="text-xs text-muted-foreground">7–12 yaş</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setChildCount(Math.max(0, childCount - 1))}
                        disabled={childCount <= 0}>
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{childCount}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => setChildCount(childCount + 1)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tahmini fiyat */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Yetişkin x {adultCount}</span>
                    <span>{(tour.group_price_adult * adultCount).toFixed(0)}€~</span>
                  </div>
                  {childCount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Çocuk x {childCount}</span>
                      <span>{((tour.group_price_child || tour.group_price_adult * 0.7) * childCount).toFixed(0)}€~</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Tahmini toplam</span>
                    <span className="text-primary">
                      {(tour.group_price_adult * adultCount + (tour.group_price_child || tour.group_price_adult * 0.7) * childCount).toFixed(0)}€~
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Kesin fiyat size özel teklifte yer alır</p>
                </div>

                {/* Teklif Al Butonu */}
                <Button
                  className="w-full h-12 text-base gap-2"
                  size="lg"
                  onClick={() => navigate('/teklif', {
                    state: {
                      items: [{
                        item_type: 'tour',
                        service_id: tour.id,
                        service_name: tour.name,
                        service_slug: tour.slug,
                        service_date: selectedDate,
                        service_time: tour.start_time,
                        adult_count: adultCount,
                        child_count: childCount,
                        unit_price: tour.group_price_adult,
                        total_price: tour.group_price_adult * adultCount + (tour.group_price_child || tour.group_price_adult * 0.7) * childCount,
                        cover_image: tour.cover_image,
                      }],
                      traveler_count: adultCount + childCount,
                    }
                  })}
                >
                  <Send className="w-4 h-4" />
                  Ücretsiz Teklif Al
                </Button>

                {/* Güvenceler */}
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />24 saat içinde yanıt</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />Kredi kartı gerekmez</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" />Kişiye özel fiyat</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
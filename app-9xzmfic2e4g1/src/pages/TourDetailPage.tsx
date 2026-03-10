// ═══════════════════════════════════════════════════════════════════════════════
// TUR DETAY SAYFASI
// Bu dosyayı src/pages/TourDetailPage.tsx olarak kaydedin
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, MapPin, Check, X, Calendar, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toursApi } from '@/db/agency-api';
import type { Tour } from '@/types/agency';

export function TourDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      toursApi.getBySlug(slug).then((data) => {
        setTour(data);
        setLoading(false);
      });
    }
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">Tur bulunamadı</h1>
        <Button onClick={() => navigate('/tours')}>Turlara Dön</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <img
          src={tour.cover_image || 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1920&h=1080&fit=crop'}
          alt={tour.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute top-4 left-4">
          <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => navigate(-1)}>
            <ChevronLeft className="mr-2" /> Geri
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-8 text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{tour.name}</h1>
            <div className="flex gap-4">
              <Badge className="bg-white/20 backdrop-blur-md">
                <Clock className="w-4 h-4 mr-2" /> {tour.duration_hours} Saat
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-md">
                <Users className="w-4 h-4 mr-2" /> Max {tour.group_max_participants} Kişi
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* İçerik */}
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Açıklama</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{tour.description}</p>
          </section>

          {/* Tur Programı */}
          {tour.itinerary && tour.itinerary.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Tur Programı</h2>
              <div className="space-y-4">
                {tour.itinerary.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="min-w-[80px] font-mono text-primary font-bold">{item.time}</div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Dahil / Hariç */}
          <div className="grid md:grid-cols-2 gap-6">
            <section>
              <h3 className="font-bold text-lg mb-3 flex items-center text-emerald-600">
                <Check className="w-5 h-5 mr-2" /> Dahil Olanlar
              </h3>
              <ul className="space-y-2">
                {tour.includes?.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    • {item}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="font-bold text-lg mb-3 flex items-center text-red-600">
                <X className="w-5 h-5 mr-2" /> Hariç Olanlar
              </h3>
              <ul className="space-y-2">
                {tour.excludes?.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    • {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Rezervasyon Paneli */}
        <div className="md:col-span-1">
          <div className="sticky top-24 bg-card rounded-xl border p-6 shadow-sm">
            <div className="text-sm text-muted-foreground mb-1">Başlangıç Fiyatı</div>
            <div className="text-3xl font-bold text-primary mb-6">{tour.group_price_adult} €</div>
            
            <Button className="w-full mb-4">
              <Calendar className="w-4 h-4 mr-2" /> Müsaitlik Sorgula
            </Button>
            
            <Separator className="my-4" />
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Buluşma Noktası: {tour.meeting_point || 'Belirtilmemiş'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TourDetailPage;

// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/BalloonsPage.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, Sunrise, Clock, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BalloonCard } from '@/components/balloons/BalloonCard';
import { balloonsApi } from '@/db/agency-api';
import type { BalloonFlight } from '@/types/agency';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=1920&h=600&fit=crop';

export default function BalloonsPage() {
  const [flights, setFlights] = useState<BalloonFlight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlights();
  }, []);

  const loadFlights = async () => {
    try {
      setLoading(true);
      const data = await balloonsApi.getAll();
      setFlights(data);
    } catch (err) {
      console.error('Error loading flights:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <Badge className="mb-4 bg-white/20 backdrop-blur-sm text-white border-white/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Unutulmaz Deneyim
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Balon Turları
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Şafakta gökyüzüne yükselin ve Kapadokya'nın büyüleyici 
            peri bacalarını kuş bakışı izleyin.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-white/80">
            <div className="flex items-center gap-2">
              <Sunrise className="w-5 h-5" />
              <span>Şafak Uçuşu</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>60-90 Dakika</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Küçük Gruplar</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>Sertifikalı Pilotlar</span>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Balon Turları</span>
          </nav>
        </div>
      </div>

      {/* Bilgi Kutuları */}
      <section className="py-12 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-background rounded-2xl border">
              <div className="text-4xl mb-3">🌅</div>
              <h3 className="font-bold mb-1">Şafak Uçuşu</h3>
              <p className="text-sm text-muted-foreground">Gün doğumunda kalkış</p>
            </div>
            <div className="text-center p-6 bg-background rounded-2xl border">
              <div className="text-4xl mb-3">🎈</div>
              <h3 className="font-bold mb-1">Güvenli Uçuş</h3>
              <p className="text-sm text-muted-foreground">Lisanslı pilotlar</p>
            </div>
            <div className="text-center p-6 bg-background rounded-2xl border">
              <div className="text-4xl mb-3">🍾</div>
              <h3 className="font-bold mb-1">Şampanya</h3>
              <p className="text-sm text-muted-foreground">İniş kutlaması</p>
            </div>
            <div className="text-center p-6 bg-background rounded-2xl border">
              <div className="text-4xl mb-3">📜</div>
              <h3 className="font-bold mb-1">Sertifika</h3>
              <p className="text-sm text-muted-foreground">Uçuş sertifikası</p>
            </div>
          </div>
        </div>
      </section>

      {/* Balon Listesi */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Balon Uçuş Seçenekleri</h2>
            <p className="text-muted-foreground">{flights.length} seçenek mevcut</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted animate-pulse rounded-2xl h-[400px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flights.map((flight) => (
                <BalloonCard key={flight.id} flight={flight} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SSS */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Sıkça Sorulan Sorular</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-background p-6 rounded-xl border">
              <h3 className="font-bold mb-2">Uçuşlar ne zaman yapılıyor?</h3>
              <p className="text-muted-foreground">Balon uçuşları her gün gün doğumunda (05:00-06:00) yapılmaktadır. Hava koşullarına bağlıdır.</p>
            </div>
            <div className="bg-background p-6 rounded-xl border">
              <h3 className="font-bold mb-2">Uçuş iptal olursa ne olur?</h3>
              <p className="text-muted-foreground">Hava koşulları nedeniyle iptal olan uçuşlar için tam iade veya ücretsiz tarih değişikliği yapılır.</p>
            </div>
            <div className="bg-background p-6 rounded-xl border">
              <h3 className="font-bold mb-2">Yaş sınırı var mı?</h3>
              <p className="text-muted-foreground">6 yaş ve üzeri herkes katılabilir. Hamile kadınlar katılamaz.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
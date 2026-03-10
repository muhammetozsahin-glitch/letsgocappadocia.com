// ═══════════════════════════════════════════════════════════════════════════════
// TURLAR LİSTELEME SAYFASI
// Bu dosyayı src/pages/ToursPage.tsx olarak kaydedin
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, Mountain, Clock, Users, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TourCard } from '@/components/tours/TourCard';
import { toursApi } from '@/db/agency-api';
import type { Tour } from '@/types/agency';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=1920&h=600&fit=crop';

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    try {
      setLoading(true);
      const data = await toursApi.getAll();
      setTours(data);
    } catch (err) {
      console.error('Error loading tours:', err);
      setError('Turlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <Badge className="mb-4 bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Kapadokya'nın En İyi Turları
          </Badge>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Günlük Turlar
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Kırmızı, Yeşil ve Mavi turlarımızla Kapadokya'nın büyüleyici vadilerini, 
            yeraltı şehirlerini ve tarihi mekanlarını keşfedin.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-white/80">
            <div className="flex items-center gap-2">
              <Mountain className="w-5 h-5" />
              <span>3 Farklı Rota</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>8-10 Saat</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Grup & Özel</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              <span>Profesyonel Rehber</span>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Günlük Turlar</span>
          </nav>
        </div>
      </div>

      {/* Tur Tipleri Tanıtım */}
      <section className="py-12 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Kırmızı Tur */}
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 rounded-2xl p-6 border border-red-200/50">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white text-xl mb-4">
                🔴
              </div>
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Kırmızı Tur</h3>
              <p className="text-sm text-muted-foreground mb-3">
                En popüler tur! Göreme Açık Hava Müzesi, Uçhisar, Paşabağ ve Avanos.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-red-600 font-semibold">8 saat</span>
                <span className="text-red-600 font-semibold">50€'dan</span>
              </div>
            </div>

            {/* Yeşil Tur */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 rounded-2xl p-6 border border-emerald-200/50">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl mb-4">
                🟢
              </div>
              <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-2">Yeşil Tur</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Macera dolu! Derinkuyu yeraltı şehri, Ihlara Vadisi ve Selime Manastırı.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-emerald-600 font-semibold">10 saat</span>
                <span className="text-emerald-600 font-semibold">60€'dan</span>
              </div>
            </div>

            {/* Mavi Tur */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-2xl p-6 border border-blue-200/50">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl mb-4">
                🔵
              </div>
              <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-2">Mavi Tur</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Otantik Kapadokya! Soğanlı Vadisi, Mustafapaşa ve Keşlik Manastırı.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-blue-600 font-semibold">8 saat</span>
                <span className="text-blue-600 font-semibold">55€'dan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Turlar Listesi */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold">Tüm Turlar</h2>
              <p className="text-muted-foreground">{tours.length} tur bulundu</p>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted animate-pulse rounded-2xl h-[400px]" />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={loadTours}>Tekrar Dene</Button>
            </div>
          )}

          {/* Turlar */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Özel Tur CTA */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Kişiye Özel Deneyim
            </Badge>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Kendi Rotanızı Oluşturun
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              AI destekli planlayıcımız ile ilgi alanlarınıza göre kişiselleştirilmiş 
              bir Kapadokya rotası oluşturun.
            </p>

            <Button size="lg" asChild>
              <Link to="/planner">
                <Sparkles className="w-5 h-5 mr-2" />
                AI ile Rota Oluştur
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
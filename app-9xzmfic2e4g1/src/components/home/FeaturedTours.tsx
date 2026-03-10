// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/components/home/FeaturedTours.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TourCard } from '@/components/tours/TourCard';
import { toursApi } from '@/db/agency-api';
import type { Tour } from '@/types/agency';

export function FeaturedTours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    try {
      const data = await toursApi.getFeatured();
      setTours(data.slice(0, 3)); // Max 3 tur göster
    } catch (err) {
      console.error('Error loading tours:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Başlık */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Popüler Turlar
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Günlük Turlarımız
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Kırmızı, Yeşil ve Mavi turlarımızla Kapadokya'nın eşsiz güzelliklerini keşfedin
          </p>
        </div>

        {/* Tur Kartları */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted animate-pulse rounded-2xl h-[400px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" asChild>
            <Link to="/turlar">
              Tüm Turları Gör
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default FeaturedTours;
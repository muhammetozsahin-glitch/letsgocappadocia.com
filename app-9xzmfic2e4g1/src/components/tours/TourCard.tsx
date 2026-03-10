// ═══════════════════════════════════════════════════════════════════════════════
// TUR KARTI KOMPONENTİ
// Bu dosyayı src/components/tours/TourCard.tsx olarak kaydedin
// ═══════════════════════════════════════════════════════════════════════════════

import { Link } from 'react-router-dom';
import { Clock, Users, Star, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Tour } from '@/types/agency';

interface TourCardProps {
  tour: Tour;
}

// Tur kodu renklerini belirle
const getTourColor = (code: string) => {
  switch (code) {
    case 'red':
      return 'bg-red-500';
    case 'green':
      return 'bg-emerald-500';
    case 'blue':
      return 'bg-blue-500';
    default:
      return 'bg-amber-500';
  }
};

// Varsayılan görsel
const getDefaultImage = (code: string) => {
  switch (code) {
    case 'red':
      return 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&h=400&fit=crop';
    case 'green':
      return 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=600&h=400&fit=crop';
    case 'blue':
      return 'https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?w=600&h=400&fit=crop';
    default:
      return 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=600&h=400&fit=crop';
  }
};

export function TourCard({ tour }: TourCardProps) {
  const colorClass = getTourColor(tour.code);
  const imageUrl = tour.cover_image || getDefaultImage(tour.code);

  return (
    <Link to={`/tur/${tour.slug}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col">
        {/* Görsel */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={imageUrl}
            alt={tour.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Tur kodu badge */}
          <div className={`absolute top-4 left-4 ${colorClass} text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg`}>
            {tour.code === 'red' && '🔴 Kırmızı Tur'}
            {tour.code === 'green' && '🟢 Yeşil Tur'}
            {tour.code === 'blue' && '🔵 Mavi Tur'}
            {!['red', 'green', 'blue'].includes(tour.code) && '⭐ Özel Tur'}
          </div>

          {/* Popüler badge */}
          {tour.is_featured && (
            <Badge className="absolute top-4 right-4 bg-amber-500/90 hover:bg-amber-500 backdrop-blur-sm">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Popüler
            </Badge>
          )}

          {/* Fiyat - alt köşe */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
            <div className="text-xs text-muted-foreground">Kişi başı</div>
            <div className="text-xl font-bold text-primary">{tour.group_price_adult}€</div>
          </div>
        </div>

        {/* İçerik */}
        <CardContent className="flex-1 flex flex-col p-5">
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {tour.name}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
            {tour.short_description}
          </p>

          {/* Meta bilgiler */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{tour.duration_hours}s</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{tour.group_max_participants} kişi</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex gap-2">
              {tour.group_enabled && (
                <Badge variant="outline" className="text-xs">Grup</Badge>
              )}
              {tour.private_enabled && (
                <Badge variant="outline" className="text-xs">Özel</Badge>
              )}
            </div>
            <span className="text-primary font-medium text-sm flex items-center group-hover:underline">
              Detaylar
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default TourCard;
// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/components/balloons/BalloonCard.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { Link } from 'react-router-dom';
import { Clock, Users, Star, ChevronRight, Sunrise } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BalloonFlight } from '@/types/agency';

interface BalloonCardProps {
  flight: BalloonFlight;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&h=400&fit=crop';

const getFlightStyle = (name: string) => {
  if (name.toLowerCase().includes('vip')) return { color: 'bg-amber-500', label: 'VIP', icon: '👑' };
  if (name.toLowerCase().includes('deluxe')) return { color: 'bg-purple-500', label: 'Deluxe', icon: '✨' };
  return { color: 'bg-sky-500', label: 'Standart', icon: '🎈' };
};

export function BalloonCard({ flight }: BalloonCardProps) {
  const style = getFlightStyle(flight.name);
  const imageUrl = flight.cover_image || DEFAULT_IMAGE;

  return (
    <Link to={`/balon/${flight.slug}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col">
        <div className="relative h-52 overflow-hidden">
          <img
            src={imageUrl}
            alt={flight.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <Badge className={`${style.color} text-white`}>
              {style.icon} {style.label}
            </Badge>
            {flight.is_featured && (
              <Badge className="bg-amber-500 text-white">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Popüler
              </Badge>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div className="text-white">
              <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                <Sunrise className="w-4 h-4" />
                <span>05:30</span>
              </div>
              <div className="text-sm text-white/70">{flight.duration_minutes} dakika</div>
            </div>
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
              <div className="text-xs text-muted-foreground">Kişi başı</div>
              <div className="text-xl font-bold text-primary">{flight.sell_price_adult}€</div>
            </div>
          </div>
        </div>

        <CardContent className="flex-1 flex flex-col p-5">
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {flight.name}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
            {flight.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{flight.duration_minutes}dk</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{flight.passengers_per_basket} kişi/sepet</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t">
            {flight.supplier && (
              <Badge variant="outline" className="text-xs">{flight.supplier.name}</Badge>
            )}
            <span className="text-primary font-medium text-sm flex items-center group-hover:underline ml-auto">
              Rezervasyon
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default BalloonCard;
// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/components/activities/ActivityCard.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { Link } from 'react-router-dom';
import { Clock, Users, Star, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Activity } from '@/types/agency';

interface ActivityCardProps {
  activity: Activity;
}

const getCategoryStyle = (category?: string) => {
  switch (category) {
    case 'adventure': return { icon: '🏍️', color: 'bg-orange-500', label: 'Macera' };
    case 'cultural': return { icon: '🏺', color: 'bg-purple-500', label: 'Kültürel' };
    case 'entertainment': return { icon: '🎭', color: 'bg-pink-500', label: 'Eğlence' };
    default: return { icon: '⭐', color: 'bg-amber-500', label: 'Aktivite' };
  }
};

const getDefaultImage = (slug: string) => {
  const images: Record<string, string> = {
    'atv-safari': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    'at-binme': 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=600&h=400&fit=crop',
    'turk-gecesi': 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=600&h=400&fit=crop',
    'comlekcil-atolyesi': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop',
  };
  return images[slug] || 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=600&h=400&fit=crop';
};

export function ActivityCard({ activity }: ActivityCardProps) {
  const style = getCategoryStyle(activity.category);
  const imageUrl = activity.cover_image || getDefaultImage(activity.slug);

  return (
    <Link to={`/aktivite/${activity.slug}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col">
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={activity.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          <Badge className={`absolute top-4 left-4 ${style.color} text-white`}>
            {style.icon} {style.label}
          </Badge>

          {activity.is_featured && (
            <Badge className="absolute top-4 right-4 bg-amber-500/90 text-white">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Popüler
            </Badge>
          )}

          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg">
            <div className="text-xs text-muted-foreground">Kişi başı</div>
            <div className="text-xl font-bold text-primary">{activity.sell_price_adult}€</div>
          </div>
        </div>

        <CardContent className="flex-1 flex flex-col p-5">
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {activity.name}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
            {activity.short_description}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {activity.duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{Math.floor(activity.duration_minutes / 60)}s</span>
              </div>
            )}
            {activity.min_age && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>Min {activity.min_age} yaş</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t">
            {activity.time_slots && activity.time_slots.length > 0 && (
              <div className="flex gap-1">
                {activity.time_slots.slice(0, 2).map((slot, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">{slot.label}</Badge>
                ))}
              </div>
            )}
            <span className="text-primary font-medium text-sm flex items-center group-hover:underline ml-auto">
              Detaylar
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default ActivityCard;
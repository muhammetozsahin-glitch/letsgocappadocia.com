// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/components/trip/TripBookingPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Send, Calendar, Users, Clock, 
  Check, ChevronRight, Star, Cloud, Ticket, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { toursApi, balloonsApi, activitiesApi } from '@/db/agency-api';
import type { Tour, BalloonFlight, Activity } from '@/types/agency';

interface TripBookingPanelProps {
  tripTitle: string;
  tripDays: number;
  tripPlaces: number;
}

export function TripBookingPanel({ tripTitle, tripDays, tripPlaces }: TripBookingPanelProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [tours, setTours] = useState<Tour[]>([]);
  const [balloons, setBalloons] = useState<BalloonFlight[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Fiyat hesaplama (örnek - kişi sayısına göre)
  const [adultCount, setAdultCount] = useState(2);
  const basePrice = tripDays * 80; // Gün başına 80€
  const totalPrice = basePrice * adultCount;

  useEffect(() => {
    if (isOpen) {
      loadRecommendations();
    }
  }, [isOpen]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const [toursData, balloonsData, activitiesData] = await Promise.all([
        toursApi.getFeatured(),
        balloonsApi.getAll(),
        activitiesApi.getAll(),
      ]);
      setTours(toursData.slice(0, 2));
      setBalloons(balloonsData.slice(0, 1));
      setActivities(activitiesData.slice(0, 2));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              size="lg" 
              className="h-14 px-6 rounded-full shadow-2xl bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 font-bold gap-2"
            >
              <Send className="w-5 h-5" />
              Teklif Al
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-full sm:w-[480px] p-0 overflow-y-auto">
            <SheetHeader className="p-6 border-b bg-gradient-to-r from-primary/10 to-orange-500/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-left text-lg">Ücretsiz Teklif Talep Et</SheetTitle>
                  <p className="text-sm text-muted-foreground text-left">{tripTitle}</p>
                </div>
              </div>
            </SheetHeader>

            <div className="p-6 space-y-6">
              {/* Rota Özeti */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Rotanız</h3>
                    <Badge variant="secondary">AI ile Oluşturuldu</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{tripDays}</div>
                      <div className="text-xs text-muted-foreground">Gün</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{tripPlaces}</div>
                      <div className="text-xs text-muted-foreground">Durak</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{tripDays * 8}</div>
                      <div className="text-xs text-muted-foreground">Saat</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dahil Olanlar */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Özel Tura Dahil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    'Özel araç ve şoför',
                    'Profesyonel lisanslı rehber',
                    'Tüm müze giriş ücretleri',
                    'Otel alım ve bırakım',
                    'Öğle yemeği (her gün)',
                    'Su ikramı',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Kişi Seçimi */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Katılımcılar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span>Yetişkin</span>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-bold">{adultCount}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setAdultCount(adultCount + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fiyat */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Gün başına ({tripDays} gün)</span>
                    <span>{basePrice}€</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Kişi sayısı (x{adultCount})</span>
                    <span>{totalPrice}€</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">Toplam</span>
                    <span className="font-bold text-2xl text-primary">{totalPrice}€</span>
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full h-12 text-base gap-2"
                size="lg"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/teklif', {
                    state: {
                      tripTitle,
                      traveler_count: adultCount,
                      items: [],
                    }
                  });
                }}
              >
                <Send className="w-5 h-5" />
                Ücretsiz Teklif Al
              </Button>

              <Separator />

              {/* Önerilen Ekstra Hizmetler */}
              <div>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Deneyiminizi Zenginleştirin
                </h3>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Balon */}
                    {balloons.map(balloon => (
                      <Link key={balloon.id} to={`/balon/${balloon.slug}`}>
                        <Card className="group hover:shadow-md transition-all cursor-pointer">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                              <Cloud className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold group-hover:text-primary transition-colors">
                                {balloon.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">Şafakta uçuş deneyimi</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">{balloon.sell_price_adult}€</div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}

                    {/* Aktiviteler */}
                    {activities.map(activity => (
                      <Link key={activity.id} to={`/aktivite/${activity.slug}`}>
                        <Card className="group hover:shadow-md transition-all cursor-pointer">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                              <Ticket className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold group-hover:text-primary transition-colors">
                                {activity.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {activity.duration_minutes && `${Math.floor(activity.duration_minutes / 60)} saat`}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">{activity.sell_price_adult}€</div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Hazır Turlar */}
              <div>
                <h3 className="font-bold mb-4">Veya Hazır Turlarımızı İnceleyin</h3>
                <div className="grid grid-cols-2 gap-3">
                  {tours.map(tour => (
                    <Link key={tour.id} to={`/tur/${tour.slug}`}>
                      <Card className="group hover:shadow-md transition-all cursor-pointer h-full">
                        <CardContent className="p-3">
                          <Badge 
                            className={`mb-2 text-xs ${
                              tour.code === 'red' ? 'bg-red-500' :
                              tour.code === 'green' ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                          >
                            {tour.code === 'red' ? '🔴' : tour.code === 'green' ? '🟢' : '🔵'} {tour.name}
                          </Badge>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{tour.duration_hours}s</span>
                            <span className="font-bold text-primary text-sm">{tour.group_price_adult}€</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-3" asChild>
                  <Link to="/turlar">
                    Tüm Turları Gör
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export default TripBookingPanel;
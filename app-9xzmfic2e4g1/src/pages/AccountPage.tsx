import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api, { Trip } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, MapPin, Trash2, ChevronRight, PlusCircle, Zap, Compass as ExploreIcon } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AccountPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTrips();
    }
  }, [user]);

  const loadTrips = async () => {
    try {
      const data = await api.getTrips();
      setTrips(data as Trip[]);
    } catch (error) {
      console.error(error);
      toast.error('Geziler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTrip(id);
      setTrips(trips.filter(t => t.id !== id));
      toast.success('Gezi silindi');
    } catch (error) {
      toast.error('Gezi silinemedi');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <img 
            src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400" 
            alt="bg" 
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <Card className="max-w-sm w-full p-8 text-center space-y-6 bg-white/5 backdrop-blur-xl border-white/10 rounded-3xl shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto border border-primary/40">
            <ExploreIcon className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">HESABIM</h2>
            <p className="text-white/60 font-medium italic text-sm">Gezilerinizi yönetmek için giriş yapmalısınız.</p>
          </div>
          <Button className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-widest rounded-xl" asChild>
            <Link to="/login">Giriş Yap</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-6 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-border">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Kişisel Arşiv</span>
              <Badge className="bg-primary/10 text-primary border-none font-black px-2 py-0.5 rounded-full uppercase text-[9px]">
                {trips.length} Rota
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">
              GEZİLERİM
            </h1>
            <p className="text-lg text-gray-500 font-medium italic">Planladığınız Kapadokya efsaneleri.</p>
          </div>
          <Button className="h-14 px-8 bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 gap-2 group transition-luxury" asChild>
            <Link to="/planner">
              <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform" />
              Yeni Plan
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-40" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-[9px]">Yükleniyor...</p>
          </div>
        ) : trips.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gray-50 dark:bg-white/5 border-dashed border-2 border-gray-100 dark:border-white/10 py-20 text-center space-y-6 rounded-3xl">
              <div className="w-20 h-20 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-gray-100 dark:border-white/10">
                <ExploreIcon className="h-8 w-8 text-gray-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Planınız yok</h3>
                <p className="text-gray-500 font-medium italic text-sm max-w-xs mx-auto">
                  İlk Kapadokya rotanızı oluşturun.
                </p>
              </div>
              <Button variant="outline" className="h-12 px-8 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white font-black uppercase tracking-widest transition-luxury" asChild>
                <Link to="/planner">Hemen Planla</Link>
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {trips.map((trip, idx) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="group overflow-hidden bg-white dark:bg-white/5 border-2 border-gray-50 dark:border-white/5 rounded-3xl shadow-md hover:shadow-xl transition-luxury">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-56 h-48 sm:h-auto bg-gray-200 relative overflow-hidden shrink-0">
                          <img 
                            src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400" 
                            alt={trip.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-luxury duration-700"
                          />
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-primary text-white border-none font-black px-2 py-0.5 rounded-full uppercase text-[8px]">
                              <Zap className="h-2 w-2 mr-1" />
                              {trip.itinerary.days.length} GÜN
                            </Badge>
                          </div>
                        </div>

                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">{trip.destination}</span>
                              </div>
                              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">
                                {trip.title}
                              </h3>
                              <div className="flex items-center gap-4 pt-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 italic">
                                  <Calendar className="h-3.5 w-3.5 text-primary" />
                                  <span>{format(new Date(trip.start_date), 'd MMM yyyy', { locale: tr })}</span>
                                </div>
                              </div>
                            </div>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-gray-300 hover:text-red-600">
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-3xl p-8 bg-secondary border-white/10">
                                <AlertDialogHeader className="space-y-3">
                                  <AlertDialogTitle className="text-2xl font-black text-white tracking-tighter uppercase">Planı Sil?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-white/60 font-medium italic text-base">
                                    Silmek istediğinize emin misiniz?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="pt-6">
                                  <AlertDialogCancel className="h-12 px-8 rounded-xl font-bold bg-white/5 text-white border-white/10">Hayır</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(trip.id)}
                                    className="h-12 px-8 rounded-xl font-black bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Evet, Sil
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>

                          <div className="mt-8 flex items-center justify-between border-t border-gray-50 dark:border-white/5 pt-6">
                            <div className="flex -space-x-2">
                              {trip.itinerary.days[0].items.slice(0, 3).map((item, i) => (
                                <div key={i} className="w-10 h-10 rounded-xl border-2 border-white dark:border-secondary bg-gray-100 overflow-hidden shadow-md">
                                  <img 
                                    src={item.photo_reference ? (item.photo_reference.startsWith('http') ? item.photo_reference : api.getPhotoUrl(item.photo_reference)) : 'https://via.placeholder.com/100'} 
                                    alt="" 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                              ))}
                            </div>
                            <Button className="h-11 px-6 rounded-xl bg-secondary dark:bg-white/10 hover:bg-primary hover:text-white transition-luxury font-black uppercase tracking-widest text-[9px] gap-2" asChild>
                              <Link to={`/trip/${trip.id}`}>
                                Aç
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
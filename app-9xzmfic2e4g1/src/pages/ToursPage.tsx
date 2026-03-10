import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, MapPin, Star, Filter } from 'lucide-react';
import api from '@/db/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TourCard } from '@/components/tours/TourCard';
import type { Tour } from '@/types';

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await api.getTours();
      setTours(data);
    } catch (err) {
      console.error('Turlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTours = tours.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase mb-4">
              Kapadokya Turları
            </h1>
            <p className="text-gray-500 font-medium italic max-w-lg mb-8">
              Bölgenin en özel balon uçuşları, ATV turları ve rehberli gezileri keşfedin.
            </p>
            
            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Tur veya aktivite ara..."
                className="pl-12 h-14 rounded-2xl border-gray-200 text-lg font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10">
                <Filter className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 font-black uppercase tracking-widest">Sonuç bulunamadı.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTours.map((tour, idx) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <TourCard tour={tour} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

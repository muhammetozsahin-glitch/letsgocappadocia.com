import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, MapPin, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
interface TripBookingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (details: any) => void;
  tourName: string;
  price: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────
export function TripBookingPanel({
  isOpen, onClose, onBook, tourName, price,
}: TripBookingPanelProps) {
  const [date, setDate] = useState<string>('');
  const [guests, setGuests] = useState<number>(1);

  const handleBook = useCallback(() => {
    onBook({ date, guests });
    onClose();
  }, [date, guests, onBook, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                Tur Rezervasyonu
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {tourName}
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tarih</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Katılımcı Sayısı</label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-400">Toplam</span>
                <span className="text-lg font-black text-orange-600">{price}</span>
              </div>
              <Button
                onClick={handleBook}
                disabled={!date}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 px-6 font-bold text-sm shadow-lg shadow-orange-600/20"
              >
                Rezervasyon Yap
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

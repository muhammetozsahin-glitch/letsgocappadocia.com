import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface TravelerInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const TravelerInput = memo(({ value, onChange }: TravelerInputProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-6 border-2 border-gray-50 dark:border-white/5 rounded-2xl bg-gray-50/50 dark:bg-white/5 gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">Kişi Sayısı</p>
          <p className="text-sm text-gray-400 font-medium italic">{value} Yetişkin Gezgin</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6 bg-white dark:bg-black/20 p-2 rounded-xl shadow-sm border-2 border-gray-50 dark:border-white/5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-primary hover:text-white transition-luxury disabled:opacity-20"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <motion.span 
          key={value}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-black w-8 text-center tracking-tighter"
        >
          {value}
        </motion.span>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-primary hover:text-white transition-luxury disabled:opacity-20"
          onClick={() => onChange(Math.min(15, value + 1))}
          disabled={value >= 15}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

TravelerInput.displayName = 'TravelerInput';
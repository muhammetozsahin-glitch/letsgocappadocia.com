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
    <div className="relative overflow-hidden rounded-[30px] border border-[#eee6fb] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,239,255,0.94))] p-6 shadow-[0_18px_40px_rgba(109,69,221,0.08)] dark:border-white/10 dark:bg-white/5">
      <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-[#eadbff] blur-3xl" />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#8b67f0] to-[#6d45dd] text-white shadow-[0_16px_32px_rgba(109,69,221,0.24)]">
          <Users className="h-6 w-6" />
        </div>
        <div>
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#7d55eb] shadow-sm dark:bg-white/10 dark:text-white">Grup Boyutu</span>
            <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#2c2350] dark:text-white">{value} kişilik ekip</p>
            <p className="mt-1 text-sm text-[#7e79a7] dark:text-muted-foreground">Otel, transfer ve aktivite kapasitesi buna göre dengelenir.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-[24px] border border-white/80 bg-white/95 p-2 shadow-[0_16px_28px_rgba(109,69,221,0.10)] dark:border-white/10 dark:bg-black/20">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-[18px] bg-[#f6f0ff] text-[#7d55eb] hover:bg-[#7d55eb] hover:text-white disabled:opacity-20 dark:bg-white/10 dark:text-white"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <motion.span 
          key={value}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 text-center text-3xl font-black tracking-[-0.06em] text-[#2c2350] dark:text-white"
        >
          {value}
        </motion.span>
        
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-[18px] bg-[#f6f0ff] text-[#7d55eb] hover:bg-[#7d55eb] hover:text-white disabled:opacity-20 dark:bg-white/10 dark:text-white"
          onClick={() => onChange(Math.min(15, value + 1))}
          disabled={value >= 15}
        >
          <Plus className="h-4 w-4" />
        </Button>
        </div>
      </div>
    </div>
  );
});

TravelerInput.displayName = 'TravelerInput';

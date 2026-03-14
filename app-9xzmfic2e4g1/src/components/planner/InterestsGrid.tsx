import { memo } from 'react';
import { INTEREST_OPTIONS } from '@/constants/planner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface InterestsGridProps {
  selectedInterests: string[];
  onToggle: (id: string) => void;
}

export const InterestsGrid = memo(({ selectedInterests, onToggle }: InterestsGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {INTEREST_OPTIONS.map((interest, index) => {
        const Icon = interest.icon;
        const isSelected = selectedInterests.includes(interest.id);
        
        return (
          <motion.div
            key={interest.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <motion.button
              type="button"
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'group relative flex h-full w-full flex-col items-start overflow-hidden rounded-[28px] border p-5 text-left transition-all duration-300',
                isSelected 
                  ? 'border-[#8b67f0]/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,239,255,0.96))] shadow-[0_20px_42px_rgba(109,69,221,0.16)]'
                  : 'border-[#eee6fb] bg-white/88 shadow-[0_14px_32px_rgba(116,87,174,0.08)] hover:border-[#d9c7ff] hover:bg-[#fcfbff] hover:shadow-[0_18px_38px_rgba(116,87,174,0.12)] dark:border-white/10 dark:bg-white/5'
              )}
              onClick={() => onToggle(interest.id)}
            >
              <div className="pointer-events-none absolute inset-0">
                <div className={cn(
                  'absolute -right-10 -top-8 h-32 w-32 rounded-full blur-3xl transition-opacity duration-300',
                  isSelected ? `bg-gradient-to-br ${interest.gradient} opacity-20` : 'bg-[#f1e9ff] opacity-60'
                )} />
              </div>

              <div className="relative z-10 flex w-full items-start justify-between gap-3">
                <span className={cn(
                  'inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]',
                  isSelected ? 'bg-white text-[#7d55eb] shadow-sm' : 'bg-[#f6f0ff] text-[#8f78cb]'
                )}>
                  İlgi Alanı
                </span>
                {isSelected && <CheckCircle2 className="h-5 w-5 text-[#7d55eb]" />}
              </div>

              <div className={cn(
                'relative z-10 mt-5 flex h-14 w-14 items-center justify-center rounded-[20px] transition-all duration-300 group-hover:scale-105',
                isSelected ? `bg-gradient-to-br ${interest.gradient} text-white shadow-[0_16px_32px_rgba(109,69,221,0.24)]` : 'border border-[#ede5fb] bg-white text-[#9a8fb7] shadow-sm'
              )}>
                <Icon className="h-6 w-6" />
              </div>

              <div className="relative z-10 mt-5 space-y-2">
                <span className={cn('block text-sm font-black uppercase tracking-[0.16em]', isSelected ? interest.text : 'text-[#2c2350] dark:text-white')}>
                  {interest.label}
                </span>
                <span className="block text-sm leading-6 text-[#7e79a7] dark:text-muted-foreground">{interest.description}</span>
              </div>

              <div className="relative z-10 mt-5 border-t border-white/70 pt-4 text-xs font-semibold text-[#8d82ab] dark:border-white/10 dark:text-muted-foreground">
                {isSelected ? 'Rotaya dahil edilecek.' : 'İlham veren öneriler için seçin.'}
              </div>
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
});

InterestsGrid.displayName = 'InterestsGrid';

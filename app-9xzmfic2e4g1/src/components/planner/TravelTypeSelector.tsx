import { memo } from 'react';
import { TRAVEL_TYPE_OPTIONS } from '@/constants/planner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface TravelTypeSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export const TravelTypeSelector = memo(({ selectedId, onSelect }: TravelTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {TRAVEL_TYPE_OPTIONS.map((option, index) => {
        const Icon = option.icon;
        const isSelected = selectedId === option.id;

        return (
          <motion.button
            key={option.id}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.35, ease: 'easeOut' }}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(option.id)}
            className={cn(
              'relative group flex min-h-[212px] flex-col items-start justify-between overflow-hidden rounded-[30px] border p-6 text-left transition-all duration-300',
              isSelected
                ? 'border-[#8b67f0]/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,239,255,0.96))] shadow-[0_22px_50px_rgba(109,69,221,0.18)]'
                : 'border-[#eee6fb] bg-white/88 shadow-[0_14px_35px_rgba(116,87,174,0.08)] hover:border-[#d9c7ff] hover:bg-[#fcfbff] hover:shadow-[0_18px_40px_rgba(116,87,174,0.12)] dark:border-white/10 dark:bg-white/5'
            )}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className={cn(
                'absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl transition-opacity duration-300',
                isSelected ? `bg-gradient-to-br ${option.gradient} opacity-20` : 'bg-[#efe5ff] opacity-60'
              )} />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            </div>

            <div className="relative z-10 flex w-full items-start justify-between gap-3">
              <span className={cn(
                'inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]',
                isSelected ? 'bg-white text-[#7d55eb] shadow-sm' : 'bg-[#f6f0ff] text-[#8f78cb]'
              )}>
                Seyahat Tarzı
              </span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-full bg-[#7d55eb] p-1 text-white shadow-[0_10px_24px_rgba(125,85,235,0.32)]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </motion.div>
              )}
            </div>

            <div className="relative z-10 mt-6 flex flex-1 flex-col justify-between gap-6">
              <div className={cn(
                'flex h-16 w-16 items-center justify-center rounded-[22px] transition-all duration-300',
                isSelected
                  ? `bg-gradient-to-br ${option.gradient} text-white shadow-[0_18px_34px_rgba(109,69,221,0.28)]`
                  : 'border border-[#ede5fb] bg-white text-[#9a8fb7] shadow-sm'
              )}>
                <Icon className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <p className={cn(
                  'text-lg font-black uppercase tracking-[0.16em]',
                  isSelected ? option.text : 'text-[#2c2350] dark:text-white'
                )}>
                  {option.label}
                </p>
                <p className="max-w-[20rem] text-sm leading-6 text-[#7e79a7] dark:text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/70 pt-4 text-xs font-semibold text-[#8d82ab] dark:border-white/10 dark:text-muted-foreground">
              <span>Tek seçim</span>
              <span className={cn(
                'transition-colors duration-200',
                isSelected ? option.text : 'text-[#c0b6d8]'
              )}>
                {isSelected ? 'Seçildi' : 'Seçmek için dokun'}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
});

TravelTypeSelector.displayName = 'TravelTypeSelector';

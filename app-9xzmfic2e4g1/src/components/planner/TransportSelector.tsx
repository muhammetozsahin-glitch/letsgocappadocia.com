import { memo } from 'react';
import { TRANSPORT_OPTIONS } from '@/constants/planner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface TransportSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export const TransportSelector = memo(({ selectedId, onSelect }: TransportSelectorProps) => {
  return (
    <div className="grid grid-cols-1 gap-3">
      {TRANSPORT_OPTIONS.map((option, index) => {
        const Icon = option.icon;
        const isSelected = selectedId === option.id;

        return (
          <motion.button
            key={option.id}
            type="button"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.07, duration: 0.25, ease: 'easeOut' }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(option.id)}
            className={cn(
              'relative group flex w-full items-center gap-4 overflow-hidden rounded-[28px] border px-5 py-5 text-left transition-all duration-300',
              isSelected
                ? 'border-[#8b67f0]/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,239,255,0.96))] shadow-[0_20px_42px_rgba(109,69,221,0.16)]'
                : 'border-[#eee6fb] bg-white/88 shadow-[0_14px_32px_rgba(116,87,174,0.08)] hover:border-[#d9c7ff] hover:bg-[#fcfbff] hover:shadow-[0_18px_38px_rgba(116,87,174,0.12)] dark:border-white/10 dark:bg-white/5'
            )}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className={cn(
                'absolute -right-10 top-0 h-32 w-32 rounded-full blur-3xl transition-opacity duration-300',
                isSelected ? `bg-gradient-to-br ${option.gradient} opacity-20` : 'bg-[#efe5ff] opacity-55'
              )} />
            </div>

            <div
              className={cn(
                'relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] transition-all duration-300',
                isSelected ? `bg-gradient-to-br ${option.gradient} text-white shadow-[0_16px_32px_rgba(109,69,221,0.24)]` : 'border border-[#ede5fb] bg-white text-[#9a8fb7] shadow-sm'
              )}
            >
              <Icon className="h-6 w-6" />
            </div>

            <div className="relative z-10 min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-3">
                <span className={cn(
                  'inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em]',
                  isSelected ? 'bg-white text-[#7d55eb] shadow-sm' : 'bg-[#f6f0ff] text-[#8f78cb]'
                )}>
                  Ulaşım Modu
                </span>
              </div>
              <p className={cn('text-sm font-black uppercase tracking-[0.16em]', isSelected ? option.text : 'text-[#2c2350] dark:text-white')}>
                {option.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#7e79a7] dark:text-muted-foreground">{option.description}</p>
            </div>

            <CheckCircle2
              className={cn(
                'relative z-10 h-5 w-5 shrink-0 transition-all duration-200',
                isSelected ? option.text : 'text-[#d2c8e7] opacity-0 group-hover:opacity-100'
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
});

TransportSelector.displayName = 'TransportSelector';

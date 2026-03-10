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
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(option.id)}
            className={cn(
              'relative group flex w-full items-center gap-4 overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-200',
              isSelected
                ? 'border-primary/25 bg-primary/5 shadow-[0_12px_24px_-18px_hsl(var(--primary)/0.45)]'
                : 'border-border bg-card hover:border-primary/20 hover:bg-accent/30'
            )}
          >
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-200',
                isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-semibold', isSelected ? 'text-foreground' : 'text-foreground')}>
                {option.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
            </div>

            <CheckCircle2
              className={cn(
                'h-5 w-5 shrink-0 transition-all duration-200',
                isSelected ? 'text-primary opacity-100' : 'text-muted-foreground/40 opacity-0 group-hover:opacity-70'
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
});

TransportSelector.displayName = 'TransportSelector';

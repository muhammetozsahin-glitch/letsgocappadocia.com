import { memo } from 'react';
import { ACCOMMODATION_OPTIONS } from '@/constants/planner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AccommodationSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export const AccommodationSelector = memo(({ selectedId, onSelect }: AccommodationSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {ACCOMMODATION_OPTIONS.map((option, index) => {
        const Icon = option.icon;
        const isSelected = selectedId === option.id;
        
        return (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-auto p-6 w-full flex flex-col items-center justify-center gap-4 rounded-2xl border-2 transition-luxury group relative overflow-hidden",
                isSelected 
                  ? "border-primary bg-primary/5 text-primary shadow-xl shadow-primary/5" 
                  : "border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-gray-500 hover:border-primary/30 hover:bg-primary/5"
              )}
              onClick={() => onSelect(option.id)}
            >
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center transition-luxury group-hover:scale-105 group-hover:rotate-3 shadow-sm",
                isSelected ? "bg-primary text-white" : "bg-gray-100 dark:bg-white/10 text-gray-400"
              )}>
                <Icon className="h-7 w-7" />
              </div>
              <div className="text-center space-y-0.5">
                <span className="text-base font-black uppercase tracking-widest block">{option.label}</span>
                <span className="text-xs font-medium italic opacity-60">Tercih Edilen Tarz</span>
              </div>
              {isSelected && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
});

AccommodationSelector.displayName = 'AccommodationSelector';
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
    <div className="grid grid-cols-2 gap-4">
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(option.id)}
            className={cn(
              'relative group flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden',
              isSelected
                ? `${option.border} ${option.bg} shadow-md`
                : 'border-gray-100 bg-gray-50/60 hover:border-gray-200 hover:bg-white hover:shadow-sm'
            )}
          >
            {/* Background glow when selected */}
            {isSelected && (
              <motion.div
                layoutId="travel-type-glow"
                className={cn('absolute inset-0 opacity-10 bg-gradient-to-br', option.gradient)}
                initial={false}
                transition={{ duration: 0.3 }}
              />
            )}

            {/* Icon */}
            <div className={cn(
              'relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200',
              isSelected
                ? `bg-gradient-to-br ${option.gradient} text-white shadow-lg`
                : 'bg-white text-gray-400 group-hover:text-gray-500 shadow-sm border border-gray-100'
            )}>
              <Icon className="h-6 w-6" />
            </div>

            {/* Text */}
            <div className="relative space-y-0.5">
              <p className={cn(
                'text-sm font-black uppercase tracking-widest',
                isSelected ? option.text : 'text-gray-700'
              )}>
                {option.label}
              </p>
              <p className={cn(
                'text-xs font-medium',
                isSelected ? 'text-gray-500' : 'text-gray-400'
              )}>
                {option.description}
              </p>
            </div>

            {/* Check badge */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-3 right-3"
              >
                <CheckCircle2 className={cn('h-5 w-5', option.text)} />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
});

TravelTypeSelector.displayName = 'TravelTypeSelector';
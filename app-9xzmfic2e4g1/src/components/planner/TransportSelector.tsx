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
            transition={{ delay: index * 0.07, duration: 0.3, ease: 'easeOut' }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(option.id)}
            className={cn(
              'relative group flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-200 w-full overflow-hidden',
              isSelected
                ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-100'
                : 'border-gray-100 bg-gray-50/60 hover:border-gray-200 hover:bg-white hover:shadow-sm'
            )}
          >
            {/* Animated left accent bar */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-2xl"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: isSelected ? 1 : 0 }}
              transition={{ duration: 0.25 }}
            />

            {/* Icon */}
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0',
              isSelected
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                : 'bg-white text-gray-400 group-hover:text-gray-500 shadow-sm border border-gray-100'
            )}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-black uppercase tracking-wider',
                isSelected ? 'text-orange-700' : 'text-gray-700'
              )}>
                {option.label}
              </p>
              <p className={cn(
                'text-xs font-medium mt-0.5',
                isSelected ? 'text-orange-500' : 'text-gray-400'
              )}>
                {option.description}
              </p>
            </div>

            {/* Check */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 className="h-5 w-5 text-orange-500 shrink-0" />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
});

TransportSelector.displayName = 'TransportSelector';
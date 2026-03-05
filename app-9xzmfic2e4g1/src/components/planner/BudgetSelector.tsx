import { memo } from 'react';
import { BUDGET_OPTIONS } from '@/constants/planner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BudgetSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export const BudgetSelector = memo(({ selectedId, onSelect }: BudgetSelectorProps) => {
  const selectedIndex = BUDGET_OPTIONS.findIndex(o => o.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Visual tier bar */}
      <div className="flex gap-1.5 mb-6">
        {BUDGET_OPTIONS.map((option, i) => (
          <motion.div
            key={option.id}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              i <= selectedIndex ? option.dot : 'bg-gray-100'
            )}
            animate={{ scaleX: i <= selectedIndex ? 1 : 0.6 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {BUDGET_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const isSelected = selectedId === option.id;

          return (
            <motion.button
              key={option.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.3 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(option.id)}
              className={cn(
                'relative group flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-200 w-full overflow-hidden',
                isSelected
                  ? `${option.activeBorder} ${option.activeBg} shadow-md`
                  : 'border-gray-100 bg-gray-50/60 hover:border-gray-200 hover:bg-white hover:shadow-sm'
              )}
            >
              {/* Tier dots */}
              <div className="absolute top-4 right-4 flex gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all duration-200',
                      i < option.tier
                        ? isSelected ? option.dot : 'bg-gray-300'
                        : 'bg-gray-100'
                    )}
                  />
                ))}
              </div>

              {/* Icon */}
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0',
                isSelected
                  ? `${option.activeBg} ${option.color} border-2 ${option.activeBorder}`
                  : 'bg-white text-gray-400 border border-gray-100 shadow-sm'
              )}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pr-12">
                <p className={cn(
                  'text-sm font-black uppercase tracking-wider',
                  isSelected ? option.color : 'text-gray-700'
                )}>
                  {option.label}
                </p>
                <p className="text-xs font-medium text-gray-400 mt-0.5">
                  {option.description}
                </p>
              </div>

              {/* Price range */}
              <div className={cn(
                'absolute bottom-3 right-4 text-[10px] font-bold tracking-wide transition-colors',
                isSelected ? option.color : 'text-gray-300'
              )}>
                {option.range}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

BudgetSelector.displayName = 'BudgetSelector';
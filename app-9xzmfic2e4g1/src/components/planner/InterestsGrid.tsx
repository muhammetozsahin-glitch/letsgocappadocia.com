import { memo } from 'react';
import { INTEREST_OPTIONS } from '@/constants/planner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface InterestsGridProps {
  selectedInterests: string[];
  onToggle: (id: string) => void;
}

export const InterestsGrid = memo(({ selectedInterests, onToggle }: InterestsGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-auto py-6 w-full flex flex-col items-center gap-3 rounded-2xl border-2 transition-luxury group relative overflow-hidden",
                isSelected 
                  ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5" 
                  : "border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-gray-500 hover:border-primary/30 hover:bg-primary/5"
              )}
              onClick={() => onToggle(interest.id)}
            >
              {isSelected && (
                <motion.div 
                  layoutId="selected-bg"
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 -z-10" 
                />
              )}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-luxury group-hover:scale-105",
                isSelected ? "bg-primary text-white" : "bg-gray-100 dark:bg-white/10 text-gray-400 group-hover:text-primary"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">{interest.label}</span>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
});

InterestsGrid.displayName = 'InterestsGrid';
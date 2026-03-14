import { memo } from 'react';
import { BUDGET_OPTIONS } from '@/constants/planner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface BudgetSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export const BudgetSelector = memo(({ selectedId, onSelect }: BudgetSelectorProps) => {
  const selectedIndex = BUDGET_OPTIONS.findIndex(o => o.id === selectedId);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-[#efe6fd] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(249,244,255,0.92))] p-4 shadow-[0_18px_40px_rgba(109,69,221,0.08)] dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#8b67f0] dark:text-primary">Harcama Seviyesi</p>
            <p className="mt-2 text-sm text-[#7e79a7] dark:text-muted-foreground">Günlük aralığı seçin; rota yoğunluğu buna göre dengelenir.</p>
          </div>
          <div className="rounded-full bg-white px-3 py-2 text-sm font-black text-[#6d45dd] shadow-sm dark:bg-white/10 dark:text-white">
            {selectedIndex >= 0 ? `${selectedIndex + 1}/4` : '0/4'}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {BUDGET_OPTIONS.map((option, i) => (
            <motion.div
              key={option.id}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i <= selectedIndex ? `bg-gradient-to-r ${option.gradient}` : 'bg-[#ece4fa] dark:bg-white/10'
              )}
              animate={{ scaleX: i <= selectedIndex ? 1 : 0.72, opacity: i <= selectedIndex ? 1 : 0.7 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          ))}
        </div>
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
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
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
                  'absolute -right-12 top-0 h-32 w-32 rounded-full blur-3xl transition-opacity duration-300',
                  isSelected ? `bg-gradient-to-br ${option.gradient} opacity-20` : 'bg-[#efe5ff] opacity-55'
                )} />
              </div>

              <div className={cn(
                'relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] transition-all duration-300',
                isSelected
                  ? `bg-gradient-to-br ${option.gradient} text-white shadow-[0_16px_32px_rgba(109,69,221,0.24)]`
                  : 'border border-[#ede5fb] bg-white text-[#9a8fb7] shadow-sm'
              )}>
                <Icon className="h-6 w-6" />
              </div>

              <div className="relative z-10 min-w-0 flex-1 pr-8">
                <div className="mb-2 flex items-center gap-3">
                  <span className={cn(
                    'inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em]',
                    isSelected ? 'bg-white text-[#7d55eb] shadow-sm' : 'bg-[#f6f0ff] text-[#8f78cb]'
                  )}>
                    Günlük Plan
                  </span>
                  <span className="text-xs font-semibold text-[#b1a5cd]">Seviye {index + 1}</span>
                </div>
                <p className={cn(
                  'text-sm font-black uppercase tracking-[0.16em]',
                  isSelected ? option.text : 'text-[#2c2350] dark:text-white'
                )}>
                  {option.label}
                </p>
                <p className="mt-2 text-base font-semibold text-[#5f4e8f] dark:text-white/90">
                  {option.description}
                </p>
                <p className="mt-1 text-sm text-[#7e79a7] dark:text-muted-foreground">Konaklama, tempo ve öneri yoğunluğu bu seviyeye göre ayarlanır.</p>
              </div>

              <div className="relative z-10 ml-auto flex shrink-0 items-start">
                <CheckCircle2 className={cn(
                  'h-5 w-5 transition-all duration-200',
                  isSelected ? option.text : 'text-[#d2c8e7] opacity-0 group-hover:opacity-100'
                )} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

BudgetSelector.displayName = 'BudgetSelector';

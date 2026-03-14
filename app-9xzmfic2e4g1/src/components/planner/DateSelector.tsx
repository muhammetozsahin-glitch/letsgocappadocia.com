import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DateSelectorProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DateSelector = memo(({ date, onDateChange, isOpen, onOpenChange }: DateSelectorProps) => {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-[72px] w-full justify-start rounded-2xl border border-[#e8e0f8] bg-white px-5 text-left text-base font-medium text-[#43406b] shadow-[0_12px_32px_rgba(102,82,160,0.08)] transition-all duration-200 hover:bg-white hover:border-[#d9cbfb] hover:shadow-[0_16px_40px_rgba(102,82,160,0.12)] dark:border-white/10 dark:bg-white/5 dark:text-white',
            !date && 'text-[#8f89b2] dark:text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-3 h-5 w-5 shrink-0 text-[#8b67f0] dark:text-primary" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, 'd MMMM yyyy', { locale: tr })} - {format(date.to, 'd MMMM yyyy', { locale: tr })}
              </>
            ) : (
              format(date.from, 'd MMMM yyyy', { locale: tr })
            )
          ) : (
            <span>Tarih seçiniz</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={12}
        className="w-auto rounded-[28px] border border-[#ece4fb] bg-white/96 p-3 shadow-[0_24px_60px_rgba(95,66,171,0.16)] backdrop-blur dark:border-white/10 dark:bg-card"
      >
        <CalendarComponent
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={onDateChange}
          numberOfMonths={2}
          locale={tr}
          className="rounded-2xl"
          classNames={{
            months: 'flex flex-col gap-4 sm:flex-row sm:gap-6',
            month: 'space-y-4',
            caption_label: 'text-sm font-semibold text-[#35335b] dark:text-white',
            head_cell: 'w-9 rounded-md text-[0.8rem] font-medium text-[#9b92bf] dark:text-muted-foreground',
            day: 'h-9 w-9 rounded-xl text-sm font-medium',
            day_today: 'bg-[#f3ebff] text-[#6d45dd] dark:bg-primary/10 dark:text-primary',
            day_range_middle: 'aria-selected:bg-[#efe7ff] aria-selected:text-[#5d36c8] dark:aria-selected:bg-primary/10',
            day_selected: 'bg-[#7c57eb] text-white hover:bg-[#7c57eb] focus:bg-[#7c57eb]',
            day_range_start: 'day-range-start aria-selected:bg-[#7c57eb] aria-selected:text-white',
            day_range_end: 'day-range-end aria-selected:bg-[#7c57eb] aria-selected:text-white',
          }}
          disabled={(day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
        />
      </PopoverContent>
    </Popover>
  );
});

DateSelector.displayName = 'DateSelector';

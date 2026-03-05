import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, X } from 'lucide-react';
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
            "w-full h-12 justify-start text-left font-normal border-gray-200",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "d MMMM yyyy", { locale: tr })} -{" "}
                {format(date.to, "d MMMM yyyy", { locale: tr })}
              </>
            ) : (
              format(date.from, "d MMMM yyyy", { locale: tr })
            )
          ) : (
            <span>Tarih seçiniz</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={onDateChange}
          numberOfMonths={2}
          locale={tr}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />
      </PopoverContent>
    </Popover>
  );
});

DateSelector.displayName = 'DateSelector';

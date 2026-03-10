import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, X } from 'lucide-react';

interface SubmitButtonProps {
  loading: boolean;
  disabled: boolean;
  onCancel: () => void;
}

export const SubmitButton = memo(({ loading, disabled, onCancel }: SubmitButtonProps) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Button disabled className="h-12 w-full rounded-xl text-sm font-semibold">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Rotanız hazırlanıyor...
        </Button>
        <Button type="button" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          İşlemi iptal et
        </Button>
      </div>
    );
  }

  return (
    <Button type="submit" disabled={disabled} className="h-12 w-full rounded-xl text-sm font-semibold">
      <Sparkles className="mr-2 h-4 w-4" />
      Kapadokya rotamı oluştur
    </Button>
  );
});

SubmitButton.displayName = 'SubmitButton';

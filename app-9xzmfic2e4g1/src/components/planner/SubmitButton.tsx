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
        <Button 
          disabled 
          className="w-full h-14 text-lg font-bold bg-orange-600"
        >
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Rotanız Oluşturuluyor...
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-gray-500 hover:text-red-600"
          onClick={onCancel}
        >
          <X className="mr-2 h-4 w-4" />
          İşlemi İptal Et
        </Button>
      </div>
    );
  }

  return (
    <Button 
      type="submit" 
      disabled={disabled}
      className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700 transition-all duration-300 shadow-lg shadow-orange-200"
    >
      <Sparkles className="mr-2 h-5 w-5" />
      Kapadokya Rotamı Oluştur
    </Button>
  );
});

SubmitButton.displayName = 'SubmitButton';

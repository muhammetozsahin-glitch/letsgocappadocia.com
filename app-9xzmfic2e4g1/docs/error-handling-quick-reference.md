# Error Handling Quick Reference

## Hızlı Başlangıç

### 1. Basit API Çağrısı
```typescript
import { parseApiError, logError } from '@/utils/errorHandler';

try {
  const result = await api.someFunction();
  // Başarılı
} catch (err: any) {
  const apiError = parseApiError(err);
  logError(apiError, { context: 'some_operation' });
  toast.error('İşlem başarısız', {
    description: apiError.userMessage,
  });
}
```

### 2. Retry ile API Çağrısı
```typescript
import { retryWithBackoff } from '@/utils/retryWithBackoff';
import { parseApiError } from '@/utils/errorHandler';

const result = await retryWithBackoff(
  async () => api.someFunction(),
  {
    maxRetries: 3,
    initialDelay: 1000,
    onRetry: (attempt) => {
      toast.warning(`Yeniden deneniyor... (${attempt}/3)`);
    },
  }
);
```

### 3. Timeout ile API Çağrısı
```typescript
import { withTimeout } from '@/utils/retryWithBackoff';

const result = await withTimeout(
  api.someFunction(),
  30000, // 30 saniye
  new Error('İşlem 30 saniyede tamamlanamadı')
);
```

### 4. Tam Özellikli Örnek
```typescript
import { useState, useRef } from 'react';
import { parseApiError, logError, logSuccess } from '@/utils/errorHandler';
import { retryWithBackoff, withTimeout } from '@/utils/retryWithBackoff';
import { toast } from 'sonner';

function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const startTimeRef = useRef<number>(0);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    startTimeRef.current = Date.now();

    try {
      const result = await retryWithBackoff(
        async () => {
          return await withTimeout(
            api.someFunction(),
            30000,
            new Error('İşlem 30 saniyede tamamlanamadı')
          );
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt, err) => {
            setRetryCount(attempt);
            const apiError = parseApiError(err);
            toast.warning(`Yeniden deneniyor... (${attempt}/3)`, {
              description: apiError.userMessage,
            });
          },
        }
      );

      // Başarı
      const duration = Date.now() - startTimeRef.current;
      logSuccess('some_operation', duration);
      toast.success('İşlem başarılı!');
      
    } catch (err: any) {
      const apiError = parseApiError(err);
      logError(apiError, { retryCount });
      setError(apiError);
      toast.error('İşlem başarısız', {
        description: apiError.userMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>{error.type}</AlertTitle>
          <AlertDescription>{error.userMessage}</AlertDescription>
        </Alert>
      )}
      
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Yükleniyor...' : 'Gönder'}
      </Button>
    </div>
  );
}
```

## Hata Tipleri ve Mesajları

| Tip | Mesaj | Retry? |
|-----|-------|--------|
| `network` | İnternet bağlantınızı kontrol edin | ✅ |
| `timeout` | İşlem uzun sürdü, lütfen tekrar deneyin | ✅ |
| `validation` | Gönderilen bilgiler geçersiz | ❌ |
| `server` | Sunucu hatası oluştu | ✅ |
| `ratelimit` | Çok fazla istek gönderildi | ❌ |
| `unknown` | Beklenmeyen bir hata oluştu | ✅ |

## Retry Stratejisi

### Exponential Backoff
```
Deneme 1: Hemen
Deneme 2: 1 saniye sonra
Deneme 3: 2 saniye sonra
Deneme 4: 4 saniye sonra
```

### Özelleştirme
```typescript
{
  maxRetries: 3,           // Maksimum deneme sayısı
  initialDelay: 1000,      // İlk bekleme süresi (ms)
  maxDelay: 30000,         // Maksimum bekleme süresi (ms)
  backoffMultiplier: 2,    // Çarpan (exponential)
  shouldRetry: (err) => {  // Retry koşulu
    return isRetryableError(err);
  },
  onRetry: (attempt, err) => {  // Retry callback
    console.log(`Retry ${attempt}`);
  },
}
```

## Loading States

### Basit Loading
```typescript
const [loading, setLoading] = useState(false);

<Button disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Yükleniyor...
    </>
  ) : (
    'Gönder'
  )}
</Button>
```

### Multi-Step Loading
```typescript
const LOADING_STEPS = [
  { label: 'Hazırlanıyor...', progress: 0 },
  { label: 'İşleniyor...', progress: 50 },
  { label: 'Tamamlanıyor...', progress: 90 },
];

const [loadingStep, setLoadingStep] = useState(0);

<Card>
  <p>{LOADING_STEPS[loadingStep]?.label}</p>
  <Progress value={LOADING_STEPS[loadingStep]?.progress} />
</Card>
```

## Form Recovery

### Otomatik Kayıt
```typescript
useEffect(() => {
  const subscription = form.watch((value) => {
    localStorage.setItem('form_draft', JSON.stringify(value));
  });
  return () => subscription.unsubscribe();
}, [form]);
```

### Otomatik Kurtarma
```typescript
useEffect(() => {
  const savedData = localStorage.getItem('form_draft');
  if (savedData) {
    form.reset(JSON.parse(savedData));
    toast.info('Önceki formunuz geri yüklendi');
  }
}, [form]);
```

## İptal (Cancel)

### AbortController
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

// Başlat
abortControllerRef.current = new AbortController();

// İptal et
const handleCancel = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  setLoading(false);
  toast.info('İşlem iptal edildi');
};

// Cleanup
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, []);
```

## Logging

### Error Logging
```typescript
import { logError } from '@/utils/errorHandler';

logError(apiError, {
  operation: 'generate_itinerary',
  userId: user?.id,
  timestamp: Date.now(),
});
```

### Success Logging
```typescript
import { logSuccess } from '@/utils/errorHandler';

const startTime = Date.now();
// ... API call
const duration = Date.now() - startTime;

logSuccess('generate_itinerary', duration, {
  userId: user?.id,
  itemCount: result.length,
});
```

### Error History
```typescript
// LocalStorage'dan error history al
const errorHistory = JSON.parse(
  localStorage.getItem('error_history') || '[]'
);

console.log('Son 10 hata:', errorHistory);
```

## Toast Bildirimleri

### Başarı
```typescript
toast.success('İşlem başarılı!', {
  description: 'Rotanız oluşturuldu',
});
```

### Hata
```typescript
toast.error('İşlem başarısız', {
  description: apiError.userMessage,
});
```

### Uyarı
```typescript
toast.warning('Yeniden deneniyor...', {
  description: `Deneme ${attempt}/3`,
});
```

### Bilgi
```typescript
toast.info('İşlem iptal edildi');
```

## Best Practices

### ✅ Yapılması Gerekenler
- Her API çağrısında `parseApiError()` kullan
- Kullanıcı dostu Türkçe mesajlar göster
- Retry edilebilir hataları otomatik retry et
- Loading states ile kullanıcıyı bilgilendir
- Form verilerini localStorage'a kaydet
- Hataları logla (console + localStorage)
- Success metriklerini kaydet

### ❌ Yapılmaması Gerekenler
- Genel "Bir hata oluştu" mesajları gösterme
- Validation hatalarını retry etme
- Hassas bilgileri loglama
- Stack trace'leri kullanıcıya gösterme
- Sonsuz retry döngüsü oluşturma
- Memory leak'e neden olma (cleanup yap)

## Debugging

### Console'da Error History
```typescript
const history = localStorage.getItem('error_history');
console.log('Error History:', JSON.parse(history || '[]'));
```

### Performance Monitoring
```typescript
const startTime = performance.now();
await api.someFunction();
const duration = performance.now() - startTime;
console.log(`Duration: ${duration}ms`);
```

### Network Tab
- Chrome DevTools → Network
- Filter: XHR/Fetch
- Check: Status, Time, Response

## Test

### Demo Sayfası
```
/error-demo
```

### Manuel Test
1. Network hatası: DevTools → Network → Offline
2. Timeout: API'yi geciktir
3. Validation: Geçersiz veri gönder
4. Server: Backend'i kapat
5. Rate limit: Çok fazla istek gönder

## Kaynaklar

- [Dokümantasyon](/docs/error-handling.md)
- [Implementation Summary](/IMPLEMENTATION_SUMMARY.md)
- [Demo Sayfası](/src/pages/ErrorHandlingDemo.tsx)
- [Error Handler Utils](/src/utils/errorHandler.ts)
- [Retry Utils](/src/utils/retryWithBackoff.ts)

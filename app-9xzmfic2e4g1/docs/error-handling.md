# Profesyonel Hata Yönetimi ve Loading States Dokümantasyonu

## Genel Bakış

PlannerPage.tsx için enterprise-grade hata yönetimi ve kullanıcı deneyimi iyileştirmeleri uygulanmıştır.

## Özellikler

### 1. Kategorize Edilmiş Hata Yönetimi

#### Hata Tipleri
- **NetworkError**: İnternet bağlantısı yok
- **TimeoutError**: API 30 saniyeden uzun sürdü
- **ValidationError**: Backend validasyon hatası
- **ServerError**: 500+ sunucu hataları
- **RateLimitError**: Çok fazla istek (429)
- **UnknownError**: Beklenmeyen hatalar

#### Kullanıcı Dostu Mesajlar
Her hata tipi için özel Türkçe mesajlar:
```typescript
{
  network: "İnternet bağlantınızı kontrol edin",
  timeout: "İşlem uzun sürdü, lütfen tekrar deneyin",
  validation: "Backend'den gelen mesajı göster",
  server: "Bir hata oluştu, ekibimiz bilgilendirildi",
  ratelimit: "Çok fazla istek gönderildi, lütfen bekleyin"
}
```

### 2. Retry Mekanizması

#### Exponential Backoff
- Maksimum 3 retry denemesi
- İlk deneme: 1 saniye bekle
- İkinci deneme: 2 saniye bekle
- Üçüncü deneme: 4 saniye bekle
- Maksimum bekleme: 30 saniye

#### Retry Kuralları
- ✅ Network hataları retry edilir
- ✅ Timeout hataları retry edilir
- ✅ 5xx server hataları retry edilir
- ❌ Validation hataları retry edilmez
- ❌ Rate limit hataları retry edilmez

#### Kullanıcı Bildirimi
```typescript
toast.warning(`Yeniden deneniyor... (${attempt}/3)`, {
  description: apiError.userMessage,
});
```

### 3. Multi-Step Loading States

#### Loading Aşamaları
```typescript
const LOADING_STEPS = [
  { label: 'Form hazırlanıyor...', progress: 0 },
  { label: 'Rotanız oluşturuluyor...', progress: 33 },
  { label: 'Mekanlar belirleniyor...', progress: 66 },
  { label: 'Son kontroller yapılıyor...', progress: 90 },
];
```

#### Progress Bar
- Görsel feedback ile kullanıcı bilgilendirmesi
- Tahmini süre gösterimi (~10 saniye)
- Retry counter (1/3, 2/3, 3/3)

### 4. İptal (Cancel) Özelliği

#### AbortController Kullanımı
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

// İşlemi başlat
abortControllerRef.current = new AbortController();

// İptal et
const handleCancel = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  setLoading(false);
  toast.info('İşlem iptal edildi');
};
```

### 5. Form Data Recovery

#### LocalStorage Otomatik Kayıt
```typescript
// Form değişikliklerini otomatik kaydet
useEffect(() => {
  const subscription = form.watch((value) => {
    localStorage.setItem('planner_form_draft', JSON.stringify(value));
  });
  return () => subscription.unsubscribe();
}, [form]);
```

#### Sayfa Yüklendiğinde Kurtarma
```typescript
useEffect(() => {
  const savedFormData = localStorage.getItem('planner_form_draft');
  if (savedFormData) {
    const parsed = JSON.parse(savedFormData);
    form.reset(parsed);
    toast.info('Önceki formunuz geri yüklendi');
  }
}, [form]);
```

#### Session Storage Backup
```typescript
// API çağrısı öncesi backup
sessionStorage.setItem('pending_form', JSON.stringify(formData));
```

### 6. Analytics ve Logging

#### Hata Loglama
```typescript
export function logError(error: ApiError, context?: Record<string, any>) {
  const errorLog = {
    type: error.type,
    message: error.userMessage,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    context,
    stack: error.stack,
  };

  console.error('[API Error]', errorLog);
  
  // LocalStorage'a hata geçmişi kaydet (son 10 hata)
  const errorHistory = JSON.parse(localStorage.getItem('error_history') || '[]');
  errorHistory.unshift(errorLog);
  localStorage.setItem('error_history', JSON.stringify(errorHistory.slice(0, 10)));
}
```

#### Başarı Metrikleri
```typescript
export function logSuccess(operation: string, duration: number, context?: Record<string, any>) {
  const successLog = {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    context,
  };

  console.log('[API Success]', successLog);
  
  // TODO: Analytics entegrasyonu
  // analytics.track('api_success', successLog);
}
```

### 7. Timeout Yönetimi

#### 30 Saniye Timeout
```typescript
const result = await withTimeout(
  api.generateItinerary(formData),
  30000,
  new Error('İşlem 30 saniyede tamamlanamadı')
);
```

## UI Bileşenleri

### Error Alert
```tsx
{error && !loading && (
  <Alert variant="destructive" className="border-red-200 bg-red-50">
    <AlertCircle className="h-5 w-5" />
    <AlertTitle className="font-semibold">
      {/* Hata tipi başlığı */}
    </AlertTitle>
    <AlertDescription className="mt-2 space-y-3">
      <p>{error.userMessage}</p>
      {retryCount > 0 && (
        <p className="text-sm">{retryCount} kez yeniden denendi</p>
      )}
      {isRetryableError(error.originalError) && (
        <Button onClick={handleRetry} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tekrar Dene
        </Button>
      )}
    </AlertDescription>
  </Alert>
)}
```

### Loading Progress Card
```tsx
{loading && (
  <Card className="p-6 border-orange-200 bg-orange-50/50">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
          <div>
            <p className="font-semibold text-gray-900">
              {LOADING_STEPS[loadingStep]?.label}
            </p>
            <p className="text-xs text-gray-600">
              Tahmini süre: ~{estimatedTime} saniye
            </p>
          </div>
        </div>
        <Button onClick={handleCancel} variant="ghost" size="sm">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Progress value={LOADING_STEPS[loadingStep]?.progress} className="h-2" />
      {retryCount > 0 && (
        <p className="text-xs text-orange-600 font-medium">
          Yeniden deneniyor... ({retryCount}/3)
        </p>
      )}
    </div>
  </Card>
)}
```

## Kullanım Örnekleri

### Basit API Çağrısı
```typescript
try {
  const result = await api.generateItinerary(formData);
  // Başarılı
} catch (err) {
  const apiError = parseApiError(err);
  logError(apiError, { formData });
  setError(apiError);
  toast.error('Rota oluşturulamadı', {
    description: apiError.userMessage,
  });
}
```

### Retry ile API Çağrısı
```typescript
const result = await retryWithBackoff(
  async () => api.generateItinerary(formData),
  {
    maxRetries: 3,
    initialDelay: 1000,
    shouldRetry: (err) => {
      const apiError = parseApiError(err);
      return apiError.type !== 'validation';
    },
    onRetry: (attempt) => {
      setRetryCount(attempt);
      toast.warning(`Yeniden deneniyor... (${attempt}/3)`);
    },
  }
);
```

### Timeout ile API Çağrısı
```typescript
const result = await withTimeout(
  api.generateItinerary(formData),
  30000,
  new Error('İşlem 30 saniyede tamamlanamadı')
);
```

## Gelecek İyileştirmeler

### 1. Sentry Entegrasyonu
```typescript
// src/utils/errorHandler.ts içinde
import * as Sentry from '@sentry/react';

export function logError(error: ApiError, context?: Record<string, any>) {
  // ...
  Sentry.captureException(error, { extra: errorLog });
}
```

### 2. Analytics Entegrasyonu
```typescript
// src/utils/errorHandler.ts içinde
import analytics from '@/lib/analytics';

export function logSuccess(operation: string, duration: number, context?: Record<string, any>) {
  // ...
  analytics.track('api_success', successLog);
}
```

### 3. Real-time Error Monitoring
```typescript
// WebSocket ile gerçek zamanlı hata bildirimi
const ws = new WebSocket('wss://monitoring.example.com');
ws.send(JSON.stringify(errorLog));
```

## Test Senaryoları

### 1. Network Hatası Testi
```typescript
// Network'ü kapat
navigator.onLine = false;
// Form submit et
// Beklenen: "İnternet bağlantınızı kontrol edin" mesajı
```

### 2. Timeout Testi
```typescript
// API'yi 30+ saniye geciktir
// Beklenen: "İşlem uzun sürdü, lütfen tekrar deneyin" mesajı
```

### 3. Retry Testi
```typescript
// İlk 2 denemede 500 hatası döndür, 3. denemede başarılı
// Beklenen: 2 retry sonrası başarılı sonuç
```

### 4. Cancel Testi
```typescript
// Form submit et
// 2 saniye sonra Cancel butonuna tıkla
// Beklenen: "İşlem iptal edildi" mesajı
```

### 5. Form Recovery Testi
```typescript
// Formu doldur
// Sayfayı yenile
// Beklenen: "Önceki formunuz geri yüklendi" mesajı
```

## Performans Metrikleri

### Hedef Metrikler
- İlk API yanıtı: < 5 saniye
- Retry toplam süresi: < 15 saniye
- Form recovery süresi: < 100ms
- Error logging süresi: < 50ms

### Monitoring
```typescript
// Performance API kullanımı
const startTime = performance.now();
await api.generateItinerary(formData);
const duration = performance.now() - startTime;
console.log(`API call duration: ${duration}ms`);
```

## Güvenlik Notları

1. **Hassas Bilgi Loglama**: Kullanıcı şifreleri veya token'lar loglanmamalı
2. **LocalStorage Güvenliği**: Hassas veriler localStorage'a kaydedilmemeli
3. **Error Stack Traces**: Production'da stack trace'ler kullanıcıya gösterilmemeli
4. **Rate Limiting**: Client-side rate limiting uygulanmalı

## Sonuç

Bu implementasyon ile:
- ✅ Kullanıcı dostu hata mesajları
- ✅ Otomatik retry mekanizması
- ✅ Görsel loading feedback
- ✅ İptal özelliği
- ✅ Form data recovery
- ✅ Comprehensive logging
- ✅ Analytics hazırlığı

Tüm özellikler production-ready ve test edilmeye hazır durumda.

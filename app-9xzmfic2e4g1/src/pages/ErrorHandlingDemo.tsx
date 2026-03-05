import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  X,
  Wifi,
  Clock,
  AlertTriangle,
  Server,
  Ban
} from 'lucide-react';
import { ApiError, parseApiError, logError } from '@/utils/errorHandler';
import { retryWithBackoff, isRetryableError } from '@/utils/retryWithBackoff';

/**
 * Hata Yönetimi Test ve Demo Sayfası
 * Bu sayfa error handling sisteminin tüm özelliklerini gösterir
 */
export default function ErrorHandlingDemo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);

  // Simüle edilmiş API çağrıları
  const simulateNetworkError = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Network hatası simülasyonu
      throw new Error('Failed to fetch');
    } catch (err: any) {
      const apiError = parseApiError(err);
      logError(apiError, { test: 'network_error' });
      setError(apiError);
      toast.error('Network Hatası', { description: apiError.userMessage });
    } finally {
      setLoading(false);
    }
  };

  const simulateTimeoutError = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Timeout hatası simülasyonu
      const error: any = new Error('Request timeout');
      error.name = 'AbortError';
      throw error;
    } catch (err: any) {
      const apiError = parseApiError(err);
      logError(apiError, { test: 'timeout_error' });
      setError(apiError);
      toast.error('Timeout Hatası', { description: apiError.userMessage });
    } finally {
      setLoading(false);
    }
  };

  const simulateValidationError = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Validation hatası simülasyonu
      const error: any = new Error('Validation failed');
      error.response = {
        status: 400,
        data: { message: 'Gönderilen bilgiler geçersiz' }
      };
      throw error;
    } catch (err: any) {
      const apiError = parseApiError(err);
      logError(apiError, { test: 'validation_error' });
      setError(apiError);
      toast.error('Validation Hatası', { description: apiError.userMessage });
    } finally {
      setLoading(false);
    }
  };

  const simulateServerError = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Server hatası simülasyonu
      const error: any = new Error('Internal server error');
      error.response = {
        status: 500,
        data: { message: 'Internal server error' }
      };
      throw error;
    } catch (err: any) {
      const apiError = parseApiError(err);
      logError(apiError, { test: 'server_error' });
      setError(apiError);
      toast.error('Server Hatası', { description: apiError.userMessage });
    } finally {
      setLoading(false);
    }
  };

  const simulateRateLimitError = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Rate limit hatası simülasyonu
      const error: any = new Error('Too many requests');
      error.response = {
        status: 429,
        data: { message: 'Too many requests' }
      };
      throw error;
    } catch (err: any) {
      const apiError = parseApiError(err);
      logError(apiError, { test: 'ratelimit_error' });
      setError(apiError);
      toast.error('Rate Limit Hatası', { description: apiError.userMessage });
    } finally {
      setLoading(false);
    }
  };

  const simulateRetrySuccess = async () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
    setProgress(0);

    try {
      let attemptCount = 0;
      
      const result = await retryWithBackoff(
        async () => {
          attemptCount++;
          setProgress(attemptCount * 33);
          
          // İlk 2 denemede hata, 3. denemede başarılı
          if (attemptCount < 3) {
            const error: any = new Error('Temporary error');
            error.response = { status: 500 };
            throw error;
          }
          
          return { success: true };
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

      setProgress(100);
      toast.success('İşlem Başarılı!', {
        description: `${attemptCount} denemede tamamlandı`,
      });
    } catch (err: any) {
      const apiError = parseApiError(err);
      logError(apiError, { test: 'retry_failed' });
      setError(apiError);
      toast.error('Retry Başarısız', { description: apiError.userMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    toast.info('Tekrar deneniyor...');
  };

  const clearError = () => {
    setError(null);
    setRetryCount(0);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Hata Yönetimi Demo
          </h1>
          <p className="text-gray-600">
            Profesyonel error handling ve loading states test arayüzü
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-semibold flex items-center justify-between">
              <span>
                {error.type === 'network' && 'Bağlantı Hatası'}
                {error.type === 'timeout' && 'Zaman Aşımı'}
                {error.type === 'validation' && 'Geçersiz Bilgi'}
                {error.type === 'server' && 'Sunucu Hatası'}
                {error.type === 'ratelimit' && 'Çok Fazla İstek'}
                {error.type === 'unknown' && 'Beklenmeyen Hata'}
              </span>
              <Button
                onClick={clearError}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>{error.userMessage}</p>
              {retryCount > 0 && (
                <p className="text-sm font-medium">
                  {retryCount} kez yeniden denendi
                </p>
              )}
              {error.statusCode && (
                <p className="text-xs">
                  Status Code: {error.statusCode}
                </p>
              )}
              {isRetryableError(error.originalError) && (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tekrar Dene
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading Progress */}
        {loading && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      İşlem devam ediyor...
                    </p>
                    <p className="text-xs text-gray-600">
                      Lütfen bekleyin
                    </p>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                {retryCount > 0 && (
                  <p className="text-xs text-orange-600 font-medium">
                    Yeniden deneniyor... ({retryCount}/3)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Buttons Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Network Error */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Network Error</CardTitle>
              </div>
              <CardDescription>
                İnternet bağlantısı hatası simülasyonu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={simulateNetworkError}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Test Et
              </Button>
            </CardContent>
          </Card>

          {/* Timeout Error */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">Timeout Error</CardTitle>
              </div>
              <CardDescription>
                Zaman aşımı hatası simülasyonu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={simulateTimeoutError}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Test Et
              </Button>
            </CardContent>
          </Card>

          {/* Validation Error */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Validation Error</CardTitle>
              </div>
              <CardDescription>
                Form validasyon hatası simülasyonu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={simulateValidationError}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Test Et
              </Button>
            </CardContent>
          </Card>

          {/* Server Error */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-red-600" />
                <CardTitle className="text-lg">Server Error</CardTitle>
              </div>
              <CardDescription>
                Sunucu hatası (500) simülasyonu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={simulateServerError}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Test Et
              </Button>
            </CardContent>
          </Card>

          {/* Rate Limit Error */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Rate Limit Error</CardTitle>
              </div>
              <CardDescription>
                Çok fazla istek (429) simülasyonu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={simulateRateLimitError}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Test Et
              </Button>
            </CardContent>
          </Card>

          {/* Retry Success */}
          <Card className="hover:shadow-lg transition-shadow border-green-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Retry Success</CardTitle>
              </div>
              <CardDescription>
                3 denemede başarılı olma simülasyonu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={simulateRetrySuccess}
                disabled={loading}
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Test Et
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Özellikler</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Kategorize edilmiş hata tipleri</li>
                <li>✅ Kullanıcı dostu Türkçe mesajlar</li>
                <li>✅ Exponential backoff retry</li>
                <li>✅ Progress bar ile görsel feedback</li>
                <li>✅ Retry counter gösterimi</li>
                <li>✅ Error logging ve analytics</li>
                <li>✅ LocalStorage error history</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retry Kuralları</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Network hataları → Retry edilir</li>
                <li>✅ Timeout hataları → Retry edilir</li>
                <li>✅ 5xx server hataları → Retry edilir</li>
                <li>❌ Validation hataları → Retry edilmez</li>
                <li>❌ Rate limit hataları → Retry edilmez</li>
                <li>⏱️ Maksimum 3 retry denemesi</li>
                <li>⏱️ Exponential backoff: 1s, 2s, 4s</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Error History */}
        <Card>
          <CardHeader>
            <CardTitle>Error History (LocalStorage)</CardTitle>
            <CardDescription>
              Son 10 hata kaydı localStorage'da saklanır
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                const history = localStorage.getItem('error_history');
                if (history) {
                  console.log('Error History:', JSON.parse(history));
                  toast.info('Error history console\'a yazdırıldı');
                } else {
                  toast.info('Henüz hata kaydı yok');
                }
              }}
              variant="outline"
            >
              Console'da Göster
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

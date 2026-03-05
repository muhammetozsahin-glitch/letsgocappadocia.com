/**
 * Özel API Hata Sınıfı
 * API hatalarını kategorize eder ve kullanıcı dostu mesajlar sağlar
 */
export class ApiError extends Error {
  constructor(
    public type: 'network' | 'timeout' | 'validation' | 'server' | 'ratelimit' | 'unknown',
    public userMessage: string,
    public originalError?: any,
    public statusCode?: number
  ) {
    super(userMessage);
    this.name = 'ApiError';
    
    // Stack trace'i koru
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * HTTP hatalarını ApiError'a dönüştürür
 */
export function parseApiError(error: any): ApiError {
  // Network hatası kontrolü
  if (!navigator.onLine) {
    return new ApiError(
      'network',
      'İnternet bağlantınızı kontrol edin',
      error
    );
  }

  // Timeout hatası kontrolü
  if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
    return new ApiError(
      'timeout',
      'İşlem uzun sürdü, lütfen tekrar deneyin',
      error
    );
  }

  // HTTP status code kontrolü
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Rate limit hatası
    if (status === 429) {
      return new ApiError(
        'ratelimit',
        'Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyip tekrar deneyin',
        error,
        status
      );
    }

    // Validation hatası
    if (status === 400 || status === 422) {
      const message = data?.message || data?.error || 'Gönderilen bilgiler geçersiz';
      return new ApiError(
        'validation',
        message,
        error,
        status
      );
    }

    // Server hatası
    if (status >= 500) {
      return new ApiError(
        'server',
        'Sunucu hatası oluştu. Ekibimiz bilgilendirildi, lütfen daha sonra tekrar deneyin',
        error,
        status
      );
    }

    // Diğer HTTP hataları
    return new ApiError(
      'unknown',
      data?.message || 'Bir hata oluştu, lütfen tekrar deneyin',
      error,
      status
    );
  }

  // Supabase hatası kontrolü
  if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return new ApiError(
      'network',
      'İnternet bağlantınızı kontrol edin',
      error
    );
  }

  // Genel hata
  return new ApiError(
    'unknown',
    error.message || 'Beklenmeyen bir hata oluştu',
    error
  );
}

/**
 * Hata loglarını konsola ve analytics'e gönderir
 */
export function logError(error: ApiError, context?: Record<string, any>) {
  const errorLog = {
    type: error.type,
    message: error.userMessage,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    context,
    stack: error.stack,
  };

  // Console'a log
  console.error('[API Error]', errorLog);

  // TODO: Analytics/Sentry entegrasyonu
  // Örnek: Sentry.captureException(error, { extra: errorLog });
  
  // LocalStorage'a hata geçmişi kaydet (son 10 hata)
  try {
    const errorHistory = JSON.parse(localStorage.getItem('error_history') || '[]');
    errorHistory.unshift(errorLog);
    localStorage.setItem('error_history', JSON.stringify(errorHistory.slice(0, 10)));
  } catch (e) {
    // LocalStorage hatası - sessizce geç
  }
}

/**
 * Başarı metriklerini loglar
 */
export function logSuccess(operation: string, duration: number, context?: Record<string, any>) {
  const successLog = {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    context,
  };

  console.log('[API Success]', successLog);

  // TODO: Analytics entegrasyonu
  // Örnek: analytics.track('api_success', successLog);
}

/**
 * Exponential Backoff ile Retry Mekanizması
 */

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: any) => void;
  shouldRetry?: (error: any) => boolean;
}

/**
 * Belirtilen fonksiyonu exponential backoff ile yeniden dener
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxRetries,
    initialDelay,
    maxDelay = 30000, // Maksimum 30 saniye
    backoffMultiplier = 2,
    onRetry,
    shouldRetry = () => true,
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // İlk denemede veya retry'da fonksiyonu çalıştır
      return await fn();
    } catch (error) {
      lastError = error;

      // Son deneme ise hata fırlat
      if (attempt === maxRetries) {
        throw error;
      }

      // Retry yapılıp yapılmayacağını kontrol et
      if (!shouldRetry(error)) {
        throw error;
      }

      // Retry callback'i çağır
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Exponential backoff ile bekle
      await sleep(Math.min(delay, maxDelay));
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Promise tabanlı sleep fonksiyonu
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry yapılabilir hata tiplerini kontrol eder
 */
export function isRetryableError(error: any): boolean {
  // Network hataları retry edilebilir
  if (!navigator.onLine) {
    return true;
  }

  // Timeout hataları retry edilebilir
  if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
    return true;
  }

  // 5xx server hataları retry edilebilir
  if (error.response?.status >= 500) {
    return true;
  }

  // 429 Rate Limit retry edilebilir (ama daha uzun beklemeli)
  if (error.response?.status === 429) {
    return true;
  }

  // 4xx client hataları retry edilmez (validation, auth vb.)
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return false;
  }

  // Diğer hatalar retry edilebilir
  return true;
}

/**
 * AbortController ile timeout ekler
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(timeoutError || new Error(`İşlem ${timeoutMs}ms içinde tamamlanamadı`));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

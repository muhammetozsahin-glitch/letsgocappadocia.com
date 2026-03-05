# Task: Fix Google Maps "For development purposes only" Issue

## Plan
- [x] Investigate current Google Maps implementation
- [x] Check if API key is properly loaded
- [x] Identify root cause of the issue
- [x] Register API key as a secret for user configuration
- [x] Create comprehensive setup documentation
- [x] Provide troubleshooting guide

## Root Cause Analysis
✅ API anahtarı .env dosyasında mevcut: `AIzaSyCLPiqNWwFSUS0X15YvTdHZxrb-2LXoYlw`
✅ Harita komponenti doğru şekilde yapılandırılmış
❌ "For development purposes only" uyarısı şu nedenlerden biri ile oluşur:
  - Faturalama (billing) hesabı bağlanmamış
  - Domain kısıtlamaları mevcut domain'i içermiyor
  - Gerekli API'ler etkinleştirilmemiş (Maps JavaScript API, Places API, Directions API)

## Implemented Solutions
✅ **API Key Secret Registration**
  - `VITE_GOOGLE_MAPS_API_KEY` secret olarak kaydedildi
  - Kullanıcı kendi Google Cloud Console'dan yeni anahtar oluşturabilir

✅ **Comprehensive Documentation**
  - Created: `/docs/google-maps-setup.md`
  - Adım adım kurulum rehberi
  - Faturalama ayarları
  - API kısıtlama yapılandırması
  - Domain restrictions ayarları
  - Sorun giderme rehberi
  - Maliyet optimizasyonu ipuçları
  - Güvenlik en iyi uygulamaları

## User Action Required
Kullanıcının yapması gerekenler:

1. **Google Cloud Console'da:**
   - Yeni bir proje oluştur veya mevcut projeyi kullan
   - Maps JavaScript API, Places API, Directions API'yi etkinleştir
   - Faturalama hesabı bağla (zorunlu)
   - Yeni API anahtarı oluştur
   - API anahtarını kısıtla (domain ve API restrictions)

2. **Uygulamada:**
   - `.env` dosyasındaki `VITE_GOOGLE_MAPS_API_KEY` değerini güncelle
   - Uygulamayı yeniden başlat

3. **Doğrulama:**
   - 5-10 dakika bekle (API kısıtlamalarının yayılması için)
   - Tarayıcıyı yenile (hard refresh)
   - "For development purposes only" yazısının kaybolduğunu kontrol et

## Notes
- Mevcut API anahtarı muhtemelen demo/kısıtlı bir anahtar
- Google Maps API için aylık $200 ücretsiz kullanım kredisi var
- Faturalama zorunlu ancak çoğu küçük-orta ölçekli uygulama için ücretsiz kredi yeterli
- Detaylı rehber: `/docs/google-maps-setup.md`

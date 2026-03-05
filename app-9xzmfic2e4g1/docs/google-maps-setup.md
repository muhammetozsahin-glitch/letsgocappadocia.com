# Google Maps API Kurulum Rehberi

## Sorun: "For development purposes only" Uyarısı

Haritada "For development purposes only" yazısı görünüyorsa, bu Google Maps API anahtarınızın düzgün yapılandırılmadığı anlamına gelir.

## Çözüm Adımları

### 1. Google Cloud Console'a Giriş Yapın
1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin
2. Mevcut projenizi seçin veya yeni bir proje oluşturun

### 2. Gerekli API'leri Etkinleştirin
Aşağıdaki API'lerin **mutlaka** etkinleştirilmesi gerekir:

1. **Maps JavaScript API**
   - Navigation menüden: APIs & Services > Library
   - "Maps JavaScript API" arayın
   - "ENABLE" butonuna tıklayın

2. **Places API**
   - "Places API" arayın
   - "ENABLE" butonuna tıklayın

3. **Directions API**
   - "Directions API" arayın
   - "ENABLE" butonuna tıklayın

### 3. Faturalama (Billing) Ayarlarını Yapın

**ÖNEMLİ:** Google Maps API'nin çalışması için faturalama hesabı bağlanması zorunludur.

1. Navigation menüden: Billing > Link a billing account
2. Kredi kartı bilgilerinizi ekleyin
3. Google Maps API için aylık $200 ücretsiz kullanım kredisi verilir
4. Bu kredi çoğu küçük-orta ölçekli uygulama için yeterlidir

**Maliyet Kontrolü:**
- Google Cloud Console > Billing > Budgets & alerts
- Aylık bütçe limiti belirleyin (örn: $50)
- Limit aşıldığında e-posta uyarısı alın

### 4. API Anahtarı Oluşturun veya Güncelleyin

1. Navigation menüden: APIs & Services > Credentials
2. "+ CREATE CREDENTIALS" > "API key" seçin
3. Yeni oluşturulan anahtarı kopyalayın

### 5. API Anahtarını Kısıtlayın (Güvenlik)

**Önemli:** Kısıtlanmamış API anahtarları güvenlik riski oluşturur!

1. Oluşturduğunuz API anahtarının yanındaki "Edit" ikonuna tıklayın
2. **Application restrictions** bölümünde:
   - "HTTP referrers (web sites)" seçin
   - Website restrictions kısmına domain'lerinizi ekleyin:
     ```
     https://yourdomain.com/*
     https://*.yourdomain.com/*
     http://localhost:5173/*
     http://localhost:4173/*
     ```

3. **API restrictions** bölümünde:
   - "Restrict key" seçin
   - Şu API'leri seçin:
     - Maps JavaScript API
     - Places API
     - Directions API

4. "SAVE" butonuna tıklayın

### 6. API Anahtarını Uygulamaya Ekleyin

1. Proje kök dizinindeki `.env` dosyasını açın
2. `VITE_GOOGLE_MAPS_API_KEY` değerini yeni anahtarınızla güncelleyin:
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSy...YourNewKey...
   ```
3. Uygulamayı yeniden başlatın

### 7. Değişikliklerin Yayılmasını Bekleyin

API anahtarı kısıtlamalarını güncelledikten sonra değişikliklerin yayılması **5-10 dakika** sürebilir.

## Doğrulama

Tüm adımları tamamladıktan sonra:
1. Tarayıcınızı yenileyin (hard refresh: Ctrl+Shift+R veya Cmd+Shift+R)
2. Haritanın düzgün yüklendiğini kontrol edin
3. "For development purposes only" yazısının kaybolduğunu doğrulayın

## Sorun Giderme

### Hala "For development purposes only" görünüyor
- API anahtarı kısıtlamalarının yayılması için 10 dakika bekleyin
- Domain kısıtlamalarını kontrol edin (localhost ve production domain'leri eklediğinizden emin olun)
- Tarayıcı cache'ini temizleyin

### "This API project is not authorized to use this API"
- İlgili API'nin (Maps JavaScript API, Places API, Directions API) etkinleştirildiğinden emin olun
- API restrictions kısmında doğru API'lerin seçildiğini kontrol edin

### Harita hiç yüklenmiyor
- Tarayıcı konsolunu açın (F12) ve hata mesajlarını kontrol edin
- API anahtarının doğru kopyalandığından emin olun
- `.env` dosyasında boşluk veya özel karakter olmadığını kontrol edin

## Maliyet Optimizasyonu

### Ücretsiz Kullanım Limitleri (Aylık)
- **Maps JavaScript API**: 28,000 yükleme
- **Places API**: 
  - Text Search: 1,000 istek
  - Place Details: 1,000 istek
  - Place Photos: 1,000 istek
- **Directions API**: 1,000 istek

### Maliyet Azaltma İpuçları
1. **Caching kullanın**: Aynı yerlerin tekrar sorgulanmasını önleyin
2. **Place Photos caching**: Supabase Storage'da fotoğrafları önbelleğe alın (zaten uygulanmış)
3. **Autocomplete yerine Text Search**: Daha az maliyetli
4. **Gereksiz API çağrılarını önleyin**: Debounce ve throttle kullanın

## Güvenlik En İyi Uygulamaları

1. ✅ **API anahtarını mutlaka kısıtlayın** (domain ve API restrictions)
2. ✅ **Faturalama uyarıları ayarlayın** (beklenmedik maliyetleri önlemek için)
3. ✅ **API anahtarını public repository'lere commit etmeyin**
4. ✅ **Production ve development için farklı anahtarlar kullanın**
5. ✅ **Düzenli olarak API kullanım raporlarını kontrol edin**

## Ek Kaynaklar

- [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)

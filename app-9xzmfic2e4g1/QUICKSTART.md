# 🚀 Hızlı Başlangıç - API Anahtarları

## ✅ Google Maps API Anahtarı Yapılandırıldı!

Google Maps API anahtarı başarıyla eklendi. Harita artık çalışmalı!

## 📋 Kalan Adımlar

### 1. ✅ Google Maps API Key - TAMAMLANDI

Google Maps API anahtarı hem `.env` dosyasına hem de Supabase Edge Functions'a eklendi.

**Önemli:** Google Cloud Console'da şu API'lerin etkinleştirildiğinden emin olun:
- ✅ Maps JavaScript API
- ✅ Places API  
- ✅ Directions API

[Google Cloud Console'a Git](https://console.cloud.google.com/)

### 2. OpenAI API Key'i Ekleyin (Zorunlu)

### 2. OpenAI API Key'i Ekleyin (Zorunlu)

Rota oluşturma özelliğinin çalışması için OpenAI API anahtarı gereklidir.

```bash
# Adım 1: OpenAI API Key alın
https://platform.openai.com/api-keys

# Adım 2: Supabase Dashboard'a gidin
https://supabase.com/dashboard/project/refnwlnyknhjydgzhyyz/settings/functions

# Adım 3: Edge Functions > Secrets bölümünde OPENAI_API_KEY'i güncelleyin
# Mevcut placeholder değeri gerçek anahtarınızla değiştirin:
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Uygulamayı Test Edin

Artık uygulama tamamen çalışır durumda! Tarayıcıyı yenileyin ve test edin:

1. ✅ Harita görüntüleniyor mu?
2. ✅ Rota oluşturuluyor mu?
3. ✅ Yerler doğrulanıyor mu?

## ✅ Test Edin

1. Tarayıcıda uygulamayı açın (veya yenileyin)
2. Bir hesap oluşturun
3. "Gezi Planla" sayfasına gidin
4. Tarih ve tercihlerinizi seçin
5. "Rota Oluştur" butonuna tıklayın
6. **Haritanın yüklendiğini görmelisiniz!** 🗺️

## 🆘 Hala Çalışmıyor mu?

### Harita Görünmüyorsa:
- [ ] Tarayıcıyı yenileyip tekrar denediniz mi? (Ctrl+F5)
- [ ] Google Cloud Console'da Maps JavaScript API etkin mi?
- [ ] F12 > Console'da hata var mı?

### Rota Oluşturulmuyor:
- [ ] OpenAI API anahtarını Supabase'e eklediniz mi?
- [ ] OpenAI hesabınızda kredi var mı?

### Tarayıcı Konsolunu Kontrol Edin:
1. F12 tuşuna basın
2. "Console" sekmesine gidin
3. Kırmızı hata mesajları var mı?

## 📞 Yardım

Detaylı kurulum için `SETUP.md` dosyasına bakın.

# Cappadocia AI Travel Planner - Kurulum Rehberi

## 🔑 Gerekli API Anahtarları

Bu uygulama çalışmak için aşağıdaki API anahtarlarına ihtiyaç duyar:

### 1. Google Maps API Key
**Neden gerekli:** Harita görüntüleme, yer doğrulama ve yol tarifi hesaplama için

**Nasıl alınır:**
1. [Google Cloud Console](https://console.cloud.google.com/) adresine gidin
2. Yeni bir proje oluşturun veya mevcut bir projeyi seçin
3. "APIs & Services" > "Library" bölümüne gidin
4. Şu API'leri etkinleştirin:
   - Maps JavaScript API
   - Places API
   - Directions API
5. "APIs & Services" > "Credentials" bölümüne gidin
6. "Create Credentials" > "API Key" seçeneğini tıklayın
7. API anahtarınızı kopyalayın

**Güvenlik (Önemli):**
- API anahtarınızı kısıtlayın (Application restrictions > HTTP referrers)
- Sadece gerekli API'leri etkinleştirin
- Kullanım kotalarını ayarlayın

### 2. OpenAI API Key
**Neden gerekli:** Kişiselleştirilmiş seyahat rotası oluşturma için

**Nasıl alınır:**
1. [OpenAI Platform](https://platform.openai.com/) adresine gidin
2. Hesap oluşturun veya giriş yapın
3. "API Keys" bölümüne gidin
4. "Create new secret key" butonuna tıklayın
5. API anahtarınızı kopyalayın (bir daha gösterilmeyecek!)

## 📝 Kurulum Adımları

### 1. Environment Variables Ayarlama

`.env` dosyasını açın ve aşağıdaki değerleri güncelleyin:

```bash
# Supabase (Otomatik oluşturuldu)
VITE_SUPABASE_URL=https://refnwlnyknhjydgzhyyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps API Key (ZORUNLU - Değiştirin!)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# OpenAI API Key (Edge Function'da kullanılıyor)
# Bu anahtarı Supabase Dashboard'dan eklemeniz gerekiyor
```

### 2. Supabase Edge Function Secrets

OpenAI ve Google Maps API anahtarlarını Supabase Edge Functions'a ekleyin:

**Yöntem 1: Supabase Dashboard (Önerilen)**
1. [Supabase Dashboard](https://supabase.com/dashboard) > Projeniz > Settings > Edge Functions
2. "Secrets" bölümüne gidin
3. Şu secret'ları ekleyin:
   - `OPENAI_API_KEY`: OpenAI API anahtarınız
   - `GOOGLE_MAPS_API_KEY`: Google Maps API anahtarınız

**Yöntem 2: Supabase CLI**
```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set GOOGLE_MAPS_API_KEY=AIza...
```

### 3. Uygulamayı Başlatma

```bash
# Bağımlılıkları yükleyin (eğer yüklenmediyse)
pnpm install

# Geliştirme sunucusunu başlatın
pnpm dev
```

## 🧪 Test Etme

### Harita Testi
1. Bir kullanıcı hesabı oluşturun
2. "Gezi Planla" sayfasına gidin
3. Tarih ve tercihlerinizi seçin
4. "Rota Oluştur" butonuna tıklayın
5. Haritanın yüklendiğini ve işaretçilerin göründüğünü kontrol edin

### Sorun Giderme

**Harita yüklenmiyor:**
- ✅ `.env` dosyasında `VITE_GOOGLE_MAPS_API_KEY` doğru mu?
- ✅ API anahtarı `VITE_` prefix'i ile başlıyor mu?
- ✅ Google Cloud Console'da Maps JavaScript API etkin mi?
- ✅ Tarayıcı konsolunda hata var mı? (F12)

**Rota oluşturulmuyor:**
- ✅ Supabase Edge Function secrets'ları eklenmiş mi?
- ✅ OpenAI API anahtarı geçerli mi?
- ✅ OpenAI hesabınızda kredi var mı?

**Yerler doğrulanmıyor:**
- ✅ Google Places API etkin mi?
- ✅ Edge Function'da GOOGLE_MAPS_API_KEY secret'ı var mı?

## 📚 Ek Kaynaklar

- [Google Maps Platform Dokümantasyonu](https://developers.google.com/maps/documentation)
- [OpenAI API Dokümantasyonu](https://platform.openai.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 💰 Maliyet Tahmini

**Google Maps API:**
- İlk $200 kredi (aylık)
- Maps JavaScript API: $7 / 1000 yükleme
- Places API: $17 / 1000 istek
- Directions API: $5 / 1000 istek

**OpenAI API:**
- GPT-4o-mini: ~$0.15 / 1M input token
- Ortalama rota maliyeti: ~$0.01-0.02

**Toplam:** Küçük ölçekli kullanım için ücretsiz kotalar yeterlidir.

## 🔒 Güvenlik Notları

1. **API anahtarlarını asla Git'e commit etmeyin**
2. **Production'da API kısıtlamaları kullanın**
3. **Kullanım kotalarını izleyin**
4. **Supabase RLS politikalarını kontrol edin**

---

Sorularınız için: [GitHub Issues](https://github.com/your-repo/issues)

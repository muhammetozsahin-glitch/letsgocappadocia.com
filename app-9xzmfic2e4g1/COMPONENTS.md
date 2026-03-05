# Kappadokya AI Travel Planner - Component Documentation

## Premium Navbar ve Global Bileşenler

Bu dokümantasyon, uygulamaya eklenen premium navbar ve global bileşenlerin kullanımını açıklar.

---

## 🎨 Tasarım Sistemi

### Renk Paleti

Uygulama, modern ve premium bir görünüm için aşağıdaki renk paletini kullanır:

**Light Mode:**
- Primary Blue: `#3B82F6` (HSL: 217 91% 60%)
- Primary Dark: `#1E40AF` (HSL: 221 83% 53%)
- Secondary Pink: `#EC4899` (HSL: 328 86% 70%)
- Success Green: `#10B981` (HSL: 142 71% 45%)
- Warning Orange: `#F59E0B` (HSL: 38 92% 50%)
- Error Red: `#EF4444` (HSL: 0 84.2% 60.2%)

**Dark Mode:**
- Otomatik olarak uyumlu koyu tonlar

### Kullanım

Tailwind CSS semantic token'ları kullanın:
```tsx
<div className="bg-primary text-primary-foreground">
  <p className="text-muted-foreground">Açıklama metni</p>
</div>
```

---

## 📦 Bileşenler

### 1. Navbar

Premium, responsive navbar bileşeni.

**Özellikler:**
- ✅ Sticky pozisyon (scroll'da sabit kalır)
- ✅ Arama modalı
- ✅ Tema değiştirici (light/dark)
- ✅ Bildirimler dropdown'u (giriş yapılmışsa)
- ✅ Kullanıcı menüsü dropdown'u
- ✅ Mobil hamburger menü
- ✅ Scroll efekti (shadow animasyonu)

**Kullanım:**
```tsx
import { Navbar } from '@/components/layout/Navbar';

function App() {
  return (
    <>
      <Navbar />
      {/* Sayfa içeriği */}
    </>
  );
}
```

**Not:** Navbar artık `App.tsx` içinde global olarak kullanılıyor, sayfalarda tekrar eklemeye gerek yok.

---

### 2. SearchModal

Arama modalı bileşeni.

**Özellikler:**
- ✅ Gerçek zamanlı arama
- ✅ Son aramalar
- ✅ Kategori bazlı sonuçlar (Mekan, Rota, Blog)
- ✅ Klavye navigasyonu (Escape ile kapatma)

**Kullanım:**
```tsx
import { SearchModal } from '@/components/layout/SearchModal';

const [searchOpen, setSearchOpen] = useState(false);

<SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
```

---

### 3. NotificationsDropdown

Bildirimler dropdown bileşeni.

**Özellikler:**
- ✅ Okunmamış bildirim sayısı badge'i
- ✅ Bildirim tipleri (success, info, warning)
- ✅ Scroll edilebilir liste
- ✅ Tümünü gör linki

**Kullanım:**
```tsx
import { NotificationsDropdown } from '@/components/layout/NotificationsDropdown';

<NotificationsDropdown />
```

---

### 4. ThemeToggle

Tema değiştirici bileşeni.

**Özellikler:**
- ✅ Light/Dark mode geçişi
- ✅ LocalStorage'da tercih kaydı
- ✅ Sistem teması desteği

**Kullanım:**
```tsx
import { ThemeToggle } from '@/components/layout/ThemeToggle';

<ThemeToggle />
```

---

### 5. MobileMenu

Mobil hamburger menü bileşeni.

**Özellikler:**
- ✅ Sheet (yan panel) kullanımı
- ✅ Kullanıcı bilgileri (giriş yapılmışsa)
- ✅ Tüm navigasyon linkleri
- ✅ Giriş/Kayıt butonları (giriş yapılmamışsa)
- ✅ Smooth animasyonlar

**Kullanım:**
```tsx
import { MobileMenu } from '@/components/layout/MobileMenu';

<MobileMenu />
```

---

### 6. PageHeader

Sayfa başlığı bileşeni.

**Özellikler:**
- ✅ Breadcrumb desteği
- ✅ Başlık ve açıklama
- ✅ Aksiyon butonları alanı

**Kullanım:**
```tsx
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

<PageHeader
  title="Gezilerim"
  description="Oluşturduğunuz rotaları görüntüleyin ve yönetin"
  breadcrumbs={[
    { label: 'Ana Sayfa', href: '/' },
    { label: 'Hesabım', href: '/account' },
    { label: 'Gezilerim' }
  ]}
  actions={
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Yeni Gezi
    </Button>
  }
/>
```

---

### 7. LoadingSkeleton

Yükleme iskelet bileşeni.

**Özellikler:**
- ✅ Farklı tipler: card, text, avatar, table, list
- ✅ Özelleştirilebilir sayı
- ✅ Pulse animasyonu

**Kullanım:**
```tsx
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

// Kart iskeletleri
<LoadingSkeleton type="card" count={3} />

// Metin iskeletleri
<LoadingSkeleton type="text" count={5} />

// Avatar iskeletleri
<LoadingSkeleton type="avatar" count={1} />

// Tablo iskeletleri
<LoadingSkeleton type="table" count={10} />

// Liste iskeletleri
<LoadingSkeleton type="list" count={5} />
```

---

### 8. EmptyState

Boş durum bileşeni.

**Özellikler:**
- ✅ İkon desteği
- ✅ Başlık ve açıklama
- ✅ Aksiyon butonu
- ✅ Opsiyonel görsel

**Kullanım:**
```tsx
import { EmptyState } from '@/components/common/EmptyState';
import { Luggage } from 'lucide-react';

<EmptyState
  icon={Luggage}
  title="Henüz gezi yok"
  description="İlk Kapadokya rotanızı oluşturun ve keşfe başlayın"
  action={{
    label: 'Gezi Oluştur',
    onClick: () => navigate('/planner')
  }}
/>
```

---

### 9. ErrorBoundary

Hata yakalama bileşeni.

**Özellikler:**
- ✅ React hata yakalama
- ✅ Kullanıcı dostu hata mesajı
- ✅ Geliştirme modunda detaylı hata bilgisi
- ✅ Sayfa yenileme ve ana sayfa butonları

**Kullanım:**
```tsx
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Not:** ErrorBoundary artık `App.tsx` içinde global olarak kullanılıyor.

---

## 🎯 Kullanım Örnekleri

### Tam Sayfa Örneği

```tsx
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Plus, Luggage } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TripsPage() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    // Veri yükleme
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    // API çağrısı
    setLoading(false);
  };

  return (
    <div className="container py-8">
      <PageHeader
        title="Gezilerim"
        description="Kapadokya rotalarınızı yönetin"
        breadcrumbs={[
          { label: 'Ana Sayfa', href: '/' },
          { label: 'Gezilerim' }
        ]}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Gezi
          </Button>
        }
      />

      {loading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Luggage}
          title="Henüz gezi yok"
          description="İlk rotanızı oluşturun"
          action={{
            label: 'Gezi Oluştur',
            onClick: () => navigate('/planner')
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 Stil Kuralları

### CSS Sınıfları

Özel CSS sınıfları `src/index.css` içinde tanımlanmıştır:

```css
/* Navbar shadow */
.navbar-shadow {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

/* Smooth transitions */
.transition-smooth {
  transition: all 200ms ease;
}

/* Backdrop blur */
.backdrop-blur-navbar {
  backdrop-filter: blur(12px);
}

/* Notification badge */
.notification-badge {
  /* Bildirim sayısı badge stili */
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 📱 Responsive Davranış

### Breakpoint'ler

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### Navbar Davranışı

**Desktop (>1024px):**
- Tam navbar görünür
- Orta navigasyon linkleri görünür
- Kullanıcı menüsü dropdown
- Hamburger menü gizli

**Tablet (640px-1024px):**
- Logo küçülür
- Orta navigasyon gizli
- Hamburger menü görünür
- Sağ kısım: İkonlar + kullanıcı menüsü

**Mobile (<640px):**
- Tam hamburger menü
- Sadece logo + ikonlar (arama, menü)
- Orta navigasyon gizli
- Kullanıcı menüsü dropdown gizli

---

## 🔧 Özelleştirme

### Renkleri Değiştirme

`src/index.css` dosyasında CSS değişkenlerini düzenleyin:

```css
:root {
  --primary: 217 91% 60%;  /* Mavi */
  --secondary: 328 86% 70%; /* Pembe */
  /* ... diğer renkler */
}
```

### Navbar Yüksekliğini Değiştirme

```tsx
// Navbar.tsx içinde
<div className="flex h-16 items-center"> {/* h-16 = 64px */}
```

Değiştirdikten sonra, sticky elementlerin `top` değerini de güncelleyin:

```tsx
// ExplorePage.tsx içinde
<div className="sticky top-16"> {/* Navbar yüksekliği kadar */}
```

---

## 🚀 Performans İpuçları

1. **Lazy Loading:** Büyük bileşenleri lazy load edin
2. **Memoization:** React.memo kullanarak gereksiz render'ları önleyin
3. **Debouncing:** Arama inputlarında debounce kullanın
4. **Image Optimization:** Görselleri optimize edin ve lazy load edin

---

## 📚 Ek Kaynaklar

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [React Router Documentation](https://reactrouter.com/)

---

## 🐛 Sorun Giderme

### Navbar görünmüyor
- `App.tsx` içinde `<Navbar />` bileşeninin eklendiğinden emin olun
- Sayfa bileşenlerinde tekrar `<Navbar />` eklemeyin

### Tema değişmiyor
- LocalStorage'ın etkin olduğundan emin olun
- Tarayıcı konsolunda hata olup olmadığını kontrol edin

### Mobil menü açılmıyor
- Sheet bileşeninin doğru import edildiğinden emin olun
- `lg:hidden` sınıfının doğru kullanıldığını kontrol edin

---

## 📝 Lisans

© 2026 Kappadokya AI Travel Planner

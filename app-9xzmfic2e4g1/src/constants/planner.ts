import {
  User, Users, Heart, Compass,
  Car, Bus, Shuffle, Navigation,
  Wallet, CreditCard, Star, Crown,
  Tent, Building2, Home, Castle,
  TreePine, Landmark, Camera,
  Zap, UtensilsCrossed, Wind,
  CheckCircle2, Sparkles, Flame, MapPin,
} from 'lucide-react';

// ─── Travel Types ─────────────────────────────────────────────────────────────
export const TRAVEL_TYPE_OPTIONS = [
  {
    id: 'solo',
    label: 'Yalnız',
    description: 'Özgür, bağımsız keşif',
    icon: User,
    bg: 'bg-violet-50',
    border: 'border-violet-400',
    text: 'text-violet-600',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'couple',
    label: 'Çift',
    description: 'Romantik kaçamak',
    icon: Heart,
    bg: 'bg-rose-50',
    border: 'border-rose-400',
    text: 'text-rose-600',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: 'family',
    label: 'Aile',
    description: 'Herkese uygun aktiviteler',
    icon: Users,
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'friends',
    label: 'Arkadaşlar',
    description: 'Macera & eğlence dolu',
    icon: Compass,
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    text: 'text-emerald-600',
    gradient: 'from-emerald-500 to-teal-600',
  },
];

// ─── Transport Options ────────────────────────────────────────────────────────
export const TRANSPORT_OPTIONS = [
  {
    id: 'rental',
    label: 'Kiralık Araç',
    description: 'En özgür seçenek, uzak noktalara ulaşım',
    icon: Car,
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-600',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'transfer',
    label: 'Özel Transfer',
    description: 'Konforlu, planlı güzergahlar',
    icon: Navigation,
    bg: 'bg-purple-50',
    border: 'border-purple-400',
    text: 'text-purple-600',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    id: 'shuttle',
    label: 'Servis / Minibüs',
    description: 'Popüler turist güzergahları',
    icon: Bus,
    bg: 'bg-orange-50',
    border: 'border-orange-400',
    text: 'text-orange-600',
    gradient: 'from-orange-500 to-amber-600',
  },
  {
    id: 'mixed',
    label: 'Karma',
    description: 'Esnek kombinasyon',
    icon: Shuffle,
    bg: 'bg-teal-50',
    border: 'border-teal-400',
    text: 'text-teal-600',
    gradient: 'from-teal-500 to-cyan-600',
  },
];

// ─── Budget Options ───────────────────────────────────────────────────────────
export const BUDGET_OPTIONS = [
  {
    id: 'budget',
    label: 'Ekonomik',
    description: '₺500–1.000 / gün',
    icon: Wallet,
    bg: 'bg-green-50',
    border: 'border-green-400',
    text: 'text-green-600',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    id: 'moderate',
    label: 'Orta',
    description: '₺1.000–2.500 / gün',
    icon: CreditCard,
    bg: 'bg-sky-50',
    border: 'border-sky-400',
    text: 'text-sky-600',
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    id: 'comfort',
    label: 'Konforlu',
    description: '₺2.500–5.000 / gün',
    icon: Star,
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-600',
    gradient: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'luxury',
    label: 'Lüks',
    description: '₺5.000+ / gün',
    icon: Crown,
    bg: 'bg-rose-50',
    border: 'border-rose-400',
    text: 'text-rose-600',
    gradient: 'from-rose-500 to-pink-600',
  },
];

// ─── Accommodation Options ────────────────────────────────────────────────────
export const ACCOMMODATION_OPTIONS = [
  {
    id: 'cave',
    label: 'Mağara Otel',
    description: 'Eşsiz Kapadokya deneyimi',
    icon: Castle,
  },
  {
    id: 'center',
    label: 'Merkez Otel',
    description: 'Göreme veya Ürgüp merkezi',
    icon: Building2,
  },
  {
    id: 'boutique',
    label: 'Butik Otel',
    description: 'Küçük, şık tesisler',
    icon: Home,
  },
  {
    id: 'camping',
    label: 'Kamp',
    description: 'Doğayla iç içe',
    icon: Tent,
  },
];

// ─── Interest Options ─────────────────────────────────────────────────────────
export const INTEREST_OPTIONS = [
  {
    id: 'balloon',
    label: 'Balon Turu',
    description: 'Şafakta gökyüzü',
    icon: Wind,
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-600',
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    id: 'nature',
    label: 'Doğa & Yürüyüş',
    description: 'Vadiler ve izler',
    icon: TreePine,
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-600',
    gradient: 'from-emerald-400 to-green-500',
  },
  {
    id: 'history',
    label: 'Tarih & Kültür',
    description: 'Yeraltı şehirleri, kiliseler',
    icon: Landmark,
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-600',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'photography',
    label: 'Fotoğrafçılık',
    description: 'En iyi manzara noktaları',
    icon: Camera,
    bg: 'bg-violet-50',
    border: 'border-violet-300',
    text: 'text-violet-600',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    id: 'adventure',
    label: 'Macera',
    description: 'ATV, atçılık, zipline',
    icon: Zap,
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-600',
    gradient: 'from-orange-400 to-red-500',
  },
  {
    id: 'gastronomy',
    label: 'Gastronomi',
    description: 'Yerel mutfak, şarap tadımı',
    icon: UtensilsCrossed,
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-600',
    gradient: 'from-rose-400 to-pink-500',
  },
];

// ─── Loading Steps ────────────────────────────────────────────────────────────
export const LOADING_STEPS = [
  { label: 'Tercihleriniz analiz ediliyor...', progress: 15, icon: Sparkles },
  { label: 'AI rotanızı oluşturuyor...', progress: 35, icon: Flame },
  { label: 'Google Maps ile doğrulanıyor...', progress: 55, icon: MapPin },
  { label: 'Fotoğraflar ve detaylar yükleniyor...', progress: 75, icon: Camera },
  { label: 'Güzergahlar hesaplanıyor...', progress: 90, icon: Navigation },
  { label: 'Rotanız hazırlanıyor!', progress: 100, icon: CheckCircle2 },
];
import type { Place } from '@/types';

// Mock data for Cappadocia places
export const MOCK_PLACES: Place[] = [
  {
    id: '1',
    name: 'Göreme Açık Hava Müzesi',
    description: 'UNESCO Dünya Mirası listesinde yer alan, kayalara oyulmuş kiliseler ve muhteşem freskleriyle ünlü açık hava müzesi. Bizans döneminden kalma manastır kompleksi.',
    category: 'Müzeler',
    rating: 4.7,
    user_ratings_total: 15234,
    images: [
      'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Göreme, Müze Cd., 50180 Nevşehir',
    phone: '+90 384 271 2167',
    hours: '08:00 - 19:00 (Yaz) / 08:00 - 17:00 (Kış)',
    duration: 120,
    difficulty: 'Kolay',
    distance_from_center: 2,
    best_time: 'Sabah',
    website: 'https://muze.gov.tr',
    reviews: [
      {
        author: 'Ayşe Yılmaz',
        date: '2026-01-15',
        rating: 5,
        text: 'Muhteşem bir deneyim! Fresklerin korunmuşluğu inanılmaz. Mutlaka rehber eşliğinde gezin.',
        avatar: 'https://i.pravatar.cc/150?img=1'
      },
      {
        author: 'Mehmet Kaya',
        date: '2026-01-10',
        rating: 5,
        text: 'Tarihi dokusu ve mimarisi harika. Sabah erken saatlerde gitmek daha iyi.',
        avatar: 'https://i.pravatar.cc/150?img=2'
      },
      {
        author: 'Sarah Johnson',
        date: '2026-01-05',
        rating: 4,
        text: 'Amazing historical site! The frescoes are breathtaking. Can get crowded in the afternoon.',
        avatar: 'https://i.pravatar.cc/150?img=3'
      }
    ]
  },
  {
    id: '2',
    name: 'Uçhisar Kalesi',
    description: 'Kapadokya\'nın en yüksek noktası olan Uçhisar Kalesi, bölgenin tamamına hakim panoramik manzarası ile ünlüdür. Gün batımı için ideal.',
    category: 'Fotoğraf',
    rating: 4.6,
    user_ratings_total: 8932,
    images: [
      'https://images.unsplash.com/photo-1559823243-d86640c49830?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Uçhisar, 50240 Nevşehir',
    phone: '+90 384 219 2005',
    hours: '08:00 - 20:00',
    duration: 90,
    difficulty: 'Orta',
    distance_from_center: 5,
    best_time: 'Akşam',
    reviews: [
      {
        author: 'Zeynep Demir',
        date: '2026-01-20',
        rating: 5,
        text: 'Gün batımı manzarası için mükemmel! Tırmanış biraz yorucu ama değer.',
        avatar: 'https://i.pravatar.cc/150?img=4'
      },
      {
        author: 'Ali Öztürk',
        date: '2026-01-18',
        rating: 4,
        text: '360 derece manzara harika. Fotoğraf meraklıları için ideal.',
        avatar: 'https://i.pravatar.cc/150?img=5'
      }
    ]
  },
  {
    id: '3',
    name: 'Derinkuyu Yeraltı Şehri',
    description: 'Dünya\'nın en derin yeraltı şehrlerinden biri. 8 kat derinliğinde, binlerce insanı barındırabilen antik yeraltı yerleşimi.',
    category: 'Altı',
    rating: 4.5,
    user_ratings_total: 12456,
    images: [
      'https://images.unsplash.com/photo-1563823243-979969190c10?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Derinkuyu, 50700 Nevşehir',
    phone: '+90 384 381 3194',
    hours: '08:00 - 19:00',
    duration: 90,
    difficulty: 'Orta',
    distance_from_center: 30,
    best_time: 'Her Zaman',
    reviews: [
      {
        author: 'Can Arslan',
        date: '2026-01-22',
        rating: 5,
        text: 'İnanılmaz bir mühendislik harikası! Dar geçitler olduğu için kapalı alan fobisi olanlar dikkat etmeli.',
        avatar: 'https://i.pravatar.cc/150?img=6'
      },
      {
        author: 'Emma Wilson',
        date: '2026-01-19',
        rating: 4,
        text: 'Fascinating underground city. Wear comfortable shoes and bring a light jacket.',
        avatar: 'https://i.pravatar.cc/150?img=7'
      }
    ]
  },
  {
    id: '4',
    name: 'Aşk Vadisi',
    description: 'Eşsiz peri bacaları ve yürüyüş parkurlarıyla ünlü vadi. Doğa fotoğrafçılığı ve trekking için ideal.',
    category: 'Doğa',
    rating: 4.8,
    user_ratings_total: 9876,
    images: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Göreme, 50180 Nevşehir',
    hours: '24 saat açık',
    duration: 150,
    difficulty: 'Orta',
    distance_from_center: 3,
    best_time: 'Sabah',
    reviews: [
      {
        author: 'Deniz Şahin',
        date: '2026-01-25',
        rating: 5,
        text: 'Harika bir yürüyüş deneyimi! Sabah erken saatlerde gitmek en iyisi.',
        avatar: 'https://i.pravatar.cc/150?img=8'
      }
    ]
  },
  {
    id: '5',
    name: 'Sıcak Hava Balonu Turu',
    description: 'Kapadokya\'nın simgesi haline gelen balon turları. Gün doğumunda eşsiz manzara ve unutulmaz deneyim.',
    category: 'Aktiviteler',
    rating: 4.9,
    user_ratings_total: 25678,
    images: [
      'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Göreme, 50180 Nevşehir',
    phone: '+90 384 271 2442',
    hours: 'Gün doğumu (05:00 - 07:00)',
    duration: 60,
    difficulty: 'Kolay',
    distance_from_center: 1,
    best_time: 'Sabah',
    reviews: [
      {
        author: 'Fatma Yıldız',
        date: '2026-02-01',
        rating: 5,
        text: 'Hayatımın en güzel deneyimi! Kesinlikle yapılmalı.',
        avatar: 'https://i.pravatar.cc/150?img=9'
      },
      {
        author: 'Michael Brown',
        date: '2026-01-28',
        rating: 5,
        text: 'Absolutely magical! Worth every penny. Book in advance!',
        avatar: 'https://i.pravatar.cc/150?img=10'
      }
    ]
  },
  {
    id: '6',
    name: 'Avanos Çömlekçilik Atölyesi',
    description: 'Geleneksel Avanos çömlekçiliğini deneyimleyin. Kızılırmak çamuru ile çömlek yapma workshopları.',
    category: 'Aktiviteler',
    rating: 4.4,
    user_ratings_total: 3456,
    images: [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Avanos, 50500 Nevşehir',
    phone: '+90 384 511 4240',
    hours: '09:00 - 18:00',
    duration: 120,
    difficulty: 'Kolay',
    distance_from_center: 8,
    best_time: 'Öğleden Sonra',
    reviews: [
      {
        author: 'Elif Kara',
        date: '2026-01-30',
        rating: 4,
        text: 'Çok eğlenceli bir aktivite! Çocuklar için de harika.',
        avatar: 'https://i.pravatar.cc/150?img=11'
      }
    ]
  },
  {
    id: '7',
    name: 'Ziggy Cafe & Restaurant',
    description: 'Kapadokya mutfağının en iyi örneklerini sunan, mağara restoran. Testi kebabı ve yerel şaraplar.',
    category: 'Yemek',
    rating: 4.6,
    user_ratings_total: 5432,
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Göreme, Adnan Menderes Cd., 50180 Nevşehir',
    phone: '+90 384 271 2107',
    hours: '12:00 - 23:00',
    duration: 90,
    difficulty: 'Kolay',
    distance_from_center: 2,
    best_time: 'Akşam',
    website: 'https://ziggycafe.com',
    reviews: [
      {
        author: 'Ahmet Çelik',
        date: '2026-02-02',
        rating: 5,
        text: 'Testi kebabı muhteşem! Atmosfer de harika.',
        avatar: 'https://i.pravatar.cc/150?img=12'
      },
      {
        author: 'Lisa Anderson',
        date: '2026-01-29',
        rating: 4,
        text: 'Great food and ambiance. Try the local wine!',
        avatar: 'https://i.pravatar.cc/150?img=13'
      }
    ]
  },
  {
    id: '8',
    name: 'Kaymaklı Yeraltı Şehri',
    description: 'Derinkuyu\'ya alternatif, daha geniş koridorlu yeraltı şehri. 4 kat ziyarete açık.',
    category: 'Altı',
    rating: 4.4,
    user_ratings_total: 8765,
    images: [
      'https://images.unsplash.com/photo-1563823243-979969190c10?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Kaymaklı, 50760 Nevşehir',
    phone: '+90 384 218 2500',
    hours: '08:00 - 19:00',
    duration: 75,
    difficulty: 'Orta',
    distance_from_center: 20,
    best_time: 'Her Zaman',
    reviews: [
      {
        author: 'Burak Yılmaz',
        date: '2026-01-27',
        rating: 4,
        text: 'Derinkuyu\'dan daha az kalabalık. Koridorlar daha geniş.',
        avatar: 'https://i.pravatar.cc/150?img=14'
      }
    ]
  },
  {
    id: '9',
    name: 'Paşabağ (Rahipler Vadisi)',
    description: 'Üç başlı peri bacaları ile ünlü vadi. Kısa yürüyüş parkuru ve fotoğraf için ideal.',
    category: 'Doğa',
    rating: 4.7,
    user_ratings_total: 7654,
    images: [
      'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Çavuşin, 50500 Nevşehir',
    hours: '24 saat açık',
    duration: 60,
    difficulty: 'Kolay',
    distance_from_center: 6,
    best_time: 'Öğleden Sonra',
    reviews: [
      {
        author: 'Selin Aydın',
        date: '2026-02-03',
        rating: 5,
        text: 'Peri bacaları muhteşem! Kısa ama etkileyici bir gezi.',
        avatar: 'https://i.pravatar.cc/150?img=15'
      }
    ]
  },
  {
    id: '10',
    name: 'ATV Safari Turu',
    description: 'Kapadokya vadilerinde ATV ile macera dolu tur. Gün batımı turları popüler.',
    category: 'Aktiviteler',
    rating: 4.5,
    user_ratings_total: 6543,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Göreme, 50180 Nevşehir',
    phone: '+90 384 271 2525',
    hours: '09:00 - 19:00',
    duration: 120,
    difficulty: 'Orta',
    distance_from_center: 2,
    best_time: 'Akşam',
    reviews: [
      {
        author: 'Murat Koç',
        date: '2026-02-01',
        rating: 5,
        text: 'Çok eğlenceli! Gün batımı turunu seçin mutlaka.',
        avatar: 'https://i.pravatar.cc/150?img=16'
      }
    ]
  },
  {
    id: '11',
    name: 'Zelve Açık Hava Müzesi',
    description: 'Göreme\'ye alternatif, daha az kalabalık açık hava müzesi. Üç vadi ve manastır kompleksi.',
    category: 'Müzeler',
    rating: 4.5,
    user_ratings_total: 4321,
    images: [
      'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Zelve, 50500 Nevşehir',
    phone: '+90 384 271 2167',
    hours: '08:00 - 19:00',
    duration: 120,
    difficulty: 'Orta',
    distance_from_center: 7,
    best_time: 'Sabah',
    reviews: [
      {
        author: 'Aylin Şen',
        date: '2026-01-26',
        rating: 4,
        text: 'Göreme kadar kalabalık değil. Daha otantik.',
        avatar: 'https://i.pravatar.cc/150?img=17'
      }
    ]
  },
  {
    id: '12',
    name: 'Kızılçukur Vadisi',
    description: 'Kırmızı kayalıkları ve gün batımı manzarasıyla ünlü yürüyüş vadisi.',
    category: 'Doğa',
    rating: 4.8,
    user_ratings_total: 5678,
    images: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=1200'
    ],
    address: 'Ortahisar, 50650 Nevşehir',
    hours: '24 saat açık',
    duration: 180,
    difficulty: 'Orta',
    distance_from_center: 4,
    best_time: 'Akşam',
    reviews: [
      {
        author: 'Cem Yıldırım',
        date: '2026-02-04',
        rating: 5,
        text: 'Gün batımı için en iyi yer! Yürüyüş parkuru harika.',
        avatar: 'https://i.pravatar.cc/150?img=18'
      }
    ]
  }
];

export const CATEGORIES = ['Tümü', 'Müzeler', 'Doğa', 'Aktiviteler', 'Yemek', 'Altı', 'Fotoğraf'] as const;

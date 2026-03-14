import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPENAI_API_KEY           = Deno.env.get('OPENAI_API_KEY')
const GOOGLE_MAPS_API_KEY      = Deno.env.get('GOOGLE_MAPS_API_KEY')
const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function normalizePlaceName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[ğĞ]/g,'g').replace(/[üÜ]/g,'u').replace(/[şŞ]/g,'s')
    .replace(/[ıİ]/g,'i').replace(/[öÖ]/g,'o').replace(/[çÇ]/g,'c')
    .replace(/\s+/g,' ')
}

// ─── Preference helpers ───────────────────────────────────────────────────────
function getTravelTypeGuidance(t: string): string {
  const m: Record<string,string> = {
    solo:    'Solo gezgin: esnek ve bağımsız. Yürüyüş, fotoğraf noktaları, yerel kafeler. Grup turundan kaçın.',
    couple:  'Romantik çift: gün batımı manzaraları, mağara restoran, balon turu, şarap tadımı, vadiler.',
    family:  'Aile (çocuklu): sadece çocuk dostu. Uzun yürüyüş yok. Max 4 durak/gün. Açık hava müzeleri, kolay doğa.',
    friends: 'Arkadaş grubu: macera (ATV, at binme), grup turları, canlı restoranlar.',
  }
  return m[t] || ''
}

function getBudgetGuidance(b: string): string {
  const m: Record<string,string> = {
    budget:   'Ekonomik (₺500-1000/gün): ücretsiz/ucuz yerler. Özel tur yok, lüks restoran yok.',
    moderate: 'Orta (₺1000-2500/gün): ücretli turlar ve orta restoran karışımı.',
    comfort:  'Konforlu (₺2500-5000/gün): özel rehber, mağara otel ziyareti, gün batımı yemeği.',
    luxury:   'Lüks (₺5000+/gün): özel balon, VIP mağara restoran, özel tur, spa, premium noktalar.',
  }
  return m[b] || ''
}

function getTransportGuidance(t: string): string {
  const m: Record<string,string> = {
    rental:   'Kiralık araç: uzak lokasyonlar erişilebilir. İhlara, Soğanlı dahil.',
    transfer: 'Özel transfer: konforlu. Günlük rotaları güzergaha göre grupla.',
    shuttle:  'Servis/minibüs: Göreme, Ürgüp, Avanos odaklı popüler güzergah.',
    mixed:    'Karma: erişilebilir ve off-beat karışımı.',
  }
  return m[t] || ''
}

function getInterestGuidance(interests: string[]): string {
  const m: Record<string,string> = {
    balloon:     'ZORUNLU: Gün 1 veya 2\'de şafak balonu (05:30). agency_service ekle.',
    nature:      'Vadilere öncelik ver: Güvercinlik, Aşk Vadisi, Kızıl Vadi, İhlara.',
    history:     'Yeraltı şehirleri (Derinkuyu, Kaymaklı), kaya kiliseler, Selime Manastırı.',
    photography: 'Fotoğraf noktaları: Uçhisar Kalesi, Rose Valley gün batımı, Paşabağ.',
    adventure:   'ATV turu, at binme, yürüyüş, zipline.',
    gastronomy:  'Avanos çömlek atölyesi, Ürgüp şarap tadımı, testi kebabı.',
  }
  return interests.map(i => m[i] || '').filter(Boolean).join(' ')
}

function getDailyPlaceCount(budget: string, travelType: string): number {
  if (travelType === 'family') return 3
  if (budget === 'luxury') return 3
  if (budget === 'budget') return 5
  return 4
}

// ─── TÜRKÇE Mock (AI yoksa) ───────────────────────────────────────────────────
function generateMockItinerary(
  startDate: string, endDate: string,
  interests: string[], travelType: string,
  budget: string, _transport: string,
  agencyTours: any[], agencyBalloons: any[]
) {
  const numDays = Math.min(
    Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1,
    14
  )

  // Türkçe yer havuzu
  const pools: Record<string, { place_name:string; category:string; duration:number; desc:string }[]> = {
    nature: [
      { place_name:'Güvercinlik Vadisi',     category:'nature',   duration:90,  desc:'Kaya yüzeylerindeki güvercin yuvalarıyla ünlü büyüleyici vadi.' },
      { place_name:'Aşk Vadisi',             category:'nature',   duration:60,  desc:'Ünik kaya oluşumlarıyla fotoğrafçıların gözdesi.' },
      { place_name:'Kızıl Vadi',             category:'nature',   duration:90,  desc:'Gün batımında kızıla boyanan eşsiz vadi.' },
      { place_name:'Devrent Vadisi',         category:'nature',   duration:45,  desc:'Hayvan silüetlerini andıran volkanik kayalar.' },
      { place_name:'İhlara Vadisi',          category:'nature',   duration:180, desc:'14 km uzunlukta nehir kenarı yürüyüş vadisi.' },
      { place_name:'Paşabağ Vadisi',        category:'nature',   duration:60,  desc:'Üç başlı peri bacalarıyla ünlü mantar kayalar.' },
    ],
    history: [
      { place_name:'Kaymaklı Yeraltı Şehri',  category:'history', duration:90,  desc:'4 katı ziyarete açık antik yeraltı şehri.' },
      { place_name:'Derinkuyu Yeraltı Şehri', category:'history', duration:120, desc:'Bölgenin en derin 8 katlı yeraltı şehri.' },
      { place_name:'Selime Manastırı',        category:'history', duration:60,  desc:'Kapadokya\'nın en büyük kaya oyma yapısı.' },
      { place_name:'Çavuşin Köyü',           category:'culture', duration:60,  desc:'Terk edilmiş Rum köyü, kaya kalesi.' },
    ],
    museum: [
      { place_name:'Göreme Açık Hava Müzesi', category:'museum', duration:120, desc:'UNESCO Dünya Mirası. 10. yüzyıl Bizans freskleri.' },
      { place_name:'Zelve Açık Hava Müzesi',  category:'museum', duration:120, desc:'Terk edilmiş mağara köyü ve kiliseler.' },
    ],
    landmark: [
      { place_name:'Uçhisar Kalesi',   category:'landmark', duration:90,  desc:'Bölgenin en yüksek noktası, 360° panorama.' },
      { place_name:'Ortahisar Kalesi', category:'landmark', duration:60,  desc:'Az kalabalık, özgün atmosfer.' },
    ],
    gastronomy: [
      { place_name:'Avanos Çömlek Atölyesi', category:'culture',    duration:60,  desc:'Kızılırmak kilinden geleneksel çömlek yapımı.' },
      { place_name:'Ürgüp Şarap Tadımı',     category:'gastronomy', duration:90,  desc:'Kapadokya\'ya özgü yerel şarap deneyimi.' },
    ],
    luxury: [
      { place_name:'Mağara Restoran Akşam Yemeği', category:'gastronomy', duration:120, desc:'Tarihi mağarada fine dining.' },
      { place_name:'Türk Hamamı',                  category:'wellness',   duration:120, desc:'Geleneksel Osmanlı hamamı deneyimi.' },
    ],
    adventure: [
      { place_name:'ATV Safari Turu',     category:'activity', duration:120, desc:'Vadilerde off-road ATV macerası.' },
      { place_name:'At Binme Turu',       category:'activity', duration:90,  desc:'Güvercinlik Vadisi\'nde at sırtında keşif.' },
      { place_name:'Jeep Safari',         category:'activity', duration:180, desc:'Köyler ve vadilerde 4x4 macerası.' },
    ],
  }

  const priorityPool: typeof pools.nature = []
  if (interests.includes('nature'))      priorityPool.push(...pools.nature)
  if (interests.includes('history'))     priorityPool.push(...pools.history)
  if (interests.includes('photography')) priorityPool.push(...pools.landmark)
  if (interests.includes('gastronomy'))  priorityPool.push(...pools.gastronomy)
  if (interests.includes('adventure'))   priorityPool.push(...pools.adventure)
  if (budget === 'luxury' || budget === 'comfort') priorityPool.push(...pools.luxury)
  priorityPool.push(...pools.museum, ...pools.landmark)

  const usedPlaces = new Set<string>()
  const maxPerDay = getDailyPlaceCount(budget, travelType)
  const days = []

  for (let i = 1; i <= numDays; i++) {
    const dailyItems: any[] = []

    // Balon: Gün 1'de (agency DB'den al, yoksa mock)
    if (i === 1 && interests.includes('balloon')) {
      if (agencyBalloons.length > 0) {
        const b = agencyBalloons[0]
        dailyItems.push({
          place_name: b.name,
          name: b.name,
          category: 'Balon Turu',
          estimated_duration_minutes: b.duration_minutes || 90,
          description: b.description || 'Şafakta Kapadokya üzerinde balon turu.',
          start_time: '05:30',
          end_time: '08:00',
          agency_service: { type: 'balloon', slug: b.slug, price: b.sell_price_adult, currency: b.currency || 'EUR' },
        })
      } else {
        dailyItems.push({
          place_name: 'Sıcak Hava Balonu Turu',
          name: 'Sıcak Hava Balonu Turu',
          category: 'Balon Turu',
          estimated_duration_minutes: budget === 'luxury' ? 90 : 60,
          description: 'Şafakta peri bacaları üzerinde unutulmaz balon turu.',
          start_time: '05:30',
          end_time: '08:00',
        })
      }
    }

    // Tur: agency DB'den al (Kırmızı tur = Gün 2-3, Yeşil tur = Gün 3-4, Mavi tur = Gün 4-5)
    const tourForDay: Record<number, string> = { 2:'red', 3:'green', 4:'blue' }
    const tourCode = tourForDay[i]
    if (tourCode && agencyTours.length > 0) {
      const tourMatch = agencyTours.find((t: any) => t.code === tourCode)
      if (tourMatch) {
        dailyItems.push({
          place_name: tourMatch.name,
          name: tourMatch.name,
          category: 'Tur',
          estimated_duration_minutes: Math.round((tourMatch.duration_hours || 8) * 60),
          description: tourMatch.short_description || `${tourMatch.name} — profesyonel rehber eşliğinde.`,
          start_time: tourMatch.start_time || '09:00',
          end_time: tourMatch.end_time || '17:30',
          agency_service: { type: 'tour', slug: tourMatch.slug, price: tourMatch.group_price_adult, currency: tourMatch.currency || 'EUR' },
        })
      }
    }

    // Kalan slotları doldur
    const available = priorityPool.filter(p => !usedPlaces.has(p.place_name))
    const shuffled = [...available].sort(() => 0.5 - Math.random())
    const slots = maxPerDay - dailyItems.length

    for (let j = 0; j < Math.min(slots, shuffled.length); j++) {
      usedPlaces.add(shuffled[j].place_name)
      dailyItems.push({
        place_name: shuffled[j].place_name,
        name: shuffled[j].place_name,
        category: shuffled[j].category,
        estimated_duration_minutes: shuffled[j].duration,
        description: shuffled[j].desc,
      })
    }

    days.push({ day: i, items: dailyItems })
  }

  return { days }
}

// ─── Zaman dilimi atama ───────────────────────────────────────────────────────
function assignTimesToDay(day: any): any {
  let currentTime = new Date('2026-01-01T09:00:00')
  const itemsWithTime = day.items.map((item: any) => {
    // Agency servisler zaten start_time'a sahip, dokunma
    if (item.start_time) return item

    const category = (item.category || '').toLowerCase()
    const name = (item.place_name || item.name || '').toLowerCase()

    // Gün batımı noktaları → 17:30
    if (/gün batımı|sunset|kızıl vadi|rose valley/.test(name)) {
      return { ...item, start_time: '17:30', end_time: '19:30' }
    }
    // Akşam aktiviteleri → 19:00
    if (/hamam|türk gecesi|akşam yemeği|dinner|restoran/.test(name)) {
      return { ...item, start_time: '19:00', end_time: '21:30' }
    }

    const startTime = currentTime.toTimeString().slice(0, 5)
    currentTime.setMinutes(currentTime.getMinutes() + (item.estimated_duration_minutes || 60))
    const endTime = currentTime.toTimeString().slice(0, 5)
    currentTime.setMinutes(currentTime.getMinutes() + 30) // seyahat tamponu
    return { ...item, start_time: startTime, end_time: endTime }
  })
  return { ...day, items: itemsWithTime }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const {
      startDate, endDate,
      interests = [],
      dailySchedule = 'moderate',
      travelType = 'couple',
      accommodation = 'center',
      transport = 'mixed',
      budget = 'moderate',
      travelers = 2,
    } = await req.json()

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // ── DB'den aktif acenta ürünlerini çek ──────────────────────────────────
    const { data: agencyTours = [] } = await supabase
      .from('tours')
      .select('id, code, name, slug, start_time, end_time, duration_hours, group_price_adult, short_description, currency')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    const { data: agencyBalloons = [] } = await supabase
      .from('balloon_flights')
      .select('id, name, slug, flight_time, duration_minutes, sell_price_adult, description, currency')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // ── Acenta tur özetini prompt'a ekle ────────────────────────────────────
    const agencyToursInfo = agencyTours.length > 0
      ? `\n\n=== ACENTANIN MEVCUT TURLARI (bunları kullan!) ===\n` +
        (agencyTours as any[]).map((t: any) =>
          `- ${t.name} (code: ${t.code}): kalkış ${t.start_time}, ${t.duration_hours} saat, ${t.group_price_adult}€/kişi`
        ).join('\n')
      : ''

    const agencyBalloonInfo = agencyBalloons.length > 0
      ? `\n\n=== ACENTANIN BALON TURLARI ===\n` +
        (agencyBalloons as any[]).map((b: any) =>
          `- ${b.name}: kalkış 05:30, ${b.duration_minutes} dakika, ${b.sell_price_adult}€/kişi`
        ).join('\n')
      : ''

    let itinerary: any

    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'PASTE_YOUR_OPENAI_API_KEY_HERE') {
      try {
        const systemPrompt = `Sen Kapadokya, Türkiye için uzman bir seyahat planlayıcısısın.
Kullanıcı tercihlerine göre kişiselleştirilmiş seyahat planı oluştur.

=== KULLANICI PROFİLİ ===
Seyahat tipi: ${travelType} — ${getTravelTypeGuidance(travelType)}
Bütçe: ${budget} — ${getBudgetGuidance(budget)}
Ulaşım: ${transport} — ${getTransportGuidance(transport)}
Grup büyüklüğü: ${travelers} kişi
Konaklama: ${accommodation}
Tempo: ${dailySchedule}

=== İLGİ ALANLARI ===
${getInterestGuidance(interests)}
${agencyToursInfo}
${agencyBalloonInfo}

=== KURALLAR ===
- Günde max ${getDailyPlaceCount(budget, travelType)} durak
- Tekrar eden yer yok
- Balon TERCİHİ VARSA: Gün 1 veya 2'de, start_time: "05:30"
- Acentanın turları mevcutsa bunları kullan (kod adlarıyla: kırmızı/yeşil/mavi)
- Kırmızı tur + Yeşil tur AYNI GÜNE KONMAZ (toplam 18+ saat)
- Gün batımı ziyaretleri: start_time 17:30 sonrası
- Türk hamamı/Türk gecesi: start_time 19:00 sonrası
- Yalnızca geçerli JSON döndür, açıklama yok

=== YANIT FORMATI ===
{
  "days": [
    {
      "day": 1,
      "items": [
        {
          "place_name": "Yer Adı",
          "category": "museum",
          "estimated_duration_minutes": 120,
          "description": "Açıklama.",
          "start_time": "09:00",
          "end_time": "11:00",
          "agency_service": { "type": "tour", "slug": "kirmizi-tur", "price": 45, "currency": "EUR" }
        }
      ]
    }
  ]
}

Not: agency_service alanı SADECE acentanın tur/balon/aktivite ürünleri için eklenir.`

        const userPrompt = `${startDate} - ${endDate} arası. ${travelers} kişi. İlgiler: ${interests.join(', ')}. Bütçe: ${budget}. Ulaşım: ${transport}. Tip: ${travelType}.`

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            temperature: 0.4,
            response_format: { type: 'json_object' },
          }),
        })

        if (!openaiRes.ok) throw new Error(`OpenAI error: ${openaiRes.statusText}`)
        const openaiData = await openaiRes.json()
        itinerary = JSON.parse(openaiData.choices[0].message.content)
      } catch (err) {
        console.error('OpenAI failed, falling back to mock:', err)
        itinerary = generateMockItinerary(startDate, endDate, interests, travelType, budget, transport, agencyTours as any[], agencyBalloons as any[])
      }
    } else {
      itinerary = generateMockItinerary(startDate, endDate, interests, travelType, budget, transport, agencyTours as any[], agencyBalloons as any[])
    }

    // ── Google Places doğrulaması ─────────────────────────────────────────────
    const verifiedDays = []
    for (const day of itinerary.days) {
      const verifiedItems = []
      for (const item of day.items) {
        // Agency servislerin place_id'si zaten var, doğrulamaya gerek yok
        if (item.agency_service) {
          verifiedItems.push({
            ...item,
            name: item.name || item.place_name,
            place_id: item.place_id || `${item.agency_service.type}__${item.agency_service.slug}`,
            formatted_address: 'Kapadokya, Nevşehir',
            lat: 38.6431,
            lng: 34.8347,
          })
          continue
        }

        const normalizedName = normalizePlaceName(item.place_name || item.name || '')
        const { data: cachedPlace } = await supabase
          .from('places_cache').select('*').eq('place_name_normalized', normalizedName).limit(1).maybeSingle()

        if (cachedPlace) {
          verifiedItems.push({ ...item, name: cachedPlace.name || item.place_name, place_id: cachedPlace.place_id, formatted_address: cachedPlace.formatted_address, lat: cachedPlace.lat, lng: cachedPlace.lng, rating: cachedPlace.rating, photo_reference: cachedPlace.photo_reference })
        } else {
          let placeInfo = null
          if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE') {
            try {
              const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent((item.place_name || item.name) + ' Kapadokya')}&key=${GOOGLE_MAPS_API_KEY}`
              const res = await fetch(searchUrl); const data = await res.json()
              if (data.results?.length > 0) {
                const p = data.results[0]
                placeInfo = { place_id: p.place_id, name: p.name, formatted_address: p.formatted_address, lat: p.geometry.location.lat, lng: p.geometry.location.lng, rating: p.rating || null, photo_reference: p.photos?.[0]?.photo_reference || null }
              }
            } catch (err) { console.error(`Google Places error for ${item.place_name}:`, err) }
          }
          if (placeInfo) {
            await supabase.from('places_cache').insert({ place_name_normalized: normalizedName, ...placeInfo })
            verifiedItems.push({ ...item, name: placeInfo.name || item.place_name, ...placeInfo })
          } else {
            verifiedItems.push({ ...item, name: item.place_name || item.name, unverified: true, lat: 38.6431, lng: 34.8347, formatted_address: 'Kapadokya, Nevşehir' })
          }
        }
      }
      verifiedDays.push({ ...day, items: verifiedItems })
    }

    // ── Saat ataması ──────────────────────────────────────────────────────────
    const finalDays = verifiedDays.map(assignTimesToDay)

    return new Response(JSON.stringify({ days: finalDays, ai_used: !!(OPENAI_API_KEY && OPENAI_API_KEY !== 'PASTE_YOUR_OPENAI_API_KEY_HERE'), ai_error: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
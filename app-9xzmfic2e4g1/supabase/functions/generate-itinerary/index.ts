import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GOOGLE_MAPS_API_KEY       = Deno.env.get('GOOGLE_MAPS_API_KEY')
const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function normalize(name: string) {
  return name.toLowerCase().trim()
    .replace(/[ğĞ]/g,'g').replace(/[üÜ]/g,'u').replace(/[şŞ]/g,'s')
    .replace(/[ıİ]/g,'i').replace(/[öÖ]/g,'o').replace(/[çÇ]/g,'c')
    .replace(/\s+/g,' ')
}

// ─── Türkçe serbest gün yerleri ─────────────────────────────────────────────
const FREE_PLACES = [
  { name:'Uçhisar Kalesi',        cat:'landmark', dur:90,  desc:'Bölgenin en yüksek noktası, 360° panorama.' },
  { name:'Güvercinlik Vadisi',     cat:'nature',   dur:90,  desc:'Kaya yüzeylerindeki güvercin yuvalarıyla ünlü.' },
  { name:'Aşk Vadisi',            cat:'nature',   dur:60,  desc:'Ünik kaya oluşumlarıyla fotoğrafçıların favorisi.' },
  { name:'Kızıl Vadi',            cat:'nature',   dur:90,  desc:'Gün batımında kızıla boyanan eşsiz vadi.' },
  { name:'Paşabağ Vadisi',        cat:'nature',   dur:60,  desc:'Üç başlı mantar kayalar ve derviş evi.' },
  { name:'Göreme Açık Hava Müzesi',cat:'museum',  dur:120, desc:'UNESCO mirası, Bizans kaya kiliseleri.' },
  { name:'Avanos Çömlek Atölyesi', cat:'culture',  dur:60,  desc:'Kızılırmak kilinden geleneksel çömlek.' },
  { name:'Ortahisar Kalesi',       cat:'landmark', dur:60,  desc:'Az turistik, özgün atmosfer.' },
  { name:'Ürgüp Şarap Tadımı',    cat:'gastronomy',dur:90, desc:'Kapadokya\'ya özgü yerel şarap deneyimi.' },
  { name:'Türk Hamamı',           cat:'wellness',  dur:120, desc:'Geleneksel Osmanlı hamamı deneyimi.', time:'19:00' },
  { name:'Türk Gecesi',           cat:'culture',   dur:180, desc:'Sema, halk oyunları, yemekli gösteri.', time:'20:00' },
]

function toHHMM(totalMins: number) {
  const h = Math.floor(totalMins / 60) % 24
  const m = totalMins % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

// ─── Serbest gün planı (tur yokken) ─────────────────────────────────────────
function buildFreeDay(dayNum: number, usedNames: Set<string>, maxItems = 4) {
  const items: any[] = []
  let curMin = 9 * 60
  const available = FREE_PLACES.filter(p => !usedNames.has(p.name) && !p.time)
  const shuffled = [...available].sort(() => Math.random() - 0.5)

  for (const p of shuffled.slice(0, maxItems)) {
    usedNames.add(p.name)
    const end = curMin + p.dur
    items.push({
      name: p.name, place_name: p.name, category: p.cat,
      estimated_duration_minutes: p.dur,
      description: p.desc,
      start_time: toHHMM(curMin), end_time: toHHMM(end),
      lat: 38.6431, lng: 34.8347,
      formatted_address: 'Kapadokya, Nevşehir',
    })
    curMin = end + 30
  }
  return { day: dayNum, day_type: 'free', items }
}

// ─── Google Places doğrulama ─────────────────────────────────────────────────
async function verifyPlace(name: string, supabase: any): Promise<Partial<any>> {
  const norm = normalize(name)
  const { data: cached } = await supabase.from('places_cache').select('*').eq('place_name_normalized', norm).limit(1).maybeSingle()
  if (cached) return { place_id: cached.place_id, name: cached.name, formatted_address: cached.formatted_address, lat: cached.lat, lng: cached.lng, rating: cached.rating, photo_reference: cached.photo_reference }

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return { lat: 38.6431, lng: 34.8347, formatted_address: 'Kapadokya, Nevşehir' }
  }

  try {
    const r = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name + ' Kapadokya')}&key=${GOOGLE_MAPS_API_KEY}`)
    const d = await r.json()
    if (d.results?.[0]) {
      const p = d.results[0]
      const info = { place_id: p.place_id, name: p.name, formatted_address: p.formatted_address, lat: p.geometry.location.lat, lng: p.geometry.location.lng, rating: p.rating || null, photo_reference: p.photos?.[0]?.photo_reference || null }
      await supabase.from('places_cache').insert({ place_name_normalized: norm, ...info })
      return info
    }
  } catch {}
  return { lat: 38.6431, lng: 34.8347, formatted_address: 'Kapadokya, Nevşehir' }
}

// ─── Ana handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()
    const {
      startDate, endDate,
      travelers = 2,
      accommodation = 'center',
      // Yeni: direkt seçilen servisler
      selectedTours = [],    // AssignedTour[]
      selectedBalloon = null, // AssignedBalloon | null
      selectedActivities = [], // Activity[]
    } = body

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const numDays = Math.min(
      Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1,
      14
    )

    const days: any[] = []
    const usedNames = new Set<string>()

    // Turların tur içindeki durak adlarını "kullanıldı" olarak işaretle
    for (const tour of selectedTours) {
      for (const stop of (tour.itinerary || [])) usedNames.add(stop.title)
    }

    // ── Gün planlaması ────────────────────────────────────────────────────
    // Strateji: Gün 1 serbest (varış), orta günlerde balon+turlar, son gün serbest (ayrılış)
    // Turları ve balonu boş günlere dağıt

    let balloonPlaced = false
    let toursToPlace = [...selectedTours]
    const activitiesToPlace = [...selectedActivities]

    for (let d = 1; d <= numDays; d++) {
      // İlk gün: varış (serbest, kısa)
      if (d === 1) {
        const arrivalItems: any[] = []
        // Akşam aktivitesi varsa (Türk Gecesi, Hamam) ilk güne koy
        const eveningActivities = activitiesToPlace.filter(a =>
          /hamam|gece|hamam|turkish|night/i.test(a.name)
        )
        if (eveningActivities.length > 0) {
          const act = eveningActivities[0]
          activitiesToPlace.splice(activitiesToPlace.indexOf(act), 1)
          arrivalItems.push({
            name: act.name, place_name: act.name, category: 'Aktivite',
            estimated_duration_minutes: act.duration_minutes || 120,
            start_time: act.start_time || '20:00',
            end_time: toHHMM((parseInt((act.start_time || '20:00').split(':')[0]) * 60) + (act.duration_minutes || 120)),
            lat: 38.6431, lng: 34.8347, formatted_address: 'Kapadokya, Nevşehir',
            agency_service: { type: 'activity', slug: act.slug, price: act.price_adult, currency: act.currency || 'EUR' },
          })
        }
        days.push({ day: d, day_type: 'free', items: arrivalItems })
        continue
      }

      // Son gün: ayrılış (serbest, kısa)
      if (d === numDays && numDays > 2) {
        days.push({ day: d, day_type: 'free', items: [] })
        continue
      }

      // Balon önce (genellikle 2. gün)
      if (!balloonPlaced && selectedBalloon) {
        balloonPlaced = true
        // Balon günü akşam aktivitesi var mı?
        const eveningAct = activitiesToPlace[0] || null
        const freeItems: any[] = []
        if (eveningAct) {
          activitiesToPlace.shift()
          freeItems.push({
            name: eveningAct.name, place_name: eveningAct.name, category: 'Aktivite',
            estimated_duration_minutes: eveningAct.duration_minutes || 120,
            start_time: eveningAct.start_time || '19:00',
            end_time: toHHMM((parseInt((eveningAct.start_time || '19:00').split(':')[0]) * 60) + (eveningAct.duration_minutes || 120)),
            lat: 38.6431, lng: 34.8347, formatted_address: 'Kapadokya, Nevşehir',
            agency_service: { type: 'activity', slug: eveningAct.slug, price: eveningAct.price_adult, currency: eveningAct.currency || 'EUR' },
          })
        }
        days.push({
          day: d, day_type: 'balloon',
          assigned_balloon: selectedBalloon,
          items: freeItems,
        })
        continue
      }

      // Tur günleri
      if (toursToPlace.length > 0) {
        const tour = toursToPlace.shift()!
        // Bu tur günü için akşam aktivitesi var mı?
        const eveningAct = activitiesToPlace[0] || null
        const freeItems: any[] = []
        if (eveningAct) {
          activitiesToPlace.shift()
          freeItems.push({
            name: eveningAct.name, place_name: eveningAct.name, category: 'Aktivite',
            estimated_duration_minutes: eveningAct.duration_minutes || 120,
            start_time: eveningAct.start_time || '19:00',
            end_time: toHHMM((parseInt((eveningAct.start_time || '19:00').split(':')[0]) * 60) + (eveningAct.duration_minutes || 120)),
            lat: 38.6431, lng: 34.8347, formatted_address: 'Kapadokya, Nevşehir',
            agency_service: { type: 'activity', slug: eveningAct.slug, price: eveningAct.price_adult, currency: eveningAct.currency || 'EUR' },
          })
        }
        days.push({
          day: d, day_type: 'tour',
          assigned_tour: tour,
          items: freeItems,
        })
        continue
      }

      // Kalan aktiviteler için gün
      if (activitiesToPlace.length > 0) {
        const items = activitiesToPlace.splice(0, 2).map(a => ({
          name: a.name, place_name: a.name, category: 'Aktivite',
          estimated_duration_minutes: a.duration_minutes || 120,
          start_time: a.start_time || '10:00',
          end_time: toHHMM((parseInt((a.start_time || '10:00').split(':')[0]) * 60) + (a.duration_minutes || 120)),
          lat: 38.6431, lng: 34.8347, formatted_address: 'Kapadokya, Nevşehir',
          agency_service: { type: 'activity', slug: a.slug, price: a.price_adult, currency: a.currency || 'EUR' },
        }))
        days.push({ day: d, day_type: 'free', items })
        continue
      }

      // Serbest gün
      days.push(buildFreeDay(d, usedNames))
    }

    // ── Serbest günlerin itemlarını Google Places ile doğrula ─────────────
    const verifiedDays = []
    for (const day of days) {
      if (day.assigned_tour || day.assigned_balloon) {
        // Tur/balon günlerinde sadece free items doğrula
        const verifiedItems = await Promise.all(
          day.items.map(async (item: any) => {
            if (item.agency_service) return item
            const geo = await verifyPlace(item.name, supabase)
            return { ...item, ...geo }
          })
        )
        verifiedDays.push({ ...day, items: verifiedItems })
      } else {
        const verifiedItems = await Promise.all(
          day.items.map(async (item: any) => {
            const geo = await verifyPlace(item.name, supabase)
            return { ...item, ...geo }
          })
        )
        verifiedDays.push({ ...day, items: verifiedItems })
      }
    }

    return new Response(
      JSON.stringify({ days: verifiedDays, ai_used: false }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
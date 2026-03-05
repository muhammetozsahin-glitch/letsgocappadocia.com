import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function normalizePlaceName(name: string): string {
  return name
    .toLowerCase().trim()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
    .replace(/İ/g, 'i').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
    .replace(/\s+/g, ' ')
}

// ─── Preference helpers ────────────────────────────────────────────────────────

function getTravelTypeGuidance(travelType: string): string {
  switch (travelType) {
    case 'solo':
      return 'Solo traveler: prioritize flexible, independent activities. Include hiking, photography spots, local cafes. Avoid group-only tours.'
    case 'couple':
      return 'Romantic couple trip: include sunset viewpoints, cave restaurants, hot air balloon, wine tasting, scenic valleys. Prioritize atmosphere and intimacy.'
    case 'family':
      return 'Family with children: only child-friendly activities. Avoid long strenuous hikes. Include interactive museums, easy nature walks, open-air museums. Max 4 stops per day.'
    case 'friends':
      return 'Friend group: include adventure activities (ATV, horse riding), nightlife, group tours, lively restaurants and social experiences.'
    default:
      return ''
  }
}

function getBudgetGuidance(budget: string): string {
  switch (budget) {
    case 'budget':
      return 'Budget traveler (₺500-1000/day): prioritize free or low-cost attractions (valleys, viewpoints, open-air sites). Avoid expensive private tours or luxury restaurants.'
    case 'moderate':
      return 'Moderate budget (₺1000-2500/day): mix of paid and free attractions. Include some paid guided tours and mid-range restaurants.'
    case 'comfort':
      return 'Comfort budget (₺2500-5000/day): include premium experiences like private guided tours, cave hotel visits, sunset dinners. Prioritize quality over quantity.'
    case 'luxury':
      return 'Luxury budget (₺5000+/day): include exclusive experiences: private balloon flight, VIP cave restaurant dinners, private guided tours, spa, premium viewpoints with private transfers.'
    default:
      return ''
  }
}

function getTransportGuidance(transport: string): string {
  switch (transport) {
    case 'rental':
      return 'Has a rental car: can reach remote locations. Include distant valleys (Ihlara, Soganli), off-the-beaten-path spots. No need to cluster locations geographically.'
    case 'transfer':
      return 'Using private transfers: comfortable but planned routes. Group locations by area per day to minimize travel time. Can reach all sites.'
    case 'shuttle':
      return 'Using shuttle/minibus: stick to popular tourist routes. Cluster stops near Göreme, Ürgüp, Avanos. Avoid remote locations not on standard routes.'
    case 'mixed':
      return 'Mixed transport: balance between accessible and remote locations. Include a mix of central and off-the-beaten-path sites.'
    default:
      return ''
  }
}

function getInterestGuidance(interests: string[]): string {
  const map: Record<string, string> = {
    balloon: 'MUST include a hot air balloon flight on Day 1 or 2 at sunrise (05:00-08:00)',
    nature: 'Prioritize valleys, hiking routes (Rose Valley, Red Valley, Pigeon Valley, Ihlara Valley)',
    history: 'Prioritize underground cities (Derinkuyu, Kaymakli), rock churches, Selime Monastery',
    photography: 'Include best photo spots: Uchisar Castle, Rose Valley sunset, Pasabag fairy chimneys, panoramic viewpoints',
    adventure: 'Include ATV tours, horse riding, hiking, zip-lining where available',
    gastronomy: 'Include local pottery workshop in Avanos, traditional restaurants, wine tasting in Ürgüp, local market visits',
  }
  return interests.map(i => map[i] || '').filter(Boolean).join('. ')
}

function getDailyPlaceCount(budget: string, travelType: string): number {
  if (travelType === 'family') return 3
  if (budget === 'luxury') return 3  // fewer but premium
  if (budget === 'budget') return 5  // more self-guided stops
  return 4
}

// ─── Mock itinerary (interest + budget aware) ─────────────────────────────────

function generateMockItinerary(
  startDate: string,
  endDate: string,
  interests: string[],
  travelType: string,
  budget: string,
  transport: string
) {
  const diffDays = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
  ) + 1
  const numDays = Math.min(diffDays, 14)

  // Place pools by category
  const pools: Record<string, { place_name: string; category: string; duration: number; desc: string }[]> = {
    nature: [
      { place_name: 'Rose Valley Sunset Hike', category: 'nature', duration: 120, desc: 'Beautiful valley that turns pink at sunset.' },
      { place_name: 'Pigeon Valley', category: 'nature', duration: 90, desc: 'Valley named after the countless man-made dovecotes.' },
      { place_name: 'Love Valley', category: 'nature', duration: 60, desc: 'Famous for its fairy chimneys.' },
      { place_name: 'Red Valley', category: 'nature', duration: 90, desc: 'Stunning valley with red hues.' },
      { place_name: 'Ihlara Valley', category: 'nature', duration: 180, desc: 'A stunning canyon with a river and rock-cut churches.' },
      { place_name: 'Devrent Valley', category: 'nature', duration: 45, desc: 'Unique rock formations resembling animals.' },
    ],
    history: [
      { place_name: 'Kaymakli Underground City', category: 'history', duration: 90, desc: 'Ancient multi-level underground city.' },
      { place_name: 'Derinkuyu Underground City', category: 'history', duration: 120, desc: 'The deepest underground city in the region.' },
      { place_name: 'Selime Monastery', category: 'history', duration: 60, desc: 'The largest religious structure in Cappadocia.' },
      { place_name: 'Çavuşin Village', category: 'culture', duration: 60, desc: 'An old Greek village with a massive rock castle.' },
    ],
    museum: [
      { place_name: 'Göreme Open Air Museum', category: 'museum', duration: 120, desc: 'UNESCO World Heritage site with rock-cut churches.' },
      { place_name: 'Zelve Open Air Museum', category: 'museum', duration: 120, desc: 'An abandoned cave town with ancient churches.' },
    ],
    landmark: [
      { place_name: 'Uçhisar Castle', category: 'landmark', duration: 90, desc: 'The highest point in Cappadocia with panoramic views.' },
      { place_name: 'Ortahisar Castle', category: 'landmark', duration: 60, desc: 'A massive rock formation used as a fortress.' },
      { place_name: 'Pasabag (Monks Valley)', category: 'nature', duration: 60, desc: 'Famous fairy chimneys with multiple caps.' },
    ],
    gastronomy: [
      { place_name: 'Avanos Pottery Workshop', category: 'culture', duration: 60, desc: 'Traditional pottery making in the Red River town.' },
      { place_name: 'Ürgüp Wine Tasting', category: 'gastronomy', duration: 90, desc: 'Local Cappadocian wine tasting experience.' },
      { place_name: 'Göreme Local Market', category: 'gastronomy', duration: 60, desc: 'Fresh local produce and Turkish delights.' },
    ],
    luxury: [
      { place_name: 'Private Guided Valley Tour', category: 'activity', duration: 180, desc: 'Exclusive private tour of the most scenic valleys.' },
      { place_name: 'Cave Restaurant Dinner', category: 'gastronomy', duration: 120, desc: 'Fine dining in a traditional Cappadocian cave.' },
      { place_name: 'Turkish Bath (Hamam)', category: 'wellness', duration: 120, desc: 'Traditional Ottoman bath experience.' },
    ],
  }

  // Build priority pool based on interests
  const priorityPool: typeof pools.nature = []

  if (interests.includes('nature')) priorityPool.push(...pools.nature)
  if (interests.includes('history')) priorityPool.push(...pools.history)
  if (interests.includes('photography')) priorityPool.push(...pools.landmark)
  if (interests.includes('gastronomy')) priorityPool.push(...pools.gastronomy)
  if (budget === 'luxury' || budget === 'comfort') priorityPool.push(...pools.luxury)

  // Always add museums as fallback
  priorityPool.push(...pools.museum, ...pools.landmark)

  const usedPlaces = new Set<string>()
  const maxPerDay = getDailyPlaceCount(budget, travelType)
  const days = []

  for (let i = 1; i <= numDays; i++) {
    const dailyItems: { place_name: string; category: string; estimated_duration_minutes: number; description: string }[] = []

    // Balloon on day 1 if interest selected
    if (i === 1 && interests.includes('balloon')) {
      dailyItems.push({
        place_name: 'Hot Air Balloon Flight',
        category: 'activity',
        estimated_duration_minutes: budget === 'luxury' ? 90 : 60,
        description: budget === 'luxury'
          ? 'Private luxury sunrise balloon flight over the fairy chimneys.'
          : 'Breathtaking sunrise flight over the fairy chimneys.',
      })
    }

    // Fill remaining slots
    const available = priorityPool.filter(p => !usedPlaces.has(p.place_name))
    const shuffled = [...available].sort(() => 0.5 - Math.random())
    const slots = maxPerDay - dailyItems.length

    for (let j = 0; j < Math.min(slots, shuffled.length); j++) {
      usedPlaces.add(shuffled[j].place_name)
      dailyItems.push({
        place_name: shuffled[j].place_name,
        category: shuffled[j].category,
        estimated_duration_minutes: shuffled[j].duration,
        description: shuffled[j].desc,
      })
    }

    days.push({ day: i, items: dailyItems })
  }

  return { days }
}

// ─── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      startDate,
      endDate,
      interests = [],
      dailySchedule = 'moderate',
      travelType = 'couple',
      accommodation = 'center',
      transport = 'mixed',
      budget = 'moderate',
      travelers = 2,
    } = await req.json()

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    let itinerary

    if (OPENAI_API_KEY && OPENAI_API_KEY !== 'PASTE_YOUR_OPENAI_API_KEY_HERE') {
      try {
        const systemPrompt = `You are an expert travel planner for Cappadocia, Turkey.
Generate a highly personalized travel itinerary strictly based on the user's preferences below.

=== USER PROFILE ===
Travel Type: ${travelType} — ${getTravelTypeGuidance(travelType)}
Budget: ${budget} — ${getBudgetGuidance(budget)}
Transport: ${transport} — ${getTransportGuidance(transport)}
Group Size: ${travelers} people
Accommodation: ${accommodation}
Daily Schedule pace: ${dailySchedule}

=== INTERESTS (strictly prioritize these) ===
${getInterestGuidance(interests)}

=== RULES ===
- Max ${getDailyPlaceCount(budget, travelType)} places per day
- No duplicate places across days
- Balloon rides ONLY at sunrise (05:00–08:00) on Day 1 or 2, ONLY if balloon is in interests
- Sunset visits (Rose Valley, Red Valley) after 17:30
- Allowed regions: Göreme, Uçhisar, Ürgüp, Avanos, Ortahisar, Çavuşin, Derinkuyu, Kaymaklı, Ihlara
- For luxury budget: include premium/private experiences
- For budget travelers: focus on free/low-cost sites (valleys, viewpoints)
- For families: ONLY child-safe, easy-access locations
- Return ONLY valid JSON, no markdown, no explanation

=== RESPONSE FORMAT ===
{
  "days": [
    {
      "day": 1,
      "items": [
        {
          "place_name": "Göreme Open Air Museum",
          "category": "museum",
          "estimated_duration_minutes": 120,
          "description": "UNESCO World Heritage site with rock-cut churches."
        }
      ]
    }
  ]
}`

        const userPrompt = `Trip: ${startDate} to ${endDate}. Travelers: ${travelers}. Interests: ${interests.join(', ')}. Budget: ${budget}. Transport: ${transport}. Travel type: ${travelType}.`

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.4,
            response_format: { type: 'json_object' },
          }),
        })

        if (!openaiRes.ok) throw new Error(`OpenAI error: ${openaiRes.statusText}`)

        const openaiData = await openaiRes.json()
        itinerary = JSON.parse(openaiData.choices[0].message.content)
      } catch (err) {
        console.error('OpenAI failed, falling back to mock:', err)
        itinerary = generateMockItinerary(startDate, endDate, interests, travelType, budget, transport)
      }
    } else {
      itinerary = generateMockItinerary(startDate, endDate, interests, travelType, budget, transport)
    }

    // ── Google Places verification with cache ──────────────────────────────────
    const verifiedDays = []
    for (const day of itinerary.days) {
      const verifiedItems = []
      for (const item of day.items) {
        const normalizedName = normalizePlaceName(item.place_name)

        const { data: cachedPlace } = await supabase
          .from('places_cache')
          .select('*')
          .eq('place_name_normalized', normalizedName)
          .limit(1)
          .maybeSingle()

        if (cachedPlace) {
          verifiedItems.push({
            ...item,
            place_id: cachedPlace.place_id,
            name: cachedPlace.name,
            formatted_address: cachedPlace.formatted_address,
            lat: cachedPlace.lat,
            lng: cachedPlace.lng,
            rating: cachedPlace.rating,
            photo_reference: cachedPlace.photo_reference,
          })
        } else {
          let placeInfo = null

          if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE') {
            try {
              const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(item.place_name + ' Cappadocia')}&key=${GOOGLE_MAPS_API_KEY}`
              const searchRes = await fetch(searchUrl)
              const searchData = await searchRes.json()

              if (searchData.results?.length > 0) {
                const place = searchData.results[0]
                placeInfo = {
                  place_id: place.place_id,
                  name: place.name,
                  formatted_address: place.formatted_address,
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng,
                  rating: place.rating || null,
                  photo_reference: place.photos?.[0]?.photo_reference || null,
                }
              }
            } catch (err) {
              console.error(`Google Places error for ${item.place_name}:`, err)
            }
          }

          if (placeInfo) {
            await supabase.from('places_cache').insert({
              place_name_normalized: normalizedName,
              ...placeInfo,
            })
            verifiedItems.push({ ...item, ...placeInfo })
          } else {
            verifiedItems.push({ ...item, unverified: true })
          }
        }
      }
      verifiedDays.push({ ...day, items: verifiedItems })
    }

    // ── Time slot assignment ───────────────────────────────────────────────────
    const finalDays = verifiedDays.map(day => {
      let currentTime = new Date('2026-01-01T09:00:00')
      const itemsWithTime = day.items.map(item => {
        if (item.place_name.toLowerCase().includes('balloon')) {
          return { ...item, start_time: '05:00', end_time: '08:00' }
        }
        // Push sunset spots to evening
        const isSunsetSpot = /rose valley|red valley|sunset/i.test(item.place_name)
        if (isSunsetSpot) {
          return { ...item, start_time: '17:30', end_time: '19:30' }
        }

        const startTime = currentTime.toTimeString().slice(0, 5)
        currentTime.setMinutes(currentTime.getMinutes() + (item.estimated_duration_minutes || 60))
        const endTime = currentTime.toTimeString().slice(0, 5)
        currentTime.setMinutes(currentTime.getMinutes() + 30) // travel buffer
        return { ...item, start_time: startTime, end_time: endTime }
      })
      return { ...day, items: itemsWithTime }
    })

    return new Response(JSON.stringify({ days: finalDays }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
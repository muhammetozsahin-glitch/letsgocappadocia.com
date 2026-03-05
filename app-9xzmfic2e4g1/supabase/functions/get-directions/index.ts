import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { origin, destination, waypoints } = await req.json()

    // Create Supabase service_role client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Build cache key from request params
    const cache_key = `${origin}|${destination}|${waypoints?.join(',') ?? ''}`

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('directions_cache')
      .select('response, created_at')
      .eq('cache_key', cache_key)
      .maybeSingle()

    if (!cacheError && cachedData) {
      // Check if cache is less than 30 days old
      const cacheAge = Date.now() - new Date(cachedData.created_at).getTime()
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000

      if (cacheAge < thirtyDaysInMs) {
        console.log('Cache hit for:', cache_key)
        return new Response(JSON.stringify(cachedData.response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Cache miss or expired - call Google Directions API (if key exists)
    if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      try {
        console.log('Cache miss for:', cache_key)
        let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`
        
        if (waypoints && waypoints.length > 0) {
          url += `&waypoints=${waypoints.join('|')}`
        }

        const res = await fetch(url)
        const data = await res.json()

        if (data.status === 'OK') {
          // Upsert the result into cache
          await supabase
            .from('directions_cache')
            .upsert({
              cache_key,
              response: data,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'cache_key'
            })
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (err) {
        console.error('Google Directions API error, falling back to dummy:', err)
      }
    }

    // No key or error - return dummy response
    const dummyResponse = {
      status: "OK",
      routes: [{
        summary: "Dummy route for demonstration",
        legs: [{
          distance: { text: "10 km", value: 10000 },
          duration: { text: "15 mins", value: 900 },
          steps: []
        }],
        overview_polyline: { points: "" }
      }]
    }

    return new Response(JSON.stringify(dummyResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
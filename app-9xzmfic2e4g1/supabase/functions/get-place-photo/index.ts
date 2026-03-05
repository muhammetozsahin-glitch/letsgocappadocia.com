import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FALLBACK_PHOTO_URLS = [
  'https://images.unsplash.com/photo-1544833316-64d88e00182a?q=80&w=800&auto=format&fit=crop', // Cappadocia Valley
  'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=800&auto=format&fit=crop', // Hot Air Balloons
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=800&auto=format&fit=crop', // Stone Houses
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const urlObj = new URL(req.url)
    const photoReference = urlObj.searchParams.get('photo_reference')

    if (!photoReference) {
      // If missing photo_reference, redirect to a random fallback image
      const fallbackUrl = FALLBACK_PHOTO_URLS[Math.floor(Math.random() * FALLBACK_PHOTO_URLS.length)]
      return Response.redirect(fallbackUrl, 302)
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Derive storage path from photo_reference
    const storagePath = `photos/${photoReference}.jpg`

    // Check if file already exists in storage
    const { data: publicUrlData } = supabase.storage
      .from('place-photos')
      .getPublicUrl(storagePath)

    // Try to HEAD the file to check if it exists
    try {
      const headResponse = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
      if (headResponse.ok) {
        // File exists in storage, redirect to it
        return Response.redirect(publicUrlData.publicUrl, 302)
      }
    } catch (headError) {
      // File doesn't exist, continue to fetch from Google
      console.log('File not in cache, fetching from Google...')
    }

    // File doesn't exist in storage, fetch from Google (if key exists)
    if (GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      try {
        const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`
        
        const googleResponse = await fetch(googlePhotoUrl)
        
        if (googleResponse.ok) {
          // Get the image blob
          const imageBlob = await googleResponse.blob()
          
          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('place-photos')
            .upload(storagePath, imageBlob, {
              contentType: 'image/jpeg',
              cacheControl: '31536000', // Cache for 1 year
              upsert: false
            })

          if (!uploadError) {
            // Successfully uploaded, redirect to storage URL
            return Response.redirect(publicUrlData.publicUrl, 302)
          } else {
            console.error('Failed to upload to storage:', uploadError)
            // If upload fails, still redirect to Google URL as fallback
            return Response.redirect(googlePhotoUrl, 302)
          }
        }
      } catch (err) {
        console.error('Failed to fetch photo from Google, using fallback:', err)
      }
    }

    // If key is missing or fetch fails, redirect to a random fallback image
    const fallbackUrl = FALLBACK_PHOTO_URLS[Math.floor(Math.random() * FALLBACK_PHOTO_URLS.length)]
    return Response.redirect(fallbackUrl, 302)
    
  } catch (error) {
    console.error('Error in get-place-photo:', error)
    // Always fallback to something visual
    const fallbackUrl = FALLBACK_PHOTO_URLS[Math.floor(Math.random() * FALLBACK_PHOTO_URLS.length)]
    return Response.redirect(fallbackUrl, 302)
  }
})
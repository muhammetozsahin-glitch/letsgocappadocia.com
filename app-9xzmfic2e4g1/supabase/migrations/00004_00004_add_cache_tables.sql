-- Create places_cache table for caching Google Places API results
CREATE TABLE places_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_name_normalized text NOT NULL,
  place_id text NOT NULL,
  name text,
  formatted_address text,
  lat float8,
  lng float8,
  rating float4,
  user_ratings_total int4,
  photo_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT places_cache_place_name_normalized_unique UNIQUE (place_name_normalized)
);

-- Create index on place_name_normalized for faster lookups
CREATE INDEX idx_places_cache_place_name_normalized ON places_cache(place_name_normalized);

-- Create directions_cache table for caching Google Directions API results
CREATE TABLE directions_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL,
  response jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT directions_cache_cache_key_unique UNIQUE (cache_key)
);

-- Create index on cache_key for faster lookups
CREATE INDEX idx_directions_cache_cache_key ON directions_cache(cache_key);

-- Disable RLS on both tables (accessed via service_role key from Edge Functions)
ALTER TABLE places_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE directions_cache DISABLE ROW LEVEL SECURITY;

-- No policies needed - Edge Functions use service_role key which bypasses RLS
-- These are server-side cache tables with no user-facing access requirements
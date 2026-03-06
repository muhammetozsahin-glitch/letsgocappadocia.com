-- Add new columns to trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS guide_intro text,
ADD COLUMN IF NOT EXISTS guide_tips text[],
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Create guide_likes table
CREATE TABLE IF NOT EXISTS guide_likes (
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, trip_id)
);

-- Enable RLS for guide_likes
ALTER TABLE guide_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view guide likes" ON guide_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON guide_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON guide_likes FOR DELETE USING (auth.uid() = user_id);

-- Update RLS for trips
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public trips are viewable by everyone" ON trips FOR SELECT USING (is_public = true);

-- SQL Function to increment view count
CREATE OR REPLACE FUNCTION increment_guide_views(p_trip_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE trips
    SET views_count = views_count + 1
    WHERE id = p_trip_id AND is_public = true;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to sync likes count
CREATE OR REPLACE FUNCTION update_trip_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE trips SET likes_count = likes_count + 1 WHERE id = NEW.trip_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE trips SET likes_count = likes_count - 1 WHERE id = OLD.trip_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_trip_likes_count
AFTER INSERT OR DELETE ON guide_likes
FOR EACH ROW EXECUTE FUNCTION update_trip_likes_count();

-- Create composite index
CREATE INDEX IF NOT EXISTS idx_public_trips_ranking ON trips (likes_count DESC, views_count DESC) WHERE is_public = true;

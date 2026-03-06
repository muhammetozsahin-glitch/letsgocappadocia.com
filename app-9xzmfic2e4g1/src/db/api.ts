import { supabase } from './supabase';

export interface Place {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  rating?: number;
  formatted_address: string;
  photo_reference?: string;
  description: string;
  category: string;
  estimated_duration_minutes: number;
  start_time: string;
  end_time: string;
  notes?: string;
  personal_tip?: string;
  why_visit?: string;
}

export interface ItineraryDay {
  day: number;
  items: Place[];
  total_distance?: string;
  total_duration?: string;
  notes?: string;
  day_story?: string;
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  preferences: any;
  itinerary: { days: ItineraryDay[] };
  created_at: string;
}

const api = {
  async getTrips() {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Trip[];
  },

  async getTripById(id: string) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as Trip;
  },

  async saveTrip(trip: Partial<Trip>) {
    const { data, error } = await supabase
      .from('trips')
      .insert(trip)
      .select()
      .single();
    if (error) throw error;
    return data as Trip;
  },

  async updateTrip(id: string, updates: Partial<Trip>) {
    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Trip;
  },

  async deleteTrip(id: string) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async generateItinerary(params: {
    startDate: string;
    endDate: string;
    interests: string[];
    dailySchedule: string;
    travelType: string;
    accommodation: string;
    transport: string;
    budget: string;
    travelers: number;
  }): Promise<{ days: any[]; ai_used: boolean; ai_error: string | null }> {
    const { data, error } = await supabase.functions.invoke('generate-itinerary', {
      body: params,
    });
    if (error) {
      const msg = await error.context?.text?.() || error.message;
      throw new Error(msg);
    }
    return data;
  },

  async getDirections(params: {
    origin: string;
    destination: string;
    waypoints?: string[];
  }) {
    const { data, error } = await supabase.functions.invoke('get-directions', {
      body: params,
    });
    if (error) throw error;
    return data;
  },

  getPhotoUrl(photoReference: string) {
    const { data } = supabase.storage.from('dummy').getPublicUrl('dummy');
    const baseUrl = data.publicUrl.split('/storage/v1')[0];
    return `${baseUrl}/functions/v1/get-place-photo?photo_reference=${photoReference}`;
  },

  async publishGuide(tripId: string, opts: {
    guide_intro?: string;
    guide_tips?: string[];
  }) {
    const { data, error } = await supabase
      .from('trips')
      .update({
        is_public: true,
        guide_intro: opts.guide_intro || null,
        guide_tips: opts.guide_tips || [],
        published_at: new Date().toISOString(),
      })
      .eq('id', tripId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async unpublishGuide(tripId: string) {
    const { error } = await supabase
      .from('trips')
      .update({ is_public: false, published_at: null })
      .eq('id', tripId);
    if (error) throw error;
  },

  async getPublicGuides(limit = 20) {
    const { data, error } = await supabase
      .from('trips')
      .select('id, title, destination, start_date, end_date, itinerary, guide_intro, guide_tips, views_count, likes_count, published_at, user_id')
      .eq('is_public', true)
      .order('likes_count', { ascending: false })
      .order('views_count', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async getPublicGuide(tripId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('is_public', true)
      .single();
    if (error) throw error;
    supabase.rpc('increment_guide_views', { trip_id: tripId }).then(() => {});
    return data;
  },

  async cloneGuide(tripId: string): Promise<Trip> {
    const guide = await this.getPublicGuide(tripId);
    if (!guide) throw new Error('Rehber bulunamadı');
    const newTrip = await this.saveTrip({
      title: `${guide.title} (Kopyam)`,
      destination: guide.destination,
      start_date: guide.start_date,
      end_date: guide.end_date,
      preferences: guide.preferences,
      itinerary: guide.itinerary,
    });
    return newTrip;
  },

  async toggleLike(tripId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Giriş gerekli');
    const { data: existing } = await supabase
      .from('guide_likes')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('trip_id', tripId)
      .maybeSingle();
    if (existing) {
      await supabase.from('guide_likes').delete().eq('user_id', user.id).eq('trip_id', tripId);
      return false;
    } else {
      await supabase.from('guide_likes').insert({ user_id: user.id, trip_id: tripId });
      return true;
    }
  },

  async getMyLikes(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from('guide_likes')
      .select('trip_id')
      .eq('user_id', user.id);
    return (data || []).map((r: any) => r.trip_id);
  },
};

export default api;
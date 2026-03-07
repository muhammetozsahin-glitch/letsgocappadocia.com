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

export interface DiscoverPlace {
  place_id: string;
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
  rating?: number;
  user_ratings_total?: number;
  photo_url?: string;
  photo_reference?: string;
  category: string;
  types?: string[];
  price_level?: number;
}

export interface PlaceDetail {
  place_id: string;
  name: string;
  summary?: string;
  rating?: number;
  user_ratings_total?: number;
  is_open_now?: boolean;
  opening_hours?: string[];
  reviews?: { author: string; rating?: number; text: string; time: string }[];
}

export interface AdminStats {
  total_users: number;
  total_trips: number;
  public_guides: number;
  total_likes: number;
  total_views: number;
  cached_places: number;
  cached_searches: number;
  users_today: number;
  trips_today: number;
  users_this_week: number;
  trips_this_week: number;
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

  // ── Discover Places — Cache Layer (DB okuma/yazma) ──────────────────────

  /** search_cache tablosundan sorgu sonuçlarını kontrol et */
  async getCachedSearch(cacheKey: string): Promise<string[] | null> {
    const { data } = await supabase
      .from('search_cache')
      .select('place_ids, created_at')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (!data || !data.place_ids?.length) return null;

    // 24 saat geçerlilik
    const age = Date.now() - new Date(data.created_at).getTime();
    if (age > 24 * 60 * 60 * 1000) return null;

    return data.place_ids;
  },

  /** places_cache tablosundan place_id listesiyle yerleri çek */
  async getCachedPlaces(placeIds: string[]): Promise<DiscoverPlace[]> {
    const { data } = await supabase
      .from('places_cache')
      .select('*')
      .in('place_id', placeIds);

    if (!data?.length) return [];

    return data.map((p: any) => ({
      place_id: p.place_id,
      name: p.name,
      formatted_address: p.formatted_address,
      lat: p.lat,
      lng: p.lng,
      rating: p.rating,
      user_ratings_total: p.user_ratings_total,
      photo_url: p.photo_reference
        ? (p.photo_reference.startsWith('http') ? p.photo_reference : api.getPhotoUrl(p.photo_reference))
        : null,
      photo_reference: p.photo_reference,
      category: p.category || 'Turistik Yer',
      types: p.types || [],
      price_level: p.price_level,
    }));
  },

  /** Tek bir yeri places_cache'e kaydet */
  async savePlaceToCache(place: {
    place_id: string;
    name: string;
    formatted_address: string;
    lat: number;
    lng: number;
    rating?: number;
    user_ratings_total?: number;
    photo_reference?: string;
    types?: string[];
    price_level?: number;
    category?: string;
  }) {
    const normalized = place.name.toLowerCase().trim()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/\s+/g, ' ');

    await supabase
      .from('places_cache')
      .upsert({
        place_name_normalized: normalized,
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        lat: place.lat,
        lng: place.lng,
        rating: place.rating || null,
        user_ratings_total: place.user_ratings_total || null,
        photo_reference: place.photo_reference || null,
        types: place.types || [],
        price_level: place.price_level ?? null,
        category: place.category || 'Turistik Yer',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'place_name_normalized' })
      .then(() => {});
  },

  /** Arama sorgusunu → place_id listesini search_cache'e kaydet */
  async saveSearchToCache(cacheKey: string, query: string, category: string, placeIds: string[]) {
    await supabase
      .from('search_cache')
      .upsert({
        cache_key: cacheKey,
        query,
        category,
        place_ids: placeIds,
        created_at: new Date().toISOString(),
      }, { onConflict: 'cache_key' })
      .then(() => {});
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN API
  // ═══════════════════════════════════════════════════════════════════════

  admin: {
    /** Dashboard istatistikleri */
    async getStats(): Promise<AdminStats> {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;
      return data as AdminStats;
    },

    /** Tüm kullanıcıları getir */
    async getUsers(opts?: { page?: number; limit?: number; search?: string }) {
      const page = opts?.page || 1;
      const limit = opts?.limit || 20;
      const from = (page - 1) * limit;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (opts?.search) {
        query = query.or(`email.ilike.%${opts.search}%,full_name.ilike.%${opts.search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { users: data || [], total: count || 0 };
    },

    /** Kullanıcı rolünü değiştir */
    async updateUserRole(userId: string, role: 'user' | 'admin') {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);
      if (error) throw error;
    },

    /** Tüm gezileri getir (tüm kullanıcılar) */
    async getTrips(opts?: { page?: number; limit?: number; search?: string; publicOnly?: boolean }) {
      const page = opts?.page || 1;
      const limit = opts?.limit || 20;
      const from = (page - 1) * limit;

      let query = supabase
        .from('trips')
        .select('id, title, destination, start_date, end_date, created_at, is_public, views_count, likes_count, user_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

      if (opts?.search) {
        query = query.ilike('title', `%${opts.search}%`);
      }
      if (opts?.publicOnly) {
        query = query.eq('is_public', true);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { trips: data || [], total: count || 0 };
    },

    /** Geziyi sil (admin) */
    async deleteTrip(tripId: string) {
      const { error } = await supabase.from('trips').delete().eq('id', tripId);
      if (error) throw error;
    },

    /** Rehberi yayından kaldır */
    async unpublishTrip(tripId: string) {
      const { error } = await supabase
        .from('trips')
        .update({ is_public: false, published_at: null })
        .eq('id', tripId);
      if (error) throw error;
    },

    /** Cache istatistikleri */
    async getCacheStats() {
      const [placesRes, searchRes] = await Promise.all([
        supabase.from('places_cache').select('id', { count: 'exact', head: true }),
        supabase.from('search_cache').select('id', { count: 'exact', head: true }),
      ]);
      return {
        places_count: placesRes.count || 0,
        search_count: searchRes.count || 0,
      };
    },

    /** Cache'i temizle */
    async clearCache(type: 'places' | 'search' | 'all') {
      if (type === 'places' || type === 'all') {
        await supabase.from('places_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      if (type === 'search' || type === 'all') {
        await supabase.from('search_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
    },

    /** Son cached yerler */
    async getRecentCachedPlaces(limit = 10) {
      const { data } = await supabase
        .from('places_cache')
        .select('place_id, name, category, rating, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      return data || [];
    },
  },
};

export default api;
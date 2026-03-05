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
}

export interface ItineraryDay {
  day: number;
  items: Place[];
  total_distance?: string;
  total_duration?: string;
  notes?: string;
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
  // Trips
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

  // Edge Functions
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
  }) {
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
    const { data } = supabase.storage.from('dummy').getPublicUrl('dummy'); // Just to get the base URL
    const baseUrl = data.publicUrl.split('/storage/v1')[0];
    return `${baseUrl}/functions/v1/get-place-photo?photo_reference=${photoReference}`;
  }
};

export default api;
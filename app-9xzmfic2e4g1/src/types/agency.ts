// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/types/agency.ts
// ═══════════════════════════════════════════════════════════════════════════════

export type ServiceType = 'tour' | 'custom_tour' | 'activity' | 'balloon' | 'hotel' | 'transfer' | 'package';
export type BookingType = 'group' | 'private';
export type SupplierType = 'own' | 'supplier';

export interface TourItineraryItem {
  time: string;
  title: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  duration_minutes?: number;
  place_id?: string;
}

export interface Tour {
  id: string;
  code: string;
  name: string;
  name_en?: string;
  slug: string;
  short_description?: string;
  short_description_en?: string;
  description?: string;
  description_en?: string;
  
  duration_hours: number;
  start_time: string;
  end_time?: string;
  
  group_enabled: boolean;
  group_price_adult: number;
  group_price_child?: number;
  group_child_age_min?: number;
  group_child_age_max?: number;
  group_infant_free?: boolean;
  group_min_participants?: number;
  group_max_participants?: number;
  
  private_enabled: boolean;
  private_price_1_3?: number;
  private_price_4_6?: number;
  private_price_7_10?: number;
  private_price_11_14?: number;
  private_price_15_plus?: number;
  private_max_participants?: number;
  
  includes?: string[];
  includes_en?: string[];
  excludes?: string[];
  excludes_en?: string[];
  important_notes?: string[];
  
  itinerary: TourItineraryItem[];
  
  meeting_point?: string;
  meeting_point_lat?: number;
  meeting_point_lng?: number;
  
  cover_image?: string;
  gallery_images?: string[];
  video_url?: string;
  
  meta_title?: string;
  meta_description?: string;
  
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  currency: string;
  
  created_at: string;
  updated_at: string;
}

export interface TourAvailability {
  id: string;
  tour_id: string;
  date: string;
  group_available: boolean;
  group_capacity: number;
  group_booked: number;
  group_price_override?: number;
  private_available: boolean;
  private_booked: boolean;
  private_price_override?: number;
  status: string;
}

export interface BalloonFlight {
  id: string;
  supplier_id: string;
  supplier?: { id: string; name: string; code?: string };
  name: string;
  name_en?: string;
  slug: string;
  description?: string;
  description_en?: string;
  duration_minutes: number;
  flight_time: string;
  passengers_per_basket?: number;
  includes?: string[];
  includes_en?: string[];
  cost_price: number;
  sell_price_adult: number;
  sell_price_child?: number;
  cover_image?: string;
  gallery_images?: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  currency: string;
}

export interface ActivityTimeSlot {
  time: string;
  label: string;
  label_en?: string;
}

export interface Activity {
  id: string;
  name: string;
  name_en?: string;
  slug: string;
  short_description?: string;
  short_description_en?: string;
  description?: string;
  description_en?: string;
  category?: string;
  supplier_type: SupplierType;
  supplier_name?: string;
  supplier_contact?: string;
  supplier_cost?: number;
  duration_minutes?: number;
  time_slots?: ActivityTimeSlot[];
  cost_price?: number;
  sell_price_adult: number;
  sell_price_child?: number;
  min_participants?: number;
  max_participants?: number;
  min_age?: number;
  includes?: string[];
  excludes?: string[];
  requirements?: string[];
  location?: string;
  cover_image?: string;
  gallery_images?: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  currency: string;
}

// ── Teklif Sistemi ──────────────────────────────────────────────────────────

export type QuoteItemType = 'tour' | 'activity' | 'balloon' | 'transfer' | 'hotel' | 'restaurant';
export type QuoteStatus   = 'pending' | 'reviewed' | 'sent' | 'accepted' | 'rejected';

export interface QuoteItem {
  id?: string;
  item_type: QuoteItemType;
  service_id?: string;
  service_name: string;
  service_slug?: string;
  service_date?: string;
  service_time?: string;
  adult_count: number;
  child_count: number;
  unit_price?: number;
  total_price?: number;
  currency?: string;
  cover_image?: string;
  notes?: string;
  sort_order?: number;
}

export interface QuoteRequest {
  id?: string;
  trip_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_country?: string;
  customer_hotel?: string;
  special_requests?: string;
  travel_dates?: string;
  traveler_count: number;
  travel_type?: string;
  estimated_total?: number;
  currency?: string;
  status?: QuoteStatus;
  items?: QuoteItem[];
}
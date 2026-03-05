export type UserRole = 'user' | 'admin';

export interface ProfilePreferences {
  language: 'tr' | 'en';
  theme: 'light' | 'dark' | 'system';
  time_format: '12h' | '24h';
  distance_unit: 'km' | 'mi';
  email_notifications: {
    tips: boolean;
    features: boolean;
    recommendations: boolean;
  };
}

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
  full_name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  preferences?: ProfilePreferences;
}

// Explore page types
export type PlaceCategory = 'Müzeler' | 'Doğa' | 'Aktiviteler' | 'Yemek' | 'Altı' | 'Fotoğraf';
export type Difficulty = 'Kolay' | 'Orta' | 'Zor';
export type BestTime = 'Sabah' | 'Öğleden Sonra' | 'Akşam' | 'Her Zaman';

export interface Review {
  author: string;
  date: string;
  rating: number;
  text: string;
  avatar?: string;
}

export interface Place {
  id: string;
  name: string;
  description: string;
  category: PlaceCategory;
  rating: number;
  user_ratings_total: number;
  images: string[];
  address: string;
  phone?: string;
  hours?: string;
  duration: number; // minutes
  difficulty: Difficulty;
  distance_from_center: number; // km
  best_time: BestTime;
  reviews: Review[];
  website?: string;
}

export interface ItineraryItem {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  image_url: string;
  formatted_address: string;
  description: string;
  category: string;
  start_time: string;
  end_time: string;
  estimated_duration_minutes: number;
}

export interface ItineraryDay {
  day: number;
  total_distance?: string;
  total_duration?: string;
  items: ItineraryItem[];
}

export interface Itinerary {
  days: ItineraryDay[];
}

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  preferences: any;
  itinerary: Itinerary;
  created_at: string;
}


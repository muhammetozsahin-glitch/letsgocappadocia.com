// ═══════════════════════════════════════════════════════════════════════════════
// SEYAHAT ACENTASI API FONKSİYONLARI  
// Bu dosyayı src/db/agency-api.ts olarak kaydedin
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase } from './supabase';
import type { Tour, TourAvailability, BalloonFlight, Activity } from '@/types/agency';

// ═══════════════════════════════════════════════════════════════════════════════
// TUR API
// ═══════════════════════════════════════════════════════════════════════════════

export const toursApi = {
  // Tüm aktif turları getir
  async getAll(): Promise<Tour[]> {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Öne çıkan turları getir
  async getFeatured(): Promise<Tour[]> {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Slug ile tek tur getir
  async getBySlug(slug: string): Promise<Tour | null> {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Fiyat hesaplama
  calculatePrice(
    tour: Tour,
    bookingType: 'group' | 'private',
    adultCount: number,
    childCount: number,
    priceOverride?: number
  ): { total: number; breakdown: { label: string; amount: number }[] } {
    const breakdown: { label: string; amount: number }[] = [];
    let total = 0;

    if (bookingType === 'group') {
      const adultPrice = priceOverride || tour.group_price_adult;
      const childPrice = tour.group_price_child || adultPrice * 0.7;

      if (adultCount > 0) {
        const adultTotal = adultPrice * adultCount;
        breakdown.push({ label: `Yetişkin x ${adultCount}`, amount: adultTotal });
        total += adultTotal;
      }

      if (childCount > 0) {
        const childTotal = childPrice * childCount;
        breakdown.push({ label: `Çocuk x ${childCount}`, amount: childTotal });
        total += childTotal;
      }
    } else {
      // Özel tur - kişi sayısına göre araç fiyatı
      const totalPax = adultCount + childCount;
      let price = 0;

      if (totalPax <= 3) {
        price = priceOverride || tour.private_price_1_3 || 0;
        breakdown.push({ label: 'Özel Tur (1-3 kişi)', amount: price });
      } else if (totalPax <= 6) {
        price = priceOverride || tour.private_price_4_6 || 0;
        breakdown.push({ label: 'Özel Tur (4-6 kişi)', amount: price });
      } else if (totalPax <= 10) {
        price = priceOverride || tour.private_price_7_10 || 0;
        breakdown.push({ label: 'Özel Tur (7-10 kişi)', amount: price });
      } else if (totalPax <= 14) {
        price = priceOverride || tour.private_price_11_14 || 0;
        breakdown.push({ label: 'Özel Tur (11-14 kişi)', amount: price });
      } else {
        price = priceOverride || tour.private_price_15_plus || 0;
        breakdown.push({ label: 'Özel Tur (15+ kişi)', amount: price });
      }

      total = price;
    }

    return { total, breakdown };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// BALON API
// ═══════════════════════════════════════════════════════════════════════════════

export const balloonsApi = {
  async getAll(): Promise<BalloonFlight[]> {
    const { data, error } = await supabase
      .from('balloon_flights')
      .select(`*, supplier:balloon_suppliers(id, name, code)`)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getBySlug(slug: string): Promise<BalloonFlight | null> {
    const { data, error } = await supabase
      .from('balloon_flights')
      .select(`*, supplier:balloon_suppliers(id, name, code)`)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AKTİVİTE API
// ═══════════════════════════════════════════════════════════════════════════════

export const activitiesApi = {
  async getAll(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getBySlug(slug: string): Promise<Activity | null> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
};

export default { tours: toursApi, balloons: balloonsApi, activities: activitiesApi };
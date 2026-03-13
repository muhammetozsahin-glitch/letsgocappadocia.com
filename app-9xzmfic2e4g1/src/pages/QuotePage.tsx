// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/QuotePage.tsx
// CheckoutPage'in yerini alır. Müşteri bilgilerini alır, quote_request oluşturur.
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ChevronRight, Send, User, Mail, Phone,
  MapPin, MessageSquare, Check, Loader2,
  Calendar, Users, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { QuoteItem } from '@/types/agency';

export default function QuotePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Önceki sayfadan gelen ön veriler (tur/aktivite detayından veya TripBookingPanel'den)
  const incoming = location.state as {
    items?: QuoteItem[];
    traveler_count?: number;
    tripTitle?: string;
    travel_dates?: string;
  } | null;

  const items: QuoteItem[] = incoming?.items || [];
  const estimatedTotal = items.reduce((s, i) => s + (i.total_price || 0), 0);

  // Müşteri formu
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    hotel: '',
    special_requests: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Ad ve e-posta zorunludur');
      return;
    }

    setSubmitting(true);
    try {
      // 1. quote_request oluştur
      const { data: quote, error: qErr } = await supabase
        .from('quote_requests')
        .insert({
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone || null,
          customer_country: form.country || null,
          customer_hotel: form.hotel || null,
          special_requests: form.special_requests || null,
          travel_dates: incoming?.travel_dates || null,
          traveler_count: incoming?.traveler_count || 2,
          estimated_total: estimatedTotal || null,
          currency: 'EUR',
          status: 'pending',
        })
        .select('id')
        .single();

      if (qErr) throw qErr;

      // 2. Her kalemi quote_items'a ekle
      if (items.length > 0 && quote) {
        const quoteItems = items.map((item, i) => ({
          quote_id: quote.id,
          item_type: item.item_type,
          service_id: item.service_id || null,
          service_name: item.service_name,
          service_slug: item.service_slug || null,
          service_date: item.service_date || null,
          service_time: item.service_time || null,
          adult_count: item.adult_count,
          child_count: item.child_count || 0,
          unit_price: item.unit_price || null,
          total_price: item.total_price || null,
          currency: item.currency || 'EUR',
          cover_image: item.cover_image || null,
          notes: item.notes || null,
          sort_order: i,
        }));

        const { error: iErr } = await supabase.from('quote_items').insert(quoteItems);
        if (iErr) console.error('Quote items error:', iErr);
      }

      navigate('/teklif/onay', { state: { quoteId: quote?.id, customerName: form.name } });
    } catch (err) {
      console.error(err);
      toast.error('Bir hata oluştu, lütfen tekrar deneyin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Teklif Al</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Ücretsiz Teklif Al</h1>
          <p className="text-muted-foreground mt-2">
            Bilgilerinizi bırakın, 24 saat içinde kişiye özel teklifinizi hazırlayalım.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sol: Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  İletişim Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Ad Soyad *</Label>
                    <Input
                      id="name" name="name"
                      placeholder="John Smith"
                      value={form.name} onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-posta *</Label>
                    <Input
                      id="email" name="email" type="email"
                      placeholder="john@email.com"
                      value={form.email} onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Telefon / WhatsApp</Label>
                    <Input
                      id="phone" name="phone"
                      placeholder="+90 555 000 00 00"
                      value={form.phone} onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country">Ülke</Label>
                    <Input
                      id="country" name="country"
                      placeholder="Almanya"
                      value={form.country} onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hotel">Konaklama (biliyorsanız)</Label>
                  <Input
                    id="hotel" name="hotel"
                    placeholder="Göreme Evi Otel"
                    value={form.hotel} onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">Transfer ve buluşma noktası için kullanılır</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Özel İstekler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="special_requests"
                  placeholder="Vejetaryen yemek, engelli erişimi, özel kutlama, dil tercihi..."
                  className="min-h-[100px]"
                  value={form.special_requests}
                  onChange={handleChange}
                />
              </CardContent>
            </Card>

            <Button
              className="w-full h-12 text-base gap-2"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Gönderiliyor...</>
                : <><Send className="w-4 h-4" />Teklif Talebini Gönder</>
              }
            </Button>
          </div>

          {/* Sağ: Özet */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Teklif Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Henüz hizmet eklenmedi.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        {item.cover_image ? (
                          <img src={item.cover_image} alt={item.service_name}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-xl">
                            {item.item_type === 'tour' ? '🗺️'
                              : item.item_type === 'balloon' ? '🎈'
                              : item.item_type === 'activity' ? '🎯'
                              : '📦'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-tight">{item.service_name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.service_date && (
                              <Badge variant="outline" className="text-xs gap-1 py-0">
                                <Calendar className="w-3 h-3" />{item.service_date}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs gap-1 py-0">
                              <Users className="w-3 h-3" />
                              {item.adult_count}y{item.child_count ? ` + ${item.child_count}ç` : ''}
                            </Badge>
                          </div>
                          {item.total_price ? (
                            <p className="text-sm font-semibold text-primary mt-1">{item.total_price.toFixed(0)}€~</p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {estimatedTotal > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Tahmini toplam</span>
                      <span className="text-primary">{estimatedTotal.toFixed(0)}€~</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kesin fiyat 24 saat içinde e-posta ile iletilir
                    </p>
                  </>
                )}

                <Separator />

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>24 saat içinde yanıt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Kredi kartı gerekmez</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Kişiye özel fiyat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Değişiklik tamamen ücretsiz</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
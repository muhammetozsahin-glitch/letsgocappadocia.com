// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/CheckoutPage.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Trash2, CreditCard, ShieldCheck, 
  User, Mail, Phone, MapPin, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Demo sepet verileri (gerçekte localStorage veya state'ten gelecek)
const demoCartItems = [
  {
    id: '1',
    service_name: 'Kırmızı Tur',
    service_date: '2026-03-15',
    booking_type: 'group',
    adult_count: 2,
    child_count: 1,
    unit_price: 50,
    child_unit_price: 35,
    line_total: 135,
  },
  {
    id: '2',
    service_name: 'Standart Balon Turu',
    service_date: '2026-03-16',
    adult_count: 2,
    child_count: 0,
    unit_price: 180,
    child_unit_price: 160,
    line_total: 360,
  },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState(demoCartItems);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [processing, setProcessing] = useState(false);
  
  // Müşteri bilgileri
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    hotel: '',
    notes: '',
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.line_total, 0);
  const total = subtotal - couponDiscount;

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const applyCoupon = () => {
    // Demo kupon kontrolü
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setCouponDiscount(subtotal * 0.1);
      alert('Kupon uygulandı! %10 indirim');
    } else {
      alert('Geçersiz kupon kodu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer.name || !customer.email || !customer.phone) {
      alert('Lütfen zorunlu alanları doldurun');
      return;
    }
    
    if (cartItems.length === 0) {
      alert('Sepetiniz boş');
      return;
    }
    
    setProcessing(true);
    
    // Simüle edilmiş ödeme işlemi
    setTimeout(() => {
      setProcessing(false);
      navigate('/rezervasyon/onay/LGC-2026-123456');
    }, 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Breadcrumb */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Rezervasyon</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Rezervasyonu Tamamla</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sol Kolon - Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Müşteri Bilgileri */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Müşteri Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Ad Soyad *</Label>
                      <Input
                        id="name"
                        value={customer.name}
                        onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customer.email}
                        onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input
                        id="phone"
                        value={customer.phone}
                        onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+90 555 123 4567"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Ülke</Label>
                      <Input
                        id="country"
                        value={customer.country}
                        onChange={(e) => setCustomer(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Türkiye"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hotel">Otel Adı (Transfer için)</Label>
                    <Input
                      id="hotel"
                      value={customer.hotel}
                      onChange={(e) => setCustomer(prev => ({ ...prev, hotel: e.target.value }))}
                      placeholder="Kelebek Cave Hotel"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notlar / Özel İstekler</Label>
                    <Textarea
                      id="notes"
                      value={customer.notes}
                      onChange={(e) => setCustomer(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Diyet kısıtlamaları, özel istekler..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Ödeme Yöntemi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Ödeme Yöntemi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="credit_card" id="credit_card" />
                      <Label htmlFor="credit_card" className="flex-1 cursor-pointer">
                        <div className="font-medium">Kredi / Banka Kartı</div>
                        <div className="text-sm text-muted-foreground">Visa, Mastercard, Troy</div>
                      </Label>
                      <div className="flex gap-1">
                        <div className="w-10 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                        <div className="w-10 h-6 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="hotel_payment" id="hotel_payment" />
                      <Label htmlFor="hotel_payment" className="flex-1 cursor-pointer">
                        <div className="font-medium">Otelde Ödeme</div>
                        <div className="text-sm text-muted-foreground">Nakit veya kart ile otelde ödeyin</div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === 'credit_card' && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-4">
                      <div className="space-y-2">
                        <Label>Kart Numarası</Label>
                        <Input placeholder="1234 5678 9012 3456" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Son Kullanma</Label>
                          <Input placeholder="AA/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input placeholder="123" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Kart Üzerindeki İsim</Label>
                        <Input placeholder="JOHN DOE" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sağ Kolon - Özet */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Sipariş Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sepet Öğeleri */}
                  {cartItems.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Sepetiniz boş</p>
                  ) : (
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{item.service_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(item.service_date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.adult_count} yetişkin
                              {item.child_count > 0 && `, ${item.child_count} çocuk`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{item.line_total}€</div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Kupon */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Kupon kodu"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={applyCoupon}>
                      Uygula
                    </Button>
                  </div>

                  <Separator />

                  {/* Fiyatlar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ara Toplam</span>
                      <span>{subtotal.toFixed(2)}€</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>İndirim</span>
                        <span>-{couponDiscount.toFixed(2)}€</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Toplam</span>
                      <span className="text-primary">{total.toFixed(2)}€</span>
                    </div>
                  </div>

                  {/* Ödeme Butonu */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg" 
                    size="lg"
                    disabled={processing || cartItems.length === 0}
                  >
                    {processing ? (
                      'İşleniyor...'
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 mr-2" />
                        Güvenli Ödeme
                      </>
                    )}
                  </Button>

                  {/* Güvence */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>🔒 256-bit SSL şifreleme ile güvenli ödeme</p>
                    <p>✓ İptal ve değişiklik koşulları geçerlidir</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
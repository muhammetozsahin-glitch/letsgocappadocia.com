// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/BookingConfirmationPage.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, Users, Mail, Phone, Download, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function BookingConfirmationPage() {
  const { code } = useParams<{ code: string }>();

  // Demo rezervasyon verileri
  const booking = {
    code: code || 'LGC-2026-123456',
    status: 'confirmed',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+90 555 123 4567',
    },
    items: [
      {
        name: 'Kırmızı Tur',
        date: '15 Mart 2026',
        time: '09:30',
        participants: '2 yetişkin, 1 çocuk',
        price: 135,
      },
      {
        name: 'Standart Balon Turu',
        date: '16 Mart 2026',
        time: '05:30',
        participants: '2 yetişkin',
        price: 360,
      },
    ],
    total: 495,
    paymentMethod: 'Kredi Kartı',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-background dark:from-emerald-950/20 dark:to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          
          {/* Başarı İkonu */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
              Rezervasyon Onaylandı!
            </h1>
            <p className="text-muted-foreground">
              Rezervasyonunuz başarıyla oluşturuldu. Detaylar e-posta adresinize gönderildi.
            </p>
          </div>

          {/* Rezervasyon Kodu */}
          <Card className="mb-6 border-2 border-emerald-200 dark:border-emerald-800">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Rezervasyon Kodu</p>
              <p className="text-3xl font-mono font-bold text-primary">{booking.code}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Bu kodu saklayın, turlarınızda göstermeniz gerekebilir.
              </p>
            </CardContent>
          </Card>

          {/* Rezervasyon Detayları */}
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-6">
              {/* Müşteri Bilgileri */}
              <div>
                <h3 className="font-semibold mb-3">Müşteri Bilgileri</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.customer.phone}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Rezerve Edilen Hizmetler */}
              <div>
                <h3 className="font-semibold mb-3">Rezerve Edilen Hizmetler</h3>
                <div className="space-y-4">
                  {booking.items.map((item, index) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{item.name}</h4>
                        <span className="font-semibold">{item.price}€</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{item.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{item.time}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{item.participants}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Ödeme Özeti */}
              <div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Toplam Ödenen</span>
                  <span className="text-2xl font-bold text-primary">{booking.total}€</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Ödeme yöntemi: {booking.paymentMethod}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Önemli Bilgiler */}
          <Card className="mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 text-amber-800 dark:text-amber-400">📌 Önemli Bilgiler</h3>
              <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                <li>• Balon turu için otel alımı sabah 04:30-05:00 arasındadır.</li>
                <li>• Günlük turlar için otel alımı 09:00-09:30 arasındadır.</li>
                <li>• Lütfen turdan 10 dakika önce hazır olun.</li>
                <li>• Hava durumu nedeniyle iptal edilen balonlar için tam iade yapılır.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Butonlar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="flex-1" size="lg">
              <Download className="w-5 h-5 mr-2" />
              PDF İndir
            </Button>
            <Button variant="outline" className="flex-1" size="lg" asChild>
              <Link to="/">
                <Home className="w-5 h-5 mr-2" />
                Ana Sayfaya Dön
              </Link>
            </Button>
          </div>

          {/* İletişim */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Sorularınız mı var?</p>
            <p>
              <a href="mailto:info@letsgocappadocia.com" className="text-primary hover:underline">
                info@letsgocappadocia.com
              </a>
              {' '}veya{' '}
              <a href="tel:+903842711234" className="text-primary hover:underline">
                +90 384 271 12 34
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
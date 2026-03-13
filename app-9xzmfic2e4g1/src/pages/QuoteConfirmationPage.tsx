// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/QuoteConfirmationPage.tsx
// BookingConfirmationPage'in yerini alır.
// ═══════════════════════════════════════════════════════════════════════════════

import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Mail, Phone, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function QuoteConfirmationPage() {
  const location = useLocation();
  const { customerName } = (location.state as { quoteId?: string; customerName?: string }) || {};

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-6">

        {/* İkon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
        </div>

        {/* Başlık */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            Teklif Talebiniz Alındı{customerName ? `, ${customerName.split(' ')[0]}!` : '!'}
          </h1>
          <p className="text-muted-foreground text-lg">
            24 saat içinde kişiye özel teklifinizi hazırlayıp size ileteceğiz.
          </p>
        </div>

        {/* Ne olacak? */}
        <Card>
          <CardContent className="pt-6 space-y-4 text-left">
            <h2 className="font-semibold text-base">Sırada ne var?</h2>

            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-medium text-sm">E-posta kontrolü yapın</p>
                  <p className="text-xs text-muted-foreground">Talep özetinizi e-posta ile gönderdik. Spam klasörünü de kontrol edin.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-medium text-sm">Ekibimiz planı inceler</p>
                  <p className="text-xs text-muted-foreground">Disponibiliteyi kontrol ediyor, en uygun seçenekleri hazırlıyoruz.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-medium text-sm">24 saat içinde teklif gelir</p>
                  <p className="text-xs text-muted-foreground">E-posta veya WhatsApp ile kesin fiyatlı teklifinizi iletiyoruz.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* İletişim */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="mailto:info@letsgocappadocia.com">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Mail className="w-4 h-4" />
              E-posta Gönder
            </Button>
          </a>
          <a href="https://wa.me/905XXXXXXXXX" target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Phone className="w-4 h-4" />
              WhatsApp
            </Button>
          </a>
        </div>

        {/* Ana sayfa */}
        <div>
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              Ana Sayfaya Dön
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
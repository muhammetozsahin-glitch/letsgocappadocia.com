// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/LandingPage.tsx (GÜNCELLENMİŞ)
// ═══════════════════════════════════════════════════════════════════════════════

import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Calendar, Compass, Globe, type LucideIcon, MapPin, ShieldCheck, 
  Sparkles, Star, Zap, Cloud, Ticket,
} from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { FeaturedTours } from '@/components/home/FeaturedTours';

// Icon mapper: DB'den gelen string → React component
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, MapPin, Calendar, Compass, ShieldCheck, Zap,
  Star, Globe,
  ArrowRight, ArrowUpRight,
};

const FeatureCard = ({ icon: Icon, title, description, index }: { icon: LucideIcon; title: string; description: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.28, delay: index * 0.06, ease: 'easeOut' }}
    className="surface-card group p-7"
  >
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-luxury group-hover:scale-105">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="mb-2 font-display text-2xl font-bold tracking-tight text-foreground">{title}</h3>
    <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
  </motion.div>
);

// Stats icon cycle
const STAT_ICONS = [Globe, Compass, MapPin, Star];

export default function LandingPage() {
  const { settings } = useSiteSettings();
  const { hero, stats, features, cta_section, theme } = settings;
  const heroImage = hero.bg_image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400';

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20" ref={containerRef}>
      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
          <img src={heroImage} alt="Cappadocia" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/45 to-black/25" />
        </motion.div>

        <div className="container relative z-20 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            {hero.badge_text}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.08, ease: 'easeOut' }}
            className="mb-6 font-display text-5xl font-bold leading-[0.92] tracking-tight text-white md:text-7xl lg:text-8xl"
          >
            Kapadokya'yı
            <br />
            <span className="text-white/85">/</span>{' '}
            <span className="text-primary">Keşfet</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.14, ease: 'easeOut' }}
            className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/80 md:text-xl"
          >
            AI ile kişiselleştirilmiş rota, gerçek zamanlı öneriler
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, delay: 0.2, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="h-14 rounded-full px-9 text-base font-semibold"
              asChild
            >
              <Link to="/planner">
                Rotanı Oluştur
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-white/65 bg-transparent px-9 text-base font-semibold text-white hover:bg-white/10"
              asChild
            >
              <Link to="/turlar">
                Turları İncele
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative overflow-hidden bg-secondary py-16 text-white">
        <div className="container relative z-10 px-6">
          <div className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = STAT_ICONS[i % STAT_ICONS.length];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.28, delay: i * 0.05, ease: 'easeOut' }}
                  className="space-y-3"
                >
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="font-display text-4xl font-bold text-white">{stat.value}</div>
                  <div className="meta-text text-[11px] uppercase text-white/60">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          YENİ: ÖNE ÇIKAN TURLAR
          ═══════════════════════════════════════════════════════════════════════ */}
      <FeaturedTours />

      {/* Hizmetler Kısa Tanıtım */}
      <section className="py-16 bg-muted/30">
        <div className="container px-6">
          <div className="text-center mb-12">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Hizmetlerimiz
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="mt-3 font-display text-3xl font-bold md:text-4xl"
            >
              Kapadokya Deneyiminiz İçin <span className="text-primary">Her Şey</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balon */}
            <Link to="/balon">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative h-64 rounded-3xl overflow-hidden"
              >
                <img 
                  src="https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&h=400&fit=crop" 
                  alt="Balon Turu"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-medium text-white/80">Şafak Deneyimi</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">Balon Turları</h3>
                  <p className="text-sm text-white/70">180€'dan başlayan fiyatlarla</p>
                </div>
              </motion.div>
            </Link>

            {/* Aktiviteler */}
            <Link to="/aktiviteler">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group relative h-64 rounded-3xl overflow-hidden"
              >
                <img 
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop" 
                  alt="Aktiviteler"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="w-5 h-5 text-orange-400" />
                    <span className="text-sm font-medium text-white/80">Macera & Eğlence</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">Aktiviteler</h3>
                  <p className="text-sm text-white/70">ATV, at binme, Türk gecesi</p>
                </div>
              </motion.div>
            </Link>

            {/* AI Planner */}
            <Link to="/planner">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="group relative h-64 rounded-3xl overflow-hidden"
              >
                <img 
                  src="https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=600&h=400&fit=crop" 
                  alt="AI Planner"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium text-white/80">Yapay Zeka</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">AI ile Rota Oluştur</h3>
                  <p className="text-sm text-white/70">Kişiselleştirilmiş deneyim</p>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container px-6">
          <div className="mx-auto mb-14 max-w-2xl space-y-4 text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="meta-text text-xs uppercase text-muted-foreground"
            >
              {features.section_badge}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.26, delay: 0.05, ease: 'easeOut' }}
              className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl"
            >
              {features.section_title_1} <br />
              <span className="text-primary">{features.section_title_2}</span>
            </motion.h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.items.map((feat, i) => (
              <FeatureCard
                key={i}
                index={i}
                icon={ICON_MAP[feat.icon] || Sparkles}
                title={feat.title}
                description={feat.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-secondary p-12 text-center lg:p-20"
        >
          <div className="absolute inset-0 opacity-20">
            <img src={heroImage} alt="CTA" className="h-full w-full object-cover" />
          </div>
          <div className="relative z-10 space-y-7">
            <h2 className="font-display text-4xl font-bold leading-[0.95] text-white lg:text-7xl">
              {cta_section.title_1} <br /> <span className="text-primary">{cta_section.title_2}</span> {cta_section.title_3}
            </h2>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-white/70 md:text-xl">
              {cta_section.description}
            </p>
            <div className="flex items-center justify-center pt-4">
              <Button size="lg" className="h-14 rounded-full px-10 text-base font-semibold" asChild>
                <Link to={cta_section.button_link} className="flex items-center gap-3">
                  {cta_section.button_text}
                  <ArrowUpRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/70 py-16">
        <div className="container px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="font-display text-2xl font-bold tracking-tight dark:text-white">
                {theme.logo_text} <span className="text-primary">{theme.logo_accent}</span>
              </span>
            </div>
            <div className="meta-text flex items-center gap-8 text-[11px] uppercase text-muted-foreground">
              <Link to="/turlar" className="hover:text-primary transition-colors">Turlar</Link>
              <Link to="/balon" className="hover:text-primary transition-colors">Balon</Link>
              <Link to="/aktiviteler" className="hover:text-primary transition-colors">Aktiviteler</Link>
              <Link to="/planner" className="hover:text-primary transition-colors">AI Planner</Link>
            </div>
          </div>
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-10 text-xs text-muted-foreground md:flex-row">
            <p>{theme.footer_text}</p>
            <div className="meta-text flex items-center gap-6">
              <span>TR</span>
              <div className="h-3 w-px bg-border" />
              <span>EUR</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
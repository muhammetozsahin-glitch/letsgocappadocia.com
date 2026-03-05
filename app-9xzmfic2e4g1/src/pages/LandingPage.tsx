import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin, Calendar, Compass, ShieldCheck, Zap, ArrowRight, Star, ArrowUpRight, Play, Globe } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const FeatureCard = ({ icon: Icon, title, description, index }: { icon: any, title: string, description: string, index: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="group p-6 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-luxury hover:shadow-xl transition-luxury"
  >
    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-luxury">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm font-medium">{description}</p>
  </motion.div>
);

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20" ref={containerRef}>
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Cinematic Background */}
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400" 
            alt="Cappadocia" 
            className="w-full h-full object-cover scale-105"
          />
        </motion.div>

        {/* Hero Content */}
        <div className="container relative z-20 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold mb-8 tracking-widest uppercase"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Yapay Zeka Destekli Premium Deneyim
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-[0.95] tracking-tighter"
          >
            KAPADOKYA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">
              EFSANESİ
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed font-medium italic"
          >
            "Sıradan bir gezi değil, ruhunuza dokunacak bir keşif hikayesi. Saniyeler içinde size özel kurgulanmış premium rotalar."
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary-dark shadow-xl shadow-primary/20 rounded-2xl transition-luxury group" asChild>
              <Link to="/planner">
                Hemen Keşfet
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <button className="h-14 px-8 text-lg font-bold bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl hover:bg-white/20 transition-luxury flex items-center gap-2">
              <Play className="h-5 w-5 fill-white" />
              Tanıtımı İzle
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 8, 0] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40"
        >
          <div className="w-5 h-8 border-2 border-white/20 rounded-full flex justify-center p-1">
            <div className="w-1 h-1 bg-white/40 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="container relative z-10 px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { label: "Mutlu Gezgin", value: "25k+", icon: Globe },
              { label: "Kişiye Özel Rota", value: "100k+", icon: Compass },
              { label: "Doğrulanmış Mekan", value: "1.2k", icon: MapPin },
              { label: "Müşteri Puanı", value: "4.9", icon: Star },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="space-y-3"
              >
                <div className="w-10 h-10 mx-auto bg-white/5 rounded-xl flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-accent" />
                </div>
                <div className="text-3xl md:text-4xl font-black text-primary">{stat.value}</div>
                <div className="text-white/60 font-bold tracking-widest uppercase text-[10px]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="container px-6">
          <div className="max-w-2xl mx-auto text-center mb-16 space-y-4">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-primary font-black tracking-widest uppercase text-xs"
            >
              Kusursuz Mühendislik
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight"
            >
              Seyahatinizi Sanata <br /> <span className="text-gradient">Dönüştürüyoruz</span>
            </motion.h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              index={0}
              icon={Zap}
              title="Yapay Zeka Mimari"
              description="OpenAI 4o-mini altyapısıyla her detayı düşünülmüş, tutarlı ve akıcı bir seyahat programı."
            />
            <FeatureCard 
              index={1}
              icon={ShieldCheck}
              title="Premium Veri"
              description="Google Places verileriyle gerçek fotoğraflar, anlık çalışma saatleri ve güvenilir yorumlar."
            />
            <FeatureCard 
              index={2}
              icon={MapPin}
              title="Akıllı Navigasyon"
              description="Sadece rota değil, Google Directions ile en mantıklı sıralama ve ulaşım süreleri."
            />
            <FeatureCard 
              index={3}
              icon={Compass}
              title="Kürasyon"
              description="Yerel rehberlerin gizli favorileri ve turistik kalabalıkların ötesindeki özel duraklar."
            />
            <FeatureCard 
              index={4}
              icon={Calendar}
              title="Dinamik Kontrol"
              description="Planınızı dilediğiniz zaman sürükle-bırak yöntemiyle revize edin, her an güncel kalın."
            />
            <FeatureCard 
              index={5}
              icon={Sparkles}
              title="Modern Estetik"
              description="En yüksek standartlarda kullanıcı deneyimi için tasarlanmış akıcı ve şık arayüz."
            />
          </div>
        </div>
      </section>

      {/* Luxury CTA */}
      <section className="py-20 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto rounded-[2.5rem] bg-secondary p-12 lg:p-20 text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 opacity-20 grayscale hover:grayscale-0 transition-luxury duration-1000 group-hover:scale-105">
            <img src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400" alt="CTA" className="w-full h-full object-cover" />
          </div>
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl lg:text-7xl font-black text-white leading-[0.95] tracking-tighter uppercase">
              BİR SONRAKİ <br /> <span className="text-primary">EFSANENİZİ</span> YAZIN
            </h2>
            <p className="text-white/60 text-lg md:text-xl max-w-xl mx-auto font-medium leading-relaxed">
              Kapadokya'nın zamansız ruhunu, modern teknolojinin gücüyle birleştirin. Bugün başlayın.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="h-16 px-10 text-xl font-bold bg-primary hover:bg-primary-dark rounded-2xl shadow-2xl shadow-primary/20 transition-luxury group" asChild>
                <Link to="/planner" className="flex items-center gap-3">
                  Rotanı Oluştur
                  <ArrowUpRight className="h-6 w-6 group-hover:rotate-45 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Modern Footer */}
      <footer className="py-16 border-t border-border bg-background">
        <div className="container px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <MapPin className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase dark:text-white">
                Kapadokya <span className="text-primary">Efsanesi</span>
              </span>
            </div>
            
            <div className="flex items-center gap-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <Link to="/explore" className="hover:text-primary transition-colors">Keşfet</Link>
              <Link to="/planner" className="hover:text-primary transition-colors">Planla</Link>
              <Link to="/account" className="hover:text-primary transition-colors">Hesabım</Link>
            </div>
          </div>
          
          <div className="mt-16 pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs font-medium">
            <p>© 2026 Cappadocia Legend. Her anı bir hikaye.</p>
            <div className="flex items-center gap-6">
              <span>TR</span>
              <div className="h-3 w-px bg-border" />
              <span>USD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
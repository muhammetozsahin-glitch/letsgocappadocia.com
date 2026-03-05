import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Star, Clock, Filter, Sparkles, Heart, Share2, ArrowUpRight, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'Tümü' },
  { id: 'museum', label: 'Müzeler' },
  { id: 'nature', label: 'Doğa' },
  { id: 'adventure', label: 'Macera' },
  { id: 'gastronomy', label: 'Yemek' },
  { id: 'underground', label: 'Yeraltı Şehirleri' },
];

const PLACES = [
  {
    id: '1',
    name: 'Göreme Açık Hava Müzesi',
    category: 'museum',
    rating: 4.8,
    reviews: 12400,
    duration: '2-3 Saat',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2736e413-5912-4327-880c-f8494d625176.jpg',
    description: 'UNESCO Dünya Mirası listesinde yer alan, 10. ve 12. yüzyıllar arasında oyulmuş eşsiz kiliseler topluluğu.',
  },
  {
    id: '2',
    name: 'Uçhisar Kalesi',
    category: 'nature',
    rating: 4.7,
    reviews: 8500,
    duration: '1 Saat',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_8ea8dda5-57a3-4533-bd11-28440db86c34.jpg',
    description: 'Kapadokya\'s en yüksek noktası. Tüm bölgeyi panoramik olarak görebileceğiniz devasa bir doğal kaya kalesi.',
  },
  {
    id: '3',
    name: 'Derinkuyu Yeraltı Şehri',
    category: 'underground',
    rating: 4.9,
    reviews: 15200,
    duration: '1.5 Saat',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9c62deaa-2f09-44b8-a9e4-1d03ae155cce.jpg',
    description: 'Binlerce yıl önce insanların saldırılardan korunmak için inşa ettiği, yerin 85 metre altına kadar uzanan muazzam bir yapı.',
  },
  {
    id: '4',
    name: 'Ihlara Vadisi',
    category: 'nature',
    rating: 4.6,
    reviews: 6300,
    duration: '4-5 Saat',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_a0a63c27-9e25-4f1a-89ef-aea901ec645d.jpg',
    description: 'Melendiz Çayı\'nın aşındırmasıyla oluşmuş 14 kilometrelik kanyon. İçerisinde onlarca kaya oyma kilise bulunur.',
  },
  {
    id: '5',
    name: 'Paşabağ (Keşişler Vadisi)',
    category: 'nature',
    rating: 4.8,
    reviews: 9100,
    duration: '1 Saat',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_8cfa89df-0b41-4cb0-9e72-f7c2e4ebda81.jpg',
    description: 'Kapadokya\'nın en karakteristik peribacalarının bulunduğu yer. Bazı peribacaları üç şapkalı yapıya sahiptir.',
  },
  {
    id: '6',
    name: 'Avanos Çömlek Atölyeleri',
    category: 'adventure',
    rating: 4.5,
    reviews: 4200,
    duration: '1-2 Saat',
    image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dd8b8233-fb7c-4dc3-90fe-eb24b5e136ee.jpg',
    description: 'Kızılırmak\'tan çıkan kızıl toprakla binlerce yıldır devam eden çömlekçilik geleneğini deneyimleyin.',
  }
];

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlaces = PLACES.filter(place => {
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          place.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 pb-20">
      {/* Immersive Header */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden mb-12">
        <div className="absolute inset-0 z-0 scale-105">
          <img 
            src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400" 
            alt="Explore Hero" 
            className="w-full h-full object-cover grayscale-[0.2]" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
        </div>

        <div className="container relative z-20 px-6 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Efsanevi Duraklar
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none uppercase"
          >
            KAPADOKYA <span className="text-primary uppercase">KEŞFİ</span>
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto relative group"
          >
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Bir efsane veya aktivite arayın..." 
              className="w-full h-14 pl-12 pr-6 bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/40 rounded-2xl text-base font-bold focus:bg-white focus:text-gray-900 transition-luxury shadow-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </motion.div>
        </div>
      </section>

      <div className="container px-6">
        {/* Categories Carousel */}
        <div className="flex items-center gap-3 overflow-x-auto pb-6 mb-12 no-scrollbar">
          <Button variant="outline" className="h-11 px-6 rounded-xl border-2 border-gray-100 dark:border-white/10 font-black uppercase tracking-widest text-[10px] shrink-0 bg-white/5 backdrop-blur-md">
            <Filter className="h-3.5 w-3.5 mr-2 text-primary" />
            Filtrele
          </Button>
          <div className="w-px h-6 bg-gray-100 dark:bg-white/10 mx-1 shrink-0" />
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shrink-0 transition-luxury ${selectedCategory === cat.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-white/5 border-2 border-gray-100 dark:border-white/10 text-gray-400 hover:border-primary/40 hover:text-primary'
              }`}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Results Grid */}
        <AnimatePresence mode="wait">
          {filteredPlaces.length > 0 ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredPlaces.map((place, index) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden border-2 border-gray-50 dark:border-white/5 bg-white dark:bg-white/5 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-luxury">
                    <CardContent className="p-0">
                      <div className="relative h-64 overflow-hidden">
                        <img 
                          src={place.image} 
                          alt={place.name} 
                          className="w-full h-full object-cover transition-luxury duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-luxury" />
                        
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 font-black uppercase tracking-widest text-[9px] px-3 py-0.5 rounded-full">
                            {CATEGORIES.find(c => c.id === place.category)?.label}
                          </Badge>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-luxury">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary transition-colors cursor-pointer">
                              <Heart className="h-4 w-4" />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary transition-colors cursor-pointer">
                              <Share2 className="h-4 w-4" />
                            </div>
                          </div>
                          <Button className="bg-primary text-white font-black uppercase tracking-widest text-[9px] rounded-full h-8 px-4">
                            Planla
                          </Button>
                        </div>
                        
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-accent text-gray-900 border-none font-black text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-lg">
                            <Star className="h-3 w-3 fill-gray-900" />
                            {place.rating}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-6 md:p-8 space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors">
                            {place.name}
                          </h3>
                          <p className="text-gray-500 font-medium italic leading-relaxed text-sm line-clamp-2">
                            "{place.description}"
                          </p>
                        </div>

                        <div className="pt-6 flex items-center justify-between border-t border-gray-50 dark:border-white/5">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              <span>{place.duration}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              <Camera className="h-3.5 w-3.5 text-primary" />
                              <span>Görsel</span>
                            </div>
                          </div>
                          <button className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-luxury group/btn">
                            <ArrowUpRight className="h-5 w-5 group-hover/btn:rotate-45 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 text-center space-y-6"
            >
              <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-200 dark:border-white/10">
                <Search className="h-10 w-10 text-gray-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">BULUNAMADI</h3>
                <p className="text-base text-gray-500 font-medium italic max-w-xs mx-auto">
                  Farklı bir keşif terimi deneyin.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-primary text-primary hover:bg-primary hover:text-white transition-luxury"
              >
                Tümü
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

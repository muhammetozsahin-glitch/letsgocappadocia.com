// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/ActivitiesPage.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, Bike, Music, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { activitiesApi } from '@/db/agency-api';
import type { Activity } from '@/types/agency';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=600&fit=crop';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await activitiesApi.getAll();
      setActivities(data);
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activeTab === 'all' 
    ? activities 
    : activities.filter(a => a.category === activeTab);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <Badge className="mb-4 bg-white/20 backdrop-blur-sm text-white border-white/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Macera & Eğlence
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Aktiviteler
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            ATV safari, at binme, Türk gecesi ve daha fazlası ile 
            Kapadokya'yı farklı deneyimleyin.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">Aktiviteler</span>
          </nav>
        </div>
      </div>

      {/* Kategori Kartları */}
      <section className="py-12 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 rounded-2xl p-6 border border-orange-200/50">
              <Bike className="w-10 h-10 text-orange-500 mb-4" />
              <h3 className="text-lg font-bold text-orange-700 dark:text-orange-400 mb-2">Macera</h3>
              <p className="text-sm text-muted-foreground">ATV safari, at binme, quad bike</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/30 dark:to-pink-900/20 rounded-2xl p-6 border border-pink-200/50">
              <Music className="w-10 h-10 text-pink-500 mb-4" />
              <h3 className="text-lg font-bold text-pink-700 dark:text-pink-400 mb-2">Eğlence</h3>
              <p className="text-sm text-muted-foreground">Türk gecesi, folklor, sema</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 rounded-2xl p-6 border border-purple-200/50">
              <Palette className="w-10 h-10 text-purple-500 mb-4" />
              <h3 className="text-lg font-bold text-purple-700 dark:text-purple-400 mb-2">Kültürel</h3>
              <p className="text-sm text-muted-foreground">Çömlekçilik, şarap tadımı</p>
            </div>
          </div>
        </div>
      </section>

      {/* Aktivite Listesi */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="all">Tümü</TabsTrigger>
              <TabsTrigger value="adventure">Macera</TabsTrigger>
              <TabsTrigger value="entertainment">Eğlence</TabsTrigger>
              <TabsTrigger value="cultural">Kültürel</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-muted animate-pulse rounded-2xl h-[350px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}

          {!loading && filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Bu kategoride aktivite bulunamadı.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
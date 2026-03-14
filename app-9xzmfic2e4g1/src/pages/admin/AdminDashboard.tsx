// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA: src/pages/admin/AdminDashboard.tsx
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Hotel, Users, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/db/supabase';

interface Stats {
  balloons: number;
  hotels: number;
  staff: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    balloons: 0,
    hotels: 0,
    staff: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [balloons, hotels, staff] = await Promise.all([
        supabase.from('balloon_flights').select('id', { count: 'exact', head: true }),
        supabase.from('hotels').select('id', { count: 'exact', head: true }),
        supabase.from('staff').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        balloons: balloons.count || 0,
        hotels: hotels.count || 0,
        staff: staff.count || 0,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const menuItems = [
    { 
      title: 'Balon Turları', 
      description: 'Balon uçuşlarını yönet', 
      icon: Cloud, 
      href: '/admin/balonlar',
      count: stats.balloons,
      color: 'bg-amber-500'
    },
    { 
      title: 'Oteller', 
      description: 'Anlaşmalı oteller', 
      icon: Hotel, 
      href: '/admin/oteller',
      count: stats.hotels,
      color: 'bg-emerald-500'
    },
    { 
      title: 'Personel', 
      description: 'Rehber ve şoförler', 
      icon: Users, 
      href: '/admin/personel',
      count: stats.staff,
      color: 'bg-rose-500'
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">LetsGo Cappadocia yönetim paneli</p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.balloons}</div>
              <p className="text-sm text-muted-foreground">Balon</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.hotels}</div>
              <p className="text-sm text-muted-foreground">Otel</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.staff}</div>
              <p className="text-sm text-muted-foreground">Personel</p>
            </CardContent>
          </Card>
        </div>

        {/* Menü */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Card className="group hover:shadow-lg transition-all cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold text-muted-foreground">{item.count}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                  <div className="flex items-center text-sm text-primary font-medium">
                    Yönet
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Hızlı İşlemler */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/planner">Planner'ı Aç</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/explore">Keşfet'e Git</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/balon">Balon Sayfası</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api, { AdminStats } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Users, Map, BarChart3, Database, Shield, ShieldCheck,
  Trash2, Eye, EyeOff, Search, ChevronLeft, ChevronRight,
  Loader2, TrendingUp, Globe, Heart, MapPin, Calendar,
  RefreshCw, AlertTriangle, CheckCircle2, ArrowUpRight,
  LayoutDashboard, UserCog, Route, HardDrive, LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
type TabId = 'dashboard' | 'users' | 'trips' | 'cache';

interface AdminUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  full_name?: string;
  created_at: string;
  avatar_url?: string;
}

interface AdminTrip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  created_at: string;
  is_public: boolean;
  views_count: number;
  likes_count: number;
  user_id: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Sidebar Tabs
// ────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users' as const,     label: 'Kullanıcılar', icon: UserCog },
  { id: 'trips' as const,     label: 'Geziler', icon: Route },
  { id: 'cache' as const,     label: 'Cache & Sistem', icon: HardDrive },
];

// ────────────────────────────────────────────────────────────────────────────
// Stat Card
// ────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) {
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
            {sub && <p className="text-[11px] font-semibold text-gray-500">{sub}</p>}
          </div>
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Admin Page
// ────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Auth guard
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      toast.error('Bu sayfaya erişim yetkiniz yok');
      navigate('/');
    }
  }, [profile, navigate]);

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Admin Panel</h2>
              <p className="text-[10px] text-gray-400 font-semibold">{profile.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  isActive
                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", isActive && "text-orange-600")} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 transition-all"
          >
            <ArrowUpRight className="h-4 w-4" />
            Siteye Dön
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-8"
          >
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'trips' && <TripsTab />}
            {activeTab === 'cache' && <CacheTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Dashboard Tab
// ════════════════════════════════════════════════════════════════════════════
function DashboardTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.admin.getStats();
      setStats(data);
    } catch (err) {
      console.error('Stats error:', err);
      toast.error('İstatistikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Sistem genel görünümü</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats} className="gap-2 rounded-xl font-bold">
          <RefreshCw className="h-3.5 w-3.5" /> Yenile
        </Button>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Kullanıcı" value={stats.total_users} icon={Users} color="bg-blue-500" sub={`+${stats.users_this_week} bu hafta`} />
        <StatCard label="Toplam Gezi" value={stats.total_trips} icon={Map} color="bg-green-500" sub={`+${stats.trips_this_week} bu hafta`} />
        <StatCard label="Yayınlanan Rehber" value={stats.public_guides} icon={Globe} color="bg-purple-500" />
        <StatCard label="Toplam Görüntülenme" value={stats.total_views} icon={Eye} color="bg-orange-500" sub={`${stats.total_likes} beğeni`} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bugün Yeni Kullanıcı" value={stats.users_today} icon={TrendingUp} color="bg-cyan-500" />
        <StatCard label="Bugün Yeni Gezi" value={stats.trips_today} icon={Calendar} color="bg-emerald-500" />
        <StatCard label="Cached Yerler" value={stats.cached_places} icon={MapPin} color="bg-amber-500" />
        <StatCard label="Cached Aramalar" value={stats.cached_searches} icon={Database} color="bg-rose-500" />
      </div>

      {/* Quick actions */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">Hızlı İşlemler</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="rounded-xl font-bold gap-2" onClick={() => {}}>
              <Database className="h-4 w-4" /> Cache Temizle
            </Button>
            <Button variant="outline" className="rounded-xl font-bold gap-2" onClick={() => window.open('https://supabase.com/dashboard', '_blank')}>
              <HardDrive className="h-4 w-4" /> Supabase Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Users Tab
// ════════════════════════════════════════════════════════════════════════════
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const limit = 15;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.getUsers({ page, limit, search: search || undefined });
      setUsers(res.users as AdminUser[]);
      setTotal(res.total);
    } catch (err) {
      toast.error('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await api.admin.updateUserRole(userId, newRole);
      toast.success(`Rol güncellendi: ${newRole}`);
      loadUsers();
    } catch {
      toast.error('Rol güncellenemedi');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Kullanıcılar</h1>
          <p className="text-sm text-gray-400 mt-1">{total} kullanıcı kayıtlı</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="E-posta veya isim ile ara..."
          className="h-11 pl-10 rounded-xl"
        />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kullanıcı</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kayıt Tarihi</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500 mx-auto" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-sm text-gray-400 font-semibold">Kullanıcı bulunamadı</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black",
                        u.role === 'admin' ? "bg-orange-600" : "bg-gray-400"
                      )}>
                        {(u.full_name || u.email)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{u.full_name || '—'}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge className={cn(
                      "text-[10px] font-bold rounded-lg border-0 px-2.5",
                      u.role === 'admin'
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    )}>
                      {u.role === 'admin' ? <ShieldCheck className="h-3 w-3 mr-1" /> : null}
                      {u.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500 font-semibold">
                    {(() => { try { return format(new Date(u.created_at), 'd MMM yyyy', { locale: tr }); } catch { return '—'; } })()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {u.id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-bold rounded-lg gap-1.5"
                        onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                      >
                        {u.role === 'admin' ? <EyeOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        {u.role === 'admin' ? 'User Yap' : 'Admin Yap'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 dark:border-gray-800">
            <p className="text-xs text-gray-400 font-semibold">Sayfa {page} / {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0 rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0 rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Trips Tab
// ════════════════════════════════════════════════════════════════════════════
function TripsTab() {
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [publicOnly, setPublicOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.getTrips({ page, limit, search: search || undefined, publicOnly });
      setTrips(res.trips as AdminTrip[]);
      setTotal(res.total);
    } catch (err) {
      toast.error('Geziler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [page, search, publicOnly]);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const handleDelete = async (tripId: string) => {
    try {
      await api.admin.deleteTrip(tripId);
      toast.success('Gezi silindi');
      loadTrips();
    } catch {
      toast.error('Gezi silinemedi');
    }
  };

  const handleUnpublish = async (tripId: string) => {
    try {
      await api.admin.unpublishTrip(tripId);
      toast.success('Rehber yayından kaldırıldı');
      loadTrips();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Geziler</h1>
          <p className="text-sm text-gray-400 mt-1">{total} gezi kaydı</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Başlık ile ara..."
            className="h-11 pl-10 rounded-xl"
          />
        </div>
        <Button
          variant={publicOnly ? "default" : "outline"}
          size="sm"
          onClick={() => { setPublicOnly(!publicOnly); setPage(1); }}
          className={cn("rounded-xl font-bold gap-2 h-11", publicOnly && "bg-purple-600 hover:bg-purple-700")}
        >
          <Globe className="h-4 w-4" />
          Sadece Rehberler
        </Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gezi</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarih</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Durum</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">İstatistik</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500 mx-auto" /></td></tr>
              ) : trips.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-sm text-gray-400 font-semibold">Gezi bulunamadı</td></tr>
              ) : trips.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{t.title}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{t.id.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs text-gray-500 font-semibold">
                      {t.start_date && t.end_date ? (
                        <>
                          {(() => { try { return format(new Date(t.start_date), 'd MMM', { locale: tr }); } catch { return '—'; } })()}
                          {' — '}
                          {(() => { try { return format(new Date(t.end_date), 'd MMM yyyy', { locale: tr }); } catch { return '—'; } })()}
                        </>
                      ) : '—'}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {t.is_public ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold rounded-lg border-0">
                        <Globe className="h-3 w-3 mr-1" /> Yayında
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-800 text-[10px] font-bold rounded-lg border-0">
                        Özel
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{t.views_count}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{t.likes_count}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg"
                        onClick={() => window.open(`/trip/${t.id}`, '_blank')}>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                      {t.is_public && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                          onClick={() => handleUnpublish(t.id)}>
                          <EyeOff className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-bold">Geziyi Sil</AlertDialogTitle>
                            <AlertDialogDescription>
                              <strong>"{t.title}"</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-red-600 hover:bg-red-700 rounded-xl font-bold">
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 dark:border-gray-800">
            <p className="text-xs text-gray-400 font-semibold">Sayfa {page} / {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0 rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0 rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Cache Tab
// ════════════════════════════════════════════════════════════════════════════
function CacheTab() {
  const [cacheStats, setCacheStats] = useState({ places_count: 0, search_count: 0 });
  const [recentPlaces, setRecentPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, recent] = await Promise.all([
        api.admin.getCacheStats(),
        api.admin.getRecentCachedPlaces(10),
      ]);
      setCacheStats(stats);
      setRecentPlaces(recent);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleClear = async (type: 'places' | 'search' | 'all') => {
    setClearing(true);
    try {
      await api.admin.clearCache(type);
      toast.success('Cache temizlendi');
      loadData();
    } catch {
      toast.error('Cache temizlenemedi');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Cache & Sistem</h1>
          <p className="text-sm text-gray-400 mt-1">Google Places cache yönetimi</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2 rounded-xl font-bold">
          <RefreshCw className="h-3.5 w-3.5" /> Yenile
        </Button>
      </div>

      {/* Cache Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Cached Yerler" value={cacheStats.places_count} icon={MapPin} color="bg-blue-500" sub="places_cache tablosu" />
        <StatCard label="Cached Aramalar" value={cacheStats.search_count} icon={Search} color="bg-purple-500" sub="search_cache tablosu" />
      </div>

      {/* Clear actions */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-gray-900 dark:text-white">Cache Temizleme</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">Temizlenen veriler bir sonraki aramada Google'dan tekrar çekilir. Maliyet artışına neden olabilir.</p>
              <div className="flex flex-wrap gap-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2" disabled={clearing}>
                      <Database className="h-3.5 w-3.5" /> Yer Cache Temizle
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Yer Cache'ini Temizle</AlertDialogTitle>
                      <AlertDialogDescription>{cacheStats.places_count} cached yer silinecek.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleClear('places')} className="bg-amber-600 hover:bg-amber-700 rounded-xl">Temizle</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2" disabled={clearing}>
                      <Search className="h-3.5 w-3.5" /> Arama Cache Temizle
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Arama Cache'ini Temizle</AlertDialogTitle>
                      <AlertDialogDescription>{cacheStats.search_count} cached arama silinecek.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleClear('search')} className="bg-amber-600 hover:bg-amber-700 rounded-xl">Temizle</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="rounded-xl font-bold gap-2" disabled={clearing}>
                      <Trash2 className="h-3.5 w-3.5" /> Tüm Cache'i Temizle
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tüm Cache Silinsin mi?</AlertDialogTitle>
                      <AlertDialogDescription>Tüm cached yerler ve aramalar silinecek. Google API maliyetleri artabilir.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Vazgeç</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleClear('all')} className="bg-red-600 hover:bg-red-700 rounded-xl">Hepsini Temizle</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent cached places */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">Son Cached Yerler</h3>
          {loading ? (
            <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-orange-500 mx-auto" /></div>
          ) : recentPlaces.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Cache boş</p>
          ) : (
            <div className="space-y-2">
              {recentPlaces.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.category || 'Turistik Yer'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.rating && (
                      <Badge className="bg-amber-50 text-amber-700 text-[10px] font-bold border-0 rounded-lg">
                        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500 mr-0.5" />{p.rating}
                      </Badge>
                    )}
                    <span className="text-[10px] text-gray-400 font-mono">
                      {(() => { try { return format(new Date(p.created_at), 'd MMM HH:mm', { locale: tr }); } catch { return ''; } })()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
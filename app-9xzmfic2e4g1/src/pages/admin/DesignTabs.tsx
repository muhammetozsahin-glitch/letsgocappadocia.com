import { useState, useEffect, useCallback } from 'react';
import api from '@/db/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Save, Loader2, RefreshCw, Eye, GripVertical, Plus, Trash2,
  Image, Type, Palette, Link2, Megaphone, Layout, ChevronUp, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/use-site-settings';

// ────────────────────────────────────────────────────────────────────────────
// Shared components
// ────────────────────────────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h1>
      <p className="text-sm text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</Label>
      {children}
    </div>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <Button onClick={onClick} disabled={saving} className="gap-2 rounded-xl font-bold bg-orange-600 hover:bg-orange-700">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Kaydet
    </Button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 1. CONTENT TAB — Hero, Stats, Features, CTA
// ════════════════════════════════════════════════════════════════════════════
export function ContentTab() {
  const { settings, refresh } = useSiteSettings();
  const [hero, setHero] = useState(settings.hero);
  const [stats, setStats] = useState(settings.stats);
  const [features, setFeatures] = useState(settings.features);
  const [ctaSection, setCtaSection] = useState(settings.cta_section);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'hero' | 'stats' | 'features' | 'cta'>('hero');

  useEffect(() => {
    setHero(settings.hero);
    setStats(settings.stats);
    setFeatures(settings.features);
    setCtaSection(settings.cta_section);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([
        api.settings.set('hero', hero),
        api.settings.set('stats', stats),
        api.settings.set('features', features),
        api.settings.set('cta_section', ctaSection),
      ]);
      await refresh();
      toast.success('İçerik kaydedildi');
    } catch { toast.error('Kaydetme başarısız'); }
    finally { setSaving(false); }
  };

  const sections = [
    { id: 'hero' as const, label: 'Hero Bölümü', icon: Image },
    { id: 'stats' as const, label: 'İstatistikler', icon: Type },
    { id: 'features' as const, label: 'Özellikler', icon: Layout },
    { id: 'cta' as const, label: 'CTA Bölümü', icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Site İçerik Yönetimi" sub="Landing page metinleri ve görselleri" />
        <SaveButton saving={saving} onClick={save} />
      </div>

      {/* Section switcher */}
      <div className="flex gap-2">
        {sections.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                activeSection === s.id
                  ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                  : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}>
              <Icon className="h-3.5 w-3.5" />{s.label}
            </button>
          );
        })}
      </div>

      {/* Hero */}
      {activeSection === 'hero' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Başlık Satır 1">
                <Input value={hero.title_line1} onChange={e => setHero({ ...hero, title_line1: e.target.value })} className="rounded-xl" />
              </FieldGroup>
              <FieldGroup label="Başlık Satır 2 (Renkli)">
                <Input value={hero.title_line2} onChange={e => setHero({ ...hero, title_line2: e.target.value })} className="rounded-xl" />
              </FieldGroup>
            </div>
            <FieldGroup label="Alt Başlık">
              <Textarea value={hero.subtitle} onChange={e => setHero({ ...hero, subtitle: e.target.value })} className="rounded-xl min-h-[80px]" />
            </FieldGroup>
            <FieldGroup label="Rozet Metni">
              <Input value={hero.badge_text} onChange={e => setHero({ ...hero, badge_text: e.target.value })} className="rounded-xl" />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Birincil Buton Metni">
                <Input value={hero.cta_primary_text} onChange={e => setHero({ ...hero, cta_primary_text: e.target.value })} className="rounded-xl" />
              </FieldGroup>
              <FieldGroup label="Birincil Buton Linki">
                <Input value={hero.cta_primary_link} onChange={e => setHero({ ...hero, cta_primary_link: e.target.value })} className="rounded-xl" />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="İkincil Buton Metni">
                <Input value={hero.cta_secondary_text} onChange={e => setHero({ ...hero, cta_secondary_text: e.target.value })} className="rounded-xl" />
              </FieldGroup>
              <FieldGroup label="İkincil Buton Linki">
                <Input value={hero.cta_secondary_link || ''} onChange={e => setHero({ ...hero, cta_secondary_link: e.target.value })} className="rounded-xl" />
              </FieldGroup>
            </div>
            <FieldGroup label="Arka Plan Görsel URL'si">
              <Input value={hero.bg_image} onChange={e => setHero({ ...hero, bg_image: e.target.value })} className="rounded-xl" />
              {hero.bg_image && (
                <div className="mt-2 h-32 rounded-xl overflow-hidden bg-gray-100">
                  <img src={hero.bg_image} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {activeSection === 'stats' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 space-y-4">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-300 w-5">{i + 1}</span>
                <Input value={stat.value} onChange={e => { const s = [...stats]; s[i] = { ...s[i], value: e.target.value }; setStats(s); }}
                  placeholder="Değer" className="rounded-xl flex-1" />
                <Input value={stat.label} onChange={e => { const s = [...stats]; s[i] = { ...s[i], label: e.target.value }; setStats(s); }}
                  placeholder="Etiket" className="rounded-xl flex-1" />
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-400 hover:text-red-600 rounded-lg"
                  onClick={() => setStats(stats.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold"
              onClick={() => setStats([...stats, { label: 'Yeni', value: '0' }])}><Plus className="h-3.5 w-3.5" />İstatistik Ekle</Button>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      {activeSection === 'features' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Bölüm Rozeti">
                <Input value={features.section_badge} onChange={e => setFeatures({ ...features, section_badge: e.target.value })} className="rounded-xl" />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-2">
                <FieldGroup label="Başlık 1">
                  <Input value={features.section_title_1} onChange={e => setFeatures({ ...features, section_title_1: e.target.value })} className="rounded-xl" />
                </FieldGroup>
                <FieldGroup label="Başlık 2 (Renkli)">
                  <Input value={features.section_title_2} onChange={e => setFeatures({ ...features, section_title_2: e.target.value })} className="rounded-xl" />
                </FieldGroup>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Özellik Kartları</p>
              {features.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <span className="text-[10px] font-black text-gray-300 mt-2.5 w-5">{i + 1}</span>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={item.icon} onChange={e => { const f = { ...features, items: [...features.items] }; f.items[i] = { ...f.items[i], icon: e.target.value }; setFeatures(f); }}
                        placeholder="İkon adı (ör: Zap)" className="rounded-lg text-xs h-9" />
                      <Input value={item.title} onChange={e => { const f = { ...features, items: [...features.items] }; f.items[i] = { ...f.items[i], title: e.target.value }; setFeatures(f); }}
                        placeholder="Başlık" className="rounded-lg text-xs h-9" />
                    </div>
                    <Textarea value={item.description} onChange={e => { const f = { ...features, items: [...features.items] }; f.items[i] = { ...f.items[i], description: e.target.value }; setFeatures(f); }}
                      placeholder="Açıklama" className="rounded-lg text-xs min-h-[50px]" />
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 rounded-lg mt-1"
                    onClick={() => { const f = { ...features, items: features.items.filter((_, j) => j !== i) }; setFeatures(f); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold"
                onClick={() => setFeatures({ ...features, items: [...features.items, { icon: 'Star', title: 'Yeni Özellik', description: '' }] })}><Plus className="h-3.5 w-3.5" />Özellik Ekle</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      {activeSection === 'cta' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <FieldGroup label="Başlık 1"><Input value={ctaSection.title_1} onChange={e => setCtaSection({ ...ctaSection, title_1: e.target.value })} className="rounded-xl" /></FieldGroup>
              <FieldGroup label="Başlık 2 (Renkli)"><Input value={ctaSection.title_2} onChange={e => setCtaSection({ ...ctaSection, title_2: e.target.value })} className="rounded-xl" /></FieldGroup>
              <FieldGroup label="Başlık 3"><Input value={ctaSection.title_3} onChange={e => setCtaSection({ ...ctaSection, title_3: e.target.value })} className="rounded-xl" /></FieldGroup>
            </div>
            <FieldGroup label="Açıklama"><Textarea value={ctaSection.description} onChange={e => setCtaSection({ ...ctaSection, description: e.target.value })} className="rounded-xl" /></FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Buton Metni"><Input value={ctaSection.button_text} onChange={e => setCtaSection({ ...ctaSection, button_text: e.target.value })} className="rounded-xl" /></FieldGroup>
              <FieldGroup label="Buton Linki"><Input value={ctaSection.button_link} onChange={e => setCtaSection({ ...ctaSection, button_link: e.target.value })} className="rounded-xl" /></FieldGroup>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 2. BANNER TAB
// ════════════════════════════════════════════════════════════════════════════
export function BannerTab() {
  const { settings, refresh } = useSiteSettings();
  const [banner, setBanner] = useState(settings.banner);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setBanner(settings.banner); }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await api.settings.set('banner', banner);
      await refresh();
      toast.success('Banner ayarları kaydedildi');
    } catch { toast.error('Kaydetme başarısız'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Duyuru Bannerı" sub="Sitenin üstünde görünen duyuru barı" />
        <SaveButton saving={saving} onClick={save} />
      </div>

      {/* Preview */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Eye className="h-3.5 w-3.5" /> Önizleme
        </div>
        {banner.enabled ? (
          <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: banner.bg_color, color: banner.text_color }}>
            <span>{banner.text || 'Banner metni...'}</span>
            {banner.link_text && <span className="underline font-bold">{banner.link_text}</span>}
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-gray-400">Banner kapalı</div>
        )}
      </Card>

      {/* Settings */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Banner Aktif</p>
              <p className="text-xs text-gray-400">Açıkken site üstünde görünür</p>
            </div>
            <Switch checked={banner.enabled} onCheckedChange={v => setBanner({ ...banner, enabled: v })} />
          </div>

          <FieldGroup label="Banner Metni">
            <Input value={banner.text} onChange={e => setBanner({ ...banner, text: e.target.value })} placeholder="🎈 Balon turları bu hafta %20 indirimli!" className="rounded-xl" />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Link"><Input value={banner.link} onChange={e => setBanner({ ...banner, link: e.target.value })} placeholder="/planner" className="rounded-xl" /></FieldGroup>
            <FieldGroup label="Link Metni"><Input value={banner.link_text} onChange={e => setBanner({ ...banner, link_text: e.target.value })} placeholder="Hemen Planla →" className="rounded-xl" /></FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Arka Plan Rengi">
              <div className="flex gap-2">
                <input type="color" value={banner.bg_color} onChange={e => setBanner({ ...banner, bg_color: e.target.value })} className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer" />
                <Input value={banner.bg_color} onChange={e => setBanner({ ...banner, bg_color: e.target.value })} className="rounded-xl flex-1" />
              </div>
            </FieldGroup>
            <FieldGroup label="Metin Rengi">
              <div className="flex gap-2">
                <input type="color" value={banner.text_color} onChange={e => setBanner({ ...banner, text_color: e.target.value })} className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer" />
                <Input value={banner.text_color} onChange={e => setBanner({ ...banner, text_color: e.target.value })} className="rounded-xl flex-1" />
              </div>
            </FieldGroup>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Kapatılabilir</p>
              <p className="text-xs text-gray-400">Kullanıcı X ile kapatabilsin</p>
            </div>
            <Switch checked={banner.dismissible} onCheckedChange={v => setBanner({ ...banner, dismissible: v })} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 3. THEME TAB
// ════════════════════════════════════════════════════════════════════════════
export function ThemeTab() {
  const { settings, refresh } = useSiteSettings();
  const [theme, setTheme] = useState(settings.theme);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setTheme(settings.theme); }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await api.settings.set('theme', theme);
      await refresh();
      toast.success('Tema ayarları kaydedildi');
    } catch { toast.error('Kaydetme başarısız'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Tema & Marka Ayarları" sub="Logo, site adı ve renk yapılandırması" />
        <SaveButton saving={saving} onClick={save} />
      </div>

      {/* Preview */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Eye className="h-3.5 w-3.5" /> Logo Önizleme
        </div>
        <div className="p-8 flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-black"
            style={{ backgroundColor: theme.primary_color }}>
            {theme.logo_text?.[0] || 'K'}
          </div>
          <span className="text-xl font-black tracking-tight">
            {theme.logo_text} <span style={{ color: theme.primary_color }}>{theme.logo_accent}</span>
          </span>
        </div>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6 space-y-5">
          <FieldGroup label="Site Adı">
            <Input value={theme.site_name} onChange={e => setTheme({ ...theme, site_name: e.target.value })} className="rounded-xl" />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Logo Metin (Ana)">
              <Input value={theme.logo_text} onChange={e => setTheme({ ...theme, logo_text: e.target.value })} className="rounded-xl" />
            </FieldGroup>
            <FieldGroup label="Logo Metin (Vurgulu)">
              <Input value={theme.logo_accent} onChange={e => setTheme({ ...theme, logo_accent: e.target.value })} className="rounded-xl" />
            </FieldGroup>
          </div>

          <FieldGroup label="Ana Renk">
            <div className="flex gap-3 items-center">
              <input type="color" value={theme.primary_color} onChange={e => setTheme({ ...theme, primary_color: e.target.value })}
                className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer" />
              <Input value={theme.primary_color} onChange={e => setTheme({ ...theme, primary_color: e.target.value })} className="rounded-xl flex-1" />
              <div className="flex gap-1">
                {['#EA580C', '#2563EB', '#059669', '#7C3AED', '#DB2777', '#D97706'].map(c => (
                  <button key={c} onClick={() => setTheme({ ...theme, primary_color: c })}
                    className={cn("w-8 h-8 rounded-lg border-2 transition-all", theme.primary_color === c ? "border-gray-900 scale-110" : "border-transparent")}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </FieldGroup>

          <FieldGroup label="Footer Metni">
            <Input value={theme.footer_text} onChange={e => setTheme({ ...theme, footer_text: e.target.value })} className="rounded-xl" />
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 4. NAVBAR TAB
// ════════════════════════════════════════════════════════════════════════════
export function NavbarTab() {
  const { settings, refresh } = useSiteSettings();
  const [items, setItems] = useState(settings.navbar.items);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setItems(settings.navbar.items); }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await api.settings.set('navbar', { items });
      await refresh();
      toast.success('Menü ayarları kaydedildi');
    } catch { toast.error('Kaydetme başarısız'); }
    finally { setSaving(false); }
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newItems = [...items];
    const target = index + direction;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    newItems.forEach((item, i) => item.order = i + 1);
    setItems(newItems);
  };

  const sorted = [...items].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Sayfa Sıralama & Menü" sub="Navbar menü öğelerini düzenleyin" />
        <SaveButton saving={saving} onClick={save} />
      </div>

      {/* Preview */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Eye className="h-3.5 w-3.5" /> Menü Önizleme
        </div>
        <div className="p-5 flex items-center gap-6">
          {sorted.filter(i => i.visible).map(item => (
            <span key={item.path} className="text-sm font-medium text-gray-600">{item.label}</span>
          ))}
        </div>
      </Card>

      {/* Items */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 space-y-3">
          {sorted.map((item, sortedIdx) => {
            const realIdx = items.findIndex(i => i.path === item.path);
            return (
              <div key={item.path} className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                item.visible ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800" : "bg-gray-50 dark:bg-gray-800/30 border-dashed border-gray-200 opacity-60"
              )}>
                <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />

                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => moveItem(realIdx, -1)} disabled={sortedIdx === 0}
                    className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20"><ChevronUp className="h-3 w-3" /></button>
                  <button onClick={() => moveItem(realIdx, 1)} disabled={sortedIdx === sorted.length - 1}
                    className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20"><ChevronDown className="h-3 w-3" /></button>
                </div>

                <Input value={item.label} onChange={e => { const n = [...items]; n[realIdx] = { ...n[realIdx], label: e.target.value }; setItems(n); }}
                  className="rounded-lg h-9 text-sm font-bold flex-1" />
                <Input value={item.path} onChange={e => { const n = [...items]; n[realIdx] = { ...n[realIdx], path: e.target.value }; setItems(n); }}
                  className="rounded-lg h-9 text-sm font-mono text-gray-500 flex-1" />

                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={item.visible} onCheckedChange={v => { const n = [...items]; n[realIdx] = { ...n[realIdx], visible: v }; setItems(n); }} />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 rounded-lg"
                    onClick={() => setItems(items.filter((_, j) => j !== realIdx))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            );
          })}

          <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold mt-2"
            onClick={() => setItems([...items, { label: 'Yeni Sayfa', path: '/yeni', visible: true, order: items.length + 1 }])}>
            <Plus className="h-3.5 w-3.5" />Menü Öğesi Ekle
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
import { createContext, createElement, type ReactNode, useContext, useEffect, useState } from 'react';
import api from '@/db/api';

interface SiteSettings {
  hero: {
    title_line1: string;
    title_line2: string;
    subtitle: string;
    badge_text: string;
    cta_primary_text: string;
    cta_primary_link: string;
    cta_secondary_text: string;
    cta_secondary_link: string;
    bg_image: string;
  };
  stats: { label: string; value: string }[];
  features: {
    section_badge: string;
    section_title_1: string;
    section_title_2: string;
    items: { icon: string; title: string; description: string }[];
  };
  cta_section: {
    title_1: string;
    title_2: string;
    title_3: string;
    description: string;
    button_text: string;
    button_link: string;
  };
  banner: {
    enabled: boolean;
    text: string;
    link: string;
    link_text: string;
    bg_color: string;
    text_color: string;
    dismissible: boolean;
  };
  theme: {
    site_name: string;
    logo_text: string;
    logo_accent: string;
    footer_text: string;
    primary_color: string;
  };
  navbar: {
    items: { label: string; path: string; visible: boolean; order: number }[];
  };
}

// Defaults (used before DB loads)
const DEFAULTS: SiteSettings = {
  hero: {
    title_line1: 'KAPADOKYA', title_line2: 'EFSANESİ',
    subtitle: 'Sıradan bir gezi değil, ruhunuza dokunacak bir keşif hikayesi.',
    badge_text: 'Yapay Zeka Destekli Premium Deneyim',
    cta_primary_text: 'Hemen Keşfet', cta_primary_link: '/planner',
    cta_secondary_text: 'Tanıtımı İzle', cta_secondary_link: '',
    bg_image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400',
  },
  stats: [
    { label: 'Mutlu Gezgin', value: '25k+' },
    { label: 'Kişiye Özel Rota', value: '100k+' },
    { label: 'Doğrulanmış Mekan', value: '1.2k' },
    { label: 'Müşteri Puanı', value: '4.9' },
  ],
  features: {
    section_badge: 'Kusursuz Mühendislik',
    section_title_1: 'Seyahatinizi Sanata',
    section_title_2: 'Dönüştürüyoruz',
    items: [],
  },
  cta_section: {
    title_1: 'BİR SONRAKİ', title_2: 'EFSANENİZİ', title_3: 'YAZIN',
    description: 'Kapadokya\'s zamansız ruhunu, modern teknolojinin gücüyle birleştirin.',
    button_text: 'Rotanı Oluştur', button_link: '/planner',
  },
  banner: { enabled: false, text: '', link: '', link_text: '', bg_color: '#EA580C', text_color: '#FFFFFF', dismissible: true },
  theme: { site_name: 'Kapadokya Efsanesi', logo_text: 'Kapadokya', logo_accent: 'Efsanesi', footer_text: '© 2026 Cappadocia Legend.', primary_color: '#EA580C' },
  // ═══════════════════════════════════════════════════════════════════════════════
  // GÜNCELLENMIŞ NAVBAR - YENİ LİNKLER EKLENDİ
  // ═══════════════════════════════════════════════════════════════════════════════
  navbar: { items: [
    { label: 'Turlar', path: '/turlar', visible: true, order: 1 },
    { label: 'Balon', path: '/balon', visible: true, order: 2 },
    { label: 'Aktiviteler', path: '/aktiviteler', visible: true, order: 3 },
    { label: 'AI Planner', path: '/planner', visible: true, order: 4 },
    { label: 'Keşfet', path: '/explore', visible: true, order: 5 },
  ]},
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULTS,
  loading: true,
  refresh: async () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const all = await api.settings.getAll();
      setSettings({
        hero: all.hero || DEFAULTS.hero,
        stats: all.stats || DEFAULTS.stats,
        features: all.features || DEFAULTS.features,
        cta_section: all.cta_section || DEFAULTS.cta_section,
        banner: all.banner || DEFAULTS.banner,
        theme: all.theme || DEFAULTS.theme,
        navbar: all.navbar || DEFAULTS.navbar,
      });
    } catch (err) {
      console.error('Failed to load site settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const contextValue = { settings, loading, refresh };

  return createElement(SiteSettingsContext.Provider, { value: contextValue }, children);
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSiteSettings } from '@/hooks/use-site-settings';

export function AnnouncementBanner() {
  const { settings } = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);
  const { banner } = settings;

  if (!banner.enabled || dismissed) return null;

  return (
    <div
      className="relative z-[60] flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-semibold"
      style={{ backgroundColor: banner.bg_color, color: banner.text_color }}
    >
      <span>{banner.text}</span>
      {banner.link && banner.link_text && (
        <Link
          to={banner.link}
          className="underline underline-offset-2 font-bold hover:opacity-80 transition-opacity"
        >
          {banner.link_text}
        </Link>
      )}
      {banner.dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
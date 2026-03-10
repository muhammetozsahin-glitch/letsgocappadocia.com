import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, MapPin, Compass, History, User, Settings, LogOut, Home, FileText } from 'lucide-react';
import { useState } from 'react';

export function MobileMenu() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => setOpen(false);
  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden rounded-full">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menüyü aç</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3 text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none text-left">
              <span className="text-base font-semibold">Kapadokya</span>
              <span className="text-xs font-medium text-muted-foreground">Seyahat planlayıcı</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex h-full flex-col py-6">
          {user && profile && (
            <>
              <div className="mb-4 flex items-center gap-3 rounded-2xl border bg-muted/40 p-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials((profile as any)?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{(profile as any)?.email?.split('@')[0]}</p>
                  <p className="truncate text-xs text-muted-foreground">{(profile as any)?.email}</p>
                </div>
              </div>
              <Separator className="mb-4" />
            </>
          )}

          <nav className="flex-1 space-y-1.5">
            <Link to="/" onClick={handleLinkClick} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent">
              <Home className="h-5 w-5 text-muted-foreground" />
              <span>Ana Sayfa</span>
            </Link>
            <Link to="/explore" onClick={handleLinkClick} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent">
              <Compass className="h-5 w-5 text-muted-foreground" />
              <span>Keşfet</span>
            </Link>
            <Link to="/planner" onClick={handleLinkClick} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>Gezi Planla</span>
            </Link>
            {user && (
              <Link to="/account" onClick={handleLinkClick} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent">
                <History className="h-5 w-5 text-muted-foreground" />
                <span>Gezilerim</span>
              </Link>
            )}
            <Link to="/blog" onClick={handleLinkClick} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span>Blog</span>
            </Link>
          </nav>

          <div className="space-y-2 border-t pt-4">
            {user ? (
              <>
                <Link to="/account/profile" onClick={handleLinkClick} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>Profilim</span>
                </Link>
                <Link to="/account/preferences" onClick={handleLinkClick} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span>Tercihler</span>
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    handleLinkClick();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Çıkış Yap</span>
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Button asChild className="w-full rounded-xl">
                  <Link to="/login" onClick={handleLinkClick}>
                    Giriş Yap
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link to="/login" onClick={handleLinkClick}>
                    Kayıt Ol
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

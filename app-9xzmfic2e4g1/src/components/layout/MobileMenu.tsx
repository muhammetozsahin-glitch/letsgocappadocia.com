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

  const handleLinkClick = () => {
    setOpen(false);
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menüyü aç</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-orange-600">
            <MapPin className="h-5 w-5 text-primary" />
            Kapadokya
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full py-6">
          {/* Kullanıcı bilgisi */}
          {user && profile && (
            <>
              <div className="flex items-center gap-3 px-2 py-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials((profile as any)?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {(profile as any)?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(profile as any)?.email}
                  </p>
                </div>
              </div>
              <Separator className="mb-4" />
            </>
          )}

          {/* Navigasyon linkleri */}
          <nav className="flex-1 space-y-1">
            <Link
              to="/"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Home className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Ana Sayfa</span>
            </Link>
            <Link
              to="/explore"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Compass className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Keşfet</span>
            </Link>
            <Link
              to="/planner"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Gezi Planla</span>
            </Link>
            {user && (
              <Link
                to="/account"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
              >
                <History className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Gezilerim</span>
              </Link>
            )}
            <Link
              to="/blog"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Blog</span>
            </Link>
          </nav>

          {/* Alt kısım */}
          <div className="space-y-2 pt-4 border-t">
            {user ? (
              <>
                <Link
                  to="/account/profile"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Profilim</span>
                </Link>
                <Link
                  to="/account/preferences"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Tercihler</span>
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    handleLinkClick();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Çıkış Yap</span>
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to="/login" onClick={handleLinkClick}>
                    Giriş Yap
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
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

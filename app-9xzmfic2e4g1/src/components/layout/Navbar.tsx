import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MapPin, History, Compass, User, LogOut, Search, Settings, FileText, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SearchModal } from './SearchModal';
import { NotificationsDropdown } from './NotificationsDropdown';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenu } from './MobileMenu';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll efekti için
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur-navbar transition-smooth",
        scrolled && "navbar-shadow"
      )}>
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Sol: Logo ve Marka */}
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <MapPin className="h-8 w-8 text-primary" />
              <span className="text-lg font-semibold tracking-tight text-orange-600">Kapadokya</span>
            </Link>

            {/* Orta: Desktop Navigasyon */}
            <div className="hidden lg:flex items-center gap-8">
              <Link
                to="/explore"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Keşfet
              </Link>
              <Link
                to="/planner"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Planla
              </Link>
              <Link
                to="/rehberler"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Rehberler
              </Link>
              <Link
                to="/account"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Gezilerim
              </Link>
            </div>

            {/* Sağ: Aksiyonlar */}
            <div className="flex items-center gap-2">
              {/* Arama butonu */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label="Ara"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Tema değiştirici */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Bildirimler (sadece giriş yapılmışsa) */}
              {user && (
                <div className="hidden sm:block">
                  <NotificationsDropdown />
                </div>
              )}

              {/* Kullanıcı menüsü veya giriş butonu */}
              {user ? (
                <div className="hidden lg:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {getInitials((profile as any)?.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <div className="flex items-center gap-3 p-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials((profile as any)?.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {(profile as any)?.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {(profile as any)?.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/account/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Profilim
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/account" className="cursor-pointer">
                          <History className="mr-2 h-4 w-4" />
                          Rotalarım
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/account/preferences" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Tercihler
                        </Link>
                      </DropdownMenuItem>
                      {(profile as any)?.role === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to="/admin" className="cursor-pointer text-orange-600">
                              <Shield className="mr-2 h-4 w-4" />
                              Admin Panel
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Çıkış Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="hidden lg:flex h-11 px-6"
                >
                  Giriş Yap
                </Button>
              )}

              {/* Mobil menü */}
              <MobileMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Navbar yüksekliği kadar boşluk bırak */}
      <div className="h-16" />

      {/* Arama modalı */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
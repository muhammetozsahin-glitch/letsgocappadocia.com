import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, History, User, LogOut, Search, Settings, Shield } from 'lucide-react';
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
import { useSiteSettings } from '@/hooks/use-site-settings';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = [...settings.navbar.items]
    .filter(item => item.visible)
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 w-full border-b border-border/70 bg-background/88 backdrop-blur-navbar transition-smooth',
          scrolled && 'navbar-shadow'
        )}
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex h-[72px] items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-semibold text-foreground">Kapadokya</span>
                <span className="text-xs font-medium text-muted-foreground">Planla, keşfet, kaydet</span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1 rounded-full border border-border/70 bg-card/80 p-1 shadow-sm">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Ara" className="rounded-full">
                <Search className="h-5 w-5" />
              </Button>

              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {user && (
                <div className="hidden sm:block">
                  <NotificationsDropdown />
                </div>
              )}

              {user ? (
                <div className="hidden lg:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-11 w-11 rounded-full border border-border bg-background">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {getInitials((profile as any)?.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <div className="flex items-center gap-3 p-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials((profile as any)?.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{(profile as any)?.email?.split('@')[0]}</p>
                          <p className="text-xs text-muted-foreground truncate">{(profile as any)?.email}</p>
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
                            <Link to="/admin" className="cursor-pointer text-primary">
                              <Shield className="mr-2 h-4 w-4" />
                              Admin Panel
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        Çıkış Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button onClick={() => navigate('/login')} variant="default" className="hidden lg:flex rounded-full px-5">
                  Giriş Yap
                </Button>
              )}

              <MobileMenu />
            </div>
          </div>
        </div>
      </nav>

      <div className="h-[72px]" />
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

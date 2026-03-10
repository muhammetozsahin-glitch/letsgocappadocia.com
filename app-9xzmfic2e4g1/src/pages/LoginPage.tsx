import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, MapPin, Sparkles, Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signInWithUsername, signUpWithUsername, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/explore';

  if (user) {
    navigate(from, { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    if (!/^[a-z0-9_]+$/.test(username)) {
      toast.error('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
      return;
    }

    if (password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signInWithUsername(username, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Kullanıcı adı veya şifre hatalı');
          }
          throw error;
        }
        toast.success(`Hoşgeldin, ${username}!`);
        navigate(from, { replace: true });
      } else {
        const { error } = await signUpWithUsername(username, password);
        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('Bu kullanıcı adı zaten kullanılıyor');
          }
          throw error;
        }
        toast.success('Hesap oluşturuldu! Giriş yapılıyor...');
        const { error: signInError } = await signInWithUsername(username, password);
        if (!signInError) {
          navigate(from, { replace: true });
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8 selection:bg-primary/20 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-luxury lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden lg:flex">
          <img
            src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400"
            alt="Cappadocia Login"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-900/45 to-sky-900/20" />

          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14 text-white">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-semibold">Kapadokya</div>
                <div className="text-sm text-white/70">Seyahat planlayıcı</div>
              </div>
            </Link>

            <div className="max-w-xl space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium"
              >
                <Sparkles className="h-4 w-4 text-sky-300" />
                Daha sade, daha hızlı seyahat akışı
              </motion.div>

              <h1 className="text-5xl font-semibold leading-[1.02] xl:text-6xl">
                Rotanızı planlayın,
                <br />
                notlarınızı kaydedin,
                <br />
                <span className="text-sky-300">tek yerde yönetin.</span>
              </h1>
              <p className="max-w-lg text-lg leading-8 text-white/72">
                Wanderlog benzeri temiz deneyimle gezi planlarınızı oluşturun, düzenleyin ve dilediğiniz zaman geri dönün.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/70">
              <Shield className="h-4 w-4 text-sky-300" />
              Hesap verileri güvenli şekilde korunur
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-background p-6 md:p-10 lg:p-14">
          <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col gap-4 lg:hidden">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">Kapadokya</div>
                  <div className="text-sm text-muted-foreground">Seyahat planlayıcı</div>
                </div>
              </Link>
            </div>

            <div className="space-y-3">
              <div className="inline-flex rounded-full bg-accent px-3 py-1 text-sm font-medium text-primary">
                {isLogin ? 'Tekrar hoş geldiniz' : 'Yeni hesap oluşturun'}
              </div>
              <h2 className="text-3xl font-semibold text-foreground md:text-4xl">
                {isLogin ? 'Gezinize kaldığınız yerden devam edin' : 'Gezilerinizi tek yerde toplamaya başlayın'}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground md:text-base">
                {isLogin ? 'Kaydedilmiş rotalarınıza ve planlarınıza birkaç saniyede ulaşın.' : 'Hesabınızı oluşturup keşiflerinizi, planlarınızı ve notlarınızı saklayın.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-foreground">Kullanıcı adı</Label>
                  <Input
                    id="username"
                    placeholder="kullanici_adi"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">Şifre</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="h-12 rounded-xl pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-2.5">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="h-4 w-4 rounded-md border-gray-300"
                      />
                      <Label htmlFor="remember" className="text-sm font-medium text-muted-foreground cursor-pointer">Beni hatırla</Label>
                    </div>
                    <button type="button" className="text-sm font-medium text-primary transition-opacity hover:opacity-80">Şifremi unuttum</button>
                  </div>
                )}
              </div>

              <Button type="submit" className="h-12 w-full rounded-xl text-sm font-semibold" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    {isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="border-t border-border pt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPassword('');
                }}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isLogin ? (
                  <>
                    Hesabınız yok mu? <span className="font-semibold text-primary">Kayıt ol</span>
                  </>
                ) : (
                  <>
                    Hesabınız var mı? <span className="font-semibold text-primary">Giriş yap</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

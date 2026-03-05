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
    <div className="min-h-screen flex bg-background selection:bg-primary/20">
      {/* Left Side - Cinematic Hero */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] relative overflow-hidden group">
        <div className="absolute inset-0 z-0 transition-luxury duration-1000 group-hover:scale-105">
          <img 
            src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=2400" 
            alt="Cappadocia Login" 
            className="w-full h-full object-cover grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 via-secondary/40 to-transparent z-10" />
        </div>

        <div className="relative z-20 w-full p-12 xl:p-16 flex flex-col justify-between">
          <Link to="/" className="flex items-center gap-3 group/logo">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/40 group-hover/logo:scale-110 transition-luxury">
              <MapPin className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">Kapadokya <span className="text-primary">Efsanesi</span></span>
          </Link>

          <div className="max-w-lg space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Sadece Size Özel Deneyim
            </motion.div>
            
            <h1 className="text-5xl xl:text-7xl font-black text-white leading-[0.9] tracking-tighter uppercase">
              BİR SONRAKİ <br /> <span className="text-primary">MACERAYA</span> <br /> ADIM ATIN
            </h1>
            <p className="text-lg text-white/60 font-medium italic leading-relaxed">
              "Efsaneler, sadece cesaret edenler ve keşfedenler için yazılır. Rotanızı kaydedin ve Kapadokya'yı yaşayın."
            </p>
          </div>

          <div className="flex items-center gap-3 text-white/40 text-[10px] font-black uppercase tracking-widest">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span>Premium Güvenlik Protokolü Aktif</span>
          </div>
        </div>
      </div>

      {/* Right Side - Luxury Form */}
      <div className="w-full lg:w-[50%] xl:w-[45%] flex items-center justify-center p-8 md:p-16 relative overflow-hidden bg-white dark:bg-card">
        <div className="w-full max-w-sm relative z-10 space-y-10">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex flex-col items-center gap-3 text-center mb-10">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <MapPin className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase">Kapadokya <span className="text-primary">Efsanesi</span></h2>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">
              {isLogin ? 'HOŞ GELDİNİZ' : 'BİZE KATILIN'}
            </h2>
            <p className="text-base text-gray-500 font-medium italic">
              {isLogin ? 'Efsane kaldığı yerden devam ediyor.' : 'Kendi Kapadokya hikayenizi başlatın.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-primary">Kullanıcı Kimliği</Label>
                <Input
                  id="username"
                  placeholder="kullanici_adi"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="h-14 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:border-primary px-5 text-base font-bold transition-luxury"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-primary">Güvenli Şifre</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-14 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:border-primary px-5 text-base font-bold transition-luxury pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="w-4 h-4 rounded-md border-2 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="remember" className="text-xs font-bold text-gray-500 cursor-pointer">Beni Hatırla</Label>
                  </div>
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">Şifremi Unuttum</button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-16 text-lg font-black bg-primary hover:bg-primary-dark rounded-xl shadow-lg shadow-primary/20 transition-luxury group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  {isLogin ? 'Giriş Yap' : 'Hesabı Oluştur'}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="pt-6 text-center border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setPassword('');
              }}
              className="text-xs font-bold text-gray-400 hover:text-primary transition-luxury group"
            >
              {isLogin ? (
                <>
                  Hesabınız yok mu?{' '}
                  <span className="font-black text-primary uppercase tracking-widest ml-1 group-hover:underline">Kayıt Ol</span>
                </>
              ) : (
                <>
                  Hesabınız var mı?{' '}
                  <span className="font-black text-primary uppercase tracking-widest ml-1 group-hover:underline">Giriş Yap</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
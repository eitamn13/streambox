import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiLogin } from '../lib/api.js';
import { Phone, Lock, Eye, EyeOff, ArrowLeft, Tv, Check } from 'lucide-react';
import { getCatalog } from '../core/StreamBoxCore.js';

const SAMPLE_BACKDROPS = [
  'https://image.tmdb.org/t/p/w300/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
  'https://image.tmdb.org/t/p/w300/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg',
  'https://image.tmdb.org/t/p/w300/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
  'https://image.tmdb.org/t/p/w300/lP5eKh8WOcPysfELrClGhleNlA.jpg',
  'https://image.tmdb.org/t/p/w300/orjiB3oUIsyz60hoEqkiGpy5CeO.jpg',
  'https://image.tmdb.org/t/p/w300/5vDnGqTrDdTa6KrZBDl5vRl5.jpg',
  'https://image.tmdb.org/t/p/w300/fTrQsdMLF2s9xStn0E2A9K1T1i.jpg',
  'https://image.tmdb.org/t/p/w300/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg',
  'https://image.tmdb.org/t/p/w300/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
  'https://image.tmdb.org/t/p/w300/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
  'https://image.tmdb.org/t/p/w300/lP5eKh8WOcPysfELrClGhleNlA.jpg',
  'https://image.tmdb.org/t/p/w300/orjiB3oUIsyz60hoEqkiGpy5CeO.jpg',
];

export default function Login() {
  const { setSession } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bgImages, setBgImages] = useState([]);

  useEffect(() => {
    async function loadBg() {
      try {
        const trending = await getCatalog('trending', 1);
        const backdrops = trending
          .filter((item) => item.backdrop)
          .slice(0, 12)
          .map((item) => item.backdrop.replace('/original/', '/w300/'));
        setBgImages(backdrops.length > 6 ? backdrops : SAMPLE_BACKDROPS);
      } catch {
        setBgImages(SAMPLE_BACKDROPS);
      }
    }
    loadBg();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Support both phone and email for now (backend compatibility)
    const identifier = phone.includes('@') ? phone : phone.replace(/[^0-9]/g, '');

    try {
      const data = await apiLogin({ email: identifier, password });
      setLoading(false);

      if (data.error || data.message) {
        setError(data.message || data.error || 'פרטי התחברות שגויים');
        return;
      }

      const token = data?.token || data?.accessToken || data?.access_token;
      const refreshToken = data?.refreshToken || data?.refresh_token;

      if (token) {
        localStorage.setItem('sb-token', token);
        if (refreshToken) localStorage.setItem('sb-refresh-token', refreshToken);
      }

      const session = {
        user: data.user,
        access_token: token,
        refresh_token: refreshToken,
      };

      setSession(session);
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || 'התחברות נכשלה');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('התחברות עם Google בקרוב');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-[#0f0f1a]">
      {/* Background movie grid */}
      <div className="login-bg-grid">
        {(bgImages.length > 0 ? bgImages : SAMPLE_BACKDROPS).map((src, i) => (
          <div key={i} className="relative overflow-hidden rounded">
            <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        ))}
      </div>

      {/* Dark overlay */}
      <div className="fixed inset-0 bg-[#0f0f1a]/85 z-[1]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#e50914] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Stream<span className="text-[#e50914]">Box</span>
          </h1>
          <p className="text-[#808090] text-sm mt-1">התחברות לחשבון שלך</p>
        </div>

        {/* Modal card */}
        <div className="bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Google login button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-black rounded-lg font-bold text-sm transition-all mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            התחבר עם Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[#1a1a2e] text-[#808090]">או</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Phone number input */}
            <div>
              <label className="block text-xs font-medium text-[#808090] mb-2">מספר טלפון</label>
              <div className="relative">
                <Phone className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-[#808090]" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg pr-10 pl-4 py-3 text-sm text-white placeholder-[#808090] outline-none focus:border-[#e50914]/60 transition-all"
                  placeholder="050-123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#808090] mb-2">סיסמה</label>
              <div className="relative">
                <Lock className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-[#808090]" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg pr-10 pl-10 py-3 text-sm text-white placeholder-[#808090] outline-none focus:border-[#e50914]/60 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute top-1/2 -translate-y-1/2 left-3 text-[#808090] hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-[#e50914] border-[#e50914]' : 'border-white/30'}`}>
                  {rememberMe && <Check className="w-3 h-3 text-white" />}
                </div>
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="hidden" />
                <span className="text-xs text-[#808090]">זכור אותי</span>
              </label>
              <Link to="/reset-password" className="text-xs text-[#e50914] hover:text-[#f40612] transition-colors">
                איפוס סיסמה
              </Link>
            </div>

            {/* reCAPTCHA placeholder */}
            <div className="flex justify-center py-2">
              <div className="bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-3 flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-white/20 rounded-sm" />
                <span className="text-sm text-[#808090]">אני לא רובוט</span>
                <div className="flex flex-col items-center mr-2">
                  <svg className="w-8 h-8" viewBox="0 0 48 48">
                    <path fill="#4285F4" d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 36c-8.82 0-16-7.18-16-16S15.18 8 24 8s16 7.18 16 16-7.18 16-16 16z" />
                  </svg>
                  <span className="text-[8px] text-[#808090]">reCAPTCHA</span>
                </div>
              </div>
            </div>

            {/* Gold login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-gold rounded-lg font-bold text-sm disabled:opacity-60"
            >
              <span>{loading ? 'טוען...' : 'התחברות'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-[#808090] text-sm">
            האם אתה חדש כאן?{' '}
            <Link to={`/signup${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-[#e50914] hover:text-[#f40612] font-semibold transition-colors">
              הרשמה
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

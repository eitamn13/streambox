import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { supabase, setAuthToken } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Tv } from 'lucide-react';

export default function Login() {
  const { setSession } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('[Login] Attempting login for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('[Login] Response:', { hasData: !!data, hasError: !!error, session: data?.session, user: data?.user });
      setLoading(false);
      if (error) {
        console.error('[Login] Error:', error.message);
        setError(error.message);
        return;
      }
      console.log('[Login] Success, token:', data.session?.access_token);
      setSession(data.session);
      if (data.session?.access_token) {
        try {
          console.log('[Login] About to call setAuthToken...');
          setAuthToken(data.session.access_token);
          const saved = localStorage.getItem('sb-token');
          console.log('[Login] After setAuthToken, sb-token in localStorage:', saved ? saved.substring(0, 30) + '...' : 'NULL');
          // Double-check after a tick to see if something clears it
          setTimeout(() => {
            const afterTick = localStorage.getItem('sb-token');
            if (!afterTick) console.warn('[Login] WARNING: sb-token was cleared after 0ms!');
            else console.log('[Login] sb-token still present after 0ms');
          }, 0);
        } catch (storageErr) {
          console.error('[Login] localStorage save failed:', storageErr);
        }
      } else {
        console.warn('[Login] No access_token in session! Trying getSession fallback...');
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.access_token) {
          setAuthToken(sessionData.session.access_token);
          console.log('[Login] Token saved via getSession fallback');
        }
      }
      navigate(redirectTo);
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-sb-black">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-sb-red flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sb-red-glow">
            <Tv className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">התחברות</h1>
          <p className="text-sb-gray text-sm mt-1">StreamBox - צפייה חכמה</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-sb-gray mb-2">דוא"ל</label>
            <div className="relative">
              <Mail className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-sb-gray" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-sb-surface border border-sb-border rounded-xl pr-10 pl-4 py-3 text-sm text-white placeholder-sb-gray outline-none focus:border-sb-red/60"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-sb-gray mb-2">סיסמה</label>
            <div className="relative">
              <Lock className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-sb-gray" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sb-surface border border-sb-border rounded-xl pr-10 pl-10 py-3 text-sm text-white placeholder-sb-gray outline-none focus:border-sb-red/60"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute top-1/2 -translate-y-1/2 left-3 text-sb-gray hover:text-white transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sb-red hover:bg-sb-red-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all"
          >
            <span>{loading ? 'טוען...' : 'התחבר'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sb-gray text-sm">
            <Link to="/reset-password" className="text-sb-light hover:text-white transition-colors">
              שכחת סיסמה?
            </Link>
          </p>
          <p className="text-sb-gray text-sm">
            אין לך חשבון?{' '}
            <Link to={`/signup${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-sb-red hover:text-sb-red-hover font-semibold transition-colors">
              הירשם
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

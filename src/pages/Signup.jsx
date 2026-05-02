import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { supabase, setAuthToken } from '../lib/supabase';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Tv } from 'lucide-react';

export default function Signup() {
  const { setSession } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    setLoading(true);
    console.log('[Signup] Attempting signup for:', email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      console.log('[Signup] Response:', { hasData: !!data, hasError: !!error, session: data?.session });
      setLoading(false);
      if (error) {
        console.error('[Signup] Error:', error.message);
        setError(error.message);
        return;
      }
      console.log('[Signup] Success, token:', data.session?.access_token);
      setSession(data.session);
      if (data.session?.access_token) {
        try {
          setAuthToken(data.session.access_token);
          const saved = localStorage.getItem('sb-token');
          console.log('[Signup] Token saved, sb-token:', saved ? saved.substring(0, 30) + '...' : 'NULL');
        } catch (storageErr) {
          console.error('[Signup] localStorage save failed:', storageErr);
        }
      } else {
        console.warn('[Signup] No access_token in session!');
      }
      navigate(redirectTo);
    } catch (err) {
      console.error('[Signup] Unexpected error:', err);
      setError(err.message || 'Signup failed');
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
          <h1 className="text-2xl font-bold text-white">הרשמה</h1>
          <p className="text-sb-gray text-sm mt-1">StreamBox - צפייה חכמה</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-sb-gray mb-2">שם מלא</label>
            <div className="relative">
              <User className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-sb-gray" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-sb-surface border border-sb-border rounded-xl pr-10 pl-4 py-3 text-sm text-white placeholder-sb-gray outline-none focus:border-sb-red/60"
                placeholder="השם שלך"
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-medium text-sb-gray mb-2">אימות סיסמה</label>
            <div className="relative">
              <Lock className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-sb-gray" />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-sb-surface border border-sb-border rounded-xl pr-10 pl-4 py-3 text-sm text-white placeholder-sb-gray outline-none focus:border-sb-red/60"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sb-red hover:bg-sb-red-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all"
          >
            <span>{loading ? 'טוען...' : 'הירשם'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-sb-gray text-sm mt-6">
          יש לך חשבון כבר?{' '}
          <Link to={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-sb-red hover:text-sb-red-hover font-semibold transition-colors">
            התחבר
          </Link>
        </p>
      </div>
    </div>
  );
}

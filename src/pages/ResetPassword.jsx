import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiForgotPassword, apiResetPassword } from '../lib/api.js';
import { Mail, ArrowLeft, Tv, Loader2, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiForgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
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
          <h1 className="text-2xl font-bold text-white">שחזור סיסמה</h1>
          <p className="text-sb-gray text-sm mt-1">StreamBox - צפייה חכמה</p>
        </div>

        {sent ? (
          <div className="bg-sb-card rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-sb-green mx-auto mb-3" />
            <h2 className="text-white font-semibold mb-2">המייל נשלח!</h2>
            <p className="text-sb-gray text-sm mb-4">
              בדוק את תיבת הדואר שלך לקבלת קישור לאיפוס הסיסמה.
            </p>
            <Link to="/login" className="text-sb-red hover:underline text-sm">
              חזרה להתחברות
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sb-red hover:bg-sb-red-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all"
            >
              <span>{loading ? 'טוען...' : 'שלח קישור לאיפוס'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        )}

        <p className="text-center text-sb-gray text-sm mt-6">
          זכרת את הסיסמה?{' '}
          <Link to="/login" className="text-sb-red hover:text-sb-red-hover font-semibold transition-colors">
            התחבר
          </Link>
        </p>
      </div>
    </div>
  );
}

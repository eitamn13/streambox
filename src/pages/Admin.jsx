import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext.jsx';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, Users, Crown, CreditCard, Activity, Loader2,
  AlertCircle, CheckCircle, XCircle, Server, Key, RefreshCw
} from 'lucide-react';

export default function Admin() {
  const { session } = useApp();
  const [stats, setStats] = useState(null);
  const [debrid, setDebrid] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      if (!token) {
        setError('לא מחובר');
        return;
      }
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Admin fetch failed');
      }
      setStats(data.stats);
      setDebrid(data.debrid);
      setRecentUsers(data.recentUsers || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchAdminData();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sb-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-sb-red animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sb-black px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="text-sb-gray hover:text-white flex items-center gap-2 mb-6">
            <ArrowLeft className="w-5 h-5" />
            חזרה
          </Link>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={fetchAdminData}
              className="mt-4 flex items-center gap-2 mx-auto text-sb-light hover:text-white text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sb-black px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sb-gray hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white">לוח בקרה - מנהל</h1>
          </div>
          <button
            onClick={fetchAdminData}
            className="flex items-center gap-2 text-sb-gray hover:text-white text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            רענן
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-sb-card rounded-2xl p-5 border border-sb-border">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-sb-blue" />
                <span className="text-sb-gray text-sm">סה"כ משתמשים</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div className="bg-sb-card rounded-2xl p-5 border border-sb-border">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-sb-purple" />
                <span className="text-sb-gray text-sm">פרימיום פעיל</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.activePremium}</p>
            </div>
            <div className="bg-sb-card rounded-2xl p-5 border border-sb-border">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-sb-green" />
                <span className="text-sb-gray text-sm">בניסיון</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.trialing}</p>
            </div>
            <div className="bg-sb-card rounded-2xl p-5 border border-sb-border">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-sb-gold" />
                <span className="text-sb-gray text-sm">הכנסה חודשית</span>
              </div>
              <p className="text-2xl font-bold text-white">₪{stats.monthlyRevenue}</p>
            </div>
          </div>
        )}

        {/* Debrid Status */}
        {debrid && (
          <div className="bg-sb-card rounded-2xl p-6 border border-sb-border mb-8">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-sb-red" />
              סטטוס Debrid
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: 'realdebrid', label: 'Real-Debrid' },
                { key: 'premiumize', label: 'Premiumize' },
                { key: 'torbox', label: 'TorBox' },
              ].map(({ key, label }) => (
                <div key={key} className="bg-sb-surface rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-sb-gray text-xs">
                      {debrid[key] ? 'מחובר' : 'לא מחובר'}
                    </p>
                  </div>
                  {debrid[key] ? (
                    <CheckCircle className="w-6 h-6 text-sb-green" />
                  ) : (
                    <XCircle className="w-6 h-6 text-sb-red" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-sb-card rounded-2xl border border-sb-border overflow-hidden">
          <div className="p-4 border-b border-sb-border flex items-center justify-between">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-sb-blue" />
              משתמשים אחרונים
            </h2>
            <span className="text-sb-gray text-xs">{recentUsers.length} משתמשים</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-sb-gray text-xs border-b border-sb-border">
                  <th className="text-right px-4 py-3 font-medium">אימייל</th>
                  <th className="text-right px-4 py-3 font-medium">מנוי</th>
                  <th className="text-right px-4 py-3 font-medium">סטטוס</th>
                  <th className="text-right px-4 py-3 font-medium">תאריך הצטרפות</th>
                  <th className="text-right px-4 py-3 font-medium">תקופה עד</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.user_id} className="border-b border-sb-border/50 hover:bg-sb-surface/50 transition-colors">
                    <td className="px-4 py-3 text-sb-light">{user.email || user.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        user.plan === 'premium'
                          ? 'bg-sb-purple/20 text-sb-purple'
                          : 'bg-sb-surface text-sb-gray'
                      }`}>
                        {user.plan === 'premium' ? 'פרימיום' : 'חינם'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        user.status === 'active'
                          ? 'bg-sb-green/20 text-sb-green'
                          : user.status === 'trialing'
                          ? 'bg-sb-blue/20 text-sb-blue'
                          : 'bg-sb-red/20 text-sb-red'
                      }`}>
                        {user.status === 'active' ? 'פעיל' : user.status === 'trialing' ? 'ניסיון' : user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sb-gray text-xs">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('he-IL') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sb-gray text-xs">
                      {user.current_period_end ? new Date(user.current_period_end).toLocaleDateString('he-IL') : '-'}
                    </td>
                  </tr>
                ))}
                {recentUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-sb-gray">
                      אין משתמשים להצגה
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

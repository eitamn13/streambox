import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useSubscription } from '../contexts/SubscriptionContext.jsx';
import { supabase } from '../lib/supabase';
import {
  User, Mail, Calendar, LogOut, ChevronLeft, Loader2,
  Save, CheckCircle, AlertCircle, KeyRound, Crown,
  RefreshCw, CreditCard
} from 'lucide-react';

export default function Profile() {
  const { session, setSession } = useApp();
  const { subscription, isPremium, planInfo, refreshSubscription, customerKey } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = session?.user;

  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Handle checkout success
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setMessage('התשלום בוצע בהצלחה! המנוי שלך מתעדכן...');
      refreshSubscription().then(() => {
        setMessage('המנוי עודכן בהצלחה!');
      });
    }
  }, [searchParams, refreshSubscription]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage('הפרופיל עודכן בהצלחה');
      setSession((prev) => ({ ...prev, user: data.user }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSubscription();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-sb-black px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/settings" className="text-sb-gray hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">פרופיל משתמש</h1>
        </div>

        {/* Avatar */}
        <div className="bg-sb-card rounded-2xl p-6 mb-4 text-center">
          <div className="w-20 h-20 rounded-full bg-sb-red/20 flex items-center justify-center mx-auto mb-3">
            <User className="w-10 h-10 text-sb-red" />
          </div>
          <h2 className="text-white font-semibold">{user?.user_metadata?.full_name || 'משתמש'}</h2>
          <p className="text-sb-gray text-sm">{user?.email}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {isPremium ? (
              <span className="inline-flex items-center gap-1 bg-sb-purple/20 text-sb-purple text-xs font-bold px-3 py-1 rounded-full">
                <Crown className="w-3 h-3" />
                פרימיום
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-sb-surface text-sb-gray text-xs px-3 py-1 rounded-full">
                חינם
              </span>
            )}
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-sb-card rounded-2xl p-6 mb-4 border border-sb-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sb-purple" />
              מנוי
            </h3>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-sb-gray hover:text-white transition-colors"
              title="רענן מצב מנוי"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-sb-gray">תוכנית</span>
              <span className="text-white font-medium">{planInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sb-gray">סטטוס</span>
              <span className={subscription?.status === 'active' ? 'text-sb-green' : 'text-sb-gray'}>
                {subscription?.status === 'active' ? 'פעיל' : subscription?.status || 'פעיל'}
              </span>
            </div>
            {subscription?.current_period_end && (
              <div className="flex justify-between">
                <span className="text-sb-gray">תקף עד</span>
                <span className="text-white">
                  {new Date(subscription.current_period_end).toLocaleDateString('he-IL')}
                </span>
              </div>
            )}
            {customerKey && (
              <div className="flex justify-between">
                <span className="text-sb-gray">מפתח לקוח</span>
                <span className="text-sb-gray font-mono text-xs">{customerKey.slice(0, 8)}...</span>
              </div>
            )}
          </div>

          {!isPremium && (
            <Link
              to="/subscription"
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-sb-purple hover:bg-sb-purple/80 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <Crown className="w-4 h-4" />
              שדרג לפרימיום
            </Link>
          )}
        </div>

        {/* Alerts */}
        {message && (
          <div className="bg-sb-green/10 border border-sb-green/20 rounded-xl p-4 mb-4 flex items-center gap-2 text-sb-green text-sm">
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-sb-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-sb-gray mb-2">שם מלא</label>
            <div className="relative">
              <User className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-sb-gray" />
              <input
                type="text"
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
                value={user?.email || ''}
                disabled
                className="w-full bg-sb-surface border border-sb-border rounded-xl pr-10 pl-4 py-3 text-sm text-sb-gray outline-none opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-sb-gray mb-2">מזהה משתמש</label>
            <div className="relative">
              <KeyRound className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-sb-gray" />
              <input
                type="text"
                value={user?.id || ''}
                disabled
                className="w-full bg-sb-surface border border-sb-border rounded-xl pr-10 pl-4 py-3 text-sm text-sb-gray outline-none opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-sb-gray mb-2">נרשם בתאריך</label>
            <div className="relative">
              <Calendar className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-sb-gray" />
              <input
                type="text"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('he-IL') : '-'}
                disabled
                className="w-full bg-sb-surface border border-sb-border rounded-xl pr-10 pl-4 py-3 text-sm text-sb-gray outline-none opacity-60"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sb-red hover:bg-sb-red-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-sb-surface hover:bg-sb-border text-sb-red rounded-xl font-bold text-sm transition-all"
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </button>
      </div>
    </div>
  );
}

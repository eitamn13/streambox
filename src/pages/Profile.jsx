import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import {
  User, Mail, Calendar, LogOut, ChevronLeft, Loader2,
  Save, CheckCircle, AlertCircle, KeyRound
} from 'lucide-react';

export default function Profile() {
  const { session, setSession } = useApp();
  const user = session?.user;

  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

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

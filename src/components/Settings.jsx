import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tmdbCache } from '../core/StreamBoxCore.js';
import { clearHistory } from '../core/History.js';
import {
  getComplianceMode,
  setComplianceMode,
  COMPLIANCE_MODES,
  SOURCE_LABELS,
} from '../core/ContentClassifier.js';
import { DEBRID_SERVICES } from '../core/DebridManager.js';
import { useApp } from '../contexts/AppContext.jsx';
import { useTranslation } from '../i18n/index.jsx';
import { supabase } from '../lib/supabase.js';
import {
  Tv, Trash2, RefreshCw, Info, Puzzle, Shield, Lock,
  MonitorPlay, ChevronLeft, Check, Key, Globe, AlertTriangle,
  Languages, User, LogOut, LogIn, UserPlus, Settings as Cog
} from 'lucide-react';

function Settings() {
  const { session, setSession, profiles, activeProfile, setActiveProfile, createProfile, deleteProfile } = useApp();
  const { t, lang, setLang, supportedLanguages } = useTranslation();
  const [cleared, setCleared] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [complianceMode, setComplianceModeState] = useState(getComplianceMode());
  const [debridKeys, setDebridKeys] = useState(() => {
    return DEBRID_SERVICES.map(s => ({
      ...s,
      key: s.instance.getApiKey(),
    }));
  });
  const [showKey, setShowKey] = useState({});
  const [newProfileName, setNewProfileName] = useState('');
  const [showAddProfile, setShowAddProfile] = useState(false);

  const updateCompliance = (mode) => {
    setComplianceMode(mode);
    setComplianceModeState(mode);
  };

  const updateDebridKey = (id, value) => {
    const svc = DEBRID_SERVICES.find(s => s.id === id);
    if (svc) svc.instance.setApiKey(value);
    setDebridKeys(prev => prev.map(d => d.id === id ? { ...d, key: value } : d));
  };

  const clearAllCache = () => {
    tmdbCache.clear();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const clearAllHistory = () => {
    if (confirm('לנקות את כל ההיסטוריה והקאש?')) {
      clearHistory();
      clearAllCache();
      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleAddProfile = () => {
    if (!newProfileName.trim()) return;
    createProfile(newProfileName.trim());
    setNewProfileName('');
    setShowAddProfile(false);
  };

  const sections = {
    general: {
      icon: Tv,
      title: 'כללי',
      items: [
        {
          title: 'StreamBox',
          desc: 'מערכת סטרימינג מתקדמת עם תמיכה בתוספים, שירותי Debrid, וכתוביות. מבוססת על טכנולוגיות קוד פתוח.',
          type: 'info',
        },
        {
          title: session ? session.user?.email || 'משתמש מחובר' : 'חשבון',
          desc: session ? 'מחובר למערכת' : 'התחבר או הירשם כדי לסנכרן את ההעדפות שלך',
          type: 'custom',
          render: () => (
            <div className="mt-3 flex gap-2">
              {session ? (
                <>
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-sb-surface text-sb-light hover:bg-sb-border transition-colors">
                    <User className="w-3.5 h-3.5" />
                    פרופיל
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-sb-red/10 text-sb-red hover:bg-sb-red/20 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    התנתק
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-sb-red text-white hover:bg-sb-red-hover transition-colors">
                    <LogIn className="w-3.5 h-3.5" />
                    התחבר
                  </Link>
                  <Link to="/signup" className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-sb-surface text-sb-light hover:bg-sb-border transition-colors">
                    <UserPlus className="w-3.5 h-3.5" />
                    הרשם
                  </Link>
                </>
              )}
            </div>
          ),
        },
        {
          title: 'ניקוי קאש',
          desc: 'מחק את הקאש המקומי כדי לטעון מידע מחדש',
          type: 'action',
          action: clearAllCache,
          button: 'נקה קאש',
          icon: RefreshCw,
        },
        {
          title: 'ניקוי היסטוריה',
          desc: 'מחק את כל היסטוריית הצפייה וההמשכים',
          type: 'action',
          action: clearAllHistory,
          button: 'נקה היסטוריה',
          icon: Trash2,
          danger: true,
        },
      ],
    },
    language: {
      icon: Languages,
      title: 'שפה',
      items: [
        {
          title: 'בחירת שפה',
          desc: 'שנה את שפת הממשק',
          type: 'custom',
          render: () => (
            <div className="mt-3 flex flex-wrap gap-2">
              {supportedLanguages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    lang === l.code
                      ? 'bg-sb-red text-white shadow-lg shadow-sb-red-glow'
                      : 'bg-sb-surface text-sb-gray hover:text-white hover:bg-sb-border'
                  }`}
                >
                  {l.native}
                </button>
              ))}
            </div>
          ),
        },
      ],
    },
    profiles: {
      icon: User,
      title: 'פרופילים',
      items: [
        {
          title: 'ניהול פרופילים',
          desc: 'בחר פרופיל פעיל או צור פרופיל חדש',
          type: 'custom',
          render: () => (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveProfile(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                      activeProfile === p.id
                        ? 'bg-sb-red text-white'
                        : 'bg-sb-surface text-sb-light hover:bg-sb-border'
                    }`}
                  >
                    <img src={p.avatar} alt="" className="w-6 h-6 rounded-full" />
                    {p.name}
                    {profiles.length > 1 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }}
                        className="text-xs opacity-60 hover:opacity-100"
                      >
                        ×
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {!showAddProfile ? (
                <button
                  onClick={() => setShowAddProfile(true)}
                  className="flex items-center gap-2 text-sb-red text-sm hover:underline"
                >
                  <UserPlus className="w-4 h-4" />
                  צור פרופיל חדש
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="שם פרופיל"
                    className="flex-1 bg-sb-card border border-sb-border rounded-lg px-3 py-2 text-sm text-white placeholder-sb-gray outline-none focus:border-sb-red/60"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddProfile()}
                  />
                  <button
                    onClick={handleAddProfile}
                    className="px-3 py-2 bg-sb-red text-white rounded-lg text-sm font-medium"
                  >
                    צור
                  </button>
                  <button
                    onClick={() => setShowAddProfile(false)}
                    className="px-3 py-2 bg-sb-surface text-sb-gray rounded-lg text-sm"
                  >
                    ביטול
                  </button>
                </div>
              )}
            </div>
          ),
        },
      ],
    },
    compliance: {
      icon: Shield,
      title: 'תאימות וסינון',
      items: [
        {
          title: 'מצב תאימות',
          desc: 'קבע אילו מקורות תוכן יוצגו באפליקציה',
          type: 'custom',
          render: () => (
            <div className="space-y-2 w-full mt-3">
              {Object.entries(COMPLIANCE_MODES).map(([key, mode]) => {
                const labels = {
                  [COMPLIANCE_MODES.STRICT]: { label: 'אבטחתי', desc: 'רק מקורות רשמיים וחוקיים', color: 'bg-sb-green' },
                  [COMPLIANCE_MODES.MODERATE]: { label: 'מומלץ', desc: 'מקורות רשמיים + מפנים + חינם', color: 'bg-sb-blue' },
                  [COMPLIANCE_MODES.OPEN]: { label: 'פתוח', desc: 'הכל (כולל קהילתי)', color: 'bg-sb-gold' },
                };
                const cfg = labels[mode];
                const active = complianceMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => updateCompliance(mode)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-right ${
                      active ? 'border-sb-red bg-sb-red/5' : 'border-sb-border bg-sb-card'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${cfg.color} ${active ? 'ring-2 ring-white/30' : 'opacity-50'}`} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${active ? 'text-white' : 'text-sb-light'}`}>{cfg.label}</p>
                      <p className="text-sb-gray text-xs">{cfg.desc}</p>
                    </div>
                    {active && <Check className="w-4 h-4 text-sb-red" />}
                  </button>
                );
              })}
            </div>
          ),
        },
        {
          title: 'סוגי מקורות',
          desc: 'הגדרות המקורות הזמינים בכל מצב',
          type: 'custom',
          render: () => (
            <div className="mt-3 space-y-2">
              {Object.entries(SOURCE_LABELS).map(([type, meta]) => {
                const allowed = {
                  [COMPLIANCE_MODES.STRICT]: ['official', 'legal_free'],
                  [COMPLIANCE_MODES.MODERATE]: ['official', 'legal_free', 'aggregator'],
                  [COMPLIANCE_MODES.OPEN]: ['official', 'legal_free', 'aggregator', 'community', 'debrid', 'unknown'],
                }[complianceMode]?.includes(type);
                return (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${meta.bg.replace('/10', '')}`} />
                      <span className="text-sb-light">{meta.label}</span>
                    </div>
                    <span className={`text-xs ${allowed ? 'text-sb-green' : 'text-sb-gray'}`}>
                      {allowed ? 'מותר' : 'חסום'}
                    </span>
                  </div>
                );
              })}
            </div>
          ),
        },
      ],
    },
    debrid: {
      icon: Key,
      title: 'Debrid Services',
      items: [
        {
          title: 'שירותי Debrid',
          desc: 'חבר את חשבונות ה-Debrid שלך לקבלת זרמים איכותיים יותר. המפתחות נשמרים מקומית במכשירך בלבד.',
          type: 'custom',
          render: () => (
            <div className="space-y-3 mt-3">
              {debridKeys.map(svc => (
                <div key={svc.id} className="bg-sb-surface rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: svc.color }}
                      >
                        {svc.name[0]}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{svc.name}</p>
                        <p className="text-sb-gray text-xs">{svc.description}</p>
                      </div>
                    </div>
                    {svc.key && (
                      <span className="text-sb-green text-xs bg-sb-green/10 px-2 py-1 rounded-lg">מחובר</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showKey[svc.id] ? 'text' : 'password'}
                      value={svc.key}
                      onChange={(e) => updateDebridKey(svc.id, e.target.value)}
                      placeholder={`הכנס API Key מ-${svc.name}`}
                      className="w-full bg-sb-card border border-sb-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-sb-gray focus:outline-none focus:border-sb-red/60 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(prev => ({ ...prev, [svc.id]: !prev[svc.id] }))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sb-gray hover:text-white text-xs"
                    >
                      {showKey[svc.id] ? 'הסתר' : 'הצג'}
                    </button>
                  </div>
                  <a
                    href={svc.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sb-blue text-xs mt-2 hover:underline"
                  >
                    <Globe className="w-3 h-3" />
                    לאתר הרשמי
                  </a>
                </div>
              ))}
            </div>
          ),
        },
      ],
    },
    addons: {
      icon: Puzzle,
      title: 'תוספים',
      items: [
        {
          title: 'נהל תוספים',
          desc: 'התקן, הסר או הגדר תוספים לסטרימינג וכתוביות',
          type: 'link',
          to: '/addons',
          icon: Puzzle,
        },
      ],
    },
    about: {
      icon: Info,
      title: 'אודות',
      items: [
        { title: 'גרסה', desc: '3.0.0', type: 'info' },
        { title: 'מפתח', desc: 'StreamBox Team', type: 'info' },
        { title: 'APIs', desc: 'TMDB, OpenSubtitles, Stremio Addons, Debrid Services', type: 'info' },
      ],
    },
  };

  const current = sections[activeSection];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 page-transition">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">הגדרות</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <nav className="md:w-56 shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
            {Object.entries(sections).map(([key, section]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeSection === key
                    ? 'bg-sb-red text-white shadow-lg shadow-sb-red-glow'
                    : 'text-sb-gray hover:text-white hover:bg-sb-card'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.title}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {cleared && (
            <div className="bg-sb-green/10 border border-sb-green/20 text-sb-green px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4" />
              הניקוי בוצע בהצלחה
            </div>
          )}

          {activeSection === 'compliance' && (
            <div className="bg-sb-gold/5 border border-sb-gold/20 rounded-xl p-4 flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-sb-gold shrink-0 mt-0.5" />
              <p className="text-sb-light text-sm">
                מצב תאימות קובע אילו מקורות תוכן יוצגו. מקורות קהילתיים עשויים להכיל תוכן לא מורשה. השימוש באפליקציה ובתוספים חיצוניים הוא באחריותך הבלעדית.
              </p>
            </div>
          )}

          {current.items.map((item, i) => (
            <div key={i} className="bg-sb-card rounded-xl p-4 sm:p-5 border border-sb-border/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-semibold mb-1">{item.title}</h3>
                  <p className="text-sb-gray text-xs leading-relaxed">{item.desc}</p>
                </div>
                {item.type === 'action' && (
                  <button
                    onClick={item.action}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                      item.danger
                        ? 'bg-sb-red/10 text-sb-red hover:bg-sb-red/20'
                        : 'bg-sb-surface text-sb-light hover:bg-sb-border'
                    }`}
                  >
                    {item.icon && <item.icon className="w-3.5 h-3.5" />}
                    {item.button}
                  </button>
                )}
                {item.type === 'link' && (
                  <Link
                    to={item.to}
                    className="flex items-center gap-1 text-sb-red text-xs font-medium shrink-0 hover:underline"
                  >
                    פתח
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
              {item.type === 'custom' && item.render()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Settings;

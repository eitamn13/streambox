import { useState, useEffect, useCallback } from 'react';
import { pluginRegistry } from '../core/PluginRegistry.js';
import { registerBuiltInPlugins } from '../plugins/BuiltInPlugins.js';
import { classifySource, getSourceMeta, getComplianceMode, COMPLIANCE_MODES } from '../core/ContentClassifier.js';
import {
  Plus, Trash2, Power, Puzzle, Globe, Check, X, Loader2,
  Sparkles, Film, Subtitles, Tv, ShieldAlert, Shield, Info
} from 'lucide-react';

const RECOMMENDED = [
  {
    name: 'OpenSubtitles',
    url: 'https://opensubtitles.strem.io',
    description: 'כתוביות מ-OpenSubtitles',
    icon: Subtitles,
    sourceType: 'legal_free',
  },
  {
    name: 'YouTube',
    url: 'https://stremio-youtube-addon.now.sh',
    description: 'סרטוני YouTube',
    icon: Tv,
    sourceType: 'legal_free',
  },
  {
    name: 'Public Domain Movies',
    url: 'https://stremio-public-domain.now.sh',
    description: 'סרטים במתחם הציבורי',
    icon: Film,
    sourceType: 'legal_free',
  },
];

function Addons() {
  const [plugins, setPlugins] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('installed');
  const [complianceMode, setComplianceMode] = useState(getComplianceMode());

  useEffect(() => {
    registerBuiltInPlugins();
    setPlugins(pluginRegistry.getPlugins());
    return pluginRegistry.subscribe(setPlugins);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setComplianceMode(getComplianceMode());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = useCallback(async () => {
    setError(null);
    setSuccess(null);
    if (!urlInput.trim()) return;
    setInstalling(true);
    try {
      await pluginRegistry.installFromUrl(urlInput.trim());
      setSuccess('התוסף הותקן בהצלחה');
      setUrlInput('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message || 'התקנה נכשלה');
    } finally {
      setInstalling(false);
    }
  }, [urlInput]);

  const toggleEnabled = (id, enabled) => {
    pluginRegistry.setEnabled(id, !enabled);
  };

  const removePlugin = (id) => {
    pluginRegistry.unregister(id);
  };

  const installRecommended = async (url) => {
    setError(null);
    setInstalling(true);
    try {
      await pluginRegistry.installFromUrl(url);
      setSuccess('התוסף הותקן בהצלחה');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message || 'התקנה נכשלה');
    } finally {
      setInstalling(false);
    }
  };

  const builtIns = plugins.filter(p => p.builtin);
  const userPlugins = plugins.filter(p => !p.builtin);
  const enabledCount = plugins.filter(p => p.enabled).length;

  const isPluginAllowed = (plugin) => {
    const sourceType = classifySource(plugin.id, plugin.name, plugin.url);
    if (complianceMode === COMPLIANCE_MODES.OPEN) return true;
    if (complianceMode === COMPLIANCE_MODES.STRICT) {
      return ['official', 'legal_free', 'aggregator'].includes(sourceType);
    }
    if (complianceMode === COMPLIANCE_MODES.MODERATE) {
      return ['official', 'legal_free', 'aggregator', 'community'].includes(sourceType);
    }
    return true;
  };

  const PluginCard = ({ plugin, isBuiltin }) => {
    const sourceType = classifySource(plugin.id, plugin.name, plugin.url);
    const meta = getSourceMeta(sourceType);
    const allowed = isPluginAllowed(plugin);

    return (
      <div className={`bg-sb-card rounded-xl p-4 flex items-center justify-between border transition-all ${
        !allowed ? 'border-sb-red/20 opacity-60' : 'border-sb-border/30'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
            {isBuiltin ? (
              <Puzzle className={`w-5 h-5 ${meta.color}`} />
            ) : (
              <Globe className={`w-5 h-5 ${meta.color}`} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white text-sm font-medium truncate">{plugin.name}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                {meta.label}
              </span>
            </div>
            <p className="text-sb-gray text-xs truncate">{plugin.url || plugin.description || plugin.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!allowed && (
            <span className="text-sb-red text-xs bg-sb-red/10 px-2 py-1 rounded-lg hidden sm:inline">
              חסום
            </span>
          )}
          {allowed && (
            <button
              onClick={() => toggleEnabled(plugin.id, plugin.enabled)}
              className={`p-2 rounded-lg transition-colors ${plugin.enabled ? 'text-sb-green bg-sb-green/10' : 'text-sb-gray bg-sb-surface'}`}
              title={plugin.enabled ? 'כבה' : 'הפעל'}
            >
              <Power className="w-4 h-4" />
            </button>
          )}
          {!isBuiltin && (
            <button
              onClick={() => removePlugin(plugin.id)}
              className="p-2 rounded-lg text-sb-red bg-sb-red/10 hover:bg-sb-red/20 transition-colors"
              title="הסר"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 page-transition">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Puzzle className="w-7 h-7 text-sb-red" />
            תוספים
          </h1>
          <p className="text-sb-gray text-sm mt-1">
            {enabledCount} תוספים פעילים • {userPlugins.length} מותקנים
          </p>
        </div>
      </div>

      {/* Compliance Banner */}
      {complianceMode !== COMPLIANCE_MODES.OPEN && (
        <div className="bg-sb-blue/5 border border-sb-blue/20 rounded-xl p-4 flex items-start gap-3 mb-6">
          <Shield className="w-5 h-5 text-sb-blue shrink-0 mt-0.5" />
          <div>
            <p className="text-sb-light text-sm">
              מצב תאימות פעיל: {complianceMode === COMPLIANCE_MODES.STRICT ? 'אבטחתי' : 'מומלץ'}
            </p>
            <p className="text-sb-gray text-xs mt-1">
              תוספים מסוימים עשויים להיות מוסתרים. שנה בהגדרות תאימות.
            </p>
          </div>
        </div>
      )}

      {/* Install */}
      <div className="bg-sb-card rounded-2xl p-5 sm:p-6 mb-6 border border-sb-border/50">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-sb-red" />
          התקן תוסף חדש
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="הכנס כתובת manifest של תוסף..."
            className="flex-1 bg-sb-surface border border-sb-border rounded-xl px-4 py-3 text-sm text-white placeholder-sb-gray focus:outline-none focus:border-sb-red/60 focus:ring-1 focus:ring-sb-red/30 transition-all"
          />
          <button
            onClick={handleInstall}
            disabled={installing || !urlInput.trim()}
            className="bg-sb-red hover:bg-sb-red-hover disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm whitespace-nowrap shadow-lg shadow-sb-red-glow"
          >
            {installing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                מתקין...
              </span>
            ) : (
              'התקן'
            )}
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sb-red text-sm bg-sb-red/10 px-3 py-2 rounded-lg">
            <ShieldAlert className="w-4 h-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 flex items-center gap-2 text-sb-green text-sm bg-sb-green/10 px-3 py-2 rounded-lg">
            <Check className="w-4 h-4" />
            {success}
          </div>
        )}
        <p className="text-sb-gray text-xs mt-3">
          תמיכה בתוספים בפורמט Stremio. הכנס כתובת בסיסית או ישירות ל-manifest.json
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto hide-scrollbar">
        {[
          { id: 'installed', label: 'מותקנים', count: plugins.length },
          { id: 'discover', label: 'גלה תוספים' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-sb-red text-white shadow-lg shadow-sb-red-glow'
                : 'bg-sb-card text-sb-gray hover:text-white hover:bg-sb-surface'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-sb-surface'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'installed' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider text-sb-gray">מובנים</h2>
            <div className="space-y-2">
              {builtIns.map(p => (
                <PluginCard key={p.id} plugin={p} isBuiltin={true} />
              ))}
            </div>
          </div>

          {userPlugins.length > 0 && (
            <div>
              <h2 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider text-sb-gray">מותקנים</h2>
              <div className="space-y-2">
                {userPlugins.map(p => (
                  <PluginCard key={p.id} plugin={p} isBuiltin={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'discover' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sb-gold" />
              מומלצים
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {RECOMMENDED.map((rec, i) => {
                const meta = getSourceMeta(rec.sourceType);
                return (
                  <div key={i} className="bg-sb-card rounded-xl p-5 border border-sb-border/30 hover:border-sb-border transition-colors">
                    <div className="w-12 h-12 bg-sb-surface rounded-xl flex items-center justify-center mb-3">
                      <rec.icon className="w-6 h-6 text-sb-red" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{rec.name}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sb-gray text-xs mb-4">{rec.description}</p>
                    <button
                      onClick={() => installRecommended(rec.url)}
                      disabled={installing}
                      className="w-full bg-sb-surface hover:bg-sb-border text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {installing ? 'מתקין...' : 'התקן'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-sb-card rounded-xl p-5 border border-sb-border/30">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-sb-blue shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-medium text-sm mb-1">התקנת תוספים נוספים</h3>
                <p className="text-sb-gray text-xs leading-relaxed">
                  ניתן להתקין כל תוסף תואם Stremio על ידי הדבקת כתובת ה-manifest שלו.
                  שים לב כי תוספים מסוימים עשויים להכיל תוכן לא מורשה. השימוש בתוספים חיצוניים
                  הוא באחריותך הבלעדית.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Addons;

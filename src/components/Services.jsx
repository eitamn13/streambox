import React, { useState, useEffect, useCallback } from 'react';
import {
  DEBRID_SERVICES,
  testDebridConnection,
} from '../core/DebridManager.js';
import {
  Key, Link, Globe, Check, AlertCircle, Loader2,
  Trash2, ExternalLink, Plus, Magnet, X, FileVideo,
  HardDrive, User, Zap, Download
} from 'lucide-react';

function Services() {
  const [services, setServices] = useState(() =>
    DEBRID_SERVICES.map(s => ({
      ...s,
      key: s.instance.getApiKey(),
      connected: false,
      testing: false,
      userInfo: null,
      error: null,
      torrents: [],
      loadingTorrents: false,
    }))
  );

  const [showKey, setShowKey] = useState({});
  const [showAddMagnet, setShowAddMagnet] = useState(null); // service id
  const [magnetInput, setMagnetInput] = useState('');
  const [addingMagnet, setAddingMagnet] = useState(false);

  const refreshStatus = useCallback(async () => {
    const updated = await Promise.all(
      services.map(async (svc) => {
        if (!svc.key) return { ...svc, connected: false, userInfo: null };
        const result = await testDebridConnection(svc.id);
        if (result.success) {
          return { ...svc, connected: true, userInfo: result.user, error: null };
        }
        return { ...svc, connected: false, error: result.error };
      })
    );
    setServices(updated);
  }, [services]);

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateKey = (id, value) => {
    const svc = DEBRID_SERVICES.find(s => s.id === id);
    if (svc) svc.instance.setApiKey(value);
    setServices(prev => prev.map(s => s.id === id ? { ...s, key: value, connected: false, error: null } : s));
  };

  const testConnection = async (id) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, testing: true, error: null } : s));
    const result = await testDebridConnection(id);
    setServices(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        testing: false,
        connected: result.success,
        userInfo: result.user || null,
        error: result.error || null,
      };
    }));
  };

  const loadTorrents = async (id) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, loadingTorrents: true } : s));
    const svc = DEBRID_SERVICES.find(s => s.id === id);
    if (!svc) return;

    try {
      let torrents = [];
      if (id === 'realdebrid') {
        const list = await svc.instance.rdGetTorrents(50);
        torrents = (list || []).map(t => ({
          id: t.id,
          name: t.filename || 'Unknown',
          status: t.status,
          progress: t.progress || 0,
          size: t.bytes ? formatBytes(t.bytes) : 'N/A',
          date: t.added ? new Date(t.added).toLocaleDateString('he-IL') : '',
        }));
      } else if (id === 'premiumize') {
        const list = await svc.instance.pmGetTransfers();
        torrents = (list?.transfers || []).map(t => ({
          id: t.id,
          name: t.name || 'Unknown',
          status: t.status,
          progress: t.progress || 0,
          size: t.size ? formatBytes(t.size) : 'N/A',
          date: t.created_at ? new Date(t.created_at * 1000).toLocaleDateString('he-IL') : '',
        }));
      } else if (id === 'torbox') {
        const list = await svc.instance.tbGetTorrents();
        torrents = (list || []).map(t => ({
          id: t.id,
          name: t.name || 'Unknown',
          status: t.status || (t.download_present ? 'finished' : 'active'),
          progress: t.progress || 0,
          size: t.size ? formatBytes(t.size) : 'N/A',
          date: t.created_at ? new Date(t.created_at).toLocaleDateString('he-IL') : '',
        }));
      }

      setServices(prev => prev.map(s => s.id === id ? { ...s, torrents, loadingTorrents: false } : s));
    } catch (e) {
      setServices(prev => prev.map(s => s.id === id ? { ...s, loadingTorrents: false, error: e.message } : s));
    }
  };

  const deleteTorrent = async (svcId, torrentId) => {
    const svc = DEBRID_SERVICES.find(s => s.id === svcId);
    if (!svc) return;
    try {
      if (svcId === 'realdebrid') await svc.instance.rdDeleteTorrent(torrentId);
      if (svcId === 'premiumize') await svc.instance.pmDeleteTransfer(torrentId);
      if (svcId === 'torbox') await svc.instance.tbDeleteTorrent(torrentId);
      await loadTorrents(svcId);
    } catch (e) {
      alert('שגיאה במחיקה: ' + e.message);
    }
  };

  const addMagnet = async (svcId) => {
    if (!magnetInput.trim()) return;
    setAddingMagnet(true);
    const svc = DEBRID_SERVICES.find(s => s.id === svcId);
    if (!svc) return;
    try {
      if (svcId === 'realdebrid') await svc.instance.rdAddMagnet(magnetInput.trim());
      if (svcId === 'premiumize') await svc.instance.pmAddMagnet(magnetInput.trim());
      if (svcId === 'torbox') await svc.instance.tbAddMagnet(magnetInput.trim());
      setMagnetInput('');
      setShowAddMagnet(null);
      await loadTorrents(svcId);
    } catch (e) {
      alert('שגיאה בהוספת מגנט: ' + e.message);
    } finally {
      setAddingMagnet(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const statusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('finish') || s.includes('downloaded')) return 'text-sb-green';
    if (s.includes('wait') || s.includes('queued')) return 'text-sb-gold';
    if (s.includes('error') || s.includes('fail')) return 'text-sb-red';
    return 'text-sb-blue';
  };

  const configuredCount = services.filter(s => s.connected).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 page-transition">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-sb-red/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-sb-red" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">שירותי Debrid</h1>
          <p className="text-sb-gray text-sm">
            {configuredCount > 0
              ? `${configuredCount} שירותים מחוברים`
              : 'חבר את חשבונות ה-Debrid שלך לקבלת זרמים איכותיים'}
          </p>
        </div>
      </div>

      <div className="space-y-4 mt-6">
        {services.map(svc => (
          <div
            key={svc.id}
            className={`bg-sb-card rounded-2xl border transition-all ${
              svc.connected ? 'border-sb-green/30' : 'border-sb-border/30'
            }`}
          >
            {/* Header */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0"
                    style={{ backgroundColor: svc.color }}
                  >
                    {svc.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{svc.name}</h3>
                      {svc.connected && (
                        <span className="inline-flex items-center gap-1 text-xs text-sb-green bg-sb-green/10 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          מחובר
                        </span>
                      )}
                    </div>
                    <p className="text-sb-gray text-xs">{svc.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={svc.signupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1 text-xs text-sb-light hover:text-white bg-sb-surface hover:bg-sb-border px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    מנוי
                  </a>
                </div>
              </div>

              {/* API Key Input */}
              <div className="mt-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sb-gray" />
                    <input
                      type={showKey[svc.id] ? 'text' : 'password'}
                      value={svc.key}
                      onChange={(e) => updateKey(svc.id, e.target.value)}
                      placeholder={`הכנס API Key מ-${svc.name}`}
                      className="w-full bg-sb-surface border border-sb-border rounded-xl pr-10 pl-20 py-2.5 text-sm text-white placeholder-sb-gray focus:outline-none focus:border-sb-red/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(prev => ({ ...prev, [svc.id]: !prev[svc.id] }))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-sb-gray hover:text-white text-xs"
                    >
                      {showKey[svc.id] ? 'הסתר' : 'הצג'}
                    </button>
                  </div>
                  <button
                    onClick={() => testConnection(svc.id)}
                    disabled={!svc.key || svc.testing}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-sb-red text-white hover:bg-sb-red-hover"
                  >
                    {svc.testing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link className="w-4 h-4" />
                    )}
                    בדוק
                  </button>
                </div>

                {svc.error && (
                  <div className="flex items-center gap-2 mt-2 text-sb-red text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {svc.error}
                  </div>
                )}

                {svc.connected && svc.userInfo && (
                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <span className="flex items-center gap-1 text-sb-light">
                      <User className="w-3.5 h-3.5 text-sb-gray" />
                      {svc.userInfo.username || 'משתמש'}
                    </span>
                    <span className="flex items-center gap-1 text-sb-light">
                      <Zap className="w-3.5 h-3.5 text-sb-gold" />
                      {svc.userInfo.premium ? 'פרימיום' : 'חינם'}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {svc.connected && (
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => loadTorrents(svc.id)}
                    disabled={svc.loadingTorrents}
                    className="flex items-center gap-1.5 text-xs text-sb-light hover:text-white bg-sb-surface hover:bg-sb-border px-3 py-2 rounded-lg transition-colors"
                  >
                    {svc.loadingTorrents ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <HardDrive className="w-3.5 h-3.5" />
                    )}
                    הצג טורנטים
                  </button>
                  <button
                    onClick={() => setShowAddMagnet(showAddMagnet === svc.id ? null : svc.id)}
                    className="flex items-center gap-1.5 text-xs text-sb-light hover:text-white bg-sb-surface hover:bg-sb-border px-3 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    הוסף מגנט
                  </button>
                </div>
              )}

              {/* Add Magnet Form */}
              {showAddMagnet === svc.id && (
                <div className="mt-3 bg-sb-surface rounded-xl p-3 animate-fade-in">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Magnet className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sb-gray" />
                      <input
                        type="text"
                        value={magnetInput}
                        onChange={(e) => setMagnetInput(e.target.value)}
                        placeholder="הדבק קישור מגנט..."
                        className="w-full bg-sb-card border border-sb-border rounded-lg pr-10 pl-3 py-2 text-sm text-white placeholder-sb-gray focus:outline-none focus:border-sb-red/60"
                      />
                    </div>
                    <button
                      onClick={() => addMagnet(svc.id)}
                      disabled={!magnetInput.trim() || addingMagnet}
                      className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-sb-red text-white hover:bg-sb-red-hover disabled:opacity-50"
                    >
                      {addingMagnet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      הוסף
                    </button>
                    <button
                      onClick={() => { setShowAddMagnet(null); setMagnetInput(''); }}
                      className="shrink-0 p-2 text-sb-gray hover:text-white rounded-lg hover:bg-sb-border transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Torrents List */}
              {svc.torrents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-medium text-sb-gray uppercase tracking-wide">טורנטים אחרונים</h4>
                  {svc.torrents.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 bg-sb-surface rounded-xl p-3 group"
                    >
                      <FileVideo className="w-4 h-4 text-sb-gray shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{t.name}</p>
                        <div className="flex items-center gap-3 text-xs text-sb-gray mt-0.5">
                          <span className={statusColor(t.status)}>{t.status}</span>
                          <span>{t.size}</span>
                          {t.progress > 0 && (
                            <span>{Math.round(t.progress)}%</span>
                          )}
                          <span>{t.date}</span>
                        </div>
                        {t.progress > 0 && (
                          <div className="w-full h-1 bg-sb-border rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-sb-red rounded-full transition-all"
                              style={{ width: `${Math.min(t.progress, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTorrent(svc.id, t.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-sb-gray hover:text-sb-red rounded-lg hover:bg-sb-red/10 transition-all shrink-0"
                        title="מחק"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-sb-surface border border-sb-border/30 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
          <Globe className="w-4 h-4 text-sb-blue" />
          מה זה Debrid?
        </h3>
        <p className="text-sb-gray text-sm leading-relaxed">
          שירותי Debrid מאפשרים לך להוריד ולצפות בתכנים בקישורים פרימיום באיכות גבוהה ללא הגבלות.
          הם עובדים על ידי פיענוח קישורים מקורות שונים והפיכתם לקישורים ישירים.
          המפתחות נשמרים מקומית במכשירך בלבד.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {DEBRID_SERVICES.map(s => (
            <a
              key={s.id}
              href={s.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-sb-light bg-sb-card hover:bg-sb-border px-3 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              {s.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Services;

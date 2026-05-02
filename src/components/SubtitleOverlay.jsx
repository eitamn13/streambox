import { useState, useEffect, useRef } from 'react';
import { fetchSubtitles, loadSubtitleTrack, LANGUAGE_NAMES } from '../core/SubtitleEngine.js';
import { Subtitles, Clock, X, Loader2, Languages } from 'lucide-react';

function SubtitleOverlay({ id, type, imdbId, title, videoRef, onClose, preloadedSubs = [] }) {
  const [subs, setSubs] = useState(preloadedSubs);
  const [loading, setLoading] = useState(preloadedSubs.length === 0);
  const [selectedLang, setSelectedLang] = useState('all');
  const [activeTrack, setActiveTrack] = useState(null);
  const [offset, setOffset] = useState(0);
  const [syncOpen, setSyncOpen] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    if (preloadedSubs.length > 0) {
      setSubs(preloadedSubs);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const results = await fetchSubtitles({ imdb_id: imdbId, query: title, lang: 'heb,eng,spa,fre,ger,ita,por,rus,ara' });
        if (!cancelled) setSubs(results);
      } catch (e) {
        console.warn('Subtitle load failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, type, preloadedSubs, imdbId, title]);

  const languages = ['all', ...Array.from(new Set(subs.map(s => s.lang)))];
  const filtered = selectedLang === 'all' ? subs : subs.filter(s => s.lang === selectedLang);

  const applyTrack = async (sub) => {
    if (!videoRef.current) return;
    // Remove old track
    if (trackRef.current) {
      videoRef.current.removeChild(trackRef.current);
      trackRef.current = null;
    }
    if (!sub) {
      setActiveTrack(null);
      return;
    }
    const blobUrl = await loadSubtitleTrack(sub.url, offset);
    if (!blobUrl) return;
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = sub.label;
    track.srclang = sub.lang;
    track.src = blobUrl;
    track.default = true;
    videoRef.current.appendChild(track);
    trackRef.current = track;
    setActiveTrack(sub);
  };

  const handleOffsetChange = async (newOffset) => {
    setOffset(newOffset);
    if (activeTrack) {
      await applyTrack(activeTrack);
    }
  };

  useEffect(() => {
    return () => {
      if (trackRef.current && videoRef.current) {
        videoRef.current.removeChild(trackRef.current);
        trackRef.current = null;
      }
    };
  }, []);

  return (
    <div className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-sb-card/95 backdrop-blur-md rounded-xl border border-sb-border shadow-2xl z-50 animate-slide-up max-h-[60vh] flex flex-col">
      <div className="p-3 border-b border-sb-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Subtitles className="w-4 h-4 text-sb-red" />
          <span className="text-white text-sm font-medium">כתוביות</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSyncOpen(!syncOpen)}
            className={`p-1.5 rounded-lg transition-colors ${syncOpen ? 'bg-sb-red text-white' : 'text-sb-gray hover:text-white'}`}
            title="סנכרון"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 text-sb-gray hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {syncOpen && (
        <div className="p-3 border-b border-sb-border bg-sb-surface/50">
          <label className="text-sb-gray text-xs mb-1.5 block">סנכרון (שניות)</label>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={offset}
            onChange={(e) => handleOffsetChange(parseFloat(e.target.value))}
            className="w-full accent-sb-red"
          />
          <div className="flex justify-between text-xs text-sb-gray mt-1">
            <span>-10s</span>
            <span className="text-white font-medium">{offset > 0 ? '+' : ''}{offset}s</span>
            <span>+10s</span>
          </div>
        </div>
      )}

      <div className="p-2 border-b border-sb-border shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <Languages className="w-3.5 h-3.5 text-sb-gray shrink-0" />
          {languages.map(lang => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                selectedLang === lang ? 'bg-sb-red text-white' : 'bg-sb-surface text-sb-gray hover:text-white'
              }`}
            >
              {LANGUAGE_NAMES[lang] || lang}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-sb-gray">
            <Loader2 className="w-4 h-4 animate-spin" />
            טוען...
          </div>
        )}

        {!loading && subs.length === 0 && (
          <p className="text-center text-sb-gray text-sm py-8">לא נמצאו כתוביות</p>
        )}

        <div className="space-y-1">
          <button
            onClick={() => applyTrack(null)}
            className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
              !activeTrack ? 'bg-sb-red text-white' : 'text-sb-light hover:bg-sb-surface'
            }`}
          >
            כבוי
          </button>
          {filtered.map((sub, i) => (
            <button
              key={`${sub.lang}-${i}`}
              onClick={() => applyTrack(sub)}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTrack?.url === sub.url ? 'bg-sb-red text-white' : 'text-sb-light hover:bg-sb-surface'
              }`}
            >
              <p className="font-medium truncate">{sub.label}</p>
              <p className="text-xs opacity-70">{sub.provider} • {LANGUAGE_NAMES[sub.lang] || sub.lang} {sub.downloads ? `• ${sub.downloads} הורדות` : ''}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SubtitleOverlay;

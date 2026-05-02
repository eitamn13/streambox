import { useState, useEffect } from 'react';
import { fetchStreams } from '../core/StreamEngine.js';
import { Play, ExternalLink, Film, Loader2 } from 'lucide-react';

function StreamSelector({ id, type, onSelect, onClose }) {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchStreams(id, type);
        if (!cancelled) setStreams(results);
      } catch (e) {
        if (!cancelled) setError('טעינת מקורות נכשלה');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, type]);

  const qualityColor = (q) => {
    if (q === '4K') return 'text-sb-gold';
    if (q === '1080p') return 'text-sb-green';
    if (q === '720p') return 'text-sb-blue';
    return 'text-sb-gray';
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-sb-card rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-sb-border flex items-center justify-between">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Film className="w-5 h-5 text-sb-red" />
            בחר מקור צפייה
          </h2>
          <button onClick={onClose} className="text-sb-gray hover:text-white transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-sb-gray">
              <Loader2 className="w-5 h-5 animate-spin" />
              טוען מקורות...
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-sb-gray">
              <p>{error}</p>
            </div>
          )}

          {!loading && streams.length === 0 && (
            <div className="text-center py-12 text-sb-gray">
              <p>לא נמצאו מקורות זמינים</p>
              <p className="text-xs mt-2">נסה להתקין תוספים נוספים בהגדרות</p>
            </div>
          )}

          <div className="space-y-2">
            {streams.map((stream, i) => (
              <button
                key={i}
                onClick={() => onSelect(stream)}
                className="w-full flex items-center gap-3 bg-sb-surface hover:bg-sb-border rounded-xl p-4 transition-colors text-right"
              >
                <div className="w-10 h-10 bg-sb-card rounded-lg flex items-center justify-center shrink-0">
                  {stream.type === 'link' ? (
                    <ExternalLink className="w-5 h-5 text-sb-gray" />
                  ) : (
                    <Play className="w-5 h-5 text-sb-red" fill="currentColor" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{stream.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-semibold ${qualityColor(stream.quality)}`}>{stream.quality}</span>
                    <span className="text-sb-gray text-xs">{stream.provider}</span>
                    {stream.size && <span className="text-sb-gray text-xs">{stream.size}</span>}
                  </div>
                  {stream.info?.length > 0 && (
                    <p className="text-sb-gray text-xs mt-1 truncate">{stream.info.join(' • ')}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StreamSelector;

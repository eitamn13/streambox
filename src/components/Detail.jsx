import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContentDetails } from '../core/StreamBoxCore.js';
import { fetchStreams } from '../core/StreamEngine.js';
import { searchYtsMagnets, addMagnetToRd, getConfiguredDebrids } from '../core/DebridManager.js';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../core/History.js';
import {
  Play, Star, Clock, Calendar, ExternalLink, Film, Bookmark, BookmarkCheck,
  MonitorPlay, Loader2, ChevronLeft, Users, Globe, Award, Search, Magnet,
  AlertCircle, CheckCircle
} from 'lucide-react';

function Detail() {
  const { type, id } = useParams();
  const [data, setData] = useState(null);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streamsLoading, setStreamsLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);

  // Magnet search states
  const [searchingMagnets, setSearchingMagnets] = useState(false);
  const [magnetResults, setMagnetResults] = useState([]);
  const [addingMagnet, setAddingMagnet] = useState(false);
  const [showMagnetPanel, setShowMagnetPanel] = useState(false);
  const [manualMagnet, setManualMagnet] = useState('');
  const [addError, setAddError] = useState(null);
  const [rdConfigured] = useState(() => getConfiguredDebrids().some(s => s.id === 'realdebrid'));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setStreamsLoading(true);
      try {
        const details = await getContentDetails(id, type);
        const streamResults = await fetchStreams(id, type, details?.title, details?.year);
        if (!cancelled) {
          setData(details);
          setStreams(streamResults);
          setInWatchlist(isInWatchlist(id, type));
        }
      } catch (_err) {
        console.error('Failed to load details:', _err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setStreamsLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true };
  }, [type, id]);

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(id, type);
    } else {
      addToWatchlist({ id, type, title: data?.title, poster: data?.poster });
    }
    setInWatchlist(!inWatchlist);
  };

  const handleSearchMagnets = async () => {
    if (!data?.title) return;
    setSearchingMagnets(true);
    setMagnetResults([]);
    setAddError(null);
    try {
      const results = await searchYtsMagnets(data.title, data.year);
      setMagnetResults(results);
    } catch (e) {
      setAddError('חיפוש המגנטים נכשל');
    } finally {
      setSearchingMagnets(false);
    }
  };

  const handleAddMagnet = async (magnet, title) => {
    setAddingMagnet(true);
    setAddError(null);
    try {
      const results = await addMagnetToRd(magnet, title);
      if (results.length > 0) {
        setStreams(prev => [...prev, ...results]);
        setShowMagnetPanel(false);
        setMagnetResults([]);
      } else {
        setAddError('לא נמצאו קבצים להורדה');
      }
    } catch (e) {
      setAddError(e.message || 'הוספת המגנט נכשלה');
    } finally {
      setAddingMagnet(false);
    }
  };

  const handleAddManualMagnet = async () => {
    if (!manualMagnet.trim()) return;
    await handleAddMagnet(manualMagnet.trim(), data?.title);
    setManualMagnet('');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-shimmer h-[40vh] rounded-2xl mb-6 bg-sb-card" />
        <div className="animate-shimmer h-8 w-64 rounded bg-sb-card mb-4" />
        <div className="animate-shimmer h-4 w-full rounded bg-sb-card mb-2" />
        <div className="animate-shimmer h-4 w-3/4 rounded bg-sb-card" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">לא נמצא</h2>
        <p className="text-sb-gray">התוכן שחיפשת לא קיים במערכת</p>
        <Link to="/" className="text-sb-red hover:underline mt-4 inline-block">חזרה לדף הבית</Link>
      </div>
    );
  }

  const hasStreams = streams.length > 0;

  return (
    <div className="page-transition">
      {/* Backdrop */}
      <div className="relative h-[45vh] sm:h-[55vh] overflow-hidden">
        {data.backdrop ? (
          <img src={data.backdrop} alt={data.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-sb-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-sb-black via-sb-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-sb-black/40 via-transparent to-transparent" />
        <Link
          to="/"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-32 sm:-mt-40 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Poster */}
          <div className="shrink-0 w-36 sm:w-44 md:w-52 mx-auto md:mx-0">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-sb-card shadow-2xl ring-1 ring-white/10">
              {data.poster ? (
                <img src={data.poster} alt={data.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-12 h-12 text-sb-gray" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-1">{data.title}</h1>
            {data.originalTitle && data.originalTitle !== data.title && (
              <p className="text-sb-gray text-sm mb-3">{data.originalTitle}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-5">
              {data.rating > 0 && (
                <span className="flex items-center gap-1 text-sb-gold text-sm font-bold">
                  <Star className="w-4 h-4" fill="currentColor" />
                  {data.rating.toFixed(1)}
                </span>
              )}
              {data.year && (
                <span className="flex items-center gap-1 text-sb-gray text-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  {data.year}
                </span>
              )}
              {data.runtime && (
                <span className="flex items-center gap-1 text-sb-gray text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  {data.runtime} דק'
                </span>
              )}
              <span className="text-sb-gray text-sm">{type === 'tv' ? 'סדרה' : 'סרט'}</span>
              {data.status && <span className="text-sb-gray text-sm">{data.status}</span>}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {data.genres.map((g) => (
                <span key={g.id} className="bg-white/10 text-sb-light text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {g.name}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              {hasStreams ? (
                <Link
                  to={`/player/${type}/${id}`}
                  className="flex items-center gap-2 bg-sb-red hover:bg-sb-red-hover text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-sb-red-glow hover:shadow-xl hover:shadow-sb-red-glow"
                >
                  <MonitorPlay className="w-5 h-5" />
                  צפה עכשיו
                </Link>
              ) : (
                <button
                  onClick={() => { setShowMagnetPanel(true); handleSearchMagnets(); }}
                  disabled={!rdConfigured || searchingMagnets}
                  className="flex items-center gap-2 bg-sb-red hover:bg-sb-red-hover text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searchingMagnets ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  חפש מגנט
                </button>
              )}
              <button
                onClick={toggleWatchlist}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                  inWatchlist
                    ? 'bg-sb-green/20 text-sb-green border border-sb-green/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                {inWatchlist ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                {inWatchlist ? 'ברשימה' : 'שמור'}
              </button>
            </div>

            {/* Overview */}
            <div className="mb-8">
              <p className="text-sb-light/90 leading-relaxed text-sm sm:text-base">{data.overview || 'אין תקציר זמין'}</p>
              {data.tagline && <p className="text-sb-gray italic mt-3 text-sm">"{data.tagline}"</p>}
            </div>

            {/* Real-Debrid Streams Section */}
            <div className="mb-8">
              <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-sb-red" />
                מקורות Real-Debrid
              </h2>

              {!rdConfigured && (
                <div className="bg-sb-gold/5 border border-sb-gold/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-sb-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sb-light text-sm">Real-Debrid לא מחובר</p>
                      <Link to="/settings" className="text-sb-red text-sm hover:underline mt-1 inline-block">
                        התחבר ל-Real-Debrid בהגדרות
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {rdConfigured && streamsLoading && (
                <div className="flex items-center gap-2 text-sb-gray py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  טוען מקורות מ-Real-Debrid...
                </div>
              )}

              {rdConfigured && !streamsLoading && !hasStreams && (
                <div className="bg-sb-card rounded-xl p-4">
                  <p className="text-sb-gray text-sm">הסרט לא נמצא בספרייה שלך ב-Real-Debrid</p>
                  <button
                    onClick={() => { setShowMagnetPanel(true); handleSearchMagnets(); }}
                    className="flex items-center gap-2 mt-3 text-sm text-sb-red hover:underline"
                  >
                    <Search className="w-4 h-4" />
                    חפש והוסף מגנט
                  </button>
                </div>
              )}

              {hasStreams && (
                <div className="space-y-2">
                  {streams.map((stream, i) => (
                    <Link
                      key={i}
                      to={`/player/${type}/${id}`}
                      className="flex items-center gap-3 bg-sb-card hover:bg-sb-surface p-4 rounded-xl transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sb-red/10 flex items-center justify-center">
                        <Play className="w-5 h-5 text-sb-red" fill="currentColor" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{stream.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sb-green text-xs font-bold">{stream.quality}</span>
                          <span className="text-sb-gray text-xs">{stream.provider}</span>
                          {stream.size && <span className="text-sb-gray text-xs">{stream.size}</span>}
                        </div>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-sb-gray group-hover:text-white transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Magnet Search Panel */}
            {showMagnetPanel && rdConfigured && (
              <div className="mb-8 bg-sb-card rounded-2xl border border-sb-border/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Magnet className="w-4 h-4 text-sb-red" />
                    הוספת מגנט
                  </h3>
                  <button onClick={() => setShowMagnetPanel(false)} className="text-sb-gray hover:text-white">✕</button>
                </div>

                {/* Manual input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={manualMagnet}
                    onChange={(e) => setManualMagnet(e.target.value)}
                    placeholder="הדבק קישור מגנט..."
                    className="flex-1 bg-sb-surface border border-sb-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-sb-gray outline-none focus:border-sb-red/60"
                  />
                  <button
                    onClick={handleAddManualMagnet}
                    disabled={!manualMagnet.trim() || addingMagnet}
                    className="bg-sb-red text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {addingMagnet ? <Loader2 className="w-4 h-4 animate-spin" /> : 'הוסף'}
                  </button>
                </div>

                {/* YTS Results */}
                {magnetResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <p className="text-sb-light text-sm font-medium">תוצאות חיפוש:</p>
                    {magnetResults.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => handleAddMagnet(m.magnet, m.title)}
                        disabled={addingMagnet}
                        className="w-full text-right bg-sb-surface hover:bg-sb-border rounded-lg p-3 transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{m.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sb-green text-xs font-bold">{m.quality}</span>
                              <span className="text-sb-gray text-xs">{m.size}</span>
                              <span className="text-sb-gray text-xs">S: {m.seeds}</span>
                            </div>
                          </div>
                          <Magnet className="w-4 h-4 text-sb-red shrink-0 mr-2" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchingMagnets && (
                  <div className="flex items-center gap-2 text-sb-gray py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    מחפש מגנטים...
                  </div>
                )}

                {addError && (
                  <div className="flex items-center gap-2 text-sb-red text-sm py-2">
                    <AlertCircle className="w-4 h-4" />
                    {addError}
                  </div>
                )}
              </div>
            )}

            {/* Cast */}
            {data.cast && data.cast.length > 0 && (
              <div className="mb-8">
                <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-sb-red" />
                  שחקנים
                </h2>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {(showAllCast ? data.cast : data.cast.slice(0, 6)).map((c, i) => (
                    <div key={i} className="flex-shrink-0 w-[100px]">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-sb-card mb-2">
                        {c.photo ? (
                          <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-sb-surface">
                            <span className="text-sb-gray text-xl font-bold">{c.name?.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-white text-xs font-medium line-clamp-1">{c.name}</p>
                      <p className="text-sb-gray text-[10px] line-clamp-1">{c.character}</p>
                    </div>
                  ))}
                </div>
                {data.cast.length > 6 && (
                  <button
                    onClick={() => setShowAllCast(!showAllCast)}
                    className="text-sb-red text-sm hover:underline mt-1"
                  >
                    {showAllCast ? 'פחות' : 'הצג הכל'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Detail;

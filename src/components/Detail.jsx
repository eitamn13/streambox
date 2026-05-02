import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContentDetails } from '../core/StreamBoxCore.js';
import { fetchStreams } from '../core/StreamEngine.js';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../core/History.js';
import {
  Play, Star, Clock, Calendar, ExternalLink, Film, Bookmark, BookmarkCheck,
  MonitorPlay, Loader2, ChevronLeft, Users, Globe, Award
} from 'lucide-react';

function Detail() {
  const { type, id } = useParams();
  const [data, setData] = useState(null);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streamsLoading, setStreamsLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setStreamsLoading(true);
      try {
        const details = await getContentDetails(id, type);
        const streamResults = await fetchStreams(id, type, details?.title, details?.year, details?.id);
        if (!cancelled) {
          setData(details);
          setStreams(streamResults);
          setInWatchlist(isInWatchlist(id, type));
        }
      } catch (e) {
        console.error('Failed to load details:', e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setStreamsLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [type, id]);

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(id, type);
    } else {
      addToWatchlist({ id, type, title: data?.title, poster: data?.poster });
    }
    setInWatchlist(!inWatchlist);
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

  const directStreams = streams.filter(s => s.type === 'direct' || s.url?.match(/\.(mp4|webm|m3u8|mkv)($|\?)/i));
  const linkStreams = streams.filter(s => s.type === 'link');

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
              <Link
                to={`/player/${type}/${id}`}
                className="flex items-center gap-2 bg-sb-red hover:bg-sb-red-hover text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-sb-red-glow hover:shadow-xl hover:shadow-sb-red-glow"
              >
                <MonitorPlay className="w-5 h-5" />
                צפה עכשיו
              </Link>
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

            {/* Streams Section */}
            <div className="mb-8">
              <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-sb-red" />
                מקורות צפייה
              </h2>
              {streamsLoading ? (
                <div className="flex items-center gap-2 text-sb-gray py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  טוען מקורות...
                </div>
              ) : streams.length === 0 ? (
                <p className="text-sb-gray text-sm py-4">לא נמצאו מקורות זמינים. התקן תוספים נוספים.</p>
              ) : (
                <div className="space-y-2">
                  {directStreams.map((stream, i) => (
                    <Link
                      key={`d-${i}`}
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
                  {linkStreams.map((stream, i) => (
                    <a
                      key={`l-${i}`}
                      href={stream.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-sb-card hover:bg-sb-surface p-4 rounded-xl transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-sb-surface flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-sb-gray" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{stream.title}</p>
                        <span className="text-sb-gray text-xs">{stream.provider}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-sb-gray group-hover:text-white transition-colors" />
                    </a>
                  ))}
                </div>
              )}
            </div>

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

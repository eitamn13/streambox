import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getContentDetails, getSeasonDetails } from '../core/StreamBoxCore.js';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../core/History.js';
import { useSubscription } from '../contexts/SubscriptionContext.jsx';
import {
  Play, Star, Clock, Calendar, Film, Bookmark, BookmarkCheck,
  Loader2, ChevronLeft, Users, Globe, Award, ChevronDown,
  Crown
} from 'lucide-react';

function Detail() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { isPremium, isTrialing, watchCheck } = useSubscription();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonData, setSeasonData] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const details = await getContentDetails(id, type);
        if (!cancelled) {
          setData(details);
          setInWatchlist(isInWatchlist(id, type));
          const firstRealSeason = details.seasons?.find(s => s.season_number > 0);
          if (firstRealSeason) setSelectedSeason(firstRealSeason.season_number);
        }
      } catch (_err) {
        console.error('Failed to load details:', _err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true };
  }, [type, id]);

  useEffect(() => {
    if (type !== 'tv' || !selectedSeason) return;
    let cancelled = false;
    async function load() {
      setSeasonLoading(true);
      try {
        const result = await getSeasonDetails(id, selectedSeason);
        if (!cancelled) setSeasonData(result);
      } catch (_err) {
        console.warn('Failed to load season:', _err);
      } finally {
        if (!cancelled) setSeasonLoading(false);
      }
    }
    load();
    return () => { cancelled = true };
  }, [type, id, selectedSeason]);

  const toggleWatchlist = () => {
    if (inWatchlist) removeFromWatchlist(id, type);
    else addToWatchlist({ id, type, title: data?.title, poster: data?.poster });
    setInWatchlist(!inWatchlist);
  };

  const handlePlay = (path) => {
    const check = watchCheck();
    if (!check.allowed) {
      navigate('/subscription');
      return;
    }
    navigate(path);
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

  const isTv = type === 'tv';
  const seasons = data.seasons?.filter(s => s.season_number > 0) || [];
  const hasAccess = isPremium || isTrialing;

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
        <Link to="/" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all">
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
              <span className="text-sb-gray text-sm">{isTv ? 'סדרה' : 'סרט'}</span>
              {data.status && <span className="text-sb-gray text-sm">{data.status}</span>}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {data.genres.map((g) => (
                <span key={g.id} className="bg-white/10 text-sb-light text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Subscription notice for non-premium */}
            {!hasAccess && (
              <div className="bg-sb-purple/10 border border-sb-purple/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-sb-purple shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium mb-1">נדרש מנוי פרימיום</p>
                    <p className="text-sb-gray text-xs mb-2">צפה בסרטים וסדרות באיכות 4K עם כתוביות אוטומטיות. התחל ניסיון חינם ל-7 ימים!</p>
                    <button
                      onClick={() => navigate('/subscription')}
                      className="bg-sb-purple hover:bg-sb-purple/80 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      התחל ניסיון חינם
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-8">
              {!isTv ? (
                <button
                  onClick={() => handlePlay(`/player/movie/${id}`)}
                  className="flex items-center gap-2 bg-sb-red hover:bg-sb-red-hover text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-sb-red-glow hover:shadow-xl hover:shadow-sb-red-glow"
                >
                  <Play className="w-5 h-5" />
                  צפה עכשיו
                </button>
              ) : (
                seasons.length > 0 && (
                  <button
                    onClick={() => handlePlay(`/player/tv/${id}/${seasons[0].season_number}/1`)}
                    className="flex items-center gap-2 bg-sb-red hover:bg-sb-red-hover text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-sb-red-glow hover:shadow-xl hover:shadow-sb-red-glow"
                  >
                    <Play className="w-5 h-5" />
                    נגן פרק 1
                  </button>
                )
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

            {/* Seasons & Episodes */}
            {isTv && seasons.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-white font-bold text-lg">עונות</h2>
                  <div className="relative">
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="appearance-none bg-sb-surface border border-sb-border text-white text-sm px-4 py-2 pr-8 rounded-lg cursor-pointer focus:border-sb-red/60 outline-none"
                    >
                      {seasons.map(s => (
                        <option key={s.season_number} value={s.season_number}>
                          {s.name} ({s.episode_count} פרקים)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-sb-gray absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {seasonLoading ? (
                  <div className="flex items-center gap-2 text-sb-gray py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    טוען פרקים...
                  </div>
                ) : seasonData?.episodes?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {seasonData.episodes.map((ep) => (
                      <button
                        key={ep.episodeNumber}
                        onClick={() => handlePlay(`/player/tv/${id}/${selectedSeason}/${ep.episodeNumber}`)}
                        className="flex gap-3 bg-sb-card hover:bg-sb-surface border border-sb-border hover:border-sb-red/30 rounded-xl p-3 text-right transition-all group"
                      >
                        <div className="shrink-0 w-28 aspect-video rounded-lg overflow-hidden bg-sb-surface">
                          {ep.still ? (
                            <img src={ep.still} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-6 h-6 text-sb-gray" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sb-red text-xs font-bold">E{ep.episodeNumber}</span>
                            <p className="text-white text-sm font-medium truncate">{ep.title}</p>
                          </div>
                          <p className="text-sb-gray text-xs line-clamp-2">{ep.overview || 'אין תקציר'}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            {ep.runtime && (
                              <span className="text-sb-gray text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {ep.runtime} דק'
                              </span>
                            )}
                            {ep.airDate && <span className="text-sb-gray text-xs">{ep.airDate}</span>}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center">
                          <div className="w-8 h-8 rounded-full bg-sb-red/10 group-hover:bg-sb-red flex items-center justify-center transition-colors">
                            <Play className="w-4 h-4 text-sb-red group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sb-gray text-sm">אין פרקים זמינים לעונה זו</p>
                )}
              </div>
            )}

            {/* Cast */}
            {data.cast.length > 0 && (
              <div className="mb-8">
                <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-sb-red" />
                  שחקנים
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {(showAllCast ? data.cast : data.cast.slice(0, 6)).map((actor) => (
                    <div key={actor.name} className="shrink-0 text-center w-20">
                      <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-sb-card mb-1.5 ring-1 ring-white/10">
                        {actor.photo ? (
                          <img src={actor.photo} alt={actor.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-sb-gray" />
                          </div>
                        )}
                      </div>
                      <p className="text-white text-xs font-medium truncate">{actor.name}</p>
                      <p className="text-sb-gray text-[10px] truncate">{actor.character}</p>
                    </div>
                  ))}
                  {!showAllCast && data.cast.length > 6 && (
                    <button
                      onClick={() => setShowAllCast(true)}
                      className="shrink-0 w-16 h-16 rounded-full bg-sb-card flex items-center justify-center text-sb-gray hover:text-white transition-colors"
                    >
                      +{data.cast.length - 6}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-3">
              {data.imdbId && (
                <a href={`https://www.imdb.com/title/${data.imdbId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sb-gold hover:text-sb-gold-hover text-sm transition-colors">
                  <Award className="w-4 h-4" />
                  IMDB
                </a>
              )}
              {data.homepage && (
                <a href={data.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sb-blue hover:text-sb-blue-hover text-sm transition-colors">
                  <Globe className="w-4 h-4" />
                  אתר רשמי
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Detail;

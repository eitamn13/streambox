import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getContentDetails, getSeasonDetails, getCatalog } from '../core/StreamBoxCore.js';
import { fetchStreams } from '../core/StreamEngine.js';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../core/History.js';
import { useSubscription } from '../contexts/SubscriptionContext.jsx';
import { useApp } from '../contexts/AppContext.jsx';
import ContentRow from './ContentRow.jsx';
import ImageWithFallback from './ImageWithFallback.jsx';
import {
  Play, Star, Clock, Film, Bookmark, BookmarkCheck,
  Loader2, ChevronLeft, Users, Globe, Award, ChevronDown,
  MonitorOff, Share2, Plus, Check
} from 'lucide-react';

function Detail() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { watchCheck } = useSubscription();
  const { addToFavorites, removeFromFavorites, isInFavorites } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inFavorites, setInFavorites] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);
  const [sourceCheck, setSourceCheck] = useState({ checking: false, hasSources: true, count: 0 });
  const [similar, setSimilar] = useState([]);

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
          setInFavorites(isInFavorites(id));
          const firstRealSeason = details.seasons?.find(s => s.season_number > 0);
          if (firstRealSeason) setSelectedSeason(firstRealSeason.season_number);

          // Load similar content
          try {
            const trending = await getCatalog('trending', 1);
            if (!cancelled) setSimilar(trending.filter(t => t.id !== Number(id)).slice(0, 12));
          } catch { /* ignore */ }

          // Check sources
          setSourceCheck({ checking: true, hasSources: true, count: 0 });
          try {
            const streams = await fetchStreams(id, type, details.title, details.year, details.imdbId, null, null);
            if (!cancelled) {
              setSourceCheck({ checking: false, hasSources: streams.length > 0, count: streams.length });
            }
          } catch (e) {
            if (!cancelled) setSourceCheck({ checking: false, hasSources: false, count: 0 });
          }
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

  const toggleFavorites = () => {
    if (inFavorites) removeFromFavorites(id);
    else addToFavorites({ id, type, title: data?.title, poster: data?.poster });
    setInFavorites(!inFavorites);
  };

  const handlePlay = (path) => {
    navigate(path);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: data?.title, text: data?.overview, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a]">
        <div className="h-[50vh] bg-[#1a1a2e] animate-shimmer" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-shimmer h-8 w-64 rounded bg-[#1a1a2e] mb-4" />
          <div className="animate-shimmer h-4 w-full rounded bg-[#1a1a2e] mb-2" />
          <div className="animate-shimmer h-4 w-3/4 rounded bg-[#1a1a2e]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">לא נמצא</h2>
        <p className="text-[#808090]">התוכן שחיפשת לא קיים במערכת</p>
        <Link to="/" className="text-[#e50914] hover:underline mt-4 inline-block">חזרה לדף הבית</Link>
      </div>
    );
  }

  const isTv = type === 'tv';
  const seasons = data.seasons?.filter(s => s.season_number > 0) || [];

  const ageRating = (data.id % 3 === 0) ? '16+' : (data.id % 3 === 1) ? '13+' : '18+';
  const quality = data.rating > 7.5 ? '4K HDR' : 'HD';

  return (
    <div className="page-transition bg-[#0f0f1a]">
      {/* Backdrop - Netflix style */}
      <div className="detail-backdrop">
        {data.backdrop ? (
          <ImageWithFallback src={data.backdrop} alt={data.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a]" />
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-[30vh] relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="shrink-0 w-40 sm:w-48 md:w-56 mx-auto md:mx-0">
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10">
              {data.poster ? (
                <ImageWithFallback src={data.poster} alt={data.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-12 h-12 text-[#808090]" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-2">{data.title}</h1>
            {data.originalTitle && data.originalTitle !== data.title && (
              <p className="text-[#808090] text-sm mb-4">{data.originalTitle}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {data.rating > 0 && (
                <span className="flex items-center gap-1 text-[#f5c518] text-sm font-bold">
                  <Star className="w-4 h-4" fill="currentColor" />
                  {data.rating.toFixed(1)}
                </span>
              )}
              {data.year && <span className="text-[#b3b3c0] text-sm">{data.year}</span>}
              {data.runtime && (
                <span className="text-[#b3b3c0] text-sm flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {data.runtime} דק'
                </span>
              )}
              <span className="age-badge">{ageRating}</span>
              <span className="quality-badge">{quality}</span>
              <span className="text-[#b3b3c0] text-sm">{isTv ? 'סדרה' : 'סרט'}</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {data.genres.map((g) => (
                <span key={g.id} className="bg-white/10 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Source check */}
            {sourceCheck.checking && (
              <div className="flex items-center gap-2 text-[#808090] text-sm mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                בודק זמינות מקורות...
              </div>
            )}
            {!sourceCheck.checking && !sourceCheck.hasSources && (
              <div className="bg-[#808090]/10 border border-[#808090]/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <MonitorOff className="w-5 h-5 text-[#808090] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium mb-1">אין מקורות זמינים כרגע</p>
                    <p className="text-[#808090] text-xs">המקורות עשויים להתעדכן בהמשך.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={() => handlePlay(isTv && seasons.length > 0 ? `/player/tv/${id}/${seasons[0].season_number}/1` : `/player/movie/${id}`)}
                disabled={!sourceCheck.hasSources}
                className="flex items-center gap-2 bg-[#e50914] hover:bg-[#f40612] disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3 rounded-md font-bold text-base transition-all hover:scale-105"
              >
                <Play className="w-5 h-5" fill="white" />
                צפה עכשיו
              </button>
              <button
                onClick={toggleWatchlist}
                className={`flex items-center gap-2 px-6 py-3 rounded-md font-bold text-base transition-all hover:scale-105 ${
                  inWatchlist
                    ? 'bg-[#46d369]/20 text-[#46d369] border border-[#46d369]/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {inWatchlist ? 'ברשימת הצפייה' : 'הוסף לרשימת צפייה'}
              </button>
              <button
                onClick={toggleFavorites}
                className={`flex items-center gap-2 px-5 py-3 rounded-md font-bold text-base transition-all hover:scale-105 ${
                  inFavorites
                    ? 'bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                <Bookmark className="w-5 h-5" fill={inFavorites ? 'currentColor' : 'none'} />
                {inFavorites ? 'במועדפים' : 'מועדפים'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-3 rounded-md font-bold text-base transition-all hover:scale-105 bg-white/10 hover:bg-white/20 text-white border border-white/10"
              >
                <Share2 className="w-5 h-5" />
                שתף
              </button>
            </div>

            {/* Overview */}
            <div className="mb-8">
              <p className="text-white/90 leading-relaxed text-sm sm:text-base">{data.overview || 'אין תקציר זמין'}</p>
              {data.tagline && <p className="text-[#808090] italic mt-3 text-sm">"{data.tagline}"</p>}
            </div>

            {/* Cast */}
            {data.cast.length > 0 && (
              <div className="mb-8">
                <h2 className="text-white font-bold text-lg mb-3">שחקנים</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                  {(showAllCast ? data.cast : data.cast.slice(0, 8)).map((actor) => (
                    <div key={actor.name} className="shrink-0 text-center w-20">
                      <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-[#1a1a2e] mb-1.5 ring-1 ring-white/10">
                        {actor.photo ? (
                          <img src={actor.photo} alt={actor.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-[#808090]" />
                          </div>
                        )}
                      </div>
                      <p className="text-white text-xs font-medium truncate">{actor.name}</p>
                      <p className="text-[#808090] text-[10px] truncate">{actor.character}</p>
                    </div>
                  ))}
                  {!showAllCast && data.cast.length > 8 && (
                    <button
                      onClick={() => setShowAllCast(true)}
                      className="shrink-0 w-16 h-16 rounded-full bg-[#1a1a2e] flex items-center justify-center text-[#808090] hover:text-white transition-colors"
                    >
                      +{data.cast.length - 8}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-4 mb-8">
              {data.imdbId && (
                <a href={`https://www.imdb.com/title/${data.imdbId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#f5c518] hover:text-[#ffd700] text-sm transition-colors font-bold">
                  <Award className="w-4 h-4" />
                  IMDB
                </a>
              )}
              {data.homepage && (
                <a href={data.homepage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#0071eb] hover:text-[#3391ff] text-sm transition-colors">
                  <Globe className="w-4 h-4" />
                  אתר רשמי
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Seasons & Episodes */}
        {isTv && seasons.length > 0 && (
          <div className="mt-8 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-white font-bold text-xl">פרקים</h2>
              <div className="relative">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="appearance-none bg-[#1a1a2e] border border-[#33334a] text-white text-sm px-4 py-2 pr-8 rounded-lg cursor-pointer focus:border-[#e50914]/60 outline-none"
                >
                  {seasons.map(s => (
                    <option key={s.season_number} value={s.season_number}>
                      {s.name} ({s.episode_count} פרקים)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#808090] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {seasonLoading ? (
              <div className="flex items-center gap-2 text-[#808090] py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                טוען פרקים...
              </div>
            ) : seasonData?.episodes?.length > 0 ? (
              <div className="space-y-3">
                {seasonData.episodes.map((ep) => (
                  <button
                    key={ep.episodeNumber}
                    onClick={() => handlePlay(`/player/tv/${id}/${selectedSeason}/${ep.episodeNumber}`)}
                    className="episode-card w-full flex gap-4 text-right group"
                  >
                    <div className="shrink-0 w-32 sm:w-40 aspect-video rounded-lg overflow-hidden bg-[#2a2a3e] relative">
                      {ep.still ? (
                        <img src={ep.still} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="w-6 h-6 text-[#808090]" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-[#e50914] flex items-center justify-center">
                          <Play className="w-4 h-4 text-white mr-0.5" fill="white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 text-right py-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#e50914] text-sm font-bold">{ep.episodeNumber}</span>
                        <p className="text-white text-sm font-medium truncate">{ep.title}</p>
                      </div>
                      <p className="text-[#808090] text-xs line-clamp-2">{ep.overview || 'אין תקציר'}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {ep.runtime && (
                          <span className="text-[#808090] text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ep.runtime} דק'
                          </span>
                        )}
                        {ep.airDate && <span className="text-[#808090] text-xs">{ep.airDate}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[#808090] text-sm">אין פרקים זמינים לעונה זו</p>
            )}
          </div>
        )}

        {/* Similar content */}
        {similar.length > 0 && (
          <div className="mt-8">
            <ContentRow title="תוכן דומה" items={similar} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Detail;

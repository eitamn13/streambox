import { useState, useEffect, useMemo } from 'react';
import HeroBanner from './HeroBanner.jsx';
import ContentRow from './ContentRow.jsx';
import PlatformRow from './PlatformRow.jsx';
import TopTenRow from './TopTenRow.jsx';
import { getCatalog, getMoviesByGenre, GENRES } from '../core/StreamBoxCore.js';
import { getContinueWatching, getRecentlyWatched } from '../core/History.js';
import { useApp } from '../contexts/AppContext.jsx';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 17) return 'צהריים טובים';
  if (hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

function Home() {
  const { session, continueWatching: globalContinue, profiles, activeProfile } = useApp();
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [catalogs, setCatalogs] = useState({
    trending: [],
    movies_popular: [],
    movies_top_rated: [],
    tv_popular: [],
    tv_top_rated: [],
  });
  const [genres, setGenres] = useState({
    action: [],
    comedy: [],
    drama: [],
    thriller: [],
    scifi: [],
    horror: [],
  });
  const [recentlyWatched, setRecentlyWatched] = useState([]);
  const [loading, setLoading] = useState(true);

  const userName = session?.user?.user_metadata?.full_name || 
    profiles?.find(p => p.id === activeProfile)?.name || 'אורח';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [trending, movies_popular, movies_top_rated, tv_popular, tv_top_rated,
               action, comedy, drama, thriller, scifi, horror] = await Promise.all([
          getCatalog('trending', 1),
          getCatalog('movies_popular', 1),
          getCatalog('movies_top_rated', 1),
          getCatalog('tv_popular', 1),
          getCatalog('tv_top_rated', 1),
          getMoviesByGenre(GENRES.action.id, 1),
          getMoviesByGenre(GENRES.comedy.id, 1),
          getMoviesByGenre(GENRES.drama.id, 1),
          getMoviesByGenre(GENRES.thriller.id, 1),
          getMoviesByGenre(GENRES.scifi.id, 1),
          getMoviesByGenre(GENRES.horror.id, 1),
        ]);
        if (!cancelled) {
          setCatalogs({ trending, movies_popular, movies_top_rated, tv_popular, tv_top_rated });
          setGenres({ action, comedy, drama, thriller, scifi, horror });
          setRecentlyWatched(getRecentlyWatched());
        }
      } catch (e) {
        console.error('Failed to load catalogs:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filterByPlatform = (items) => {
    if (!selectedPlatform || !items) return items;
    const platformIndex = ['netflix', 'hbo', 'disney', 'appletv', 'prime', 'yes', 'hot'].indexOf(selectedPlatform);
    if (platformIndex === -1) return items;
    return items.filter((item) => (item.id || 0) % 7 === platformIndex);
  };

  const allMovies = useMemo(() => {
    const all = [...catalogs.movies_popular, ...catalogs.movies_top_rated];
    const seen = new Set();
    return all.filter((item) => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
  }, [catalogs]);

  const new2025 = useMemo(() => allMovies.filter((item) => item.year === '2025' || item.year === '2026'), [allMovies]);
  const kidsContent = useMemo(() => [...genres.comedy, ...catalogs.tv_popular].slice(0, 20), [genres, catalogs]);

  const continueWatchingItems = useMemo(() => {
    const local = getContinueWatching();
    return local.length > 0 ? local : globalContinue || [];
  }, [globalContinue]);

  return (
    <div className="page-transition bg-[#0f0f1a]">
      {/* Greeting */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          {getGreeting()}, {userName}
        </h1>
      </div>

      {/* HERO BANNER */}
      <HeroBanner items={catalogs.trending.slice(0, 5)} />

      {/* CONTINUE WATCHING */}
      {continueWatchingItems.length > 0 && (
        <ContentRow title="המשך צפייה" items={continueWatchingItems} showProgress />
      )}

      {/* PLATFORM FILTERS */}
      <PlatformRow selected={selectedPlatform} onSelect={setSelectedPlatform} />

      {/* TOP 10 */}
      <TopTenRow items={filterByPlatform(catalogs.trending)} />

      {/* CATEGORY ROWS */}
      <div className="pb-12">
        <ContentRow title="המומלצים עבורך" items={filterByPlatform(catalogs.trending)} loading={loading} />
        <ContentRow title="חדש על StreamBox" items={filterByPlatform(new2025.length > 0 ? new2025 : catalogs.movies_popular)} loading={loading} />
        <ContentRow title="פופולרי עכשיו" items={filterByPlatform(catalogs.movies_popular)} loading={loading} />
        <ContentRow title="NETFLIX" items={filterByPlatform(catalogs.movies_top_rated)} loading={loading} />
        <ContentRow title="HBO" items={filterByPlatform(catalogs.tv_top_rated)} loading={loading} />
        <ContentRow title="DISNEY+" items={filterByPlatform(kidsContent)} loading={loading} />
        <ContentRow title="AMAZON PRIME" items={filterByPlatform(catalogs.tv_popular)} loading={loading} />
        <ContentRow title="דרמה כבדה" items={filterByPlatform(genres.drama)} loading={loading} />
        <ContentRow title="אקשן" items={filterByPlatform(genres.action)} loading={loading} />
        <ContentRow title="קומדיה" items={filterByPlatform(genres.comedy)} loading={loading} />
        <ContentRow title="מדע בדיוני" items={filterByPlatform(genres.scifi)} loading={loading} />
        <ContentRow title="אימה" items={filterByPlatform(genres.horror)} loading={loading} />
        <ContentRow title="מתח" items={filterByPlatform(genres.thriller)} loading={loading} />
        <ContentRow title="סרטי ילדים" items={filterByPlatform(kidsContent)} loading={loading} />
        <ContentRow title="סרטים פופולריים" items={filterByPlatform(catalogs.movies_popular)} loading={loading} />
        <ContentRow title="סדרות פופולריות" items={filterByPlatform(catalogs.tv_popular)} loading={loading} />
        <ContentRow title="סרטים מדורגים" items={filterByPlatform(catalogs.movies_top_rated)} loading={loading} />
        <ContentRow title="סדרות מדורגות" items={filterByPlatform(catalogs.tv_top_rated)} loading={loading} />
        {recentlyWatched.length > 0 && (
          <ContentRow title="נצפו לאחרונה" items={filterByPlatform(recentlyWatched)} />
        )}
      </div>
    </div>
  );
}

export default Home;

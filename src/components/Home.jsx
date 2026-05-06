import { useState, useEffect, useMemo } from 'react';
import HeroBanner from './HeroBanner.jsx';
import ContentRow from './ContentRow.jsx';
import PlatformRow from './PlatformRow.jsx';
import TopTenRow from './TopTenRow.jsx';
import { getCatalog, getMoviesByGenre, GENRES } from '../core/StreamBoxCore.js';
import { getContinueWatching, getRecentlyWatched } from '../core/History.js';

function Home() {
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
  });
  const [continueWatching, setContinueWatching] = useState([]);
  const [recentlyWatched, setRecentlyWatched] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [trending, movies_popular, movies_top_rated, tv_popular, tv_top_rated,
               action, comedy, drama, thriller] = await Promise.all([
          getCatalog('trending', 1),
          getCatalog('movies_popular', 1),
          getCatalog('movies_top_rated', 1),
          getCatalog('tv_popular', 1),
          getCatalog('tv_top_rated', 1),
          getMoviesByGenre(GENRES.action.id, 1),
          getMoviesByGenre(GENRES.comedy.id, 1),
          getMoviesByGenre(GENRES.drama.id, 1),
          getMoviesByGenre(GENRES.thriller.id, 1),
        ]);
        if (!cancelled) {
          setCatalogs({ trending, movies_popular, movies_top_rated, tv_popular, tv_top_rated });
          setGenres({ action, comedy, drama, thriller });
          setContinueWatching(getContinueWatching());
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

  // Filter items by selected platform (simulated)
  const filterByPlatform = (items) => {
    if (!selectedPlatform || !items) return items;
    // In a real app, items would have a platform property
    // Here we deterministically filter based on item id
    const platformIndex = ['netflix', 'hbo', 'disney', 'appletv', 'prime', 'yes', 'hot'].indexOf(selectedPlatform);
    if (platformIndex === -1) return items;
    return items.filter((item) => (item.id || 0) % 7 === platformIndex);
  };

  const allMovies = useMemo(() => {
    const all = [
      ...catalogs.movies_popular,
      ...catalogs.movies_top_rated,
      ...genres.drama,
    ];
    // Remove duplicates
    const seen = new Set();
    return all.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [catalogs, genres]);

  const new2025 = useMemo(() => {
    return allMovies.filter((item) => item.year === '2025' || item.year === '2026');
  }, [allMovies]);

  return (
    <div className="page-transition bg-[#0a0a0f]">
      {/* 1. HERO BANNER */}
      <HeroBanner items={catalogs.trending.slice(0, 5)} />

      {/* 2. PLATFORM ROWS */}
      <div className="relative z-10 bg-[#0a0a0f]">
        <PlatformRow selected={selectedPlatform} onSelect={setSelectedPlatform} />
      </div>

      {/* 3. TOP 10 ROW */}
      <TopTenRow items={filterByPlatform(catalogs.trending)} />

      {/* 4. CATEGORY ROWS */}
      <div className="relative z-10 bg-[#0a0a0f] pb-8">
        {continueWatching.length > 0 && (
          <ContentRow title="המשך לצפות" items={filterByPlatform(continueWatching)} />
        )}

        <ContentRow title="טרנדינג 🔥" items={filterByPlatform(catalogs.trending)} loading={loading} />

        {/* Category: Heavy Drama */}
        <ContentRow title="דרמה כבדה" items={filterByPlatform(genres.drama)} loading={loading} />

        {/* Category: Netflix style */}
        <ContentRow title="NETFLIX" items={filterByPlatform(catalogs.movies_popular)} loading={loading} />

        {/* Category: HBO style */}
        <ContentRow title="HBO" items={filterByPlatform(catalogs.tv_top_rated)} loading={loading} />

        {/* Category: 2025 New */}
        {new2025.length > 0 && (
          <ContentRow title="2025 חדש" items={filterByPlatform(new2025)} loading={loading} />
        )}

        {/* Category: Dubbed (simulated with comedy) */}
        <ContentRow title="מדובב" items={filterByPlatform(genres.comedy)} loading={loading} />

        <ContentRow title="אקשן" items={filterByPlatform(genres.action)} loading={loading} />
        <ContentRow title="מתח" items={filterByPlatform(genres.thriller)} loading={loading} />
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

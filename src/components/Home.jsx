import { useState, useEffect } from 'react';
import HeroBanner from './HeroBanner.jsx';
import ContentRow from './ContentRow.jsx';
import { getCatalog, getMoviesByGenre, GENRES } from '../core/StreamBoxCore.js';
import { getContinueWatching, getRecentlyWatched } from '../core/History.js';

function Home() {
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

  return (
    <div className="page-transition">
      <HeroBanner items={catalogs.trending.slice(0, 5)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        {continueWatching.length > 0 && (
          <ContentRow title="המשך לצפות" items={continueWatching} />
        )}
        <ContentRow title="טרנדינג" items={catalogs.trending} loading={loading} />

        {/* Genre rows */}
        <ContentRow title={`🎬 ${GENRES.action.name}`} items={genres.action} loading={loading} />
        <ContentRow title={`😂 ${GENRES.comedy.name}`} items={genres.comedy} loading={loading} />
        <ContentRow title={`🎭 ${GENRES.drama.name}`} items={genres.drama} loading={loading} />
        <ContentRow title={`🔥 ${GENRES.thriller.name}`} items={genres.thriller} loading={loading} />

        <ContentRow title="סרטים פופולריים" items={catalogs.movies_popular} loading={loading} />
        <ContentRow title="סדרות פופולריות" items={catalogs.tv_popular} loading={loading} />
        <ContentRow title="סרטים מדורגים" items={catalogs.movies_top_rated} loading={loading} />
        <ContentRow title="סדרות מדורגות" items={catalogs.tv_top_rated} loading={loading} />
        {recentlyWatched.length > 0 && (
          <ContentRow title="נצפו לאחרונה" items={recentlyWatched} />
        )}
      </div>
    </div>
  );
}

export default Home;

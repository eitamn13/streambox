import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCatalog } from '../core/StreamBoxCore.js';
import ContentRow from './ContentRow.jsx';
import { Film, Tv, TrendingUp, Star, Calendar, Clapperboard } from 'lucide-react';

const categories = [
  { id: 'trending', label: 'טרנדינג', icon: TrendingUp },
  { id: 'movies_popular', label: 'סרטים פופולריים', icon: Film },
  { id: 'movies_top_rated', label: 'סרטים מדורגים', icon: Star },
  { id: 'movies_upcoming', label: 'בקרוב', icon: Calendar },
  { id: 'tv_popular', label: 'סדרות פופולריות', icon: Tv },
  { id: 'tv_top_rated', label: 'סדרות מדורגות', icon: Star },
  { id: 'tv_on_the_air', label: 'משודר עכשיו', icon: Clapperboard },
];

function Discover() {
  const [activeCategory, setActiveCategory] = useState('trending');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setPage(1);
      try {
        const results = await getCatalog(activeCategory, 1);
        if (!cancelled) {
          setItems(results);
          setHasMore(results.length >= 20);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeCategory]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const results = await getCatalog(activeCategory, nextPage);
      if (results.length > 0) {
        setItems(prev => [...prev, ...results]);
        setPage(nextPage);
      }
      setHasMore(results.length >= 20);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 page-transition">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">גלה תוכן</h1>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-sb-red text-white shadow-lg shadow-sb-red-glow'
                : 'bg-sb-card text-sb-gray hover:text-white hover:bg-sb-surface'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading && items.length === 0 ? (
        <div className="content-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-sb-card rounded-xl animate-shimmer" />
          ))}
        </div>
      ) : (
        <>
          <div className="content-grid">
            {items.map(item => (
              <Link
                key={`${item.type}-${item.id}`}
                to={`/detail/${item.type}/${item.id}`}
                className="group relative block animate-fade-in"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-sb-card card-hover">
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-sb-surface">
                      <Film className="w-10 h-10 text-sb-gray" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-sb-light group-hover:text-white transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sb-gray text-xs">{item.year}</p>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="bg-sb-card hover:bg-sb-surface text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'טוען...' : 'טען עוד'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Discover;

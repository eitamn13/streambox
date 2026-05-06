import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { unifiedSearch } from '../core/StreamBoxCore.js';
import { searchPlugins } from '../core/StreamEngine.js';
import { Search as SearchIcon, X, Clock, TrendingUp, Film } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback.jsx';

const RECENT_SEARCHES_KEY = 'sb_recent_searches';

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecent(searches) {
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 10)));
}

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [queryInput, setQueryInput] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(loadRecent());
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const q = searchParams.get('q');

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    async function doSearch() {
      setLoading(true);
      try {
        const [tmdbResults, pluginResults] = await Promise.allSettled([
          unifiedSearch(q),
          searchPlugins(q),
        ]);
        const merged = [];
        if (tmdbResults.status === 'fulfilled') merged.push(...tmdbResults.value);
        if (pluginResults.status === 'fulfilled') {
          const pluginItems = pluginResults.value.map(p => ({
            ...p,
            id: p.id.includes(':') ? p.id.split(':')[1] : p.id,
            type: p.type === 'series' ? 'tv' : p.type,
            title: p.name || p.title,
          }));
          merged.push(...pluginItems);
        }
        // Deduplicate by id+type
        const seen = new Set();
        const deduped = merged.filter(item => {
          const key = `${item.type}-${item.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (!cancelled) setResults(deduped);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    doSearch();
    return () => { cancelled = true; };
  }, [q]);

  const updateSuggestions = useCallback(async (text) => {
    if (!text.trim() || text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await unifiedSearch(text);
      setSuggestions(res.slice(0, 6));
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQueryInput(val);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateSuggestions(val), 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (queryInput.trim()) {
      const trimmed = queryInput.trim();
      setSearchParams({ q: trimmed });
      setShowSuggestions(false);
      const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 10);
      setRecentSearches(updated);
      saveRecent(updated);
    }
  };

  const selectSuggestion = (item) => {
    setQueryInput(item.title);
    setShowSuggestions(false);
    setSearchParams({ q: item.title });
  };

  const clearRecent = () => {
    setRecentSearches([]);
    saveRecent([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 page-transition">
      <form onSubmit={handleSubmit} className="relative mb-8">
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sb-gray" />
          <input
            ref={inputRef}
            type="text"
            value={queryInput}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="חפש סרטים, סדרות, שחקנים..."
            className="w-full bg-sb-card border border-sb-border rounded-2xl pr-12 pl-4 py-4 text-white placeholder-sb-gray focus:outline-none focus:border-sb-red/60 focus:ring-2 focus:ring-sb-red/20 transition-all text-base"
          />
          {queryInput && (
            <button
              type="button"
              onClick={() => { setQueryInput(''); setSuggestions([]); inputRef.current?.focus(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-sb-gray hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && !q && (
          <div className="absolute top-full right-0 left-0 mt-2 max-w-2xl bg-sb-card border border-sb-border rounded-2xl shadow-2xl overflow-hidden z-40 animate-scale-in">
            {suggestions.length > 0 && (
              <div className="p-2">
                <p className="text-sb-gray text-xs px-3 py-2 font-medium">הצעות</p>
                {suggestions.map(item => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => selectSuggestion(item)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sb-surface transition-colors text-right"
                  >
                    {item.poster ? (
                      <img src={item.poster} alt="" className="w-8 h-12 rounded object-cover bg-sb-surface" />
                    ) : (
                      <div className="w-8 h-12 rounded bg-sb-surface flex items-center justify-center">
                        <Film className="w-4 h-4 text-sb-gray" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                      <p className="text-sb-gray text-xs">{item.year} • {item.type === 'tv' ? 'סדרה' : 'סרט'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {recentSearches.length > 0 && (
              <div className="p-2 border-t border-sb-border">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-sb-gray text-xs font-medium">חיפושים אחרונים</p>
                  <button type="button" onClick={clearRecent} className="text-sb-red text-xs hover:underline">נקה</button>
                </div>
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setQueryInput(term); setShowSuggestions(false); setSearchParams({ q: term }); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sb-surface transition-colors text-right"
                  >
                    <Clock className="w-4 h-4 text-sb-gray" />
                    <span className="text-sb-light text-sm">{term}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </form>

      {q ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-white">
              {results.length > 0 ? `${results.length} תוצאות` : 'לא נמצאו תוצאות'}
            </h2>
            <span className="text-sb-gray text-sm">עבור "{q}"</span>
          </div>
          {loading && results.length === 0 ? (
            <div className="content-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-sb-card rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : (
            <div className="content-grid">
              {results.map(item => (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={`/detail/${item.type}/${item.id}`}
                  className="group relative block animate-fade-in"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-sb-card card-hover">
                    {item.poster ? (
                      <ImageWithFallback src={item.poster} alt={item.title} className="w-full h-full object-cover" />
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
          )}
        </div>
      ) : (
        <div className="text-center py-20">
          <SearchIcon className="w-16 h-16 text-sb-gray mx-auto mb-4 opacity-40" />
          <h2 className="text-xl font-semibold text-sb-light mb-2">חפש תוכן</h2>
          <p className="text-sb-gray">הקלד שם של סרט או סדרה כדי למצוא תוצאות</p>
        </div>
      )}
    </div>
  );
}

export default Search;

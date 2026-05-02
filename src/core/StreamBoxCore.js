// StreamBox Core - Addon System + API Integration
// ================================================

const API_KEYS = {
  TMDB: import.meta.env.VITE_TMDB_API_KEY,
};

// Smart Caching System
// ====================
class Cache {
  constructor(name, ttl = 5 * 60 * 1000) {
    this.name = name;
    this.ttl = ttl;
    this.memory = new Map();
  }

  _key(key) { return `${this.name}:${key}`; }

  get(key) {
    const item = this.memory.get(this._key(key));
    if (!item) return null;
    if (Date.now() - item.time > this.ttl) {
      this.memory.delete(this._key(key));
      return null;
    }
    return item.data;
  }

  set(key, data) {
    this.memory.set(this._key(key), { data, time: Date.now() });
  }

  clear() {
    this.memory.clear();
  }
}

const tmdbCache = new Cache('tmdb', 10 * 60 * 1000);

// TMDB API
// ========
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

async function tmdbFetch(endpoint, params = {}) {
  const cacheKey = endpoint + JSON.stringify(params);
  const cached = tmdbCache.get(cacheKey);
  if (cached) return cached;

  const url = new URL(TMDB_BASE + endpoint);
  url.searchParams.append('api_key', API_KEYS.TMDB);
  url.searchParams.append('language', 'he-IL');
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  const data = await res.json();
  tmdbCache.set(cacheKey, data);
  return data;
}

// Unified Search
// ==============
export async function unifiedSearch(query) {
  const data = await tmdbFetch('/search/multi', { query, include_adult: false });

  return (data.results || []).map(item => ({
    id: item.id,
    type: item.media_type,
    title: item.title || item.name,
    overview: item.overview,
    poster: item.poster_path ? `${TMDB_IMG}/w500${item.poster_path}` : null,
    backdrop: item.backdrop_path ? `${TMDB_IMG}/original${item.backdrop_path}` : null,
    year: (item.release_date || item.first_air_date || '').slice(0, 4),
    rating: item.vote_average,
    source: 'tmdb',
  }));
}

// Season Details (TV Shows)
// ==========================
export async function getSeasonDetails(showId, seasonNumber) {
  try {
    const data = await tmdbFetch(`/tv/${showId}/season/${seasonNumber}`, { language: 'he-IL' });
    return {
      seasonNumber: data.season_number,
      name: data.name,
      overview: data.overview,
      poster: data.poster_path ? `${TMDB_IMG}/w500${data.poster_path}` : null,
      episodes: (data.episodes || []).map(ep => ({
        episodeNumber: ep.episode_number,
        title: ep.name,
        overview: ep.overview,
        still: ep.still_path ? `${TMDB_IMG}/w500${ep.still_path}` : null,
        runtime: ep.runtime,
        airDate: ep.air_date,
      })),
    };
  } catch (e) {
    console.warn('Season fetch failed:', e);
    return null;
  }
}

// Content Details
// ===============
export async function getContentDetails(id, type) {
  const tmdbType = type === 'tv' ? 'tv' : 'movie';
  const [details, credits] = await Promise.allSettled([
    tmdbFetch(`/${tmdbType}/${id}`, { append_to_response: 'external_ids' }),
    tmdbFetch(`/${tmdbType}/${id}/credits`),
  ]);

  const info = details.status === 'fulfilled' ? details.value : {};
  const cast = credits.status === 'fulfilled' ? (credits.value.cast || []).slice(0, 10) : [];

  return {
    id: info.id,
    type,
    title: info.title || info.name,
    originalTitle: info.original_title || info.original_name,
    overview: info.overview,
    tagline: info.tagline,
    poster: info.poster_path ? `${TMDB_IMG}/w500${info.poster_path}` : null,
    backdrop: info.backdrop_path ? `${TMDB_IMG}/original${info.backdrop_path}` : null,
    year: (info.release_date || info.first_air_date || '').slice(0, 4),
    runtime: info.runtime || info.episode_run_time?.[0],
    rating: info.vote_average,
    voteCount: info.vote_count,
    genres: info.genres || [],
    cast: cast.map(c => ({
      name: c.name,
      character: c.character,
      photo: c.profile_path ? `${TMDB_IMG}/w200${c.profile_path}` : null,
    })),
    imdbId: info.external_ids?.imdb_id,
    seasons: info.seasons,
    status: info.status,
    homepage: info.homepage,
  };
}

// Catalogs
// =========
export async function getCatalog(category, page = 1) {
  const endpoints = {
    trending: '/trending/all/week',
    movies_popular: '/movie/popular',
    movies_top_rated: '/movie/top_rated',
    movies_upcoming: '/movie/upcoming',
    tv_popular: '/tv/popular',
    tv_top_rated: '/tv/top_rated',
    tv_on_the_air: '/tv/on_the_air',
  };

  const endpoint = endpoints[category] || endpoints.trending;
  const data = await tmdbFetch(endpoint, { page });

  return (data.results || []).map(item => ({
    id: item.id,
    type: item.media_type || (category.startsWith('tv') ? 'tv' : 'movie'),
    title: item.title || item.name,
    overview: item.overview,
    poster: item.poster_path ? `${TMDB_IMG}/w500${item.poster_path}` : null,
    backdrop: item.backdrop_path ? `${TMDB_IMG}/original${item.backdrop_path}` : null,
    year: (item.release_date || item.first_air_date || '').slice(0, 4),
    rating: item.vote_average,
  }));
}

// Streaming Sources (Public/Free Legal Sources)
// =============================================
// DISABLED — Real-Debrid only mode
export function getStreamingSources(_title, _imdbId, _type) {
  return [];
}

// Recommendations (Trending-based fallback)
// =========================================
export async function getRecommendations(_watchHistory = []) {
  const trending = await getCatalog('trending', 1);
  // Return first 5 trending items as fallback recommendations
  return trending.slice(0, 5).map(item => ({
    title: item.title,
    reason: 'טרנדינג עכשיו',
    genre: item.genres?.[0]?.name || 'כללי',
  }));
}

// Addon Manifest (Stremio-compatible format)
// ==========================================
export function getAddonManifest() {
  return {
    id: 'community.streambox',
    version: '1.0.0',
    name: 'StreamBox',
    description: 'StreamBox - גלה תוכן חוקי',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie', 'series'],
    catalogs: [
      { type: 'movie', id: 'streambox_movies_popular', name: 'סרטים פופולריים' },
      { type: 'movie', id: 'streambox_movies_top', name: 'סרטים מדורגים' },
      { type: 'series', id: 'streambox_tv_popular', name: 'סדרות פופולריות' },
      { type: 'series', id: 'streambox_tv_top', name: 'סדרות מדורגות' },
    ],
  };
}

// Export utilities
export { TMDB_IMG };
export { tmdbCache };

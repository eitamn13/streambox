// Built-in Plugins
// ================

import { pluginRegistry } from '../core/PluginRegistry.js';
import {
  getCatalog,
  unifiedSearch,
  getContentDetails,
} from '../core/StreamBoxCore.js';

// TMDB Plugin
// -----------
export const tmdbPlugin = {
  id: 'community.tmdb',
  name: 'TMDB Catalog',
  version: '1.0.0',
  description: 'סרטים וסדרות מ-TMDB',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie', 'series'],
  catalogs: [
    { type: 'movie', id: 'tmdb_movies_popular', name: 'סרטים פופולריים' },
    { type: 'movie', id: 'tmdb_movies_top', name: 'סרטים מדורגים' },
    { type: 'series', id: 'tmdb_tv_popular', name: 'סדרות פופולריות' },
    { type: 'series', id: 'tmdb_tv_top', name: 'סדרות מדורגות' },
  ],

  async getCatalog(type, catalogId, page = 1) {
    const map = {
      tmdb_movies_popular: 'movies_popular',
      tmdb_movies_top: 'movies_top_rated',
      tmdb_tv_popular: 'tv_popular',
      tmdb_tv_top: 'tv_top_rated',
    };
    const category = map[catalogId] || 'trending';
    const items = await getCatalog(category, page);
    return items.map(item => ({
      id: `${item.type}:${item.id}`,
      type: item.type === 'tv' ? 'series' : 'movie',
      name: item.title,
      poster: item.poster,
      background: item.backdrop,
      year: item.year,
      rating: item.rating,
    }));
  },

  async getMeta(id, type) {
    const [actualType, actualId] = id.includes(':') ? id.split(':') : [type, id];
    const details = await getContentDetails(actualId, actualType === 'series' ? 'tv' : actualType);
    return {
      id,
      type: type === 'tv' ? 'series' : type,
      name: details.title,
      description: details.overview,
      poster: details.poster,
      background: details.backdrop,
      year: details.year,
      rating: details.rating,
      genres: details.genres.map(g => g.name),
      runtime: details.runtime,
      status: details.status,
    };
  },

  async search(query) {
    const results = await unifiedSearch(query);
    return results.map(item => ({
      id: `${item.type}:${item.id}`,
      type: item.type === 'tv' ? 'series' : 'movie',
      name: item.title,
      poster: item.poster,
      year: item.year,
      rating: item.rating,
    }));
  },

  async getStreams(_id, _type) {
    // DISABLED — Real-Debrid only mode
    return [];
  },
};

// OpenSubtitles Plugin
// --------------------
export const opensubtitlesPlugin = {
  id: 'community.opensubtitles',
  name: 'OpenSubtitles',
  version: '1.0.0',
  description: 'כתוביות מ-OpenSubtitles',
  resources: ['subtitles'],
  types: ['movie', 'series'],

  async getSubtitles(id, type, lang = null) {
    const [actualType, actualId] = id.includes(':') ? id.split(':') : [type, id];
    try {
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/${actualType === 'series' ? 'tv' : 'movie'}/${actualId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&append_to_response=external_ids`);
      if (!tmdbRes.ok) return [];
      const tmdbData = await tmdbRes.json();
      const imdbId = tmdbData.external_ids?.imdb_id;
      if (!imdbId) return [];

      const queryLang = lang || 'heb';
      const url = `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${imdbId}&languages=${queryLang}`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).map(item => ({
        url: item.attributes?.url || item.attributes?.download_link || item.attributes?.files?.[0]?.file_id,
        lang: item.attributes?.language || queryLang,
        label: item.attributes?.release || item.attributes?.language || 'כתובית',
      })).filter(s => s.url);
    } catch (e) {
      console.warn('OpenSubtitles fetch failed:', e);
      return [];
    }
  },
};

export function registerBuiltInPlugins() {
  pluginRegistry.register(tmdbPlugin);
  pluginRegistry.register(opensubtitlesPlugin);
}

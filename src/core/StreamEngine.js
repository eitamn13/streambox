// Stream Engine — Netflix-style: calls backend for instant streams
// ================================================================

import { pluginRegistry } from './PluginRegistry.js';
import { getAuthToken } from '../lib/supabase.js';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

function normalizeStream(s, pluginName) {
  return {
    url: s.url || s.externalUrl || s.streamUrl || s.source,
    title: s.title || s.name || pluginName,
    quality: s.quality || s.resolution || 'auto',
    provider: s.provider || pluginName,
    type: s.type || 'direct',
    size: s.size || null,
    info: s.info || s.description || [],
    behaviorHints: s.behaviorHints || {},
    sourceType: s.sourceType || 'debrid',
    infoHash: s.infoHash || null,
  };
}

// NEW: One-click content API — admin-managed Debrid behind the scenes
export async function fetchStreams(id, type, title = '', year = '', imdbId = '', season = null, episode = null) {
  // Call our backend content API
  try {
    const params = new URLSearchParams();
    params.set('imdbId', imdbId || '');
    params.set('type', type === 'tv' ? 'series' : 'movie');
    if (season) params.set('season', season);
    if (episode) params.set('episode', episode);

    // Get auth token if logged in
    let authToken = '';
    try {
      authToken = await getAuthToken();
    } catch { /* not logged in */ }
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(`/api/content?${params.toString()}`, { headers });
    if (!res.ok) {
      console.warn('[StreamEngine] Content API failed:', res.status);
      return [];
    }
    const data = await res.json();
    return (data.streams || []).map(s => normalizeStream(s, 'StreamBox'));
  } catch (e) {
    console.warn('[StreamEngine] Content API error:', e);
    return [];
  }
}

// Legacy catalog functions
export async function fetchCatalog(pluginId, type, catalogId, page = 1) {
  const plugin = pluginRegistry.getPlugins().find(p => p.id === pluginId);
  if (!plugin || !plugin.enabled) return [];

  if (plugin.builtin && plugin.getCatalog) {
    return await plugin.getCatalog(type, catalogId, page);
  }

  if (!plugin.builtin) {
    try {
      const endpoint = `${plugin.url}/catalog/${type}/${catalogId}.json`;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(endpoint + (page > 1 ? `?skip=${(page - 1) * 100}` : ''))}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.metas || []).map(m => ({
        id: m.id,
        type: m.type || type,
        title: m.name || m.title,
        poster: m.poster || null,
        backdrop: m.background || null,
        year: m.year || (m.releaseDate || '').slice(0, 4),
        rating: m.imdbRating || m.rating || 0,
      }));
    } catch (e) {
      console.warn(`Addon catalog fetch failed for ${plugin.name}:`, e);
      return [];
    }
  }

  return [];
}

export async function fetchMeta(pluginId, id, type) {
  const plugin = pluginRegistry.getPlugins().find(p => p.id === pluginId);
  if (!plugin || !plugin.enabled) return null;

  if (plugin.builtin && plugin.getMeta) {
    return await plugin.getMeta(id, type);
  }

  if (!plugin.builtin) {
    try {
      const endpoint = `${plugin.url}/meta/${type}/${encodeURIComponent(id)}.json`;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(endpoint)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) return null;
      const data = await res.json();
      const m = data.meta;
      if (!m) return null;
      return {
        id: m.id,
        type: m.type || type,
        title: m.name || m.title,
        overview: m.description || m.overview,
        poster: m.poster || null,
        backdrop: m.background || null,
        year: m.year || (m.releaseDate || '').slice(0, 4),
        rating: m.imdbRating || m.rating || 0,
        genres: m.genres || [],
        runtime: m.runtime,
        status: m.status,
      };
    } catch (e) {
      console.warn(`Meta fetch failed:`, e);
      return null;
    }
  }

  return null;
}

export async function searchPlugins(query) {
  const plugins = pluginRegistry.getEnabledPlugins().filter(p =>
    p.resources.includes('catalog') || p.resources.includes('meta')
  );

  const results = [];
  await Promise.allSettled(
    plugins.map(async (plugin) => {
      try {
        let items = [];
        if (plugin.builtin && plugin.search) {
          items = await plugin.search(query);
        } else if (!plugin.builtin) {
          const catalog = plugin.manifest?.catalogs?.find(c => c.extra?.some(e => e.name === 'search'));
          if (catalog) {
            const endpoint = `${plugin.url}/catalog/${catalog.type}/${catalog.id}/search=${encodeURIComponent(query)}.json`;
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(endpoint)}`;
            const res = await fetch(proxyUrl);
            if (res.ok) {
              const data = await res.json();
              items = (data.metas || []).map(m => ({
                id: m.id,
                type: m.type || catalog.type,
                title: m.name || m.title,
                poster: m.poster || null,
                year: m.year || '',
                rating: m.imdbRating || 0,
              }));
            }
          }
        }
        if (items.length > 0) results.push(...items);
      } catch (e) {
        console.warn(`Search failed for ${plugin.name}:`, e);
      }
    })
  );

  return results;
}

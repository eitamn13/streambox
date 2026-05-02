// Stream Engine - Aggregates streams from all enabled plugins + backend sources + Debrid
// ======================================================================================

import { pluginRegistry } from './PluginRegistry.js';
import { classifySource, isSourceAllowed } from './ContentClassifier.js';
import { getConfiguredDebrids, resolveDebridStreams } from './DebridManager.js';

const TMDB_IMG = 'https://image.tmdb.org/t/p';

function normalizeStream(s, pluginName, pluginUrl = '') {
  const sourceType = s.sourceType || classifySource('', pluginName, pluginUrl);
  return {
    url: s.url || s.externalUrl || s.streamUrl || s.source,
    title: s.title || s.name || pluginName,
    quality: s.quality || s.resolution || 'auto',
    provider: s.provider || pluginName,
    type: s.type || 'direct',
    size: s.size || null,
    info: s.info || s.description || [],
    behaviorHints: s.behaviorHints || {},
    sourceType,
    infoHash: s.infoHash || null,
    magnetUri: s.magnetUri || null,
    sources: s.sources || null,
  };
}

// Fetch real streams from backend
async function fetchBackendStreams(id, type, title, year) {
  try {
    const res = await fetch(`/api/streams?id=${encodeURIComponent(id)}&type=${type}&title=${encodeURIComponent(title || '')}&year=${year || ''}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.streams || []).map(s => normalizeStream(s, s.provider, ''));
  } catch (e) {
    console.warn('Backend streams fetch failed:', e);
    return [];
  }
}

// Fetch streams from remote addon via proxy
async function fetchAddonStreams(plugin, id, type) {
  try {
    const endpoint = `${plugin.url}/stream/${type}/${encodeURIComponent(id)}.json`;
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(endpoint)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.streams || []).map(s => normalizeStream(s, plugin.name, plugin.url));
  } catch (e) {
    console.warn(`Addon stream fetch failed for ${plugin.name}:`, e);
    return [];
  }
}

// Fetch catalog from remote addon via proxy
async function fetchAddonCatalog(plugin, type, catalogId, page = 1) {
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

// Resolve streams via Debrid from addon results
async function resolveDebridFromStreams(streams) {
  const configured = getConfiguredDebrids();
  if (configured.length === 0) return [];

  const processed = new Set();
  const magnets = [];

  for (const stream of streams) {
    if (!stream.infoHash && !stream.magnetUri && !stream.sources) continue;

    let magnet = null;
    if (stream.magnetUri) {
      magnet = stream.magnetUri;
    } else if (stream.infoHash) {
      magnet = `magnet:?xt=urn:btih:${stream.infoHash}`;
    } else if (stream.sources && Array.isArray(stream.sources)) {
      const magnetSource = stream.sources.find(s => s && s.startsWith('magnet:'));
      if (magnetSource) magnet = magnetSource;
    }

    if (!magnet || processed.has(magnet)) continue;
    processed.add(magnet);
    magnets.push({ magnet, title: stream.title });
  }

  // Resolve all magnets in parallel with timeout
  const results = await Promise.allSettled(
    magnets.map(({ magnet, title }) =>
      Promise.race([
        resolveDebridStreams(magnet, title),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Debrid resolve timeout')), 30000)
        ),
      ])
    )
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

export async function fetchStreams(id, type, title = '', year = '') {
  const plugins = pluginRegistry.getStreamPlugins();
  const results = [];

  // 1. Backend sources (Archive.org, etc.)
  const backendStreams = await fetchBackendStreams(id, type, title, year);
  results.push(...backendStreams);

  // 2. Remote addon sources
  const addonStreams = [];
  await Promise.allSettled(
    plugins.filter(p => !p.builtin).map(async (plugin) => {
      try {
        const streams = await fetchAddonStreams(plugin, id, type);
        const normalized = streams.map(s => normalizeStream(s, plugin.name, plugin.url));
        const allowed = normalized.filter(s => isSourceAllowed(s.sourceType));
        addonStreams.push(...allowed);
        results.push(...allowed);
      } catch (e) {
        console.warn(`Addon stream fetch failed for ${plugin.name}:`, e);
      }
    })
  );

  // 3. Built-in plugins
  await Promise.allSettled(
    plugins.filter(p => p.builtin && p.getStreams).map(async (plugin) => {
      try {
        const streams = await plugin.getStreams(id, type);
        const normalized = (streams || []).map(s => normalizeStream(s, plugin.name, plugin.url));
        const allowed = normalized.filter(s => isSourceAllowed(s.sourceType));
        addonStreams.push(...allowed);
        results.push(...allowed);
      } catch (e) {
        console.warn(`Stream fetch failed for ${plugin.name}:`, e);
      }
    })
  );

  // 4. Debrid resolution for addon streams with magnets/infoHashes
  const debridResults = await resolveDebridFromStreams(addonStreams);
  results.push(...debridResults);

  // Sort by quality, with debrid streams prioritized
  const qualityOrder = { '4K': 5, '1080p': 4, '720p': 3, '480p': 2, '360p': 1, auto: 0 };
  results.sort((a, b) => {
    const qa = qualityOrder[a.quality] ?? 0;
    const qb = qualityOrder[b.quality] ?? 0;
    const sa = a.sourceType === 'debrid' ? 10 : 0;
    const sb = b.sourceType === 'debrid' ? 10 : 0;
    return (qb + sb) - (qa + sa);
  });

  return results;
}

export async function fetchCatalog(pluginId, type, catalogId, page = 1) {
  const plugin = pluginRegistry.getPlugins().find(p => p.id === pluginId);
  if (!plugin || !plugin.enabled) return [];

  if (plugin.builtin && plugin.getCatalog) {
    return await plugin.getCatalog(type, catalogId, page);
  }

  if (!plugin.builtin) {
    return await fetchAddonCatalog(plugin, type, catalogId, page);
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

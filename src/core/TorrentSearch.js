// Torrent Search - Multi-strategy: server endpoint first, then client fallbacks
// =============================================================================

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function detectQuality(filename = '') {
  const f = filename.toLowerCase();
  if (f.includes('2160') || f.includes('4k') || f.includes('uhd')) return '4K';
  if (f.includes('1080')) return '1080p';
  if (f.includes('720')) return '720p';
  if (f.includes('480')) return '480p';
  return 'auto';
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '?';
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(0)} MB`;
}

// ------------------------------------------------------------------
// STRATEGY 1: Our own server endpoint (bypasses CORS & IP blocks)
// ------------------------------------------------------------------
async function searchViaServer(title, year, imdbId, type) {
  try {
    const query = year ? `${title} ${year}` : title;
    const params = new URLSearchParams({ q: query, type: type || 'movie' });
    if (imdbId) params.set('imdbId', imdbId);

    const res = await fetch(`/api/search-torrents?${params.toString()}`, {
      signal: timeoutSignal(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(r => ({
      ...r,
      magnet: r.magnet,
      hash: r.hash,
      quality: r.quality || detectQuality(r.title),
      size: r.size || '?',
      seeds: r.seeds || 0,
      peers: r.peers || 0,
    }));
  } catch (e) {
    console.warn('Server search failed:', e.message);
    return [];
  }
}

// ------------------------------------------------------------------
// STRATEGY 2: Torrentio (Stremio addon, CORS-enabled, very reliable)
// ------------------------------------------------------------------
async function searchTorrentio(title, year, imdbId, type) {
  if (!imdbId) return [];
  try {
    const isMovie = type === 'movie';
    const url = isMovie
      ? `https://torrentio.strem.fun/stream/movie/${imdbId}.json`
      : `https://torrentio.strem.fun/stream/series/${imdbId}:1:1.json`;

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: timeoutSignal(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const streams = data.streams || [];

    const results = [];
    for (const s of streams) {
      if (!s.infoHash) continue;
      // Parse title for quality info
      const titleStr = s.title || s.name || '';
      const quality = detectQuality(titleStr);
      // Parse size from title like "👤 1234 💾 2.1 GB"
      const sizeMatch = titleStr.match(/💾\s*([\d.]+\s*(GB|MB))/i);
      const size = sizeMatch ? sizeMatch[1] : '?';

      results.push({
        title: s.name || title || '',
        year: year || '',
        quality,
        type: 'web',
        size,
        magnet: `magnet:?xt=urn:btih:${s.infoHash}&dn=${encodeURIComponent(title)}&tr=udp://tracker.opentrackr.org:1337/announce`,
        hash: s.infoHash.toLowerCase(),
        seeds: 0, // Torrentio doesn't provide seeds
        peers: 0,
        provider: 'Torrentio',
      });
    }
    return results;
  } catch (e) {
    console.warn('Torrentio search failed:', e.message);
    return [];
  }
}

// ------------------------------------------------------------------
// STRATEGY 3: Public CORS proxies as last resort (rarely works)
// ------------------------------------------------------------------
async function searchViaProxy(url) {
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  ];
  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy, { signal: timeoutSignal(8000) });
      if (!res.ok) continue;
      const wrapped = await res.json();
      if (wrapped.contents) return JSON.parse(wrapped.contents);
    } catch { /* ignore */ }
  }
  return null;
}

// ------------------------------------------------------------------
// MAIN EXPORT
// ------------------------------------------------------------------
export async function searchMagnets(title, year = '', imdbId = '', type = 'movie') {
  const allResults = [];
  const seenHashes = new Set();

  const addUnique = (items) => {
    for (const r of items) {
      if (!r.hash || seenHashes.has(r.hash)) continue;
      seenHashes.add(r.hash);
      allResults.push(r);
    }
  };

  // 1. Server search (most reliable)
  const serverResults = await searchViaServer(title, year, imdbId, type);
  addUnique(serverResults);

  // 2. Torrentio fallback (if we have IMDB ID and few results)
  if (allResults.length < 3 && imdbId) {
    const torrentioResults = await searchTorrentio(title, year, imdbId, type);
    addUnique(torrentioResults);
  }

  // Sort by quality then seeds
  const qualityOrder = { '4K': 4, '2160p': 4, '1080p': 3, '720p': 2, '480p': 1, 'auto': 0 };
  return allResults.sort((a, b) => {
    const qa = qualityOrder[a.quality] || 0;
    const qb = qualityOrder[b.quality] || 0;
    if (qa !== qb) return qb - qa;
    return (b.seeds || 0) - (a.seeds || 0);
  });
}

// Legacy alias
export async function searchYtsMagnets(title, year = '') {
  return searchMagnets(title, year, '', 'movie');
}

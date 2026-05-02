// Torrent Search - Client-side multi-strategy engine
// Tries direct fetch first, then CORS proxies, then manual fallback
// ================================================================

const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

// Try fetching directly (works if API sends Access-Control-Allow-Origin)
async function fetchDirect(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    return null;
  }
}

// Try fetching via CORS proxies
async function fetchViaProxy(url, timeoutMs = 10000) {
  for (const proxyFn of CORS_PROXIES) {
    const proxyUrl = proxyFn(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      // Some proxies return text that we need to parse as JSON
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        // If it's not JSON, this proxy/source failed
        continue;
      }
    } catch (e) {
      clearTimeout(timer);
      continue;
    }
  }
  return null;
}

// Unified fetch: direct first, then proxy
async function fetchJson(url) {
  const direct = await fetchDirect(url);
  if (direct !== null) return direct;
  return await fetchViaProxy(url);
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

// ============================================================================
// SOURCE 1: YTS (Movies only) - Best quality info
// ============================================================================
async function searchYTS(query) {
  const urls = [
    `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=10`,
    `https://yts.unblockit.earth/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=10`,
  ];

  for (const url of urls) {
    const data = await fetchJson(url);
    if (!data) continue;

    const movies = data.data?.movies || [];
    const results = [];
    for (const movie of movies) {
      for (const torrent of (movie.torrents || [])) {
        const hash = torrent.hash;
        const magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(movie.title_long || movie.title)}&tr=udp://tracker.opentrackr.org:1337/announce`;
        results.push({
          title: movie.title_long || movie.title,
          year: movie.year,
          quality: torrent.quality,
          type: torrent.type,
          size: torrent.size,
          magnet,
          hash,
          seeds: parseInt(torrent.seeds) || 0,
          peers: parseInt(torrent.peers) || 0,
          provider: 'YTS',
        });
      }
    }
    if (results.length > 0) return results;
  }
  return [];
}

// ============================================================================
// SOURCE 2: TorrentAPI / ThePirateBay (General)
// ============================================================================
async function searchTorrentAPI(query) {
  const url = `https://apibay.org/q.php?q=${encodeURIComponent(query)}&cat=201`;
  const data = await fetchJson(url);
  if (!data || !Array.isArray(data)) return [];

  return data
    .filter(t => t.info_hash && t.name)
    .map(t => ({
      title: t.name,
      year: '',
      quality: detectQuality(t.name),
      type: 'bluray',
      size: formatBytes(parseInt(t.size) || 0),
      magnet: `magnet:?xt=urn:btih:${t.info_hash}&dn=${encodeURIComponent(t.name)}&tr=udp://tracker.opentrackr.org:1337/announce`,
      hash: t.info_hash,
      seeds: parseInt(t.seeders) || 0,
      peers: parseInt(t.leechers) || 0,
      provider: 'TPB',
    }));
}

// ============================================================================
// SOURCE 3: EZTV (TV Shows)
// ============================================================================
async function searchEZTV(imdbId) {
  if (!imdbId) return [];
  const cleanId = imdbId.toString().replace('tt', '');
  const url = `https://eztv.re/api/get-torrents?limit=15&imdb_id=${cleanId}`;
  const data = await fetchJson(url);
  if (!data) return [];

  const torrents = data.torrents || [];
  return torrents.map(t => ({
    title: t.title || t.filename || '',
    year: '',
    quality: detectQuality(t.filename || t.title || ''),
    type: 'web',
    size: formatBytes(parseInt(t.size_bytes) || 0),
    magnet: t.magnet_url || `magnet:?xt=urn:btih:${t.hash}&dn=${encodeURIComponent(t.title || '')}&tr=udp://tracker.opentrackr.org:1337/announce`,
    hash: t.hash,
    seeds: parseInt(t.seeds) || 0,
    peers: parseInt(t.peers) || 0,
    provider: 'EZTV',
  }));
}

// ============================================================================
// SOURCE 4: 1337x via torrent-api-py public instance (fallback)
// ============================================================================
async function search1337x(query) {
  // Public instance of torrent-api-py — CORS-enabled, built for this purpose
  const url = `https://torrent-api-py-nxul.onrender.com/api/v1/search?site=1337x&query=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  if (!data || !data.data || !Array.isArray(data.data)) return [];

  return data.data
    .filter(t => t.magnet || t.infoHash)
    .map(t => ({
      title: t.name || t.title || '',
      year: '',
      quality: detectQuality(t.name || t.title || ''),
      type: 'web',
      size: t.size || '?',
      magnet: t.magnet || `magnet:?xt=urn:btih:${t.infoHash}&dn=${encodeURIComponent(t.name || '')}&tr=udp://tracker.opentrackr.org:1337/announce`,
      hash: t.infoHash || '',
      seeds: parseInt(t.seeders) || 0,
      peers: parseInt(t.leechers) || 0,
      provider: '1337x',
    }));
}

// ============================================================================
// SOURCE 5: Torrents-csv (lightweight fallback)
// ============================================================================
async function searchTorrentsCSV(query) {
  const url = `https://torrents-csv.com/service/search?q=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  if (!data || !Array.isArray(data)) return [];

  return data
    .filter(t => t.infohash && t.name)
    .slice(0, 10)
    .map(t => ({
      title: t.name,
      year: '',
      quality: detectQuality(t.name),
      type: 'web',
      size: formatBytes(parseInt(t.size_bytes) || 0),
      magnet: `magnet:?xt=urn:btih:${t.infohash}&dn=${encodeURIComponent(t.name)}&tr=udp://tracker.opentrackr.org:1337/announce`,
      hash: t.infohash,
      seeds: parseInt(t.seeders) || 0,
      peers: parseInt(t.leechers) || 0,
      provider: 'CSV',
    }));
}

// ============================================================================
// MAIN EXPORT: Search all sources in parallel, merge & rank
// ============================================================================
export async function searchMagnets(title, year = '', imdbId = '', type = 'movie') {
  const query = year ? `${title} ${year}` : title;
  const allResults = [];
  const seenHashes = new Set();

  const addUnique = (results) => {
    for (const r of results) {
      if (!r.hash || seenHashes.has(r.hash)) continue;
      seenHashes.add(r.hash);
      allResults.push(r);
    }
  };

  // Run searches based on content type
  const promises = [];

  if (type === 'movie') {
    promises.push(
      searchYTS(query).then(addUnique),
      searchTorrentAPI(query).then(addUnique),
      search1337x(query).then(addUnique),
      searchTorrentsCSV(query).then(addUnique),
    );
  } else {
    // TV shows
    promises.push(
      searchEZTV(imdbId).then(addUnique),
      searchTorrentAPI(query).then(addUnique),
      search1337x(query).then(addUnique),
    );
  }

  // Wait for all with a global timeout
  await Promise.all(promises.map(p =>
    Promise.race([
      p.catch(() => {}),
      new Promise(resolve => setTimeout(resolve, 12000)),
    ])
  ));

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

// Quick check if search is likely to work (for UI)
export async function testSearchConnectivity() {
  const testUrl = 'https://yts.mx/api/v2/list_movies.json?limit=1';
  try {
    const res = await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' });
    return { direct: true };
  } catch {
    return { direct: false, proxy: true };
  }
}

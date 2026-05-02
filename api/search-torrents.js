// Server-side Torrent Search — with extensive diagnostics
// =========================================================

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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
// SOURCE 1: Torrentio (Stremio addon — designed for streaming apps)
// ------------------------------------------------------------------
async function searchTorrentio(imdbId, type) {
  if (!imdbId) return { results: [], error: 'no imdbId' };
  const cleanId = imdbId.toString().startsWith('tt') ? imdbId : `tt${imdbId}`;
  const url = type === 'series'
    ? `https://torrentio.strem.fun/stream/series/${cleanId}:1:1.json`
    : `https://torrentio.strem.fun/stream/movie/${cleanId}.json`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: timeoutSignal(12000),
    });
    if (!res.ok) return { results: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    const streams = data.streams || [];

    const results = [];
    for (const s of streams) {
      if (!s.infoHash) continue;
      const titleStr = s.title || s.name || '';
      const quality = detectQuality(titleStr);
      const sizeMatch = titleStr.match(/💾\s*([\d.]+\s*(GB|MB))/i);
      const size = sizeMatch ? sizeMatch[1] : '?';

      results.push({
        title: s.name || titleStr.split('\n')[0] || 'Unknown',
        year: '',
        quality,
        type: 'web',
        size,
        magnet: `magnet:?xt=urn:btih:${s.infoHash}&dn=${encodeURIComponent(s.name || '')}&tr=udp://tracker.opentrackr.org:1337/announce`,
        hash: s.infoHash.toLowerCase(),
        seeds: 0,
        peers: 0,
        provider: 'Torrentio',
      });
    }
    return { results, error: null };
  } catch (e) {
    return { results: [], error: e.message };
  }
}

// ------------------------------------------------------------------
// SOURCE 2: ThePirateBay API + mirrors
// ------------------------------------------------------------------
async function searchTPB(query) {
  const endpoints = [
    `https://apibay.org/q.php?q=${encodeURIComponent(query)}`,
    `https://apibay.org/q.php?q=${encodeURIComponent(query)}&cat=201`,
    `https://apibay.org/q.php?q=${encodeURIComponent(query)}&cat=207`,
    `https://piratebay.live/api.php?url=/q.php?q=${encodeURIComponent(query)}`,
  ];

  const errors = [];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: timeoutSignal(8000),
      });
      if (!res.ok) {
        errors.push(`${url}: HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      if (!text || text.trim().length === 0) {
        errors.push(`${url}: empty response`);
        continue;
      }
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        errors.push(`${url}: invalid JSON`);
        continue;
      }
      if (!Array.isArray(data)) {
        errors.push(`${url}: not array (${typeof data})`);
        continue;
      }

      const results = data
        .filter(t => t.info_hash && t.name)
        .map(t => ({
          title: t.name,
          year: '',
          quality: detectQuality(t.name),
          type: 'bluray',
          size: formatBytes(parseInt(t.size) || 0),
          magnet: `magnet:?xt=urn:btih:${t.info_hash}&dn=${encodeURIComponent(t.name)}&tr=udp://tracker.opentrackr.org:1337/announce`,
          hash: t.info_hash.toLowerCase(),
          seeds: parseInt(t.seeders) || 0,
          peers: parseInt(t.leechers) || 0,
          provider: 'TPB',
        }));
      return { results, error: null };
    } catch (e) {
      errors.push(`${url}: ${e.message}`);
      continue;
    }
  }
  return { results: [], error: errors.join('; ') };
}

// ------------------------------------------------------------------
// SOURCE 3: YTS mirrors (direct, no proxy)
// ------------------------------------------------------------------
async function searchYTS(query) {
  const endpoints = [
    `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=10`,
    `https://yts.lt/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=10`,
    `https://yts.unblockit.earth/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}&limit=10`,
  ];

  const errors = [];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: timeoutSignal(8000),
      });
      if (!res.ok) {
        errors.push(`${url}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
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
            hash: hash.toLowerCase(),
            seeds: parseInt(torrent.seeds) || 0,
            peers: parseInt(torrent.peers) || 0,
            provider: 'YTS',
          });
        }
      }
      if (results.length > 0) return { results, error: null };
      errors.push(`${url}: 0 movies`);
    } catch (e) {
      errors.push(`${url}: ${e.message}`);
    }
  }
  return { results: [], error: errors.join('; ') };
}

// ------------------------------------------------------------------
// SOURCE 4: EZTV (TV shows)
// ------------------------------------------------------------------
async function searchEZTV(imdbId) {
  if (!imdbId) return { results: [], error: 'no imdbId' };
  const cleanId = imdbId.toString().replace('tt', '');
  try {
    const res = await fetch(
      `https://eztv.re/api/get-torrents?limit=15&imdb_id=${cleanId}`,
      { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(8000) }
    );
    if (!res.ok) return { results: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    const torrents = data.torrents || [];

    return {
      results: torrents.map(t => ({
        title: t.title || t.filename || '',
        year: '',
        quality: detectQuality(t.filename || t.title || ''),
        type: 'web',
        size: formatBytes(parseInt(t.size_bytes) || 0),
        magnet: t.magnet_url || `magnet:?xt=urn:btih:${t.hash}&dn=${encodeURIComponent(t.title || '')}&tr=udp://tracker.opentrackr.org:1337/announce`,
        hash: (t.hash || '').toLowerCase(),
        seeds: parseInt(t.seeds) || 0,
        peers: parseInt(t.peers) || 0,
        provider: 'EZTV',
      })),
      error: null,
    };
  } catch (e) {
    return { results: [], error: e.message };
  }
}

// ------------------------------------------------------------------
// SOURCE 5: 1337x via torrent-api-py
// ------------------------------------------------------------------
async function search1337x(query) {
  try {
    const res = await fetch(
      `https://torrent-api-py-nxul.onrender.com/api/v1/search?site=1337x&query=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(10000) }
    );
    if (!res.ok) return { results: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    if (!data?.data || !Array.isArray(data.data)) return { results: [], error: 'Invalid format' };

    return {
      results: data.data
        .filter(t => t.magnet || t.infoHash)
        .map(t => ({
          title: t.name || t.title || '',
          year: '',
          quality: detectQuality(t.name || t.title || ''),
          type: 'web',
          size: t.size || '?',
          magnet: t.magnet || `magnet:?xt=urn:btih:${t.infoHash}&dn=${encodeURIComponent(t.name || '')}&tr=udp://tracker.opentrackr.org:1337/announce`,
          hash: (t.infoHash || '').toLowerCase(),
          seeds: parseInt(t.seeders) || 0,
          peers: parseInt(t.leechers) || 0,
          provider: '1337x',
        })),
      error: null,
    };
  } catch (e) {
    return { results: [], error: e.message };
  }
}

// ------------------------------------------------------------------
// SOURCE 6: Torrents-csv
// ------------------------------------------------------------------
async function searchTorrentsCSV(query) {
  try {
    const res = await fetch(
      `https://torrents-csv.com/service/search?q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(8000) }
    );
    if (!res.ok) return { results: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    if (!Array.isArray(data)) return { results: [], error: 'Invalid format' };

    return {
      results: data
        .filter(t => t.infohash && t.name)
        .slice(0, 10)
        .map(t => ({
          title: t.name,
          year: '',
          quality: detectQuality(t.name),
          type: 'web',
          size: formatBytes(parseInt(t.size_bytes) || 0),
          magnet: `magnet:?xt=urn:btih:${t.infohash}&dn=${encodeURIComponent(t.name)}&tr=udp://tracker.opentrackr.org:1337/announce`,
          hash: (t.infohash || '').toLowerCase(),
          seeds: parseInt(t.seeders) || 0,
          peers: parseInt(t.leechers) || 0,
          provider: 'CSV',
        })),
      error: null,
    };
  } catch (e) {
    return { results: [], error: e.message };
  }
}

// ------------------------------------------------------------------
// Main handler
// ------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { q, type, imdbId, imdb } = req.query;
  const actualImdb = imdbId || imdb;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  const diagnostics = {};
  const results = [];
  const seenHashes = new Set();

  const addUnique = (items) => {
    for (const item of items) {
      if (!item.hash || seenHashes.has(item.hash)) continue;
      seenHashes.add(item.hash);
      results.push(item);
    }
  };

  // 1. Torrentio (most reliable for IMDB-based search)
  if (actualImdb) {
    const tio = await searchTorrentio(actualImdb, type);
    diagnostics.torrentio = { count: tio.results.length, error: tio.error };
    addUnique(tio.results);
  } else {
    diagnostics.torrentio = { skipped: true, reason: 'no imdbId' };
  }

  // 2. YTS (movies only)
  if (type !== 'series') {
    const yts = await searchYTS(q);
    diagnostics.yts = { count: yts.results.length, error: yts.error };
    addUnique(yts.results);
  }

  // 3. TPB
  const tpb = await searchTPB(q);
  diagnostics.tpb = { count: tpb.results.length, error: tpb.error };
  addUnique(tpb.results);

  // 4. 1337x
  const x1337 = await search1337x(q);
  diagnostics.x1337 = { count: x1337.results.length, error: x1337.error };
  addUnique(x1337.results);

  // 5. Torrents-csv
  const csv = await searchTorrentsCSV(q);
  diagnostics.csv = { count: csv.results.length, error: csv.error };
  addUnique(csv.results);

  // 6. EZTV for TV
  if (type === 'series' && actualImdb) {
    const eztv = await searchEZTV(actualImdb);
    diagnostics.eztv = { count: eztv.results.length, error: eztv.error };
    addUnique(eztv.results);
  }

  // Sort by quality then seeds
  const qualityOrder = { '4K': 4, '2160p': 4, '1080p': 3, '720p': 2, '480p': 1, 'auto': 0 };
  results.sort((a, b) => {
    const qa = qualityOrder[a.quality] || 0;
    const qb = qualityOrder[b.quality] || 0;
    if (qa !== qb) return qb - qa;
    return (b.seeds || 0) - (a.seeds || 0);
  });

  console.log('Search diagnostics:', JSON.stringify(diagnostics));

  res.status(200).json({
    query: q,
    imdbId: actualImdb || null,
    count: results.length,
    diagnostics,
    results: results.slice(0, 20),
  });
}

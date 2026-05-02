// Server-side Torrent Search
// Tries multiple APIs from Vercel (server IPs, not blocked by CORS)
// ================================================================

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    return AbortSignal.timeout(ms);
  }
  // Fallback for older Node versions
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
// Source 1: ThePirateBay API (apibay.org) — usually no Cloudflare
// ------------------------------------------------------------------
async function searchTPB(query) {
  const endpoints = [
    `https://apibay.org/q.php?q=${encodeURIComponent(query)}&cat=201`,
    `https://apibay.org/q.php?q=${encodeURIComponent(query)}&cat=207`, // HD movies
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: timeoutSignal(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (!Array.isArray(data)) continue;

      return data
        .filter(t => t.info_hash && t.name)
        .map(t => ({
          title: t.name,
          year: '',
          quality: detectQuality(t.name),
          type: 'bluray',
          size: formatBytes(parseInt(t.size) || 0),
          magnet: `magnet:?xt=urn:btih:${t.info_hash}&dn=${encodeURIComponent(t.name)}&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://open.stealth.si:80/announce&tr=udp://tracker.torrent.eu.org:451/announce`,
          hash: t.info_hash.toLowerCase(),
          seeds: parseInt(t.seeders) || 0,
          peers: parseInt(t.leechers) || 0,
          provider: 'TPB',
        }));
    } catch (e) {
      console.warn('TPB search failed for', url, e.message);
    }
  }
  return [];
}

// ------------------------------------------------------------------
// Source 2: EZTV (TV shows)
// ------------------------------------------------------------------
async function searchEZTV(imdbId) {
  if (!imdbId) return [];
  const cleanId = imdbId.toString().replace('tt', '');
  try {
    const res = await fetch(
      `https://eztv.re/api/get-torrents?limit=15&imdb_id=${cleanId}`,
      { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const torrents = data.torrents || [];

    return torrents.map(t => ({
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
    }));
  } catch (e) {
    console.warn('EZTV search failed:', e.message);
    return [];
  }
}

// ------------------------------------------------------------------
// Source 3: 1337x via torrent-api-py public instance
// ------------------------------------------------------------------
async function search1337x(query) {
  try {
    const res = await fetch(
      `https://torrent-api-py-nxul.onrender.com/api/v1/search?site=1337x&query=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.data || !Array.isArray(data.data)) return [];

    return data.data
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
      }));
  } catch (e) {
    console.warn('1337x search failed:', e.message);
    return [];
  }
}

// ------------------------------------------------------------------
// Source 4: Torrents-csv
// ------------------------------------------------------------------
async function searchTorrentsCSV(query) {
  try {
    const res = await fetch(
      `https://torrents-csv.com/service/search?q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

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
        hash: (t.infohash || '').toLowerCase(),
        seeds: parseInt(t.seeders) || 0,
        peers: parseInt(t.leechers) || 0,
        provider: 'CSV',
      }));
  } catch (e) {
    console.warn('TorrentsCSV search failed:', e.message);
    return [];
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

  const { q, type, imdbId } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  const results = [];
  const seenHashes = new Set();

  const addUnique = (items) => {
    for (const item of items) {
      if (!item.hash || seenHashes.has(item.hash)) continue;
      seenHashes.add(item.hash);
      results.push(item);
    }
  };

  // Run all searches in parallel with individual timeouts
  const searches = [];

  if (type === 'series' && imdbId) {
    searches.push(searchEZTV(imdbId).then(addUnique));
  }

  // Always search TPB and 1337x
  searches.push(
    searchTPB(q).then(addUnique),
    search1337x(q).then(addUnique),
    searchTorrentsCSV(q).then(addUnique),
  );

  // Wait up to 15 seconds total
  await Promise.race([
    Promise.all(searches.map(s => s.catch(() => {}))),
    new Promise(r => setTimeout(r, 15000)),
  ]);

  // Sort: quality desc, then seeds desc
  const qualityOrder = { '4K': 4, '2160p': 4, '1080p': 3, '720p': 2, '480p': 1, 'auto': 0 };
  results.sort((a, b) => {
    const qa = qualityOrder[a.quality] || 0;
    const qb = qualityOrder[b.quality] || 0;
    if (qa !== qb) return qb - qa;
    return (b.seeds || 0) - (a.seeds || 0);
  });

  res.status(200).json({
    query: q,
    count: results.length,
    results: results.slice(0, 20),
  });
}

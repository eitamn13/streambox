// Free Streaming Sources — Archive.org, YouTube, Vimeo
// =======================================================
// Searches public-domain / free-to-watch content.
// Returns direct stream URLs ready for the HTML5 video player.

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

// ------------------------------------------------------------------
// 1. Archive.org — public domain movies & shows
// ------------------------------------------------------------------
async function searchArchiveOrg(query) {
  if (!query) return [];
  const q = encodeURIComponent(`title:(${query}) AND medatype:(movies)`);
  const url = `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier,title,year,description&output=json&rows=5`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    const docs = data?.response?.docs || [];
    const results = [];

    for (const doc of docs) {
      try {
        const metaRes = await fetch(
          `https://archive.org/metadata/${doc.identifier}/files`,
          { signal: timeoutSignal(8000) }
        );
        if (!metaRes.ok) continue;
        const meta = await metaRes.json();
        const files = meta?.result || [];

        // Find best video file
        const video = files.find(f =>
          f.name?.match(/\.(mp4|webm|mkv|ogv)$/i) &&
          !f.name?.toLowerCase().includes('sample') &&
          f.size > 10 * 1024 * 1024 // at least 10MB
        ) || files.find(f => f.name?.match(/\.(mp4|webm|mkv|ogv)$/i));

        if (video) {
          results.push({
            url: `https://archive.org/download/${doc.identifier}/${video.name}`,
            title: doc.title || query,
            quality: 'auto',
            provider: 'Archive.org',
            type: 'direct',
            info: ['Public Domain'],
          });
        }
      } catch { /* skip item */ }
    }
    return results;
  } catch (e) {
    console.warn('[free-sources] Archive.org failed:', e.message);
    return [];
  }
}

// ------------------------------------------------------------------
// 2. YouTube — free-with-ads movies (via Invidious instances)
// ------------------------------------------------------------------
async function searchYouTube(query) {
  if (!query) return [];
  const instances = [
    'https://vid.puffyan.us',
    'https://y.com.sb',
    'https://iv.datura.network',
  ];

  for (const base of instances) {
    try {
      const url = `${base}/api/v1/search?q=${encodeURIComponent(query + ' full movie')}&type=video`;
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(10000) });
      if (!res.ok) continue;
      const data = await res.json();
      const results = [];

      for (const item of (data || []).slice(0, 3)) {
        if (!item.videoId) continue;
        // Skip trailers (heuristic)
        const title = (item.title || '').toLowerCase();
        if (title.includes('trailer') && !title.includes('full')) continue;

        results.push({
          url: `https://www.youtube.com/embed/${item.videoId}?autoplay=1&rel=0`,
          title: item.title || query,
          quality: 'auto',
          provider: 'YouTube',
          type: 'iframe',
          info: ['Free with Ads'],
        });
      }
      if (results.length > 0) return results;
    } catch { /* try next instance */ }
  }
  return [];
}

// ------------------------------------------------------------------
// Main handler
// ------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { query, type, imdbId } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  console.log(`[free-sources] Searching: "${query}" type=${type || 'movie'}`);

  const [archive, youtube] = await Promise.allSettled([
    searchArchiveOrg(query),
    searchYouTube(query),
  ]);

  const archiveResults = archive.status === 'fulfilled' ? archive.value : [];
  const youtubeResults = youtube.status === 'fulfilled' ? youtube.value : [];

  const all = [...archiveResults, ...youtubeResults];

  console.log(`[free-sources] Archive: ${archiveResults.length}, YouTube: ${youtubeResults.length}, total: ${all.length}`);

  res.status(200).json({
    query,
    count: all.length,
    sources: {
      archive: archiveResults.length,
      youtube: youtubeResults.length,
    },
    streams: all,
  });
}

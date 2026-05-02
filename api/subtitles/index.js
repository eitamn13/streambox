// Subtitle API - OpenSubtitles + others
// ======================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { imdb_id, tmdb_id, query, lang = 'heb,eng' } = req.query;

  const subtitles = [];

  // OpenSubtitles API v1 (free tier, no key needed for some endpoints)
  try {
    const osUrl = new URL('https://api.opensubtitles.com/api/v1/subtitles');
    if (imdb_id) osUrl.searchParams.set('imdb_id', imdb_id);
    if (tmdb_id) osUrl.searchParams.set('tmdb_id', tmdb_id);
    if (query) osUrl.searchParams.set('query', query);
    osUrl.searchParams.set('languages', lang);
    osUrl.searchParams.set('order_by', 'download_count');
    osUrl.searchParams.set('order_direction', 'desc');

    const osRes = await fetch(osUrl.toString(), {
      headers: {
        'User-Agent': 'StreamBox/1.0',
        'Content-Type': 'application/json',
      },
    });

    if (osRes.ok) {
      const data = await osRes.json();
      for (const item of (data.data || []).slice(0, 10)) {
        const attrs = item.attributes || {};
        if (attrs.download_link || attrs.url) {
          subtitles.push({
            url: attrs.download_link || attrs.url,
            lang: attrs.language || 'und',
            label: attrs.release || attrs.filename || attrs.language || 'Subtitle',
            provider: 'OpenSubtitles',
            rating: attrs.ratings || 0,
            downloads: attrs.download_count || 0,
          });
        }
      }
    }
  } catch (e) { console.warn('OpenSubtitles fetch failed:', e.message); }

  res.status(200).json({ subtitles });
}

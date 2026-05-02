// Subtitle API — OpenSubtitles + fallback search
// ================================================
// Searches multiple sources for Hebrew and English subtitles.
// Returns direct download URLs.

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

// Normalize language codes
function normalizeLang(code) {
  const map = {
    'he': 'heb', 'hebrew': 'heb', 'iw': 'heb',
    'en': 'eng', 'english': 'eng',
    'ar': 'ara', 'arabic': 'ara',
    'es': 'spa', 'spanish': 'spa',
    'fr': 'fre', 'french': 'fre',
  };
  return map[code?.toLowerCase()] || code;
}

// ------------------------------------------------------------------
// 1. OpenSubtitles.com API v1
// ------------------------------------------------------------------
async function searchOpenSubtitles(imdbId, query, langs) {
  const results = [];
  try {
    const osUrl = new URL('https://api.opensubtitles.com/api/v1/subtitles');
    if (imdbId) osUrl.searchParams.set('imdb_id', imdbId.toString().replace(/^tt/, ''));
    if (query) osUrl.searchParams.set('query', query);
    osUrl.searchParams.set('languages', langs);
    osUrl.searchParams.set('order_by', 'download_count');
    osUrl.searchParams.set('order_direction', 'desc');

    const osRes = await fetch(osUrl.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
        'Api-Key': process.env.OPENSUBTITLES_API_KEY || '',
      },
      signal: timeoutSignal(10000),
    });

    if (osRes.ok) {
      const data = await osRes.json();
      for (const item of (data.data || []).slice(0, 15)) {
        const attrs = item.attributes || {};
        const files = attrs.files || [];
        const file = files[0] || {};
        const dlLink = file.file_id
          ? `https://api.opensubtitles.com/api/v1/download?file_id=${file.file_id}`
          : (attrs.legacy_subtitle_id
            ? `https://www.opensubtitles.org/en/subtitleserve/sub/${attrs.legacy_subtitle_id}`
            : null);

        if (dlLink) {
          results.push({
            url: dlLink,
            lang: normalizeLang(attrs.language),
            label: attrs.release || attrs.filename || attrs.language || 'Subtitle',
            provider: 'OpenSubtitles',
            rating: attrs.ratings || 0,
            downloads: attrs.download_count || 0,
          });
        }
      }
    }
  } catch (e) { console.warn('[subtitles] OpenSubtitles failed:', e.message); }
  return results;
}

// ------------------------------------------------------------------
// 2. SubDL fallback (free API, no key needed for basic search)
// ------------------------------------------------------------------
async function searchSubDL(imdbId, query) {
  const results = [];
  try {
    const url = new URL('https://api.subdl.com/api/v1/subtitles');
    if (imdbId) url.searchParams.set('imdb_id', imdbId);
    if (query) url.searchParams.set('film_name', query);
    url.searchParams.set('languages', 'he,en');
    url.searchParams.set('subs_per_page', '10');

    const res = await fetch(url.toString(), { signal: timeoutSignal(8000) });
    if (!res.ok) return results;
    const data = await res.json();
    const subs = data.subtitles || [];
    for (const s of subs) {
      if (s.url || s.link || s.download) {
        results.push({
          url: s.url || s.link || s.download,
          lang: normalizeLang(s.language || s.lang),
          label: s.release || s.filename || s.title || 'Subtitle',
          provider: 'SubDL',
        });
      }
    }
  } catch (e) { console.warn('[subtitles] SubDL failed:', e.message); }
  return results;
}

// ------------------------------------------------------------------
// Main handler
// ------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { imdb_id, tmdb_id, query, lang = 'heb,eng' } = req.query;

  // Build language list for APIs
  const langList = lang.split(',').map(l => {
    const map = { 'heb': 'he', 'he': 'he', 'eng': 'en', 'en': 'en' };
    return map[l.trim()] || l.trim();
  }).join(',');

  const [osResults, subdlResults] = await Promise.allSettled([
    searchOpenSubtitles(imdb_id, query, langList),
    searchSubDL(imdb_id, query),
  ]);

  const all = [
    ...(osResults.status === 'fulfilled' ? osResults.value : []),
    ...(subdlResults.status === 'fulfilled' ? subdlResults.value : []),
  ];

  // Deduplicate by URL
  const seen = new Set();
  const unique = [];
  for (const s of all) {
    if (!seen.has(s.url)) {
      seen.add(s.url);
      unique.push(s);
    }
  }

  // Sort: Hebrew first, then English, then by downloads
  const langPriority = { heb: 0, he: 0, eng: 1, en: 1 };
  unique.sort((a, b) => {
    const pa = langPriority[a.lang] ?? 2;
    const pb = langPriority[b.lang] ?? 2;
    if (pa !== pb) return pa - pb;
    return (b.downloads || 0) - (a.downloads || 0);
  });

  res.status(200).json({
    query: query || imdb_id,
    count: unique.length,
    subtitles: unique,
  });
}

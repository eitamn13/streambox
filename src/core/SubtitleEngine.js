// Subtitle Engine - Fetches, converts, and syncs subtitles
// =========================================================

function srtToVtt(srt) {
  const header = 'WEBVTT\n\n';
  const body = srt
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n\n')
    .map(block => {
      const lines = block.trim().split('\n');
      if (lines.length < 2) return '';
      const first = lines[0].match(/^\d+$/) ? lines.slice(1) : lines;
      if (first.length < 1) return '';
      const time = first[0].replace(/,/g, '.');
      const text = first.slice(1).join('\n');
      return `${time}\n${text}`;
    })
    .filter(Boolean)
    .join('\n\n');
  return header + body;
}

function applyOffset(vtt, offsetSeconds) {
  if (!offsetSeconds) return vtt;
  return vtt.replace(/(\d{2}:\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}\.\d{3})/g, (match, start, end) => {
    const shift = (t) => {
      const [h, m, s] = t.split(':');
      let total = parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s) + offsetSeconds;
      if (total < 0) total = 0;
      const nh = Math.floor(total / 3600);
      const nm = Math.floor((total % 3600) / 60);
      const ns = (total % 60).toFixed(3);
      return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}:${ns.padStart(6, '0')}`;
    };
    return `${shift(start)} --> ${shift(end)}`;
  });
}

function createSubtitleBlob(vttContent) {
  const blob = new Blob([vttContent], { type: 'text/vtt' });
  return URL.createObjectURL(blob);
}

export async function fetchSubtitles({ imdb_id, tmdb_id, query, lang = 'heb,eng', type = 'movie', season = null, episode = null }) {
  const results = [];

  // 1. Try Wizdom Hebrew subtitles (fast, dedicated Hebrew source)
  if (imdb_id) {
    try {
      const wizdomType = type === 'tv' || type === 'series' ? 'series' : 'movie';
      const wizdomId = wizdomType === 'series' && season && episode
        ? `${imdb_id}:${season}:${episode}`
        : imdb_id;
      const wizdomUrl = `https://4b139a4b7f94-wizdom-stremio-v2.baby-beamup.club/subtitles/${wizdomType}/${wizdomId}.json`;
      const res = await fetch(wizdomUrl);
      if (res.ok) {
        const data = await res.json();
        const subs = (data.subtitles || []).map(s => ({
          url: s.url,
          lang: s.lang === 'heb' ? 'he' : s.lang,
          label: `עברית — ${s.id?.replace(/\[WIZDOM\]/, '') || 'Wizdom'}`,
          provider: 'Wizdom',
          rating: 10,
          downloads: 9999,
        }));
        results.push(...subs);
      }
    } catch (e) {
      console.warn('Wizdom fetch failed:', e);
    }
  }

  // 2. Try OpenSubtitles legacy REST API (free, no key needed for search)
  if (imdb_id) {
    try {
      const cleanImdb = imdb_id.replace(/^tt/, '');
      const osRes = await fetch(`https://rest.opensubtitles.org/search/imdbid-${cleanImdb}/sublanguageid-${lang.replace(/,.*$/, '')}`, {
        headers: { 'User-Agent': 'StreamBox v1.0' },
      });
      if (osRes.ok) {
        const osData = await osRes.json();
        const osSubs = (osData || []).slice(0, 10).map(s => ({
          url: s.SubDownloadLink || s.SubtitlesLink,
          lang: (s.ISO639 === 'he' ? 'he' : s.ISO639) || 'und',
          label: `${s.LanguageName || s.ISO639} — ${s.SubFormat || 'srt'}`,
          provider: 'OpenSubtitles',
          rating: s.SubRating ? parseFloat(s.SubRating) * 2 : 0,
          downloads: s.SubDownloadsCnt || 0,
        })).filter(s => s.url);
        results.push(...osSubs);
      }
    } catch (e) {
      console.warn('OpenSubtitles legacy fetch failed:', e);
    }
  }

  // 3. Fallback to backend subtitle API
  try {
    const params = new URLSearchParams();
    if (imdb_id) params.set('imdb_id', imdb_id);
    if (tmdb_id) params.set('tmdb_id', tmdb_id);
    if (query) params.set('query', query);
    params.set('lang', lang);

    const res = await fetch(`/api/subtitles?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const subs = (data.subtitles || []).map(s => ({
        url: s.url,
        lang: s.lang || 'und',
        label: s.label || s.lang || 'Subtitle',
        provider: s.provider || 'OpenSubtitles',
        rating: s.rating || 0,
        downloads: s.downloads || 0,
      }));
      results.push(...subs);
    }
  } catch (e) {
    console.warn('Backend subtitle fetch failed:', e);
  }

  // Sort: Hebrew first, then English, then others
  const langPriority = { he: 0, heb: 0, en: 1, eng: 1 };
  results.sort((a, b) => {
    const pa = langPriority[a.lang] ?? 2;
    const pb = langPriority[b.lang] ?? 2;
    return pa - pb;
  });

  return results;
}

export async function loadSubtitleTrack(subUrl, offsetSeconds = 0) {
  try {
    // Try with CORS proxy if direct fetch fails
    let res;
    try {
      res = await fetch(subUrl, { headers: { 'Accept': '*/*' } });
    } catch {
      // Fallback via corsproxy
      res = await fetch(`https://corsproxy.io/?${encodeURIComponent(subUrl)}`);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Handle gzip if Content-Encoding is gzip
    const isGzip = res.headers.get('Content-Encoding') === 'gzip' ||
                   res.headers.get('Content-Type')?.includes('gzip') ||
                   subUrl.toLowerCase().endsWith('.gz');
    let text;
    if (isGzip && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('gzip');
      const decompressed = res.body.pipeThrough(ds);
      const response = new Response(decompressed);
      text = await response.text();
    } else {
      text = await res.text();
    }

    const isSrt = subUrl.toLowerCase().endsWith('.srt') || text.trim().startsWith('1\n') || /\d{2}:\d{2}:\d{2},\d{3}/.test(text);
    let vtt = isSrt ? srtToVtt(text) : text;
    vtt = applyOffset(vtt, offsetSeconds);
    return createSubtitleBlob(vtt);
  } catch (e) {
    console.error('Failed to load subtitle:', e);
    return null;
  }
}

export const LANGUAGE_NAMES = {
  he: 'עברית',
  heb: 'עברית',
  en: 'English',
  eng: 'English',
  es: 'Español',
  spa: 'Español',
  fr: 'Français',
  fre: 'Français',
  de: 'Deutsch',
  ger: 'Deutsch',
  it: 'Italiano',
  ita: 'Italiano',
  pt: 'Português',
  por: 'Português',
  ru: 'Русский',
  rus: 'Русский',
  ar: 'العربية',
  ara: 'العربية',
  zh: '中文',
  chi: '中文',
  ja: '日本語',
  jpn: '日本語',
  ko: '한국어',
  kor: '한국어',
  hi: 'हिन्दी',
  hin: 'हिन्दी',
  tr: 'Türkçe',
  tur: 'Türkçe',
  pl: 'Polski',
  pol: 'Polski',
  nl: 'Nederlands',
  dut: 'Nederlands',
  sv: 'Svenska',
  swe: 'Svenska',
  und: 'לא ידוע',
};

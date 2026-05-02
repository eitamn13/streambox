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

export async function fetchSubtitles({ imdb_id, tmdb_id, query, lang = 'heb,eng' }) {
  try {
    const params = new URLSearchParams();
    if (imdb_id) params.set('imdb_id', imdb_id);
    if (tmdb_id) params.set('tmdb_id', tmdb_id);
    if (query) params.set('query', query);
    params.set('lang', lang);

    const res = await fetch(`/api/subtitles?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.subtitles || []).map(s => ({
      url: s.url,
      lang: s.lang || 'und',
      label: s.label || s.lang || 'Subtitle',
      provider: s.provider || 'OpenSubtitles',
      rating: s.rating || 0,
      downloads: s.downloads || 0,
    }));
  } catch (e) {
    console.warn('Subtitle fetch failed:', e);
    return [];
  }
}

export async function loadSubtitleTrack(subUrl, offsetSeconds = 0) {
  try {
    const res = await fetch(subUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
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

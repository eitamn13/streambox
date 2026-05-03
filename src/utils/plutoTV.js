// Pluto TV Public API Integration
// =================================
// Pluto TV offers a free, public API for their ad-supported channels.
// No authentication required. Legal to use.

const PLUTO_API_BASE = 'https://api.pluto.tv/v2';
const PLUTO_WEB_BASE = 'https://pluto.tv';

// Fetch all live channels with current programming
export async function fetchPlutoChannels() {
  // Use corsproxy for browser CORS
  const proxyUrl = 'https://corsproxy.io/?';
  const apiUrl = `${PLUTO_API_BASE}/channels.json`;

  const res = await fetch(proxyUrl + encodeURIComponent(apiUrl));
  if (!res.ok) throw new Error(`Pluto TV API error: ${res.status}`);

  const data = await res.json();

  return (data || []).map((ch) => {
    // Get the HLS stream URL
    const streamUrl = ch.stitched?.urls?.[0]?.url ||
                      ch.slive?.urls?.[0]?.url ||
                      null;

    // Get current program from timelines
    const now = new Date();
    const currentProgram = (ch.timelines || []).find((t) => {
      const start = new Date(t.start);
      const stop = new Date(t.stop);
      return now >= start && now < stop;
    });

    const nextProgram = (ch.timelines || []).find((t) => {
      const start = new Date(t.start);
      return start > now;
    });

    return {
      id: `pluto-${ch._id}`,
      name: ch.name,
      slug: ch.slug,
      number: ch.number,
      category: mapPlutoCategory(ch.category),
      logo: ch.colorLogoPNG?.path || ch.logo?.path || null,
      poster: ch.colorLogoSVG?.path || null,
      streamUrl,
      webUrl: `${PLUTO_WEB_BASE}/live-tv/${ch.slug}`,
      currentProgram: currentProgram ? {
        title: currentProgram.title,
        description: currentProgram.episode?.description || '',
        start: currentProgram.start,
        stop: currentProgram.stop,
      } : null,
      nextProgram: nextProgram ? {
        title: nextProgram.title,
        start: nextProgram.start,
      } : null,
    };
  }).filter((ch) => ch.streamUrl); // Only include channels with stream URLs
}

function mapPlutoCategory(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('movie') || cat.includes('film')) return 'movies';
  if (cat.includes('news')) return 'news';
  if (cat.includes('sport')) return 'sport';
  if (cat.includes('kid') || cat.includes('family')) return 'kids';
  if (cat.includes('music')) return 'music';
  if (cat.includes('comedy')) return 'comedy';
  return 'general';
}

export function getPlutoCategories(channels) {
  const cats = new Set(channels.map((c) => c.category));
  return ['all', ...Array.from(cats).sort()];
}

export const PLUTO_CATEGORY_LABELS = {
  all: 'הכל',
  movies: 'סרטים',
  news: 'חדשות',
  sport: 'ספורט',
  kids: 'ילדים',
  music: 'מוזיקה',
  comedy: 'קומדיה',
  general: 'כללי',
};

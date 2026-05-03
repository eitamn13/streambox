export function parseM3U(content) {
  const lines = content.split(/\r?\n/);
  const channels = [];
  let currentChannel = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('#EXTINF:')) {
      currentChannel = parseExtInf(trimmed);
    } else if (trimmed.startsWith('#EXTVLCOPT:')) {
      if (currentChannel) {
        const refererMatch = trimmed.match(/http-referrer=(.+)/);
        if (refererMatch) currentChannel.referrer = refererMatch[1];
        const userAgentMatch = trimmed.match(/http-user-agent=(.+)/);
        if (userAgentMatch) currentChannel.userAgent = userAgentMatch[1];
      }
    } else if (!trimmed.startsWith('#')) {
      if (currentChannel) {
        currentChannel.url = trimmed;
        currentChannel.id = `ch-${channels.length}`;
        currentChannel.category = detectCategory(currentChannel);
        channels.push(currentChannel);
        currentChannel = null;
      }
    }
  }

  return channels;
}

function parseExtInf(line) {
  const channel = {
    name: 'ערוץ ללא שם',
    logo: '',
    group: 'כללי',
    tvgId: '',
    tvgName: '',
  };

  const nameMatch = line.match(/,(.+)$/);
  if (nameMatch) {
    channel.name = nameMatch[1].trim();
  }

  const attrRegex = /(\w+-(?:id|name|logo|group-title))="([^"]*)"/g;
  let match;
  while ((match = attrRegex.exec(line)) !== null) {
    const attr = match[1];
    const value = match[2];
    if (attr === 'tvg-id') channel.tvgId = value;
    if (attr === 'tvg-name') channel.tvgName = value;
    if (attr === 'tvg-logo') channel.logo = value;
    if (attr === 'group-title') channel.group = value;
  }

  if (channel.tvgName && channel.name === 'ערוץ ללא שם') {
    channel.name = channel.tvgName;
  }

  return channel;
}

const CATEGORY_MAP = {
  sport: ['sport', 'sports', 'espn', 'fox sports', 'bein', 'sky sport', 'bt sport', 'nba', 'nfl', 'ufc', 'mma', 'boxing', 'motorsport', 'racing', 'golf', 'tennis', 'cricket', 'ספורט', 'כדורגל', 'כדורסל', 'sport1', 'sport2', 'sport3', 'sport4', 'sport5'],
  news: ['news', 'cnn', 'bbc', 'fox news', 'msnbc', 'al jazeera', 'sky news', 'bloomberg', 'cnbc', 'reuters', 'חדשות'],
  movies: ['movie', 'movies', 'cinema', 'film', 'hbo', 'showtime', 'starz', 'cinemax', 'epix', 'tcm', 'amc', 'fx', 'syfy', 'sci-fi', 'סרטים'],
  kids: ['kids', 'children', 'cartoon', 'disney', 'nickelodeon', 'nick', 'cartoon network', 'boomerang', 'pbs kids', 'baby', 'junior', 'ילדים', 'ניק', 'דיסני', 'הופ'],
  music: ['music', 'mtv', 'vh1', 'bet', 'trace', 'mcm', 'fm', 'radio', 'מוזיקה'],
};

function detectCategory(channel) {
  const text = `${channel.name} ${channel.group}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return 'general';
}

// Israeli channel detection — STRICT: only Hebrew text or exact Israeli identifiers
const ISRAELI_KEYWORDS = [
  // Hebrew words (very specific to Israeli channels)
  'ישראל', 'עידן פלוס', 'ערוץ ', 'כאן', 'קשת', 'רשת', 'מכאן',
  'החינוכית', 'חדשות', 'ספורט', 'ילדים', 'מוזיקה', 'סרטים',
  'שלבה', 'שידורי', 'הטלוויזיה', 'הציבורית', 'בידור',
  // Exact English matches with context
  'idan plus', 'israel plus', 'israeli network',
  'kan 11', 'keshet 12', 'reshet 13', 'now 14',
  'mako tv', 'channel 10 il', 'channel 12 il', 'channel 13 il',
  'sport 5', 'sport5', 'one sport',
  // Specific brands
  'shalva', 'cellcom tv', 'yes tv', 'hot ', 'hot3', 'hot8',
];

const ISRAELI_TVG_IDS = [
  'kan11', 'keshet12', 'reshet13', 'now14',
  'channel1il', 'channel2il', 'channel10il', 'channel11il', 'channel12il', 'channel13il', 'channel14il',
  'sport1il', 'sport2il', 'sport3il', 'sport4il', 'sport5il',
  'israelplus', 'idanplus', 'hinuchit', 'makan33',
];

function isIsraeliChannel(channel) {
  const name = (channel.name || '').toLowerCase();
  const group = (channel.group || '').toLowerCase();
  const tvgId = (channel.tvgId || '').toLowerCase();
  const fullText = `${name} ${group}`;

  // 1. PRIMARY: Hebrew characters = definitely Israeli
  const hasHebrew = /[\u0590-\u05FF]/.test(channel.name + channel.group);
  if (hasHebrew) return true;

  // 2. TVG-ID exact match (most reliable)
  for (const id of ISRAELI_TVG_IDS) {
    if (tvgId === id || tvgId.endsWith('.' + id) || tvgId.startsWith(id + '.')) return true;
  }

  // 3. Keyword matching — only whole words or specific phrases
  for (const kw of ISRAELI_KEYWORDS) {
    // For single words, require word boundary
    if (!kw.includes(' ')) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(fullText)) return true;
    } else {
      // For multi-word phrases, substring match is OK
      if (fullText.includes(kw.toLowerCase())) return true;
    }
  }

  return false;
}

export async function fetchM3U(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`שגיאה בטעינת ה-M3U: ${response.status}`);
    }

    const text = await response.text();
    const allChannels = parseM3U(text);

    // Filter only Israeli channels
    const israeliChannels = allChannels.filter(isIsraeliChannel);

    return israeliChannels;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('הזמן לטעינת הרשימה פג (5 שניות) — בדוק את החיבור');
    }
    throw err;
  }
}

export function getCategories(channels) {
  const cats = new Set(channels.map((c) => c.category));
  return ['all', ...Array.from(cats).sort()];
}

// Deprecated: use epgParser.js instead for real EPG
export function generateMockEPG(channel, offset = 0) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + offset * 30);
  const titles = [
    'שידור חי',
    'דיווח מיוחד',
    'תוכן בוקר',
    'חדשות ערב',
    'מבזקי ספורט',
    'בכורת סרט',
    'דוקומנטרי',
    'תוכן אירוח',
    'ריאליטי',
    'שעת קומדיה',
    'סדרת דרמה',
    'אירוע חי',
  ];

  const programs = [];
  for (let i = -2; i < 4; i++) {
    const start = new Date(now.getTime() + i * 30 * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const titleIndex = Math.abs((channel.name.length + i) % titles.length);
    programs.push({
      title: titles[titleIndex],
      start,
      end,
      isCurrent: i === 0,
    });
  }
  return programs;
}

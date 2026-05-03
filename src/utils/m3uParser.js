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
  sport: ['sport', 'sports', 'espn', 'fox sports', 'bein', 'sky sport', 'bt sport', 'nba', 'nfl', 'ufc', 'mma', 'boxing', 'motorsport', 'racing', 'golf', 'tennis', 'cricket', 'ספורט', 'כדורגל', 'כדורסל'],
  news: ['news', 'cnn', 'bbc', 'fox news', 'msnbc', 'al jazeera', 'sky news', 'bloomberg', 'cnbc', 'reuters', 'חדשות'],
  movies: ['movie', 'movies', 'cinema', 'film', 'hbo', 'showtime', 'starz', 'cinemax', 'epix', 'tcm', 'amc', 'fx', 'syfy', 'sci-fi', 'סרטים'],
  kids: ['kids', 'children', 'cartoon', 'disney', 'nickelodeon', 'nick', 'cartoon network', 'boomerang', 'pbs kids', 'baby', 'junior', 'ילדים', 'ניק', 'דיסני'],
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

// Check if channel is Israeli (Hebrew text or Israeli keywords)
function isIsraeliChannel(channel) {
  const text = `${channel.name} ${channel.group} ${channel.tvgId}`.toLowerCase();

  // Hebrew characters
  const hasHebrew = /[\u0590-\u05FF]/.test(channel.name + channel.group);
  if (hasHebrew) return true;

  // Israeli keywords
  const israeliKeywords = [
    'israel', 'israeli', 'ישראל', 'ערוץ', 'חדשות', 'ספורט', 'ילדים',
    'מוזיקה', 'קשת', 'רשת', 'כאן', 'הטלוויזיה', 'החינוכית',
    'mako', 'keshet', 'reshet', 'kan', 'channel 1', 'channel 2',
    'channel 10', 'channel 11', 'channel 12', 'channel 13', 'channel 14',
    ' ערוץ 1', ' ערוץ 2', ' ערוץ 10', ' ערוץ 11', ' ערוץ 12', ' ערוץ 13', ' ערוץ 14',
    ' ערוץ1', ' ערוץ2', ' ערוץ10', ' ערוץ11', ' ערוץ12', ' ערוץ13', ' ערוץ14',
    'sport 1', 'sport 2', 'sport 3', 'sport 4', 'sport 5',
    'ספורט 1', 'ספורט 2', 'ספורט 3', 'ספורט 4', 'ספורט 5',
    'one', 'two', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
  ];

  for (const kw of israeliKeywords) {
    if (text.includes(kw.toLowerCase())) return true;
  }

  return false;
}

export async function fetchM3U(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

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
      throw new Error('הזמן לטעינת הרשימה פג (3 שניות) — בדוק את החיבור');
    }
    throw err;
  }
}

export function getCategories(channels) {
  const cats = new Set(channels.map((c) => c.category));
  return ['all', ...Array.from(cats).sort()];
}

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

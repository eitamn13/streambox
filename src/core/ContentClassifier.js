// Content Classifier - Distinguishes legal vs unofficial content sources
// =====================================================================

export const SOURCE_TYPES = {
  OFFICIAL: 'official',       // Netflix, Disney+, TMDB official, etc.
  LEGAL_FREE: 'legal_free',   // Archive.org, Public Domain, Tubi, Pluto
  COMMUNITY: 'community',     // Stremio community addons (mixed legality)
  AGGREGATOR: 'aggregator',   // JustWatch, TMDB providers (links to official)
  DEBRID: 'debrid',           // Real-Debrid, Premiumize, TorBox
  UNKNOWN: 'unknown',         // Unclassified sources
};

export const SOURCE_LABELS = {
  [SOURCE_TYPES.OFFICIAL]: { label: 'רשמי', color: 'text-sb-green', bg: 'bg-sb-green/10', desc: 'שירות רשמי מורשה' },
  [SOURCE_TYPES.LEGAL_FREE]: { label: 'חוקי חינם', color: 'text-sb-blue', bg: 'bg-sb-blue/10', desc: 'תוכן חופשי או במתחם הציבורי' },
  [SOURCE_TYPES.COMMUNITY]: { label: 'קהילתי', color: 'text-sb-gold', bg: 'bg-sb-gold/10', desc: 'מקור קהילתי - בדוק את חוקיות השימוש באזורך' },
  [SOURCE_TYPES.AGGREGATOR]: { label: 'מפנה', color: 'text-sb-purple', bg: 'bg-sb-purple/10', desc: 'מפנה לשירותים רשמיים' },
  [SOURCE_TYPES.DEBRID]: { label: 'Debrid', color: 'text-sb-red', bg: 'bg-sb-red/10', desc: 'שירות Debrid - דורש מנוי נפרד' },
  [SOURCE_TYPES.UNKNOWN]: { label: 'לא ידוע', color: 'text-sb-gray', bg: 'bg-sb-gray/10', desc: 'מקור לא ידוע' },
};

export const COMPLIANCE_MODES = {
  STRICT: 'strict',     // Only official + legal_free
  MODERATE: 'moderate', // Official + legal_free + aggregator
  OPEN: 'open',         // Everything (with warnings)
};

const MODE_FILTERS = {
  [COMPLIANCE_MODES.STRICT]: [SOURCE_TYPES.OFFICIAL, SOURCE_TYPES.LEGAL_FREE],
  [COMPLIANCE_MODES.MODERATE]: [SOURCE_TYPES.OFFICIAL, SOURCE_TYPES.LEGAL_FREE, SOURCE_TYPES.AGGREGATOR],
  [COMPLIANCE_MODES.OPEN]: Object.values(SOURCE_TYPES),
};

// Known plugin/source classifications
const KNOWN_SOURCES = {
  // Official
  'community.tmdb': SOURCE_TYPES.AGGREGATOR,
  'tmdb': SOURCE_TYPES.AGGREGATOR,
  'netflix': SOURCE_TYPES.OFFICIAL,
  'disney': SOURCE_TYPES.OFFICIAL,
  'hbo': SOURCE_TYPES.OFFICIAL,
  'hulu': SOURCE_TYPES.OFFICIAL,
  'amazon': SOURCE_TYPES.OFFICIAL,
  'appletv': SOURCE_TYPES.OFFICIAL,
  'peacock': SOURCE_TYPES.OFFICIAL,
  'paramount': SOURCE_TYPES.OFFICIAL,
  'crunchyroll': SOURCE_TYPES.OFFICIAL,
  'youtube': SOURCE_TYPES.LEGAL_FREE,

  // Legal Free
  'community.publicdomain': SOURCE_TYPES.LEGAL_FREE,
  'archive.org': SOURCE_TYPES.LEGAL_FREE,
  'pluto': SOURCE_TYPES.LEGAL_FREE,
  'tubi': SOURCE_TYPES.LEGAL_FREE,
  'crackle': SOURCE_TYPES.LEGAL_FREE,
  'plex': SOURCE_TYPES.LEGAL_FREE,
  'imdbtv': SOURCE_TYPES.LEGAL_FREE,
  'kanopy': SOURCE_TYPES.LEGAL_FREE,

  // Debrid
  'realdebrid': SOURCE_TYPES.DEBRID,
  'premiumize': SOURCE_TYPES.DEBRID,
  'torbox': SOURCE_TYPES.DEBRID,
  'alldebrid': SOURCE_TYPES.DEBRID,
  'debridlink': SOURCE_TYPES.DEBRID,

  // Community / Mixed
  'thepiratebay': SOURCE_TYPES.COMMUNITY,
  'rarbg': SOURCE_TYPES.COMMUNITY,
  '1337x': SOURCE_TYPES.COMMUNITY,
  'yts': SOURCE_TYPES.COMMUNITY,
  'eztv': SOURCE_TYPES.COMMUNITY,
  'opensubtitles': SOURCE_TYPES.LEGAL_FREE,
};

export function classifySource(id, name = '', url = '') {
  const key = (id || '').toLowerCase();
  const n = (name || '').toLowerCase();
  const u = (url || '').toLowerCase();

  for (const [known, type] of Object.entries(KNOWN_SOURCES)) {
    if (key.includes(known) || n.includes(known) || u.includes(known)) {
      return type;
    }
  }

  // Heuristics
  if (u.includes('netflix') || u.includes('disney') || u.includes('hbo') || u.includes('hulu')) {
    return SOURCE_TYPES.OFFICIAL;
  }
  if (u.includes('real-debrid') || u.includes('premiumize') || u.includes('torbox') || u.includes('alldebrid')) {
    return SOURCE_TYPES.DEBRID;
  }
  if (u.includes('archive.org') || u.includes('publicdomain') || u.includes('pluto.tv') || u.includes('tubi')) {
    return SOURCE_TYPES.LEGAL_FREE;
  }
  if (u.includes('stremio') || u.includes('community') || u.includes('addon')) {
    return SOURCE_TYPES.COMMUNITY;
  }

  return SOURCE_TYPES.UNKNOWN;
}

export function getComplianceMode() {
  try {
    return localStorage.getItem('sb_compliance_mode') || COMPLIANCE_MODES.MODERATE;
  } catch {
    return COMPLIANCE_MODES.MODERATE;
  }
}

export function setComplianceMode(mode) {
  localStorage.setItem('sb_compliance_mode', mode);
}

export function isSourceAllowed(sourceType) {
  const mode = getComplianceMode();
  return MODE_FILTERS[mode]?.includes(sourceType) ?? true;
}

export function filterStreamsByCompliance(streams) {
  const mode = getComplianceMode();
  if (mode === COMPLIANCE_MODES.OPEN) return streams;
  const allowed = MODE_FILTERS[mode] || [];
  return streams.filter(s => allowed.includes(s.sourceType || SOURCE_TYPES.UNKNOWN));
}

export function getSourceMeta(sourceType) {
  return SOURCE_LABELS[sourceType] || SOURCE_LABELS[SOURCE_TYPES.UNKNOWN];
}

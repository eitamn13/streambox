const EPG_URL = 'https://corsproxy.io/?http://epg.streamstv.me/epg/guide-israel.xml.gz';
const EPG_CACHE_KEY = 'sb-epg-cache';
const EPG_CACHE_TIME = 6 * 60 * 60 * 1000; // 6 hours

function getCachedEPG() {
  try {
    const cached = JSON.parse(localStorage.getItem(EPG_CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.timestamp < EPG_CACHE_TIME) {
      return cached.data;
    }
  } catch {
    // ignore
  }
  return null;
}

function setCachedEPG(data) {
  try {
    localStorage.setItem(EPG_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // ignore
  }
}

async function decompressGzip(blob) {
  const ds = new DecompressionStream('gzip');
  const decompressed = blob.stream().pipeThrough(ds);
  const response = new Response(decompressed);
  return response.text();
}

function parseXMLTV(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  // Check for parse error
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse XMLTV');
  }

  const programs = [];
  const programmeElements = doc.querySelectorAll('programme');

  programmeElements.forEach((prog) => {
    const channelId = prog.getAttribute('channel');
    const start = parseXMLTVDate(prog.getAttribute('start'));
    const stop = parseXMLTVDate(prog.getAttribute('stop'));
    const titleEl = prog.querySelector('title');
    const title = titleEl ? titleEl.textContent.trim() : 'שידור חי';
    const descEl = prog.querySelector('desc');
    const description = descEl ? descEl.textContent.trim() : '';
    const categoryEl = prog.querySelector('category');
    const category = categoryEl ? categoryEl.textContent.trim() : '';

    if (channelId && start && stop) {
      programs.push({
        channelId,
        title,
        description,
        category,
        start,
        stop,
        isCurrent: false,
      });
    }
  });

  return programs;
}

function parseXMLTVDate(str) {
  if (!str || str.length < 14) return null;
  // XMLTV format: YYYYMMDDHHMMSS +timezone
  const year = parseInt(str.slice(0, 4), 10);
  const month = parseInt(str.slice(4, 6), 10) - 1;
  const day = parseInt(str.slice(6, 8), 10);
  const hour = parseInt(str.slice(8, 10), 10);
  const minute = parseInt(str.slice(10, 12), 10);
  const second = parseInt(str.slice(12, 14), 10);
  return new Date(year, month, day, hour, minute, second);
}

export async function fetchEPG() {
  const cached = getCachedEPG();
  if (cached) return cached;

  const response = await fetch(EPG_URL);
  if (!response.ok) {
    throw new Error(`EPG fetch failed: ${response.status}`);
  }

  const blob = await response.blob();
  const xmlText = await decompressGzip(blob);
  const programs = parseXMLTV(xmlText);

  setCachedEPG(programs);
  return programs;
}

export function getChannelEPG(programs, channelId, channelName) {
  if (!programs || !channelId) return [];

  const now = new Date();

  // Try exact channelId match first
  let channelPrograms = programs.filter((p) => p.channelId === channelId);

  // Fallback: fuzzy match by channel name
  if (channelPrograms.length === 0 && channelName) {
    const normalizedName = channelName.toLowerCase().replace(/[^\u0590-\u05FFa-z0-9]/g, '');
    channelPrograms = programs.filter((p) => {
      const normalizedId = p.channelId.toLowerCase().replace(/[^\u0590-\u05FFa-z0-9]/g, '');
      return normalizedId.includes(normalizedName) || normalizedName.includes(normalizedId);
    });
  }

  // Sort by start time
  channelPrograms.sort((a, b) => a.start - b.start);

  // Mark current program
  channelPrograms.forEach((p) => {
    p.isCurrent = now >= p.start && now < p.stop;
  });

  // Return current + next 3 + previous 2
  const currentIndex = channelPrograms.findIndex((p) => p.isCurrent);
  if (currentIndex === -1) {
    // No current program, return programs around now
    const aroundNow = channelPrograms.filter((p) => p.stop > now);
    return aroundNow.slice(0, 5);
  }

  const start = Math.max(0, currentIndex - 2);
  const end = Math.min(channelPrograms.length, currentIndex + 4);
  return channelPrograms.slice(start, end);
}

export function getCurrentProgram(programs, channelId, channelName) {
  const epg = getChannelEPG(programs, channelId, channelName);
  return epg.find((p) => p.isCurrent) || null;
}

export function formatEPGTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

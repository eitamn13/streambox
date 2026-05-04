// Premium Content Streaming API — Centralized Debrid Backend
// ===========================================================
// Chains: Real-Debrid (instant cache) → Direct fallback → Premiumize → TorBox
// Admin manages all keys. Users never see debrid.

import { createClient } from '@supabase/supabase-js';

const ADMIN_RD_KEY = process.env.ADMIN_RD_API_KEY || 'GSQ2DULH2E4SXZNDFQJBCYTZBL3HID3FVMBM7AOELFBAHEEIVLNQ';
const ADMIN_PM_KEY = process.env.ADMIN_PM_API_KEY || 'w8rwmnmj4yicdp74';
const ADMIN_TB_KEY = process.env.ADMIN_TB_API_KEY || '4a6beffa-7884-4983-9385-ab6a989a937d';

const VPS_API_URL = process.env.VPS_API_URL || 'https://streambox.one';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  try { return createClient(supabaseUrl, supabaseServiceKey); } catch { return null; }
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// ------------------------------------------------------------------
// Timeout helpers
// ------------------------------------------------------------------
function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

function withTimeout(promise, ms, label = 'operation') {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

function detectQuality(filename = '') {
  const f = filename.toLowerCase();
  if (f.includes('2160') || f.includes('4k') || f.includes('uhd')) return '4K';
  if (f.includes('1080')) return '1080p';
  if (f.includes('720')) return '720p';
  if (f.includes('480')) return '480p';
  return 'auto';
}

// ------------------------------------------------------------------
// Admin check — server-side only, cannot be bypassed from frontend
// ------------------------------------------------------------------
async function isAdminUser(supabase, user) {
  if (!user) return false;
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    if (data?.is_admin) return true;
  } catch (e) { /* ignore */ }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (data?.is_admin) return true;
  } catch (e) { /* ignore */ }
  return user.email?.includes('admin') || false;
}

// ------------------------------------------------------------------
// VPS Auth check (new backend)
// ------------------------------------------------------------------
async function checkVpsAuth(token) {
  try {
    const res = await fetch(`${VPS_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('[content] VPS auth check error:', e.message);
    return null;
  }
}

async function checkVpsSubscription(token) {
  try {
    const res = await fetch(`${VPS_API_URL}/api/payments/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('[content] VPS subscription check error:', e.message);
    return null;
  }
}

// ------------------------------------------------------------------
// Auth & Subscription check — VPS first, then Supabase fallback
// ------------------------------------------------------------------
async function checkSubscription(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, plan: 'free', status: 'none', reason: 'לא מחובר' };
  }

  const token = authHeader.slice(7);

  // 1. Try VPS auth (new backend)
  const vpsAuth = await checkVpsAuth(token);
  if (vpsAuth?.user) {
    const user = vpsAuth.user;
    const isAdmin = user.isAdmin || false;
    if (isAdmin) {
      return { ok: true, plan: 'premium', status: 'active', userId: user.id, isAdmin: true };
    }

    // Non-admin: check VPS subscription
    const vpsSub = await checkVpsSubscription(token);
    if (vpsSub) {
      const isActive = vpsSub.status === 'active' || vpsSub.status === 'trialing';
      if (!isActive) {
        return { ok: false, plan: vpsSub.plan || 'free', status: vpsSub.status || 'none', reason: 'נדרש מנוי פעיל' };
      }
      return { ok: true, plan: vpsSub.plan || 'premium', status: vpsSub.status, userId: user.id };
    }

    // If subscription check fails but auth is valid, allow anyway (frontend already gated)
    return { ok: true, plan: 'premium', status: 'active', userId: user.id };
  }

  // 2. Fallback to Supabase (legacy)
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: true, plan: 'premium', status: 'active' }; // Dev fallback
  }

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return { ok: false, plan: 'free', status: 'none', reason: 'סשן לא תקין' };
    }

    const isAdmin = await isAdminUser(supabase, user);
    if (isAdmin) {
      return { ok: true, plan: 'premium', status: 'active', userId: user.id, isAdmin: true };
    }

    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', user.id)
      .single();

    if (!sub && subError?.code === 'PGRST116') {
      try {
        const { data: userRow } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
        if (userRow?.is_admin) {
          return { ok: true, plan: 'premium', status: 'active', userId: user.id, isAdmin: true };
        }
      } catch (e) { /* ignore */ }
    }

    const isActive = sub?.status === 'active' || sub?.status === 'trialing';
    if (!isActive) {
      return { ok: false, plan: sub?.plan || 'free', status: sub?.status || 'none', reason: 'נדרש מנוי פעיל' };
    }

    return { ok: true, plan: sub.plan, status: sub.status, userId: user.id };
  } catch (e) {
    return { ok: false, plan: 'free', status: 'none', reason: 'שגיאת אימות' };
  }
}

// ------------------------------------------------------------------
// Torrent search — Torrentio + YTS (fast, 5s timeout each)
// ------------------------------------------------------------------
async function searchTorrentio(imdbId, type, season, episode) {
  if (!imdbId) return [];
  const cleanId = imdbId.toString().startsWith('tt') ? imdbId : `tt${imdbId}`;
  const url = type === 'series' && season && episode
    ? `https://torrentio.strem.fun/stream/series/${cleanId}:${season}:${episode}.json`
    : `https://torrentio.strem.fun/stream/movie/${cleanId}.json`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.streams || [])
      .filter(s => s.infoHash)
      .map(s => {
        const titleStr = s.title || s.name || '';
        const sizeMatch = titleStr.match(/💾\s*([\d.]+\s*(GB|MB))/i);
        return {
          infoHash: s.infoHash.toLowerCase(),
          title: s.name || titleStr.split('\n')[0] || 'Unknown',
          quality: detectQuality(titleStr),
          size: sizeMatch ? sizeMatch[1] : '?',
        };
      });
  } catch (e) {
    return [];
  }
}

async function searchYts(imdbId) {
  if (!imdbId) return [];
  const cleanId = imdbId.toString().startsWith('tt') ? imdbId : `tt${imdbId}`;
  const mirrors = [
    `https://yts.mx/api/v2/list_movies.json?query_term=${cleanId}&limit=5`,
  ];
  for (const url of mirrors) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(5000) });
      if (!res.ok) continue;
      const data = await res.json();
      const movies = data?.data?.movies || [];
      const results = [];
      for (const movie of movies) {
        for (const t of movie.torrents || []) {
          if (t.hash) {
            const q = t.quality || 'auto';
            results.push({
              infoHash: t.hash.toLowerCase(),
              title: `${movie.title_long || movie.title} [YTS ${q}]`,
              quality: q === '2160p' ? '4K' : q,
              size: t.size || '?',
            });
          }
        }
      }
      if (results.length > 0) return results;
    } catch { /* try next mirror */ }
  }
  return [];
}

// ------------------------------------------------------------------
// Real-Debrid — instant availability + stream (max 5s total)
// ------------------------------------------------------------------
async function checkRDAvailability(infoHash) {
  if (!ADMIN_RD_KEY) return false;
  try {
    const res = await fetch(
      `https://api.real-debrid.com/rest/1.0/torrents/instantAvailability/${infoHash}`,
      { headers: { Authorization: `Bearer ${ADMIN_RD_KEY}` }, signal: timeoutSignal(4000) }
    );
    if (!res.ok) return false;
    const data = await res.json();
    const hashData = data[infoHash.toUpperCase()] || data[infoHash.toLowerCase()];
    return hashData && hashData.rd && hashData.rd.length > 0;
  } catch { return false; }
}

async function getRDStream(infoHash, title) {
  if (!ADMIN_RD_KEY) return null;
  const magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`;
  const headers = { Authorization: `Bearer ${ADMIN_RD_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' };

  try {
    const addRes = await fetch('https://api.real-debrid.com/rest/1.0/torrents/addMagnet', {
      method: 'POST',
      headers,
      body: new URLSearchParams({ magnet }).toString(),
      signal: timeoutSignal(4000),
    });
    if (!addRes.ok) return null;
    const addData = await addRes.json();
    if (!addData.id) return null;

    const torrentId = addData.id;
    // Max 3 poll attempts = 3 seconds
    for (let i = 0; i < 3; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 1000));
      const infoRes = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
        headers: { Authorization: `Bearer ${ADMIN_RD_KEY}` },
        signal: timeoutSignal(4000),
      });
      if (!infoRes.ok) continue;
      const info = await infoRes.json();

      if (info.status === 'waiting_files_selection') {
        await fetch(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`, {
          method: 'POST', headers,
          body: new URLSearchParams({ files: 'all' }).toString(),
          signal: timeoutSignal(4000),
        });
      }

      if (info.status === 'downloaded' && info.links?.length > 0) {
        const streams = [];
        for (const link of info.links) {
          try {
            const unres = await fetch('https://api.real-debrid.com/rest/1.0/unrestrict/link', {
              method: 'POST', headers,
              body: new URLSearchParams({ link }).toString(),
              signal: timeoutSignal(4000),
            });
            if (!unres.ok) continue;
            const unresData = await unres.json();
            if (unresData.download) {
              streams.push({ url: unresData.download, title: unresData.filename || title, quality: detectQuality(unresData.filename), provider: 'Real-Debrid', type: 'direct' });
            }
          } catch { /* ignore */ }
        }
        return streams;
      }
      if (info.status === 'error') break;
    }
  } catch (e) {
    console.warn('[content] RD failed:', e.message);
  }
  return null;
}

// ------------------------------------------------------------------
// Premiumize — transfer + stream (max 5s total)
// ------------------------------------------------------------------
async function getPMStream(infoHash, title) {
  if (!ADMIN_PM_KEY) return null;
  const magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`;

  try {
    const createRes = await fetch('https://www.premiumize.me/api/transfer/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ apikey: ADMIN_PM_KEY, src: magnet }).toString(),
      signal: timeoutSignal(4000),
    });
    if (!createRes.ok) return null;
    const createData = await createRes.json();
    if (!createData.status || createData.status !== 'success') return null;

    for (let i = 0; i < 2; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 1000));
      const listRes = await fetch(
        `https://www.premiumize.me/api/transfer/list?apikey=${ADMIN_PM_KEY}`,
        { signal: timeoutSignal(4000) }
      );
      if (!listRes.ok) continue;
      const listData = await listRes.json();
      const transfers = listData.transfers || [];
      const match = transfers.find(t => t.src?.toLowerCase().includes(infoHash.toLowerCase()));

      if (match && match.status === 'finished') {
        const folderId = match.folder_id;
        if (!folderId) return null;
        const folderRes = await fetch(
          `https://www.premiumize.me/api/folder/list?id=${folderId}&apikey=${ADMIN_PM_KEY}`,
          { signal: timeoutSignal(4000) }
        );
        if (!folderRes.ok) continue;
        const folderData = await folderRes.json();
        const files = folderData.content || [];
        const video = files.find(f => f.name?.match(/\.(mp4|mkv|avi|mov)$/i));
        if (video && video.link) {
          return [{ url: video.link, title: video.name, quality: detectQuality(video.name), provider: 'Premiumize', type: 'direct' }];
        }
      }
      if (match && match.status === 'error') break;
    }
  } catch (e) {
    console.warn('[content] PM failed:', e.message);
  }
  return null;
}

// ------------------------------------------------------------------
// TorBox — torrent + stream (max 5s total)
// ------------------------------------------------------------------
async function getTBStream(infoHash, title) {
  if (!ADMIN_TB_KEY) return null;
  const magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`;

  try {
    const addRes = await fetch('https://api.torbox.app/v1/api/torrents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_TB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ magnet }),
      signal: timeoutSignal(4000),
    });
    if (!addRes.ok) return null;
    const addData = await addRes.json();
    const torrentId = addData?.data?.torrent_id || addData?.torrent_id;
    if (!torrentId) return null;

    for (let i = 0; i < 2; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 1000));
      const infoRes = await fetch(
        `https://api.torbox.app/v1/api/torrents/${torrentId}`,
        { headers: { Authorization: `Bearer ${ADMIN_TB_KEY}` }, signal: timeoutSignal(4000) }
      );
      if (!infoRes.ok) continue;
      const info = await infoRes.json();
      const t = info?.data || info;

      if (t.status === 'completed' || t.status === 'seeding') {
        const filesRes = await fetch(
          `https://api.torbox.app/v1/api/torrents/${torrentId}/files`,
          { headers: { Authorization: `Bearer ${ADMIN_TB_KEY}` }, signal: timeoutSignal(4000) }
        );
        if (!filesRes.ok) continue;
        const filesData = await filesRes.json();
        const files = filesData?.data || filesData?.files || [];
        const video = files.find(f => f.name?.match(/\.(mp4|mkv|avi|mov)$/i));
        if (video) {
          const dlRes = await fetch(
            `https://api.torbox.app/v1/api/torrents/${torrentId}/download/${video.id}`,
            { headers: { Authorization: `Bearer ${ADMIN_TB_KEY}` }, signal: timeoutSignal(4000) }
          );
          if (!dlRes.ok) continue;
          const dlData = await dlRes.json();
          if (dlData?.data?.url || dlData?.url) {
            return [{ url: dlData.data?.url || dlData.url, title: video.name, quality: detectQuality(video.name), provider: 'TorBox', type: 'direct' }];
          }
        }
      }
      if (t.status === 'failed' || t.status === 'error') break;
    }
  } catch (e) {
    console.warn('[content] TB failed:', e.message);
  }
  return null;
}

// ------------------------------------------------------------------
// Direct fallback — magnet + DHT web seeds (instant, no debrid needed)
// ------------------------------------------------------------------
function getDirectStreams(torrent) {
  const { infoHash, title, quality, size } = torrent;
  if (!infoHash) return [];

  const encodedTitle = encodeURIComponent(title || 'video');
  const magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodedTitle}`;

  const trackers = [
    'udp://tracker.openbittorrent.com:80',
    'udp://tracker.opentrackr.org:1337',
    'udp://tracker.leechers-paradise.org:6969',
    'udp://tracker.coppersurfer.tk:6969',
    'udp://open.demonii.com:1337',
  ];

  const magnetWithTrackers = magnet + trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');

  return [
    {
      url: magnetWithTrackers,
      title: title || 'Magnet link',
      quality: quality || 'auto',
      size: size || '?',
      provider: 'Direct (Magnet)',
      type: 'magnet',
      sourceType: 'direct',
      infoHash,
      service: 'direct',
    },
    {
      url: `https://itorrents.org/torrent/${infoHash.toUpperCase()}.torrent`,
      title: `${title || 'Torrent'} [.torrent]`,
      quality: quality || 'auto',
      size: size || '?',
      provider: 'Direct (.torrent)',
      type: 'torrent',
      sourceType: 'direct',
      infoHash,
      service: 'direct',
    },
  ];
}

// ------------------------------------------------------------------
// Multi-debrid stream resolver — RD (instant cache) → Direct → PM → TB
// Each provider limited to 5s max via withTimeout
// ------------------------------------------------------------------
async function resolveStream(torrent, usedProviders) {
  const { infoHash, title } = torrent;
  const streams = [];

  // 1. Real-Debrid (instant cache check first, then fast add)
  if (ADMIN_RD_KEY && !usedProviders.has('rd')) {
    try {
      const isAvailable = await withTimeout(checkRDAvailability(infoHash), 4000, 'RD availability');
      console.log(`[content] RD availability for ${infoHash.substring(0, 12)}:`, isAvailable);

      if (isAvailable) {
        const rdStreams = await withTimeout(getRDStream(infoHash, title), 5000, 'RD stream');
        if (rdStreams && rdStreams.length > 0) {
          for (const s of rdStreams) {
            streams.push({ ...s, quality: torrent.quality, size: torrent.size, sourceType: 'debrid', infoHash, service: 'rd' });
          }
          usedProviders.add('rd');
          return streams;
        }
      }
      const rdStreams = await withTimeout(getRDStream(infoHash, title), 5000, 'RD stream (non-cached)');
      if (rdStreams && rdStreams.length > 0) {
        for (const s of rdStreams) {
          streams.push({ ...s, quality: torrent.quality, size: torrent.size, sourceType: 'debrid', infoHash, service: 'rd' });
        }
        usedProviders.add('rd');
        return streams;
      }
    } catch (e) {
      console.warn('[content] RD timeout/error:', e.message);
    }
  }

  // 2. Direct fallback (instant — no debrid needed)
  if (!usedProviders.has('direct')) {
    const direct = getDirectStreams(torrent);
    if (direct.length > 0) {
      streams.push(...direct);
      usedProviders.add('direct');
      return streams;
    }
  }

  // 3. Premiumize
  if (ADMIN_PM_KEY && !usedProviders.has('pm')) {
    try {
      const pmStreams = await withTimeout(getPMStream(infoHash, title), 5000, 'PM stream');
      if (pmStreams && pmStreams.length > 0) {
        for (const s of pmStreams) {
          streams.push({ ...s, quality: torrent.quality, size: torrent.size, sourceType: 'debrid', infoHash, service: 'pm' });
        }
        usedProviders.add('pm');
        return streams;
      }
    } catch (e) {
      console.warn('[content] PM timeout/error:', e.message);
    }
  }

  // 4. TorBox
  if (ADMIN_TB_KEY && !usedProviders.has('tb')) {
    try {
      const tbStreams = await withTimeout(getTBStream(infoHash, title), 5000, 'TB stream');
      if (tbStreams && tbStreams.length > 0) {
        for (const s of tbStreams) {
          streams.push({ ...s, quality: torrent.quality, size: torrent.size, sourceType: 'debrid', infoHash, service: 'tb' });
        }
        usedProviders.add('tb');
        return streams;
      }
    } catch (e) {
      console.warn('[content] TB timeout/error:', e.message);
    }
  }

  return null;
}

// ------------------------------------------------------------------
// Main handler — global 15s timeout, fast fail
// ------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { imdbId, type, season, episode, title } = req.query;

  // 1. Check subscription
  const subCheck = await checkSubscription(req);
  if (!subCheck.ok) {
    return res.status(403).json({
      error: 'Subscription required',
      message: subCheck.reason,
      redirect: '/subscription',
      count: 0,
      streams: [],
    });
  }

  if (!imdbId && !title) {
    return res.status(400).json({ error: 'Missing imdbId or title' });
  }

  const searchTitle = title || '';
  console.log(`[content] ${imdbId || '-'} "${searchTitle}" ${type || 'movie'} S${season || '-'}E${episode || '-'} plan=${subCheck.plan}`);

  // 2. Search torrents (parallel, 5s timeout each)
  const [torrentioResults, ytsResults] = await Promise.all([
    withTimeout(searchTorrentio(imdbId, type, season, episode), 5000, 'Torrentio'),
    type !== 'series' ? withTimeout(searchYts(imdbId), 5000, 'YTS') : Promise.resolve([]),
  ]).catch(() => [[], []]);

  // Merge and filter by quality + reject XviD
  const allowedQualities = new Set(['4K', '1080p']);
  let allTorrents = [...torrentioResults, ...ytsResults];
  
  // Reject XviD explicitly
  allTorrents = allTorrents.filter(t => {
    const lowerTitle = (t.title || '').toLowerCase();
    return !lowerTitle.includes('xvid');
  });

  // Filter to 4K/1080p only
  const filteredTorrents = allTorrents.filter(t => allowedQualities.has(t.quality));
  // If no high-quality torrents found, fallback to any quality (except XviD already filtered)
  const finalTorrents = filteredTorrents.length > 0 ? filteredTorrents : allTorrents;

  console.log(`[content] Torrents: ${finalTorrents.length} (after quality+XviD filter)`);

  // 3. Resolve streams via debrid chain — each torrent gets max 5s
  const streams = [];
  const checkedHashes = new Set();
  const usedProviders = new Set();

  for (const torrent of finalTorrents.slice(0, 6)) {
    if (checkedHashes.has(torrent.infoHash)) continue;
    checkedHashes.add(torrent.infoHash);

    try {
      const resolved = await withTimeout(resolveStream(torrent, usedProviders), 5000, 'resolveStream');
      if (resolved && resolved.length > 0) {
        streams.push(...resolved);
        // Continue trying other hashes for backup streams
      }
    } catch (e) {
      console.warn('[content] resolveStream timeout for', torrent.infoHash.substring(0, 12));
    }
  }

  // 4. Sort by quality (debrid first, then direct)
  const qualityOrder = { '4K': 4, '2160p': 4, '1080p': 3, '720p': 2, '480p': 1, 'auto': 0 };
  const sourceOrder = { debrid: 0, direct: 1 };
  streams.sort((a, b) => {
    const srcDiff = (sourceOrder[a.sourceType] || 0) - (sourceOrder[b.sourceType] || 0);
    if (srcDiff !== 0) return srcDiff;
    return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
  });

  console.log(`[content] Returning ${streams.length} streams`);

  // 5. Validate URLs are present
  const validStreams = streams.filter(s => s.url && s.url.length > 10);

  // 6. If no streams found, return clear error
  if (validStreams.length === 0) {
    return res.status(200).json({
      imdbId: imdbId || null,
      type: type || 'movie',
      season,
      episode,
      plan: subCheck.plan,
      count: 0,
      streams: [],
      error: 'לא נמצאו מקורות זמינים',
      message: 'לא נמצאו מקורות לסרט זה. נסה שוב מאוחר יותר או בדוק את חיבור ה-Debrid.',
    });
  }

  res.status(200).json({
    imdbId: imdbId || null,
    type: type || 'movie',
    season,
    episode,
    plan: subCheck.plan,
    count: validStreams.length,
    streams: validStreams.slice(0, 10),
  });
}

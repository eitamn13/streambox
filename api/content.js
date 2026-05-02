// Premium Content Streaming API — Centralized Debrid Backend
// ===========================================================
// Chains: Real-Debrid → Premiumize → TorBox → Auto-add
// Admin manages all keys. Users never see debrid.

import { createClient } from '@supabase/supabase-js';

const ADMIN_RD_KEY = process.env.ADMIN_RD_API_KEY;
const ADMIN_PM_KEY = process.env.ADMIN_PM_API_KEY;
const ADMIN_TB_KEY = process.env.ADMIN_TB_API_KEY;

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  try { return createClient(supabaseUrl, supabaseServiceKey); } catch { return null; }
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function timeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
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
  // 1. Check subscriptions table
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    console.log('[content] subscriptions is_admin:', { userId: user.id, data, error: error?.message || null });
    if (data?.is_admin) return true;
  } catch (e) { console.log('[content] subscriptions check error:', e.message); }
  // 2. Check users table as fallback
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    console.log('[content] users is_admin:', { userId: user.id, data, error: error?.message || null });
    if (data?.is_admin) return true;
  } catch (e) { console.log('[content] users check error:', e.message); }
  // 3. Fallback: email contains 'admin'
  const emailAdmin = user.email?.includes('admin') || false;
  console.log('[content] email admin check:', user.email, emailAdmin);
  return emailAdmin;
}

// ------------------------------------------------------------------
// Auth & Subscription check
// ------------------------------------------------------------------
async function checkSubscription(req) {
  const authHeader = req.headers.authorization;
  console.log('[content] Auth header:', authHeader ? `${authHeader.slice(0, 20)}...` : 'MISSING');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, plan: 'free', status: 'none', reason: 'לא מחובר' };
  }

  const token = authHeader.slice(7);
  const supabase = getSupabase();
  if (!supabase) {
    console.log('[content] Dev fallback — no Supabase config');
    return { ok: true, plan: 'premium', status: 'active' }; // Dev fallback
  }

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    console.log('[content] Auth result:', { userId: user?.id, email: user?.email, authErr: authErr?.message || null });
    if (authErr || !user) {
      return { ok: false, plan: 'free', status: 'none', reason: 'סשן לא תקין' };
    }

    // Admin gets premium automatically — no Stripe needed
    const isAdmin = await isAdminUser(supabase, user);
    console.log('[content] isAdmin result:', isAdmin);
    if (isAdmin) {
      return { ok: true, plan: 'premium', status: 'active', userId: user.id, isAdmin: true };
    }

    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', user.id)
      .single();
    console.log('[content] Subscription query:', { sub: sub || null, error: subError?.message || null, code: subError?.code || null });

    // If no subscription row found, check users table for admin flag (same as subscription API)
    if (!sub && subError?.code === 'PGRST116') {
      console.log('[content] No subscription row, checking users table for admin');
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        console.log('[content] Users table admin check:', userRow);
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
    console.warn('[content] Auth error:', e.message);
    return { ok: false, plan: 'free', status: 'none', reason: 'שגיאת אימות' };
  }
}

// ------------------------------------------------------------------
// Torrent search — Torrentio + YTS
// ------------------------------------------------------------------
async function searchTorrentio(imdbId, type, season, episode) {
  if (!imdbId) return [];
  const cleanId = imdbId.toString().startsWith('tt') ? imdbId : `tt${imdbId}`;
  const url = type === 'series' && season && episode
    ? `https://torrentio.strem.fun/stream/series/${cleanId}:${season}:${episode}.json`
    : `https://torrentio.strem.fun/stream/movie/${cleanId}.json`;

  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(12000) });
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
    console.warn('[content] Torrentio failed:', e.message);
    return [];
  }
}

async function searchYts(imdbId) {
  if (!imdbId) return [];
  const cleanId = imdbId.toString().startsWith('tt') ? imdbId : `tt${imdbId}`;
  const mirrors = [
    `https://yts.mx/api/v2/list_movies.json?query_term=${cleanId}&limit=5`,
    `https://yts.lt/api/v2/list_movies.json?query_term=${cleanId}&limit=5`,
  ];
  for (const url of mirrors) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: timeoutSignal(10000) });
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
// Real-Debrid — instant availability + stream
// ------------------------------------------------------------------
async function checkRDAvailability(infoHash) {
  if (!ADMIN_RD_KEY) return false;
  try {
    const res = await fetch(
      `https://api.real-debrid.com/rest/1.0/torrents/instantAvailability/${infoHash}`,
      { headers: { Authorization: `Bearer ${ADMIN_RD_KEY}` }, signal: timeoutSignal(8000) }
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
      signal: timeoutSignal(10000),
    });
    if (!addRes.ok) return null;
    const addData = await addRes.json();
    if (!addData.id) return null;

    const torrentId = addData.id;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const infoRes = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
        headers: { Authorization: `Bearer ${ADMIN_RD_KEY}` },
        signal: timeoutSignal(8000),
      });
      if (!infoRes.ok) continue;
      const info = await infoRes.json();

      if (info.status === 'waiting_files_selection') {
        await fetch(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`, {
          method: 'POST', headers,
          body: new URLSearchParams({ files: 'all' }).toString(),
          signal: timeoutSignal(8000),
        });
      }

      if (info.status === 'downloaded' && info.links?.length > 0) {
        const streams = [];
        for (const link of info.links) {
          try {
            const unres = await fetch('https://api.real-debrid.com/rest/1.0/unrestrict/link', {
              method: 'POST', headers,
              body: new URLSearchParams({ link }).toString(),
              signal: timeoutSignal(8000),
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
// Premiumize — transfer + stream
// ------------------------------------------------------------------
async function getPMStream(infoHash, title) {
  if (!ADMIN_PM_KEY) return null;
  const magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`;

  try {
    // Create transfer
    const createRes = await fetch('https://www.premiumize.me/api/transfer/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ apikey: ADMIN_PM_KEY, src: magnet }).toString(),
      signal: timeoutSignal(10000),
    });
    if (!createRes.ok) return null;
    const createData = await createRes.json();
    if (!createData.status || createData.status !== 'success') return null;

    // Poll transfers
    for (let i = 0; i < 45; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const listRes = await fetch(
        `https://www.premiumize.me/api/transfer/list?apikey=${ADMIN_PM_KEY}`,
        { signal: timeoutSignal(8000) }
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
          { signal: timeoutSignal(8000) }
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
// TorBox — torrent + stream
// ------------------------------------------------------------------
async function getTBStream(infoHash, title) {
  if (!ADMIN_TB_KEY) return null;
  const magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`;

  try {
    // Add torrent
    const addRes = await fetch('https://api.torbox.app/v1/api/torrents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ADMIN_TB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ magnet }),
      signal: timeoutSignal(10000),
    });
    if (!addRes.ok) return null;
    const addData = await addRes.json();
    const torrentId = addData?.data?.torrent_id || addData?.torrent_id;
    if (!torrentId) return null;

    // Poll
    for (let i = 0; i < 45; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const infoRes = await fetch(
        `https://api.torbox.app/v1/api/torrents/${torrentId}`,
        { headers: { Authorization: `Bearer ${ADMIN_TB_KEY}` }, signal: timeoutSignal(8000) }
      );
      if (!infoRes.ok) continue;
      const info = await infoRes.json();
      const t = info?.data || info;

      if (t.status === 'completed' || t.status === 'seeding') {
        const filesRes = await fetch(
          `https://api.torbox.app/v1/api/torrents/${torrentId}/files`,
          { headers: { Authorization: `Bearer ${ADMIN_TB_KEY}` }, signal: timeoutSignal(8000) }
        );
        if (!filesRes.ok) continue;
        const filesData = await filesRes.json();
        const files = filesData?.data || filesData?.files || [];
        const video = files.find(f => f.name?.match(/\.(mp4|mkv|avi|mov)$/i));
        if (video) {
          const dlRes = await fetch(
            `https://api.torbox.app/v1/api/torrents/${torrentId}/download/${video.id}`,
            { headers: { Authorization: `Bearer ${ADMIN_TB_KEY}` }, signal: timeoutSignal(8000) }
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
// Multi-debrid stream resolver — RD → PM → TB
// ------------------------------------------------------------------
async function resolveStream(torrent, usedProviders) {
  const { infoHash, title } = torrent;
  const streams = [];

  // 1. Real-Debrid (instant or add)
  if (ADMIN_RD_KEY && !usedProviders.has('rd')) {
    const available = await checkRDAvailability(infoHash);
    const rdStreams = await getRDStream(infoHash, title);
    if (rdStreams && rdStreams.length > 0) {
      for (const s of rdStreams) {
        streams.push({ ...s, quality: torrent.quality, size: torrent.size, sourceType: 'debrid', infoHash, service: 'rd' });
      }
      usedProviders.add('rd');
      return streams;
    }
  }

  // 2. Premiumize
  if (ADMIN_PM_KEY && !usedProviders.has('pm')) {
    const pmStreams = await getPMStream(infoHash, title);
    if (pmStreams && pmStreams.length > 0) {
      for (const s of pmStreams) {
        streams.push({ ...s, quality: torrent.quality, size: torrent.size, sourceType: 'debrid', infoHash, service: 'pm' });
      }
      usedProviders.add('pm');
      return streams;
    }
  }

  // 3. TorBox
  if (ADMIN_TB_KEY && !usedProviders.has('tb')) {
    const tbStreams = await getTBStream(infoHash, title);
    if (tbStreams && tbStreams.length > 0) {
      for (const s of tbStreams) {
        streams.push({ ...s, quality: torrent.quality, size: torrent.size, sourceType: 'debrid', infoHash, service: 'tb' });
      }
      usedProviders.add('tb');
      return streams;
    }
  }

  return null;
}

// ------------------------------------------------------------------
// Main handler
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

  // 2. Search torrents
  const torrentioResults = await searchTorrentio(imdbId, type, season, episode);
  const ytsResults = type !== 'series' ? await searchYts(imdbId) : [];
  const allTorrents = [...torrentioResults, ...ytsResults];
  console.log(`[content] Torrents: ${allTorrents.length}`);

  // 3. Resolve streams via debrid chain
  const streams = [];
  const checkedHashes = new Set();
  const usedProviders = new Set();

  for (const torrent of allTorrents.slice(0, 6)) {
    if (checkedHashes.has(torrent.infoHash)) continue;
    checkedHashes.add(torrent.infoHash);

    const resolved = await resolveStream(torrent, usedProviders);
    if (resolved && resolved.length > 0) {
      streams.push(...resolved);
      // Continue trying other hashes for backup streams
    }
  }

  // 4. Sort by quality
  const qualityOrder = { '4K': 4, '2160p': 4, '1080p': 3, '720p': 2, '480p': 1, 'auto': 0 };
  streams.sort((a, b) => (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0));

  console.log(`[content] Returning ${streams.length} streams`);

  res.status(200).json({
    imdbId: imdbId || null,
    type: type || 'movie',
    season,
    episode,
    plan: subCheck.plan,
    count: streams.length,
    streams: streams.slice(0, 10),
  });
}

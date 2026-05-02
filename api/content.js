// Content Streaming API — One-click Netflix-style playback
// Admin manages Debrid keys, customers never see them
// ========================================================

import { createClient } from '@supabase/supabase-js';

const ADMIN_RD_KEY = process.env.ADMIN_RD_API_KEY;
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
// 1. Search Torrentio for streams by IMDB ID
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

// ------------------------------------------------------------------
// 2. Search YTS for movies (guaranteed 720p/1080p)
// ------------------------------------------------------------------
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
    } catch (e) {
      console.warn('[content] YTS failed:', e.message);
    }
  }
  return [];
}

// ------------------------------------------------------------------
// 3. Check Real-Debrid instant availability
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
  } catch (e) {
    return false;
  }
}

// ------------------------------------------------------------------
// 4. Add magnet to RD, select files, unrestrict
// ------------------------------------------------------------------
async function getRDStream(infoHash, title) {
  if (!ADMIN_RD_KEY) return null;

  const magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`;
  const headers = { Authorization: `Bearer ${ADMIN_RD_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' };

  try {
    // Add magnet
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

    // Poll for ready (max 60s)
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
          method: 'POST',
          headers,
          body: new URLSearchParams({ files: 'all' }).toString(),
          signal: timeoutSignal(8000),
        });
      }

      if (info.status === 'downloaded' && info.links?.length > 0) {
        // Unrestrict all links
        const streams = [];
        for (const link of info.links) {
          try {
            const unres = await fetch('https://api.real-debrid.com/rest/1.0/unrestrict/link', {
              method: 'POST',
              headers,
              body: new URLSearchParams({ link }).toString(),
              signal: timeoutSignal(8000),
            });
            if (!unres.ok) continue;
            const unresData = await unres.json();
            if (unresData.download) {
              streams.push({
                url: unresData.download,
                title: unresData.filename || title,
                quality: detectQuality(unresData.filename),
                provider: 'Real-Debrid',
                type: 'direct',
              });
            }
          } catch { /* ignore */ }
        }
        return streams;
      }

      if (info.status === 'error') break;
    }
  } catch (e) {
    console.warn('[content] RD stream failed:', e.message);
  }
  return null;
}

// ------------------------------------------------------------------
// Main handler
// ------------------------------------------------------------------
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { imdbId, type, season, episode } = req.query;
  if (!imdbId) return res.status(400).json({ error: 'Missing imdbId' });

  if (!ADMIN_RD_KEY) {
    return res.status(500).json({ error: 'Admin Debrid not configured' });
  }

  // Optional: verify user subscription
  const authHeader = req.headers.authorization;
  let plan = 'free';
  if (authHeader?.startsWith('Bearer ') && getSupabase()) {
    try {
      const token = authHeader.slice(7);
      const { data: { user } } = await getSupabase().auth.getUser(token);
      if (user) {
        const { data: sub } = await getSupabase()
          .from('subscriptions')
          .select('plan, status')
          .eq('user_id', user.id)
          .single();
        if (sub?.status === 'active' || sub?.status === 'trialing') plan = sub.plan;
      }
    } catch { /* ignore auth errors, fall back to free */ }
  }

  console.log(`[content] Request: ${imdbId} ${type} S${season || '-'}E${episode || '-'} plan=${plan}`);

  // 1. Search Torrentio + YTS (movies only)
  const torrentioResults = await searchTorrentio(imdbId, type, season, episode);
  const ytsResults = type !== 'series' ? await searchYts(imdbId) : [];
  const allResults = [...torrentioResults, ...ytsResults];
  console.log(`[content] Torrentio: ${torrentioResults.length}, YTS: ${ytsResults.length}, total: ${allResults.length}`);

  // 2. Check availability and get streams
  const streams = [];
  const checked = new Set();

  for (const result of allResults.slice(0, 8)) {
    if (checked.has(result.infoHash)) continue;
    checked.add(result.infoHash);

    const available = await checkRDAvailability(result.infoHash);
    console.log(`[content] ${result.infoHash} available: ${available}`);

    if (available) {
      const rdStreams = await getRDStream(result.infoHash, result.title);
      if (rdStreams && rdStreams.length > 0) {
        for (const s of rdStreams) {
          streams.push({
            ...s,
            quality: result.quality,
            size: result.size,
            sourceType: 'debrid',
            infoHash: result.infoHash,
          });
        }
      }
    }
  }

  // Sort by quality
  const qualityOrder = { '4K': 4, '2160p': 4, '1080p': 3, '720p': 2, '480p': 1, 'auto': 0 };
  streams.sort((a, b) => (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0));

  console.log(`[content] Returning ${streams.length} streams`);

  res.status(200).json({
    imdbId,
    type,
    season,
    episode,
    plan,
    count: streams.length,
    streams: streams.slice(0, 5),
  });
}

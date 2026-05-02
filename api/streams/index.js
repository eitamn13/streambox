// Stream Resolver - Aggregates real video sources
// =================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id, type, title, year, tmdb_id } = req.query;
  if (!id || !type) return res.status(400).json({ error: 'Missing id or type' });

  const streams = [];

  // 1. Archive.org search (public domain / creative commons)
  if (title) {
    try {
      const searchQuery = encodeURIComponent(`${title} ${year || ''}`);
      const archiveRes = await fetch(
        `https://archive.org/advancedsearch.php?q=title:(${searchQuery})+AND+mediatype:movies&output=json&rows=3`,
        { headers: { 'User-Agent': 'StreamBox/1.0' } }
      );
      if (archiveRes.ok) {
        const data = await archiveRes.json();
        for (const doc of (data.response?.docs || []).slice(0, 2)) {
          const metaRes = await fetch(`https://archive.org/metadata/${doc.identifier}`, {
            headers: { 'User-Agent': 'StreamBox/1.0' },
          });
          if (metaRes.ok) {
            const meta = await metaRes.json();
            const videoFile = (meta.files || []).find(f =>
              f.name.endsWith('.mp4') && f.size > 10 * 1024 * 1024 // > 10MB to avoid thumbnails
            ) || (meta.files || []).find(f => f.name.endsWith('.mp4'));
            if (videoFile && videoFile.size > 1024 * 1024) { // > 1MB
              streams.push({
                url: `https://archive.org/download/${doc.identifier}/${videoFile.name}`,
                title: doc.title || 'Archive.org',
                quality: videoFile.name.match(/1080/) ? '1080p' : videoFile.name.match(/720/) ? '720p' : '480p',
                provider: 'Archive.org',
                type: 'direct',
                sourceType: 'legal_free',
                info: ['Public Domain / Creative Commons'],
              });
            }
          }
        }
      }
    } catch (e) { console.warn('Archive fetch failed:', e.message); }
  }

  // 2. YouTube trailers via Invidious
  if (title) {
    const instances = [
      'https://vid.puffyan.us',
      'https://inv.riverside.rocks',
      'https://y.com.sb',
    ];
    for (const instance of instances) {
      try {
        const ytRes = await fetch(
          `${instance}/api/v1/search?q=${encodeURIComponent(`${title} ${year || ''} trailer`)}&type=video`,
          { headers: { 'User-Agent': 'StreamBox/1.0' } }
        );
        if (!ytRes.ok) continue;
        const ytData = await ytRes.json();
        const videos = (Array.isArray(ytData) ? ytData : []).slice(0, 2);
        for (const v of videos) {
          if (v.lengthSeconds > 30 && v.lengthSeconds < 600) { // 30s - 10min
            streams.push({
              url: `https://www.youtube.com/embed/${v.videoId}`,
              title: `Trailer: ${v.title}`,
              quality: '720p',
              provider: 'YouTube',
              type: 'link',
              sourceType: 'legal_free',
              info: ['Official Trailer'],
            });
          }
        }
        break; // Stop after first successful instance
      } catch (e) { /* try next instance */ }
    }
  }

  // 3. TMDB Videos (trailers)
  if (tmdb_id) {
    try {
      const tmdbType = type === 'tv' ? 'tv' : 'movie';
      const tmdbRes = await fetch(
        `https://api.themoviedb.org/3/${tmdbType}/${tmdb_id}/videos?api_key=${process.env.VITE_TMDB_API_KEY || ''}`,
        { headers: { 'User-Agent': 'StreamBox/1.0' } }
      );
      if (tmdbRes.ok) {
        const tmdbData = await tmdbRes.json();
        const trailers = (tmdbData.results || [])
          .filter(v => v.site === 'YouTube' && v.type === 'Trailer')
          .slice(0, 2);
        for (const t of trailers) {
          streams.push({
            url: `https://www.youtube.com/embed/${t.key}`,
            title: `TMDB Trailer: ${t.name}`,
            quality: '720p',
            provider: 'TMDB / YouTube',
            type: 'link',
            sourceType: 'legal_free',
            info: ['Official Trailer'],
          });
        }
      }
    } catch (e) { console.warn('TMDB videos fetch failed:', e.message); }
  }

  res.status(200).json({ streams });
}

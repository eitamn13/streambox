import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Inline API handlers for dev mode
async function handleApiDebrid(req, res) {
  const serviceMatch = req.url.match(/^\/api\/debrid\/(rd|pm|tb)(.*)$/);
  if (!serviceMatch) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Unknown service' }));
    return;
  }

  const [, service, path] = serviceMatch;

  const SERVICE_CONFIG = {
    rd: { baseUrl: 'https://api.real-debrid.com/rest/1.0', authHeader: (k) => ({ 'Authorization': `Bearer ${k}` }) },
    pm: { baseUrl: 'https://www.premiumize.me/api', authHeader: (k) => ({ 'Authorization': `Bearer ${k}` }) },
    tb: { baseUrl: 'https://api.torbox.app/v1/api', authHeader: (k) => ({ 'Authorization': `Bearer ${k}` }) },
  };

  const config = SERVICE_CONFIG[service];
  const apiKey = req.headers['x-debrid-key'];

  if (!apiKey) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'API key required' }));
    return;
  }

  try {
    const cleanPath = path.split('?')[0];
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
    const targetUrl = `${config.baseUrl}${cleanPath}${queryString ? '?' + queryString : ''}`;
    const fetchOptions = {
      method: req.method,
      headers: { ...config.authHeader(apiKey) },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(req.body)) {
        if (k !== 'apiKey') params.append(k, String(v));
      }
      fetchOptions.body = params.toString();
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => null);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: response.ok, status: response.status, data }));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Proxy failed', message: error.message }));
  }
}

async function handleApiProxy(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const targetUrl = url.searchParams.get('url');
  if (!targetUrl) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Missing url parameter' }));
    return;
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: { 'User-Agent': 'StreamBox/1.0' },
    };
    if (req.headers.authorization) fetchOptions.headers['Authorization'] = req.headers.authorization;

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.statusCode = response.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    } else {
      const text = await response.text();
      res.statusCode = response.status;
      res.setHeader('Content-Type', contentType || 'text/plain');
      res.end(text);
    }
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Proxy failed', message: error.message }));
  }
}

async function handleApiStreams(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  // eslint-disable-next-line no-unused-vars
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type');
  const title = url.searchParams.get('title');
  const year = url.searchParams.get('year');
  const tmdb_id = url.searchParams.get('tmdb_id');

  const streams = [];

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
              f.name.endsWith('.mp4') && f.size > 10 * 1024 * 1024
            ) || (meta.files || []).find(f => f.name.endsWith('.mp4'));
            if (videoFile && videoFile.size > 1024 * 1024) {
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
          if (v.lengthSeconds > 30 && v.lengthSeconds < 600) {
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
        break;
      } catch { /* try next instance */ }
    }
  }

  if (tmdb_id) {
    try {
      const tmdbType = type === 'tv' ? 'tv' : 'movie';
      const tmdbRes = await fetch(
        `https://api.themoviedb.org/3/${tmdbType}/${tmdb_id}/videos?api_key=${process.env.VITE_TMDB_API_KEY || ''}`, // eslint-disable-line no-undef
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

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ streams }));
}

async function handleApiAddonManifest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const addonUrl = url.searchParams.get('url');
  if (!addonUrl) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Missing url parameter' }));
    return;
  }

  try {
    const manifestUrl = addonUrl.endsWith('/manifest.json') ? addonUrl : `${addonUrl.replace(/\/$/, '')}/manifest.json`;
    const response = await fetch(manifestUrl, {
      headers: { 'User-Agent': 'StreamBox/1.0', 'Accept': 'application/json' },
    });

    if (!response.ok) {
      res.statusCode = response.status;
      res.end(JSON.stringify({ error: 'Failed to fetch manifest', status: response.status }));
      return;
    }

    const manifest = await response.json();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      id: manifest.id,
      name: manifest.name,
      version: manifest.version || '1.0.0',
      description: manifest.description || '',
      resources: manifest.resources || [],
      types: manifest.types || ['movie', 'series'],
      catalogs: manifest.catalogs || [],
      behaviorHints: manifest.behaviorHints || {},
      logo: manifest.logo || null,
      background: manifest.background || null,
      url: addonUrl.replace(/\/$/, ''),
    }));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Manifest fetch failed', message: error.message }));
  }
}

const apiMiddleware = () => ({
  name: 'api-middleware',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url.startsWith('/api/debrid/')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Debrid-Key');
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        let body = {};
        if (req.method === 'POST' || req.method === 'PUT') {
          try {
            const chunks = [];
            req.on('data', chunk => chunks.push(chunk));
            await new Promise((resolve) => req.on('end', resolve));
            const raw = Buffer.concat(chunks).toString('utf8'); // eslint-disable-line no-undef
            if (raw) body = JSON.parse(raw);
          } catch { /* ignore parse errors */ }
        }
        req.body = body;
        await handleApiDebrid(req, res);
        return;
      }

      if (req.url.startsWith('/api/proxy')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }
        await handleApiProxy(req, res);
        return;
      }

      if (req.url.startsWith('/api/streams')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }
        await handleApiStreams(req, res);
        return;
      }

      if (req.url.startsWith('/api/addon/manifest')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }
        await handleApiAddonManifest(req, res);
        return;
      }

      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), apiMiddleware()],
  server: {
    port: 3000,
    host: true,
  },
});

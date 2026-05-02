export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  try {
    const manifestUrl = url.endsWith('/manifest.json') ? url : `${url.replace(/\/$/, '')}/manifest.json`;
    const response = await fetch(manifestUrl, {
      headers: { 'User-Agent': 'StreamBox/1.0', 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch manifest', status: response.status, url: manifestUrl });
    }

    const manifest = await response.json();
    if (!manifest.id || !manifest.name) {
      return res.status(400).json({ error: 'Invalid manifest: missing id or name' });
    }

    res.status(200).json({
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
      url: url.replace(/\/$/, ''),
    });
  } catch (error) {
    res.status(500).json({ error: 'Manifest fetch failed', message: error.message });
  }
}

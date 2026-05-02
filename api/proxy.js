// Generic CORS Proxy with retry logic
// =====================================

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = req.query.url || req.body?.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  // Validate URL
  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
      },
    };

    if (req.headers.authorization) {
      fetchOptions.headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers['x-api-key']) {
      fetchOptions.headers['X-Api-Key'] = req.headers['x-api-key'];
    }

    if (req.method === 'POST' && req.body?.data) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(req.body.data);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    // Forward response headers
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Proxy error:', error.message, 'URL:', targetUrl);
    res.status(502).json({ 
      error: 'Proxy failed', 
      message: error.message,
      url: targetUrl 
    });
  }
}

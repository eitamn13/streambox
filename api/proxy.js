// Generic CORS Proxy
// ==================

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

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'StreamBox/1.0',
      },
    };

    // Forward auth headers if present
    if (req.headers.authorization) {
      fetchOptions.headers['Authorization'] = req.headers.authorization;
    }
    if (req.headers['x-api-key']) {
      fetchOptions.headers['X-Api-Key'] = req.headers['x-api-key'];
    }

    if (req.method === 'POST' && req.body?.data) {
      fetchOptions.body = JSON.stringify(req.body.data);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).setHeader('Content-Type', contentType).send(text);
    }
  } catch (error) {
    res.status(500).json({ error: 'Proxy failed', message: error.message });
  }
}

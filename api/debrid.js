// Debrid API Proxy - Real-Debrid, Premiumize, TorBox
// Endpoint: /api/debrid?service=rd&path=/user
// =====================================================

const SERVICE_CONFIG = {
  rd: {
    baseUrl: 'https://api.real-debrid.com/rest/1.0',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    formBody: true,
  },
  pm: {
    baseUrl: 'https://www.premiumize.me/api',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    formBody: true,
  },
  tb: {
    baseUrl: 'https://api.torbox.app/v1/api',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    formBody: true,
  },
};

function toFormData(obj) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) params.append(k, String(v));
  }
  return params.toString();
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    return new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch {
          resolve({});
        }
      });
      req.on('error', () => resolve({}));
    });
  }

  return {};
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Debrid-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { service, path: targetPath = '/' } = req.query;
  const config = SERVICE_CONFIG[service];

  if (!config) {
    return res.status(400).json({ error: 'Unknown service' });
  }

  const body = await parseBody(req);
  const apiKey = req.headers['x-debrid-key'] || body?.apiKey;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const targetUrl = `${config.baseUrl}${targetPath}`;

    const fetchOptions = {
      method: req.method,
      headers: {
        ...config.authHeader(apiKey),
      },
    };

    if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && Object.keys(body).length > 0) {
      const bodyData = { ...body };
      delete bodyData.apiKey;
      delete bodyData.service;
      delete bodyData.path;

      if (config.formBody) {
        fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        fetchOptions.body = toFormData(bodyData);
      } else {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(bodyData);
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    let data = null;
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => null);
    }

    res.status(response.status).json({
      ok: response.ok,
      status: response.status,
      data,
    });
  } catch (error) {
    console.error(`Debrid proxy error for ${service}:`, error);
    res.status(500).json({ error: 'Proxy failed', message: error.message });
  }
}

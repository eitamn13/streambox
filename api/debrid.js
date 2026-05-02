// Debrid Proxy - Supports both user keys and admin-managed SaaS keys
// ===================================================================

import { createClient } from '@supabase/supabase-js';

const SERVICE_CONFIG = {
  rd: { 
    baseUrl: 'https://api.real-debrid.com/rest/1.0', 
    authHeader: (k) => ({ 'Authorization': `Bearer ${k}` }), 
    formBody: true 
  },
  pm: { 
    baseUrl: 'https://www.premiumize.me/api', 
    authHeader: (k) => ({ 'Authorization': `Bearer ${k}` }), 
    formBody: true 
  },
  tb: { 
    baseUrl: 'https://api.torbox.app/v1/api', 
    authHeader: (k) => ({ 'Authorization': `Bearer ${k}` }), 
    formBody: true 
  },
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  try {
    return createClient(supabaseUrl, supabaseServiceKey);
  } catch {
    return null;
  }
}

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

async function getApiKey(req) {
  const body = await parseBody(req);
  
  // 1. SaaS mode: Customer API key → admin-managed debrid key
  const customerKey = req.headers['x-customer-key'] || body?.customerKey;
  if (customerKey) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan, status, user_id')
          .eq('customer_api_key', customerKey)
          .single();
        
        if (sub && sub.status === 'active') {
          // Check concurrent streams
          const { data: sessions } = await supabase
            .from('active_sessions')
            .select('*')
            .eq('user_id', sub.user_id)
            .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
          
          const maxConcurrent = sub.plan === 'premium' ? 2 : 1;
          if (sessions && sessions.length >= maxConcurrent) {
            // Still allow but could throttle here
          }
          
          // Return admin's debrid key
          const service = req.query.service;
          const envKey = process.env[`ADMIN_${service.toUpperCase()}_API_KEY`];
          if (envKey) {
            // Track usage
            const today = new Date().toISOString().split('T')[0];
            await supabase.rpc('increment_usage', {
              p_user_id: sub.user_id,
              p_date: today,
            });
            return { apiKey: envKey, plan: sub.plan, userId: sub.user_id };
          }
        }
      } catch (e) {
        console.warn('SaaS key lookup failed:', e.message);
      }
    }
  }
  
  // 2. Legacy mode: User's own debrid key
  const userKey = req.headers['x-debrid-key'] || body?.apiKey;
  if (userKey) {
    return { apiKey: userKey, plan: null, userId: null };
  }
  
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Debrid-Key, X-Customer-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { service, path: targetPath = '/' } = req.query;
  
  if (!service || !SERVICE_CONFIG[service]) {
    return res.status(400).json({ ok: false, status: 400, data: { error: 'Invalid or missing service parameter. Use rd, pm, or tb.' } });
  }

  const config = SERVICE_CONFIG[service];
  
  const keyInfo = await getApiKey(req);
  if (!keyInfo) {
    return res.status(401).json({ ok: false, status: 401, data: { error: 'No API key provided. Set X-Debrid-Key or X-Customer-Key header.' } });
  }

  try {
    const url = `${config.baseUrl}${targetPath}`;
    const fetchOptions = {
      method: req.method,
      headers: { ...config.authHeader(keyInfo.apiKey) },
    };

    // Re-parse body for the actual request (since getApiKey already consumed it)
    // For Vercel, req body is already parsed if content-type is application/json
    const bodyData = req.body || {};
    
    // Don't forward our internal fields to the debrid API
    const { apiKey: _ak, customerKey: _ck, ...cleanBody } = bodyData;

    if (req.method !== 'GET' && req.method !== 'HEAD' && Object.keys(cleanBody).length > 0) {
      if (config.formBody) {
        const formData = new URLSearchParams();
        for (const [k, v] of Object.entries(cleanBody)) {
          formData.append(k, v);
        }
        fetchOptions.body = formData.toString();
        fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        fetchOptions.body = JSON.stringify(cleanBody);
        fetchOptions.headers['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    res.status(200).json({
      ok: response.ok,
      status: response.status,
      data,
      plan: keyInfo.plan,
    });
  } catch (error) {
    console.error('Debrid proxy error:', error.message);
    res.status(502).json({ ok: false, status: 502, data: { error: error.message } });
  }
}

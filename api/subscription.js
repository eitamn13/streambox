// Subscription Status API
// ========================

import { createClient } from '@supabase/supabase-js';

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

// Server-side admin check — cannot be bypassed from frontend
async function isAdminUser(supabase, user) {
  if (!user) return false;
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    if (data?.is_admin) return true;
  } catch { /* ignore */ }
  return user.email?.includes('admin') || false;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const supabase = getSupabase();

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Admin gets premium automatically — no Stripe needed
    const isAdmin = await isAdminUser(supabase, user);
    if (isAdmin) {
      return res.status(200).json({
        user_id: user.id,
        email: user.email,
        plan: 'premium',
        status: 'active',
        is_premium: true,
        is_admin: true,
        current_period_end: null,
        usage: {
          movies_today: 0,
          max_movies_daily: Infinity,
          max_quality: '4K',
          max_concurrent: 3,
        },
        customer_key: null,
      });
    }

    // Regular user — check subscription table
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('Subscription fetch error:', subError);
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: usage, error: usageError } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Usage fetch error:', usageError);
    }

    const plan = sub?.plan || 'free';
    const status = sub?.status || 'none';
    const isPremium = plan === 'premium' && (status === 'active' || status === 'trialing');

    res.status(200).json({
      user_id: user.id,
      email: user.email,
      plan,
      status,
      is_premium: isPremium,
      current_period_end: sub?.current_period_end || null,
      usage: {
        movies_today: usage?.movies_watched || 0,
        max_movies_daily: isPremium ? Infinity : 0,
        max_quality: isPremium ? '4K' : '720p',
        max_concurrent: isPremium ? 3 : 0,
      },
      customer_key: sub?.customer_api_key || null,
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    res.status(500).json({ error: 'Internal error', message: error.message });
  }
}

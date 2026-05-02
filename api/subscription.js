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
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get subscription
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('Subscription fetch error:', subError);
    }

    // Get today's usage
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
    const status = sub?.status || 'active';
    const isPremium = plan === 'premium' && status === 'active';

    res.status(200).json({
      user_id: user.id,
      email: user.email,
      plan,
      status,
      is_premium: isPremium,
      current_period_end: sub?.current_period_end || null,
      usage: {
        movies_today: usage?.movies_watched || 0,
        max_movies_daily: isPremium ? Infinity : 3,
        max_quality: isPremium ? '4K' : '720p',
        max_concurrent: isPremium ? 2 : 1,
      },
      customer_key: sub?.customer_api_key || null,
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    res.status(500).json({ error: 'Internal error', message: error.message });
  }
}

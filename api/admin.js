// Admin Dashboard API
// ====================

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

async function testDebridStatus() {
  const results = { realdebrid: false, premiumize: false, torbox: false };

  // Test Real-Debrid
  const rdKey = process.env.ADMIN_RD_API_KEY;
  if (rdKey) {
    try {
      const res = await fetch('https://api.real-debrid.com/rest/1.0/user', {
        headers: { Authorization: `Bearer ${rdKey}` },
      });
      results.realdebrid = res.ok;
    } catch {
      results.realdebrid = false;
    }
  }

  // Test Premiumize
  const pmKey = process.env.ADMIN_PM_API_KEY;
  if (pmKey) {
    try {
      const res = await fetch(`https://www.premiumize.me/api/account/info?apikey=${pmKey}`);
      results.premiumize = res.ok;
    } catch {
      results.premiumize = false;
    }
  }

  // Test TorBox
  const tbKey = process.env.ADMIN_TB_API_KEY;
  if (tbKey) {
    try {
      const res = await fetch('https://api.torbox.app/v1/api/user/me', {
        headers: { Authorization: `Bearer ${tbKey}` },
      });
      results.torbox = res.ok;
    } catch {
      results.torbox = false;
    }
  }

  return results;
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

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('subscriptions')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    // Also allow if email contains 'admin' as fallback
    const isAdmin = adminCheck?.is_admin || user.email?.includes('admin');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden - admin only' });
    }

    // Get stats
    const { count: totalUsers } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });

    const { count: activePremium } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'premium')
      .eq('status', 'active');

    const { count: trialing } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'premium')
      .eq('status', 'trialing');

    // Get recent users
    const { data: recentUsers } = await supabase
      .from('subscriptions')
      .select('user_id, email, plan, status, created_at, current_period_end')
      .order('created_at', { ascending: false })
      .limit(50);

    // Get debrid status
    const debridStatus = await testDebridStatus();

    res.status(200).json({
      stats: {
        totalUsers: totalUsers || 0,
        activePremium: activePremium || 0,
        trialing: trialing || 0,
        freeUsers: (totalUsers || 0) - (activePremium || 0) - (trialing || 0),
        monthlyRevenue: (activePremium || 0) * 35,
      },
      debrid: debridStatus,
      recentUsers: recentUsers || [],
    });
  } catch (error) {
    console.error('Admin API error:', error);
    res.status(500).json({ error: 'Internal error', message: error.message });
  }
}

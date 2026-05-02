// Subscription Manager - Plans, usage tracking, feature gates
// ============================================================

export const PLANS = {
  free: {
    id: 'free',
    name: 'חינם',
    nameEn: 'Free',
    price: 0,
    currency: 'ILS',
    features: [
      '3 סרטים ביום',
      'איכות עד 720p',
      'כתוביות אוטומטיות',
      'מקור אחד בו-זמנית',
    ],
    limits: {
      maxMoviesDaily: 3,
      maxQuality: '720p',
      maxConcurrent: 1,
    },
  },
  premium: {
    id: 'premium',
    name: 'פרימיום',
    nameEn: 'Premium',
    price: 35,
    currency: 'ILS',
    interval: 'month',
    stripePriceId: process.env.VITE_STRIPE_PRICE_ID || '',
    features: [
      'סרטים ללא הגבלה',
      'איכות עד 4K',
      'כתוביות אוטומטיות',
      '2 מקורות בו-זמנית',
      'תמיכה מועדפת',
    ],
    limits: {
      maxMoviesDaily: Infinity,
      maxQuality: '4K',
      maxConcurrent: 2,
    },
  },
};

const STORAGE_KEYS = {
  subscription: 'sb_subscription',
  usage: 'sb_usage',
  customerKey: 'sb_customer_key',
};

// Local storage helpers for offline/fallback mode
function getStoredSubscription() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.subscription) || 'null');
  } catch { return null; }
}

function setStoredSubscription(sub) {
  localStorage.setItem(STORAGE_KEYS.subscription, JSON.stringify(sub));
}

function getStoredUsage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.usage) || '{}');
  } catch { return {}; }
}

function setStoredUsage(usage) {
  localStorage.setItem(STORAGE_KEYS.usage, JSON.stringify(usage));
}

export function getCustomerKey() {
  try {
    return localStorage.getItem(STORAGE_KEYS.customerKey) || '';
  } catch { return ''; }
}

export function setCustomerKey(key) {
  localStorage.setItem(STORAGE_KEYS.customerKey, key);
}

export function clearCustomerKey() {
  localStorage.removeItem(STORAGE_KEYS.customerKey);
}

// Fetch subscription from server (requires auth token)
export async function fetchSubscription(authToken) {
  if (!authToken) {
    // Return free plan for unauthenticated users
    return { plan: 'free', status: 'active', is_premium: false };
  }

  try {
    const res = await fetch('/api/subscription', {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setStoredSubscription(data);
    return data;
  } catch (e) {
    console.warn('Subscription fetch failed, using cached:', e);
    return getStoredSubscription() || { plan: 'free', status: 'active', is_premium: false };
  }
}

// Check if user can watch a movie
export function canWatchMovie(subscription) {
  const sub = subscription || getStoredSubscription() || { plan: 'free', status: 'active' };
  const plan = PLANS[sub.plan] || PLANS.free;
  
  if (sub.status !== 'active' && sub.status !== 'trialing') {
    return { allowed: false, reason: 'המנוי שלך אינו פעיל' };
  }

  // Check daily limit for free users
  if (plan.id === 'free') {
    const usage = getStoredUsage();
    const today = new Date().toISOString().split('T')[0];
    const moviesToday = usage[today] || 0;
    if (moviesToday >= plan.limits.maxMoviesDaily) {
      return { allowed: false, reason: 'הגעת למכסת הסרטים היומית (3). שדרג לפרימיום לצפייה ללא הגבלה.' };
    }
  }

  return { allowed: true };
}

// Record a movie watch
export function recordMovieWatch() {
  const usage = getStoredUsage();
  const today = new Date().toISOString().split('T')[0];
  usage[today] = (usage[today] || 0) + 1;
  setStoredUsage(usage);
  return usage[today];
}

// Check if quality is allowed
export function isQualityAllowed(quality, subscription) {
  const sub = subscription || getStoredSubscription() || { plan: 'free' };
  const plan = PLANS[sub.plan] || PLANS.free;
  
  const qualityRank = { '480p': 1, '720p': 2, '1080p': 3, '4K': 4, 'auto': 3 };
  const maxRank = qualityRank[plan.limits.maxQuality] || 2;
  const requestedRank = qualityRank[quality] || 3;
  
  return requestedRank <= maxRank;
}

// Filter streams by plan quality limit
// Returns allowed streams first, then locked streams (lowest quality first)
export function filterStreamsByPlan(streams, subscription) {
  const sub = subscription || getStoredSubscription() || { plan: 'free' };
  const plan = PLANS[sub.plan] || PLANS.free;
  
  if (plan.id === 'premium') return streams;
  
  const maxRank = { '480p': 1, '720p': 2, '1080p': 3, '4K': 4, 'auto': 2 }[plan.limits.maxQuality] || 2;
  const qualityRank = { '480p': 1, '720p': 2, '1080p': 3, '4K': 4, 'auto': 2 };
  
  const allowed = [];
  const locked = [];
  
  for (const s of streams) {
    if ((qualityRank[s.quality] || 2) <= maxRank) {
      allowed.push(s);
    } else {
      locked.push({ ...s, locked: true });
    }
  }
  
  // Sort locked by quality (lowest first so free user gets 1080p before 4K)
  locked.sort((a, b) => (qualityRank[a.quality] || 2) - (qualityRank[b.quality] || 2));
  
  return [...allowed, ...locked];
}

// Create Stripe checkout session
export async function createCheckoutSession(priceId, email, userId) {
  const res = await fetch('/api/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, customerEmail: email, userId }),
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Checkout failed');
  }
  
  return await res.json();
}

// Get plan display info
export function getPlanInfo(planId) {
  return PLANS[planId] || PLANS.free;
}

// Check if using SaaS mode (customer key set)
export function isSaaSMode() {
  return !!getCustomerKey();
}

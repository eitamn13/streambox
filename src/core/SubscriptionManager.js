// Subscription Manager — Premium SaaS Gates
// ==========================================

const API_URL = (() => {
  const env = import.meta.env?.VITE_API_URL;
  if (env && !env.includes('your_')) return env.replace(/\/$/, '');
  return 'https://streambox.one';
})();

function api(path) {
  return `${API_URL}${path}`;
}

export const PLANS = {
  free: {
    id: 'free',
    name: 'חינם',
    nameEn: 'Free',
    price: 0,
    features: ['צפייה מוגבלת', 'עד 720p'],
    limits: { maxMoviesDaily: 0, maxQuality: '720p', maxConcurrent: 1 },
  },
  premium: {
    id: 'premium',
    name: 'פרימיום',
    nameEn: 'Premium',
    price: 35,
    currency: 'ILS',
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ID || '',
    features: [
      'סרטים וסדרות ללא הגבלה',
      'איכות עד 4K / HDR',
      'כתוביות אוטומטיות עברית + אנגלית',
      '3 שירותי Debrid במקביל',
      'תמיכה מועדפת',
    ],
    limits: { maxMoviesDaily: Infinity, maxQuality: '4K', maxConcurrent: 3 },
  },
};

const STORAGE_KEYS = {
  subscription: 'sb_subscription',
  customerKey: 'sb_customer_key',
};

function getStoredSubscription() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.subscription) || 'null');
  } catch { return null; }
}

function setStoredSubscription(sub) {
  localStorage.setItem(STORAGE_KEYS.subscription, JSON.stringify(sub));
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

import { getAuthToken } from '../lib/supabase.js';

// Fetch subscription from server
export async function fetchSubscription(authToken) {
  const token = authToken || await getAuthToken();
  if (!token) {
    return { plan: 'free', status: 'none', is_premium: false };
  }
  try {
    const res = await fetch(api('/api/payments/subscription'), {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setStoredSubscription(data);
    return data;
  } catch (e) {
    console.warn('Subscription fetch failed:', e);
    return getStoredSubscription() || { plan: 'free', status: 'none', is_premium: false };
  }
}

// Gate: admin / premium / active subscription or trial
export function canWatchMovie(subscription) {
  const sub = subscription || getStoredSubscription() || { plan: 'free', status: 'none' };
  // Admin and premium users always have access
  if (sub.is_admin || sub.is_premium) {
    return { allowed: true };
  }
  const isActive = sub.status === 'active' || sub.status === 'trialing';
  if (!isActive) {
    return { allowed: false, reason: 'נדרש מנוי פעיל. התחל ניסיון חינם של 7 ימים.' };
  }
  return { allowed: true };
}

export function recordMovieWatch() {
  // Server-side tracking via debrid proxy
}

export function isQualityAllowed() {
  return true; // Premium gets everything
}

export function filterStreamsByPlan(streams) {
  return streams; // No filtering for premium
}

// Stripe checkout
export async function createCheckoutSession(priceId, email, userId) {
  const token = await getAuthToken();
  const res = await fetch(api('/api/payments/checkout'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ priceId, customerEmail: email, userId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Checkout failed');
  }
  return await res.json();
}

export function getPlanInfo(planId) {
  return PLANS[planId] || PLANS.free;
}

export function isSaaSMode() {
  return !!getCustomerKey();
}

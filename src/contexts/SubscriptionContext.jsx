import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext.jsx';
import {
  fetchSubscription,
  getCustomerKey,
  setCustomerKey,
  canWatchMovie,
  recordMovieWatch,
  isQualityAllowed,
  filterStreamsByPlan,
  getPlanInfo,
  isSaaSMode,
  createCheckoutSession,
} from '../core/SubscriptionManager.js';

function getToken() {
  try {
    return localStorage.getItem('sb-token') || '';
  } catch { return ''; }
}

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { isAdmin } = useApp();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load subscription on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const token = getToken();
        const sub = await fetchSubscription(token);
        if (!cancelled) {
          setSubscription(sub);
          if (sub?.customer_key) setCustomerKey(sub.customer_key);
        }
      } catch (e) {
        console.warn('Subscription load failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Also try loading after a short delay (in case auth loads async)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = getToken();
      if (!token) return;
      try {
        const sub = await fetchSubscription(token);
        if (!cancelled) {
          setSubscription(sub);
          if (sub?.customer_key) setCustomerKey(sub.customer_key);
        }
      } catch (e) {
        console.warn('Subscription mount load failed:', e);
      }
    }
    const timer = setTimeout(load, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const refreshSubscription = useCallback(async () => {
    const token = getToken();
    const sub = await fetchSubscription(token);
    setSubscription(sub);
    if (sub?.customer_key) setCustomerKey(sub.customer_key);
    return sub;
  }, []);

  const checkout = useCallback(async (priceId) => {
    const token = getToken();
    if (!token) throw new Error('Must be logged in to subscribe');
    // Get user info from session or localStorage
    let email = '';
    let userId = '';
    try {
      const sessionRaw = localStorage.getItem('sb-session');
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        email = session.user?.email || '';
        userId = session.user?.id || '';
      }
    } catch { /* ignore */ }
    const result = await createCheckoutSession(priceId, email, userId);
    if (result.url) {
      window.location.href = result.url;
    }
    return result;
  }, []);

  const watchCheck = useCallback(() => {
    if (isAdmin) return { allowed: true };
    return canWatchMovie(subscription);
  }, [subscription, isAdmin]);

  const recordWatch = useCallback(() => {
    recordMovieWatch();
  }, []);

  const qualityCheck = useCallback((quality) => {
    return isQualityAllowed(quality, subscription);
  }, [subscription]);

  const filterStreams = useCallback((streams) => {
    return filterStreamsByPlan(streams, subscription);
  }, [subscription]);

  const plan = isAdmin ? 'premium' : (subscription?.plan || 'free');
  const isPremium = subscription?.is_premium || subscription?.is_admin || isAdmin || false;
  const isTrialing = subscription?.status === 'trialing';
  const planInfo = getPlanInfo(plan);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        plan,
        isPremium,
        isTrialing,
        planInfo,
        customerKey: getCustomerKey(),
        saasMode: isSaaSMode(),
        refreshSubscription,
        checkout,
        watchCheck,
        recordWatch,
        qualityCheck,
        filterStreams,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be inside SubscriptionProvider');
  return ctx;
}

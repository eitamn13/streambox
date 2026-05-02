import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
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

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSessionState] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionState(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSessionState(newSession);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const token = session?.access_token;
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
  }, [session]);

  const refreshSubscription = useCallback(async () => {
    const token = session?.access_token;
    const sub = await fetchSubscription(token);
    setSubscription(sub);
    if (sub?.customer_key) setCustomerKey(sub.customer_key);
    return sub;
  }, [session]);

  const checkout = useCallback(async (priceId) => {
    const userId = session?.user?.id;
    const email = session?.user?.email;
    const result = await createCheckoutSession(priceId, email, userId);
    if (result.url) {
      window.location.href = result.url;
    }
    return result;
  }, [session]);

  const watchCheck = useCallback(() => {
    return canWatchMovie(subscription);
  }, [subscription]);

  const recordWatch = useCallback(() => {
    recordMovieWatch();
  }, []);

  const qualityCheck = useCallback((quality) => {
    return isQualityAllowed(quality, subscription);
  }, [subscription]);

  const filterStreams = useCallback((streams) => {
    return filterStreamsByPlan(streams, subscription);
  }, [subscription]);

  const plan = subscription?.plan || 'free';
  const isPremium = subscription?.is_premium || false;
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

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '../lib/api.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Watchlist
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb-watchlist') || '[]'); } catch { return []; }
  });

  // Favorites
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb-favorites') || '[]'); } catch { return []; }
  });

  // Multi-profile system
  const [profiles, setProfiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb-profiles') || '[]'); } catch { return []; }
  });
  const [activeProfile, setActiveProfile] = useState(() => {
    try { return localStorage.getItem('sb-active-profile') || null; } catch { return null; }
  });

  // Continue watching
  const [continueWatching, setContinueWatching] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb-continue') || '[]'); } catch { return []; }
  });

  // Settings
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb-settings') || '{"autoplay":true,"notifications":true}'); } catch { return { autoplay: true, notifications: true }; }
  });

  // Live TV settings
  const [tvSettings, setTvSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb-tv-settings') || '{"m3uUrl":"","channels":[]}'); } catch { return { m3uUrl: '', channels: [] }; }
  });

  // Onboarding
  const [onboardingDone, setOnboardingDone] = useState(() => {
    try { return localStorage.getItem('sb-onboarding-done') === 'true'; } catch { return false; }
  });

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('sb-onboarding-done', 'true');
    setOnboardingDone(true);
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);

  // Create default profile if none exists
  useEffect(() => {
    if (profiles.length === 0) {
      const id = crypto.randomUUID();
      const defaultProfile = { id, name: 'Default', isKids: false, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}` };
      setProfiles([defaultProfile]);
      setActiveProfile(id);
    }
  }, []);

  // Auth state — load from VPS backend
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const token = localStorage.getItem('sb-token');
        if (token) {
          try {
            const res = await fetch(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              const newSession = {
                access_token: token,
                user: {
                  id: data.user.id,
                  email: data.user.email,
                  user_metadata: { full_name: data.user.fullName },
                  created_at: data.user.createdAt,
                },
              };
              if (mounted) {
                setSession(newSession);
                setIsAdmin(data.user.isAdmin || false);
              }
            } else {
              localStorage.removeItem('sb-token');
              localStorage.removeItem('sb-refresh-token');
            }
          } catch (e) {
            console.warn('Backend session load failed:', e);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    const handleUnauthorized = () => {
      setSession(null);
      setIsAdmin(false);
    };
    window.addEventListener('api:unauthorized', handleUnauthorized);

    return () => {
      mounted = false;
      window.removeEventListener('api:unauthorized', handleUnauthorized);
    };
  }, []);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('sb-watchlist', JSON.stringify(watchlist)); }, [watchlist]);
  useEffect(() => { localStorage.setItem('sb-favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('sb-profiles', JSON.stringify(profiles)); }, [profiles]);
  useEffect(() => { localStorage.setItem('sb-active-profile', activeProfile || ''); }, [activeProfile]);
  useEffect(() => { localStorage.setItem('sb-continue', JSON.stringify(continueWatching)); }, [continueWatching]);
  useEffect(() => { localStorage.setItem('sb-settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('sb-tv-settings', JSON.stringify(tvSettings)); }, [tvSettings]);

  const addToWatchlist = useCallback((item) => {
    setWatchlist((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);
  const removeFromWatchlist = useCallback((id) => {
    setWatchlist((prev) => prev.filter((x) => x.id !== id));
  }, []);
  const isInWatchlist = useCallback((id) => watchlist.some((x) => x.id === id), [watchlist]);

  const addToFavorites = useCallback((item) => {
    setFavorites((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);
  const removeFromFavorites = useCallback((id) => {
    setFavorites((prev) => prev.filter((x) => x.id !== id));
  }, []);
  const isInFavorites = useCallback((id) => favorites.some((x) => x.id === id), [favorites]);

  const addContinue = useCallback((item) => {
    setContinueWatching((prev) => {
      const filtered = prev.filter((x) => x.id !== item.id);
      return [item, ...filtered].slice(0, 20);
    });
  }, []);

  const createProfile = useCallback((name, isKids = false) => {
    const id = crypto.randomUUID();
    const p = { id, name, isKids, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}` };
    setProfiles((prev) => [...prev, p]);
    if (!activeProfile) setActiveProfile(id);
    return p;
  }, [activeProfile]);

  const deleteProfile = useCallback((id) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (activeProfile === id) setActiveProfile(null);
  }, [activeProfile]);

  const updateSettings = useCallback((next) => {
    setSettings((prev) => ({ ...prev, ...next }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        session, setSession, loading,
        watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist,
        favorites, addToFavorites, removeFromFavorites, isInFavorites,
        profiles, activeProfile, setActiveProfile, createProfile, deleteProfile,
        continueWatching, addContinue,
        settings, updateSettings,
        tvSettings, setTvSettings,
        isAdmin,
        onboardingDone,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

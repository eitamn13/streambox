import { createClient } from '@supabase/supabase-js';

// Support both Vite build-time env and runtime injection from Vercel
function getEnv(key, fallback = '') {
  if (import.meta.env?.[key]) return import.meta.env[key];
  if (typeof window !== 'undefined' && window.__ENV__?.[key]) return window.__ENV__[key];
  return fallback;
}

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');
const API_URL = getEnv('VITE_API_URL');

const USE_BACKEND = API_URL && !API_URL.includes('your_');

function isValidSupabaseConfig(url, key) {
  if (!url || !key) return false;
  if (url.includes('your_') || key.includes('your_')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch { return false; }
}

// ------------------------------------------------------------------
// Backend-aware mock client — used when VITE_API_URL is set
// ------------------------------------------------------------------
function createBackendClient() {
  const subscribers = new Map();

  function notify(event, session) {
    const cbs = subscribers.get('AUTH_STATE_CHANGE') || [];
    cbs.forEach((cb) => cb(event, session));
  }

  async function backendFetch(path, options = {}) {
    const url = `${API_URL}${path}`;
    const token = localStorage.getItem('sb-token') || '';
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
  }

  return {
    auth: {
      getSession: async () => {
        const raw = localStorage.getItem('sb-session');
        const session = raw ? JSON.parse(raw) : null;
        // Try to validate / refresh if token exists but no session
        const token = localStorage.getItem('sb-token');
        if (token && !session) {
          try {
            const me = await backendFetch('/api/auth/me');
            const newSession = {
              access_token: token,
              user: {
                id: me.user.id,
                email: me.user.email,
                user_metadata: { full_name: me.user.fullName },
                created_at: me.user.createdAt,
              },
            };
            localStorage.setItem('sb-session', JSON.stringify(newSession));
            return { data: { session: newSession }, error: null };
          } catch {
            localStorage.removeItem('sb-token');
            localStorage.removeItem('sb-refresh-token');
          }
        }
        return { data: { session }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        const data = await backendFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        const session = {
          access_token: data.accessToken,
          user: {
            id: data.user.id,
            email: data.user.email,
            user_metadata: { full_name: data.user.fullName },
          },
        };
        localStorage.setItem('sb-session', JSON.stringify(session));
        localStorage.setItem('sb-token', data.accessToken);
        localStorage.setItem('sb-refresh-token', data.refreshToken);
        notify('SIGNED_IN', session);
        return { data: { session }, error: null };
      },
      signUp: async ({ email, password, options }) => {
        const data = await backendFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, fullName: options?.data?.full_name }),
        });
        const session = {
          access_token: data.accessToken,
          user: {
            id: data.user.id,
            email: data.user.email,
            user_metadata: { full_name: data.user.fullName },
          },
        };
        localStorage.setItem('sb-session', JSON.stringify(session));
        localStorage.setItem('sb-token', data.accessToken);
        localStorage.setItem('sb-refresh-token', data.refreshToken);
        notify('SIGNED_IN', session);
        return { data: { session }, error: null };
      },
      signOut: async () => {
        const refreshToken = localStorage.getItem('sb-refresh-token');
        try {
          await backendFetch('/api/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
        } catch { /* ignore */ }
        localStorage.removeItem('sb-session');
        localStorage.removeItem('sb-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb_subscription');
        localStorage.removeItem('sb_customer_key');
        notify('SIGNED_OUT', null);
        return { error: null };
      },
      resetPasswordForEmail: async (email) => {
        await backendFetch('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        return { data: null, error: null };
      },
      updateUser: async (attrs) => {
        const raw = localStorage.getItem('sb-session');
        const session = raw ? JSON.parse(raw) : null;
        if (session?.user) {
          session.user.user_metadata = { ...session.user.user_metadata, ...attrs.data };
          localStorage.setItem('sb-session', JSON.stringify(session));
          notify('USER_UPDATED', session);
        }
        return { data: { user: session?.user || null, session }, error: null };
      },
      onAuthStateChange: (callback) => {
        const key = 'AUTH_STATE_CHANGE';
        if (!subscribers.has(key)) subscribers.set(key, []);
        subscribers.get(key).push(callback);
        return {
          data: { subscription: { unsubscribe: () => {
            const arr = subscribers.get(key) || [];
            subscribers.set(key, arr.filter((cb) => cb !== callback));
          }}},
        };
      },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
    }),
  };
}

// Fallback mock client when nothing is configured
function createMockClient() {
  const subscribers = new Map();

  function notify(event, session) {
    const cbs = subscribers.get('AUTH_STATE_CHANGE') || [];
    cbs.forEach((cb) => cb(event, session));
  }

  return {
    auth: {
      getSession: async () => {
        const raw = localStorage.getItem('sb-session');
        const session = raw ? JSON.parse(raw) : null;
        return { data: { session }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        const users = JSON.parse(localStorage.getItem('sb-users') || '[]');
        const user = users.find((u) => u.email === email && u.password === password);
        if (!user) return { data: null, error: { message: 'Invalid credentials' } };
        const session = {
          access_token: `mock_${user.id}_${Date.now()}`,
          user: { id: user.id, email: user.email, user_metadata: user.user_metadata },
        };
        localStorage.setItem('sb-session', JSON.stringify(session));
        localStorage.setItem(TOKEN_KEY, session.access_token);
        notify('SIGNED_IN', session);
        return { data: { session }, error: null };
      },
      signUp: async ({ email, password, options }) => {
        const users = JSON.parse(localStorage.getItem('sb-users') || '[]');
        if (users.find((u) => u.email === email)) {
          return { data: null, error: { message: 'Email already registered' } };
        }
        const newUser = {
          id: crypto.randomUUID(),
          email,
          password,
          user_metadata: options?.data || {},
          created_at: new Date().toISOString(),
        };
        users.push(newUser);
        localStorage.setItem('sb-users', JSON.stringify(users));
        const session = {
          access_token: `mock_${newUser.id}_${Date.now()}`,
          user: { id: newUser.id, email: newUser.email, user_metadata: newUser.user_metadata },
        };
        localStorage.setItem('sb-session', JSON.stringify(session));
        localStorage.setItem(TOKEN_KEY, session.access_token);
        notify('SIGNED_IN', session);
        return { data: { session }, error: null };
      },
      signOut: async () => {
        localStorage.removeItem('sb-session');
        localStorage.removeItem(TOKEN_KEY);
        notify('SIGNED_OUT', null);
        return { error: null };
      },
      resetPasswordForEmail: async () => {
        return { data: null, error: { message: 'Mock mode: password reset not available without Supabase' } };
      },
      updateUser: async (attrs) => {
        const raw = localStorage.getItem('sb-session');
        const session = raw ? JSON.parse(raw) : null;
        if (session?.user) {
          session.user.user_metadata = { ...session.user.user_metadata, ...attrs.data };
          localStorage.setItem('sb-session', JSON.stringify(session));
          notify('USER_UPDATED', session);
        }
        return { data: { user: session?.user || null, session }, error: null };
      },
      onAuthStateChange: (callback) => {
        const key = 'AUTH_STATE_CHANGE';
        if (!subscribers.has(key)) subscribers.set(key, []);
        subscribers.get(key).push(callback);
        return {
          data: { subscription: { unsubscribe: () => {
            const arr = subscribers.get(key) || [];
            subscribers.set(key, arr.filter((cb) => cb !== callback));
          }}},
        };
      },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
    }),
  };
}

export const supabase = USE_BACKEND
  ? createBackendClient()
  : isValidSupabaseConfig(SUPABASE_URL, SUPABASE_ANON_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : createMockClient();

// ------------------------------------------------------------------
// Token helpers
// ------------------------------------------------------------------
const TOKEN_KEY = 'sb-token';

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('[setAuthToken] localStorage error:', err.name, err.message);
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch { return ''; }
}

export async function getAuthToken() {
  const explicit = getStoredToken();
  if (explicit && !explicit.startsWith('mock_')) return explicit;
  try {
    const { data } = await supabase.auth.getSession();
    const realToken = data.session?.access_token;
    if (realToken) {
      setAuthToken(realToken);
      return realToken;
    }
  } catch (e) { console.warn('[getAuthToken] getSession failed:', e?.message || e); }
  if (!USE_BACKEND && SUPABASE_URL) {
    try {
      const projectRef = SUPABASE_URL?.match(/\/\/([^.]+)\.supabase\.co/)?.[1];
      if (projectRef) {
        const nativeKey = `sb-${projectRef}-auth-token`;
        const nativeRaw = localStorage.getItem(nativeKey);
        if (nativeRaw) {
          const nativeSession = JSON.parse(nativeRaw);
          const nativeToken = nativeSession?.access_token || nativeSession?.[0]?.access_token;
          if (nativeToken && !nativeToken.startsWith('mock_')) {
            setAuthToken(nativeToken);
            return nativeToken;
          }
        }
      }
    } catch { /* ignore */ }
  }
  return '';
}

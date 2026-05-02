import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback mock client when Supabase is not configured
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
          user: { id: user.id, email: user.email, user_metadata: user.user_metadata }
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
          user: { id: newUser.id, email: newUser.email, user_metadata: newUser.user_metadata }
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
      resetPasswordForEmail: async (email, options) => {
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

function isValidSupabaseConfig(url, key) {
  if (!url || !key) return false;
  if (url.includes('your_') || key.includes('your_')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const supabase = isValidSupabaseConfig(SUPABASE_URL, SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createMockClient();

// ------------------------------------------------------------------
// Token helpers — explicit localStorage + Supabase fallback
// ------------------------------------------------------------------
const TOKEN_KEY = 'sb-token';

export function setAuthToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch { return ''; }
}

/** Get auth token: explicit localStorage first, then Supabase session */
export async function getAuthToken() {
  const explicit = getStoredToken();
  if (explicit) return explicit;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  } catch { return ''; }
}

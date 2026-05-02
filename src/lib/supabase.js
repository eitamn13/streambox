// Mock Supabase client - works locally via localStorage
// Replace with real Supabase credentials to enable cloud auth
// Get yours at: https://supabase.com

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
        const session = { user: { id: user.id, email: user.email, user_metadata: user.user_metadata } };
        localStorage.setItem('sb-session', JSON.stringify(session));
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
        const session = { user: { id: newUser.id, email: newUser.email, user_metadata: newUser.user_metadata } };
        localStorage.setItem('sb-session', JSON.stringify(session));
        notify('SIGNED_IN', session);
        return { data: { session }, error: null };
      },
      signOut: async () => {
        localStorage.removeItem('sb-session');
        notify('SIGNED_OUT', null);
        return { error: null };
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

export const supabase = createMockClient();

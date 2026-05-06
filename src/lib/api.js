// StreamBox API Client — talks to the new VPS backend
// =====================================================

const API_URL = (() => {
  const env = import.meta.env?.VITE_API_URL;
  if (env && !env.includes('your_')) return env.replace(/\/$/, '');
  // Use relative paths for same-origin deployment
  return '';
})();

function getToken() {
  try {
    return localStorage.getItem('sb-token') || '';
  } catch { return ''; }
}

async function fetchApi(path, options = {}) {
  const url = `${API_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Token expired — clear and let app handle re-auth
    localStorage.removeItem('sb-token');
    window.dispatchEvent(new CustomEvent('api:unauthorized'));
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.error || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Auth
function extractTokens(data) {
  const accessToken = data?.token || data?.accessToken || data?.access_token || '';
  const refreshToken = data?.refreshToken || data?.refresh_token || '';
  return { accessToken, refreshToken };
}

export async function apiRegister({ email, password, fullName }) {
  const data = await fetchApi('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  });
  const { accessToken, refreshToken } = extractTokens(data);
  if (accessToken) {
    localStorage.setItem('sb-token', accessToken);
    if (refreshToken) localStorage.setItem('sb-refresh-token', refreshToken);
    console.log('[apiRegister] Token saved to localStorage');
  } else {
    console.warn('[apiRegister] No token found in response. Fields:', Object.keys(data || {}));
  }
  return data;
}

export async function apiLogin({ email, password }) {
  const data = await fetchApi('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const { accessToken, refreshToken } = extractTokens(data);
  if (accessToken) {
    localStorage.setItem('sb-token', accessToken);
    if (refreshToken) localStorage.setItem('sb-refresh-token', refreshToken);
    console.log('[apiLogin] Token saved to localStorage');
  } else {
    console.warn('[apiLogin] No token found in response. Fields:', Object.keys(data || {}));
  }
  return data;
}

export async function apiLogout() {
  const refreshToken = localStorage.getItem('sb-refresh-token');
  try {
    await fetchApi('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } catch { /* ignore */ }
  localStorage.removeItem('sb-token');
  localStorage.removeItem('sb-refresh-token');
  localStorage.removeItem('sb-session');
  localStorage.removeItem('sb_subscription');
}

export async function apiRefreshToken() {
  const refreshToken = localStorage.getItem('sb-refresh-token');
  if (!refreshToken) throw new Error('No refresh token');
  const data = await fetchApi('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  const { accessToken, refreshToken: newRefreshToken } = extractTokens(data);
  if (accessToken) {
    localStorage.setItem('sb-token', accessToken);
    if (newRefreshToken) localStorage.setItem('sb-refresh-token', newRefreshToken);
    console.log('[apiRefreshToken] Token saved to localStorage');
  } else {
    console.warn('[apiRefreshToken] No token found in response. Fields:', Object.keys(data || {}));
  }
  return data;
}

export async function apiMe() {
  return fetchApi('/api/auth/me');
}

export async function apiChangePassword({ currentPassword, newPassword }) {
  return fetchApi('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function apiForgotPassword(email) {
  return fetchApi('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword({ token, password }) {
  return fetchApi('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

// Profile update — backend doesn't support metadata update yet, but we keep signature
export async function apiUpdateProfile({ fullName }) {
  return fetchApi('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ fullName }),
  });
}

// Payments
export async function apiCreateCheckout(priceId) {
  return fetchApi('/api/payments/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId }),
  });
}

export async function apiGetSubscription() {
  return fetchApi('/api/payments/subscription');
}

export async function apiCreatePortal() {
  return fetchApi('/api/payments/portal', { method: 'POST' });
}

export async function apiCancelSubscription() {
  return fetchApi('/api/payments/cancel', { method: 'POST' });
}

// Debrid
export async function apiGetDebridKey() {
  return fetchApi('/api/debrid/key');
}

export async function apiProxyDebrid(service, path, options = {}) {
  return fetchApi(`/api/debrid/${service}${path}`, options);
}

// Admin
export async function apiGetAdminUsers(page = 1, limit = 50) {
  return fetchApi(`/api/admin/users?page=${page}&limit=${limit}`);
}

export async function apiGetAdminStats() {
  return fetchApi('/api/admin/stats');
}

export async function apiUpdateUserPlan(userId, plan, status) {
  return fetchApi(`/api/admin/users/${userId}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ plan, status }),
  });
}

// Health check
export async function apiHealth() {
  return fetchApi('/api/health');
}

export { API_URL };

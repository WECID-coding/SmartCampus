/**
 * SmartCampus API Client & Local Fallback Store
 * Handles backend requests with graceful fallback to localStorage demo mode.
 */
// Dynamic host detection: When running locally or via file://, use local FastAPI on :8000;
// When deployed on Vercel or custom domain, use relative '' so requests hit the cloud serverless functions directly.
const isLocal = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' || 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);
const API_BASE = (typeof window !== 'undefined' && window.SMARTCAMPUS_API_BASE) 
  ? window.SMARTCAMPUS_API_BASE 
  : (isLocal ? 'http://localhost:8000' : '');
const TOKEN_KEY = 'smartcampus-auth-token';
const USER_KEY = 'smartcampus-user';
const MINE_KEY = 'smartcampus-my-reports-v2';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

function setSession(data) {
  if (data?.token) localStorage.setItem(TOKEN_KEY, data.token);
  if (data?.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function refreshUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    }
  } catch {
    // If backend is offline, return cached user
  }
  return getStoredUser();
}

async function requireAuth() {
  const user = getStoredUser();
  if (!user && !getToken()) {
    // Check if on subpage or root
    const loginUrl = location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
    // For demo purposes, if user is not logged in, we allow browsing or redirect
    return true;
  }
  return true;
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  let res;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch (netErr) {
    // True network failure / timeout: Graceful local simulation
    return handleLocalFallback(endpoint, options);
  }

  // Backend is online: Parse server response or throw real HTTP error
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.message || `Request failed with status ${res.status}`);
  }
  return await res.json();
}

function handleLocalFallback(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const path = endpoint.split('?')[0];

  // Auth mock
  if (path === '/auth/login' && method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const inputIdentifier = (body.email || body.username || '').trim().toLowerCase();
    const isAdmin = inputIdentifier === 'admin' || inputIdentifier === 'admin@mitsgwl.ac.in';
    const isFaculty = inputIdentifier.includes('mitsgwalior.in') || inputIdentifier.includes('faculty');

    // Strict admin authentication check
    if (isAdmin) {
      if ((body.password || '') !== 'admin123') {
        throw new Error('Invalid administrator credentials. Access denied.');
      }
      const mockUser = {
        name: 'System Administrator',
        email: 'admin@mitsgwl.ac.in',
        role: 'admin'
      };
      const session = { token: 'demo-token-admin-' + Date.now(), user: mockUser };
      setSession(session);
      return session;
    }

    const role = isFaculty ? 'faculty' : 'student';
    const cleanEmail = inputIdentifier.includes('@') ? inputIdentifier : `${inputIdentifier}@mitsgwl.ac.in`;
    const namePart = inputIdentifier.includes('@') ? inputIdentifier.split('@')[0] : inputIdentifier;
    const displayName = namePart.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const mockUser = {
      name: displayName,
      email: cleanEmail,
      role: role
    };
    const session = { token: 'demo-token-' + Date.now(), user: mockUser };
    setSession(session);
    return session;
  }

  if (path === '/auth/register' && method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const mockUser = {
      name: body.name || 'Campus Student',
      email: body.email,
      role: 'student'
    };
    const session = { token: 'demo-token-' + Date.now(), user: mockUser };
    setSession(session);
    return session;
  }

  if (path === '/reports/mine') {
    return JSON.parse(localStorage.getItem(MINE_KEY) || '[]');
  }

  // Report status update fallback
  if (path.includes('/status') && method === 'PATCH') {
    return { success: true, message: 'Status updated locally' };
  }

  // Report delete fallback
  if (path.startsWith('/reports/') && method === 'DELETE') {
    return { success: true, message: 'Report removed locally' };
  }

  if (path.startsWith('/reports') && method === 'POST') {
    let newReport = {};
    if (options.body instanceof FormData) {
      for (const [k, v] of options.body.entries()) {
        if (k !== 'image') newReport[k] = v;
      }
    } else if (typeof options.body === 'string') {
      newReport = JSON.parse(options.body);
    }
    newReport.id = Date.now();
    newReport.time = 'Just now';
    newReport.date = newReport.item_date || new Date().toISOString().slice(0, 10);
    
    // Save to global list
    if (typeof getReports === 'function' && typeof saveReports === 'function') {
      const all = getReports();
      all.unshift(newReport);
      saveReports(all);
    }
    // Save to user's reports
    const myReports = JSON.parse(localStorage.getItem(MINE_KEY) || '[]');
    myReports.unshift(newReport);
    localStorage.setItem(MINE_KEY, JSON.stringify(myReports));
    return newReport;
  }

  if (path.startsWith('/claims') && method === 'POST') {
    return { status: 'submitted', message: 'Claim submitted for review' };
  }

  // Notifications fallbacks
  if (path === '/notifications' && method === 'GET') {
    return typeof window.getStoredNotifications === 'function' ? window.getStoredNotifications() : [];
  }
  if (path === '/notifications' && method === 'POST') {
    return { success: true, id: Date.now() };
  }
  if (path.includes('/notifications') && (path.includes('/read') || method === 'PATCH' || method === 'POST')) {
    return { success: true };
  }

  // Admin stats fallback
  if (path === '/admin/stats') {
    const all = typeof getReports === 'function' ? getReports() : [];
    return {
      total_reports: all.length,
      pending_claims: 2,
      reunited: all.filter(r => r.status === 'resolved' || r.type === 'found').length,
      total_users: 4120
    };
  }

  if (path === '/admin/claims') {
    return [];
  }

  throw new Error('Local mock fallback unavailable for this operation');
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('routes_token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getDashboard: () => request('/dashboard'),
  getHouses: (query = '') => request(`/houses${query ? `?${query}` : ''}`),
  getHouse: (id) => request(`/houses/${id}`),
  createHouse: (payload) => request('/houses', { method: 'POST', body: JSON.stringify(payload) }),
  createVisit: (payload) => request('/visits', { method: 'POST', body: JSON.stringify(payload) }),
  getRoutes: () => request('/routes'),
  createRoute: (payload) => request('/routes', { method: 'POST', body: JSON.stringify(payload) }),
  getLeads: () => request('/leads'),
};

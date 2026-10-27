import axios from 'axios';

// Same site by default (backend serves the app). When the frontend is deployed on its own,
// VITE_API_URL is set at build time to the backend's address, e.g. https://srini-physio-api.onrender.com
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const API = axios.create({ baseURL: API_URL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (r) => r,
  (err) => {
    // Expired session inside the admin panel or a patient account → back to sign-in.
    // Public pages just carry on without the stale token.
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      const path = window.location.pathname;
      if (path.startsWith('/admin') || path.startsWith('/account')) {
        window.location.href = `/login?next=${encodeURIComponent(path)}`;
      }
    }
    return Promise.reject(err);
  }
);

export default API;

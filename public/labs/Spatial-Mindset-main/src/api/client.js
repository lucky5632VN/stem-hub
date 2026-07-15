// API Client với timeout và error handling tốt hơn
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Fix W1: Thêm timeout 30s để tránh frontend đợi mãi mãi khi server treo
const fetchWithTimeout = (url, options = {}, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
};

export const apiClient = {
  get: async (endpoint) => {
    try {
      const token = localStorage.getItem('spatialmind_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, { headers });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `API Error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Request timeout sau 30 giây');
      throw err;
    }
  },

  post: async (endpoint, data) => {
    try {
      const token = localStorage.getItem('spatialmind_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `API Error: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Request timeout sau 30 giây');
      throw err;
    }
  }
};

export default API_BASE_URL;

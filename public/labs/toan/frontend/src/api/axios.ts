import axios from 'axios';

/**
 * Centralized Axios instance for the entire frontend.
 * It reads the base URL from environment variables, 
 * which is essential for deployment (production vs development).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

export default api;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import './index.css'
import AppRoutes from './AppRoutes.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'

// Ghi log toàn bộ hoạt động API (đặc biệt là gọi chatbot Gemini)
axios.interceptors.request.use(request => {
  console.log('[🌐 Web Activity - Request]', request.method?.toUpperCase(), request.url, request.data ? request.data : '');
  return request;
});

axios.interceptors.response.use(response => {
  console.log('[✅ Web Activity - Response]', response.config.url, response.data);
  return response;
}, error => {
  console.error('[❌ Web Activity - Error]', error.config?.url, error);
  return Promise.reject(error);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
)

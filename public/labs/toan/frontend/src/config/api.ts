/**
 * STEM HUB API CONFIGURATION
 * 
 * In production/preview without serverless functions on Firebase Hosting,
 * API requests can be routed directly to the Cloudflare Worker Edge Proxy.
 * 
 * Priority:
 * 1. import.meta.env.VITE_API_BASE_URL (if provided at build time)
 * 2. Window runtime global window.__STEM_HUB_API_URL__ (if configured)
 * 3. Empty string '' (falls back to relative '/api/lab-toan/...' if same-origin proxy is active)
 */

declare global {
  interface Window {
    __STEM_HUB_API_URL__?: string;
  }
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.__STEM_HUB_API_URL__) {
    return window.__STEM_HUB_API_URL__.replace(/\/$/, '');
  }
  const envUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    ''
  ).trim();
  return envUrl.replace(/\/$/, '');
}

export const CLOUDFLARE_EDGE_PROXY_URL = (
  import.meta.env.NEXT_PUBLIC_API_PROXY_URL ||
  'https://stem-hub-api-proxy.ai-stem-hub.workers.dev'
).trim().replace(/\/$/, '');

export const API_TIMEOUT_MS = 60000; // 60s cho Agentic AI và Cloudflare Edge Proxy

export function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = API_TIMEOUT_MS): Promise<Response> {
  let timer: any = null;
  const controller = new AbortController();

  const signal = options.signal || (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(timeoutMs)
    : controller.signal);

  if (!options.signal && (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function')) {
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }

  return fetch(url, { ...options, signal }).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export const API_ENDPOINTS = {
  get generate3D(): string {
    return `${getApiBaseUrl()}/api/lab-toan/generate-3d`;
  },
  get chatModel(): string {
    return `${getApiBaseUrl()}/api/lab-toan/chat-model`;
  },
  get chatTutor(): string {
    return `${getApiBaseUrl()}/api/lab-toan/chat-tutor`;
  },
  get visionOcr(): string {
    return `${getApiBaseUrl()}/api/lab-toan/vision-ocr`;
  }
};

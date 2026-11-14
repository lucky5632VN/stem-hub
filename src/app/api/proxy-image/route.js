import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Cache in-memory simple Map for fast responses
const cache = new Map();
const MAX_CACHE_SIZE = 100;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl || typeof rawUrl !== 'string') {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Allowlist security check: only allow http/https from trusted or educational origins
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return new NextResponse('Invalid protocol', { status: 400 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  // Normalize Unicode to NFD for WordPress/Nginx upload compatibility
  const nfdUrl = encodeURI(rawUrl.trim().normalize('NFD'));

  // Check in-memory cache
  if (cache.has(nfdUrl)) {
    const cached = cache.get(nfdUrl);
    return new NextResponse(cached.buffer, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
        'X-Proxy-Cache': 'HIT'
      }
    });
  }

  try {
    const upstreamRes = await fetch(nfdUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': new URL(rawUrl).origin + '/'
      },
      next: { revalidate: 604800 }
    });

    if (!upstreamRes.ok) {
      // If NFD fails, try raw or NFC as fallback
      const fallbackUrl = encodeURI(rawUrl.trim().normalize('NFC'));
      if (fallbackUrl !== nfdUrl) {
        const fallbackRes = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': new URL(rawUrl).origin + '/'
          }
        });
        if (fallbackRes.ok) {
          const buffer = await fallbackRes.arrayBuffer();
          const contentType = fallbackRes.headers.get('content-type') || 'image/png';
          if (cache.size > MAX_CACHE_SIZE) cache.clear();
          cache.set(nfdUrl, { buffer, contentType });
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000'
            }
          });
        }
      }

      // Return a clean inline SVG fallback if not found
      return createSvgFallback('Hình ảnh không khả dụng');
    }

    const buffer = await upstreamRes.arrayBuffer();
    const contentType = upstreamRes.headers.get('content-type') || 'image/png';

    if (cache.size > MAX_CACHE_SIZE) cache.clear();
    cache.set(nfdUrl, { buffer, contentType });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
        'X-Proxy-Cache': 'MISS'
      }
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    return createSvgFallback('Lỗi kết nối ảnh');
  }
}

function createSvgFallback(message) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" fill="none">
    <rect width="400" height="200" rx="16" fill="#181a26"/>
    <rect x="1" y="1" width="398" height="198" rx="15" stroke="#33374d" stroke-dasharray="6 6"/>
    <circle cx="200" cy="85" r="28" fill="#25293d"/>
    <path d="M190 85l6 7 14-14" stroke="#f43f5e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="200" y="140" fill="#94a3b8" font-size="13" font-weight="600" text-anchor="middle" font-family="sans-serif">📐 ${message}</text>
    <text x="200" y="160" fill="#64748b" font-size="11" text-anchor="middle" font-family="sans-serif">Hình vẽ / sơ đồ mô phỏng khoa học</text>
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}


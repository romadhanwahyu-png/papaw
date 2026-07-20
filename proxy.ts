// ============================================================
// Papaw — Rate Limiting Proxy (Next 16 middleware → proxy)
// ============================================================
//
// Basic per-IP fixed-window limiter on /api/* to prevent accidental loops and
// casual abuse of the (paid) LLM endpoints. ARCHITECTURE §7 target: 60 req/min.
//
// NOTE: state is in-memory and per-instance. On a multi-instance / edge
// deployment this is a soft guard, not a hard global limit. For production-grade
// limiting across instances, back this with a shared store (e.g. Upstash Redis).

import { NextRequest, NextResponse } from 'next/server';

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // per IP per window

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // First entry is the original client.
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export function proxy(request: NextRequest) {
  const ip = getClientIp(request);
  const now = Date.now();

  let bucket = buckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);

    // Opportunistic cleanup of expired buckets to bound memory growth.
    if (buckets.size > 5_000) {
      for (const [key, b] of buckets) {
        if (now >= b.resetAt) buckets.delete(key);
      }
    }
  }

  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar ya.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
  res.headers.set('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - bucket.count)));
  return res;
}

export const config = {
  matcher: '/api/:path*',
};

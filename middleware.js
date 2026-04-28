// Vercel Edge Middleware — custom domain routing for white-label
// Runs on every request before it hits any route handler

import { NextResponse } from 'next/server'

const SUPABASE_URL  = process.env.SUPABASE_URL
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY

// Cache: domain → { business_id, verified } with 5-min TTL
const CACHE = new Map()
const CACHE_TTL = 5 * 60 * 1000

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|icons|.*\\..*).*)'],
}

export default async function middleware(req) {
  const { hostname, pathname } = new URL(req.url)

  // Only intercept custom domains (not sinpepay.cr or localhost)
  const isOwnDomain = hostname.includes('sinpepay') || hostname.includes('localhost') || hostname.includes('vercel.app')
  if (isOwnDomain) return NextResponse.next()

  // Check cache
  const now = Date.now()
  const cached = CACHE.get(hostname)
  if (cached && now - cached.ts < CACHE_TTL) {
    if (!cached.active) return NextResponse.next()
    const rewriteUrl = new URL(req.url)
    rewriteUrl.hostname = 'sinpepay.cr'
    const resp = NextResponse.rewrite(rewriteUrl)
    resp.headers.set('X-SINPEpay-Domain', hostname)
    return resp
  }

  // Query Supabase for active custom domain
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/custom_domains?domain=eq.${encodeURIComponent(hostname)}&status=eq.active&select=business_id`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
    )
    const data = await res.json()
    const domainRow = Array.isArray(data) ? data[0] : null

    CACHE.set(hostname, { active: !!domainRow, business_id: domainRow?.business_id, ts: now })

    if (!domainRow) return NextResponse.next()

    const rewriteUrl = new URL(req.url)
    rewriteUrl.hostname = 'sinpepay.cr'
    const resp = NextResponse.rewrite(rewriteUrl)
    resp.headers.set('X-SINPEpay-Domain', hostname)
    return resp
  } catch {
    return NextResponse.next()
  }
}

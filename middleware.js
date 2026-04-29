// Vercel Edge Middleware — custom domain routing for white-label
import { next, rewrite } from '@vercel/edge'

const CACHE = new Map()
const CACHE_TTL = 5 * 60 * 1000

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|icons|.*\\..*).*)'],
}

export default async function middleware(req) {
  const { hostname } = new URL(req.url)

  const isOwnDomain =
    hostname.includes('sinpepay') ||
    hostname.includes('localhost') ||
    hostname.includes('vercel.app')
  if (isOwnDomain) return next()

  const now = Date.now()
  const cached = CACHE.get(hostname)
  if (cached && now - cached.ts < CACHE_TTL) {
    if (!cached.active) return next()
    const dest = new URL(req.url)
    dest.hostname = 'sinpepay.cr'
    return rewrite(dest, { headers: { 'X-SINPEpay-Domain': hostname } })
  }

  const supabaseUrl  = process.env.VITE_SUPABASE_URL
  const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnon) return next()

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/custom_domains?domain=eq.${encodeURIComponent(hostname)}&status=eq.active&select=business_id`,
      { headers: { apikey: supabaseAnon, Authorization: `Bearer ${supabaseAnon}` } }
    )
    const data = await res.json()
    const domainRow = Array.isArray(data) ? data[0] : null

    CACHE.set(hostname, { active: !!domainRow, business_id: domainRow?.business_id, ts: now })

    if (!domainRow) return next()

    const dest = new URL(req.url)
    dest.hostname = 'sinpepay.cr'
    return rewrite(dest, { headers: { 'X-SINPEpay-Domain': hostname } })
  } catch {
    return next()
  }
}

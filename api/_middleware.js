import bcrypt from 'bcryptjs'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { adminClient } from './_lib/supabase.js'
import { effectivePlan, PLAN_LIMITS } from './_lib/plans.js'

let _redis = null
const ratelimiters = {}

function getRedis() {
  if (!_redis && process.env.UPSTASH_REDIS_REST_URL) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return _redis
}

function getRatelimiter(plan) {
  if (ratelimiters[plan]) return ratelimiters[plan]
  const redis = getRedis()
  if (!redis) return null
  const limit = PLAN_LIMITS[plan]?.api_rate ?? 100
  ratelimiters[plan] = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, '1 h'),
    prefix: `sinpepay:rl:${plan}`,
  })
  return ratelimiters[plan]
}

export async function authenticateApiKey(req) {
  const authHeader = req.headers.get?.('authorization') ?? req.headers['authorization'] ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token || !token.startsWith('sp_')) return { error: 'Missing or invalid API key', status: 401 }

  const supabase = adminClient()

  // Find by key prefix (first 8 chars after sp_live_ or sp_test_)
  const prefix = token.slice(0, 16)
  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, business_id, key_hash, permissions, environment, revoked_at, expires_at')
    .eq('key_prefix', prefix)
    .is('revoked_at', null)
    .limit(5)

  if (!keys?.length) return { error: 'Invalid API key', status: 401 }

  let matched = null
  for (const k of keys) {
    if (await bcrypt.compare(token, k.key_hash)) { matched = k; break }
  }
  if (!matched) return { error: 'Invalid API key', status: 401 }
  if (matched.expires_at && new Date(matched.expires_at) < new Date())
    return { error: 'API key expired', status: 401 }

  // Fetch business + plan
  const { data: business } = await supabase
    .from('businesses')
    .select('id, plan, plan_period_end, trial_end')
    .eq('id', matched.business_id)
    .single()
  if (!business) return { error: 'Business not found', status: 401 }

  const plan = effectivePlan(business)

  // Rate limiting (non-blocking if Redis not configured)
  const limiter = getRatelimiter(plan)
  if (limiter) {
    const { success, limit, remaining, reset } = await limiter.limit(matched.id)
    if (!success) return {
      error: 'Rate limit exceeded',
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(reset),
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
      },
    }
  }

  // Update last_used_at asynchronously (fire-and-forget)
  supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', matched.id).then(() => {})

  return { keyId: matched.id, businessId: matched.business_id, permissions: matched.permissions, plan }
}

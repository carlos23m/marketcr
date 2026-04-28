import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)

const RETRY_DELAYS = [60, 300, 1800] // seconds: 1min, 5min, 30min

interface FirePayload {
  business_id: string
  event_type:  string
  payload:     Record<string, unknown>
}

async function hmacSha256(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return 'sha256=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('')
}

async function deliver(endpoint: { id: string; url: string; secret: string }, eventType: string, payloadStr: string): Promise<{ code: number; body: string; duration: number }> {
  const deliveryId = crypto.randomUUID()
  const sig = await hmacSha256(endpoint.secret, payloadStr)
  const start = Date.now()
  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SINPEpay-Event': eventType,
        'X-SINPEpay-Signature': sig,
        'X-SINPEpay-Delivery': deliveryId,
      },
      body: payloadStr,
      signal: AbortSignal.timeout(10_000),
    })
    const text = await res.text().catch(() => '')
    return { code: res.status, body: text.slice(0, 500), duration: Date.now() - start }
  } catch (e) {
    return { code: 0, body: String(e), duration: Date.now() - start }
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let body: FirePayload
  try { body = await req.json() }
  catch { return new Response('Invalid JSON', { status: 400 }) }

  const { business_id, event_type, payload } = body
  if (!business_id || !event_type || !payload)
    return new Response('Missing fields', { status: 400 })

  // Get all enabled endpoints subscribed to this event
  const { data: endpoints } = await supabase
    .from('webhook_endpoints')
    .select('id, url, secret, failure_count')
    .eq('business_id', business_id)
    .eq('enabled', true)
    .contains('events', [event_type])

  if (!endpoints?.length) return new Response(JSON.stringify({ fired: 0 }), { headers: { 'Content-Type': 'application/json' } })

  const payloadStr = JSON.stringify({ event: event_type, ...payload, fired_at: new Date().toISOString() })

  await Promise.all(endpoints.map(async (ep) => {
    const result = await deliver(ep, event_type, payloadStr)
    const failed = result.code === 0 || result.code >= 500

    await supabase.from('webhook_deliveries').insert({
      endpoint_id:   ep.id,
      event_type,
      payload:       JSON.parse(payloadStr),
      response_code: result.code,
      response_body: result.body,
      duration_ms:   result.duration,
      failed,
    })

    // Track consecutive failures; disable after 10
    const newCount = failed ? (ep.failure_count ?? 0) + 1 : 0
    const updates: Record<string, unknown> = { failure_count: newCount }
    if (newCount >= 10) updates.enabled = false
    await supabase.from('webhook_endpoints').update(updates).eq('id', ep.id)
  }))

  return new Response(JSON.stringify({ fired: endpoints.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { adminClient } from '../../_lib/supabase.js'
import { planGte } from '../../_lib/plans.js'

const app = new Hono()

function ok(c, data, meta) { return c.json({ success: true, data, ...(meta && { meta }) }) }
function err(c, message, status = 400, code = 'ERROR', extra = {}) {
  return c.json({ success: false, error: { code, message, ...extra } }, status)
}

const VALID_EVENTS = [
  'payment.received','payment.link.created','payment.link.expired',
  'payment.link.paid','invoice.accepted','invoice.rejected',
]

// GET /api/v1/webhooks
app.get('/', async (c) => {
  const supabase = adminClient()
  const { data } = await supabase
    .from('webhook_endpoints')
    .select('id, url, events, enabled, failure_count, created_at')
    .eq('business_id', c.get('businessId'))
    .order('created_at', { ascending: false })
  return ok(c, data ?? [])
})

// POST /api/v1/webhooks
app.post('/', zValidator('json', z.object({
  url:    z.string().url(),
  events: z.array(z.enum(VALID_EVENTS)).min(1),
})), async (c) => {
  const plan = c.get('plan')
  if (!planGte(plan, 'pro'))
    return err(c, 'Webhooks require Pro plan or higher', 403, 'PLAN_REQUIRED', { upgradeUrl: '/configuracion/facturacion' })

  const supabase = adminClient()
  const businessId = c.get('businessId')

  // Check webhook limit for pro
  const { count } = await supabase.from('webhook_endpoints')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId).eq('enabled', true)
  const maxWebhooks = plan === 'pro' ? 3 : null
  if (maxWebhooks !== null && (count ?? 0) >= maxWebhooks)
    return err(c, `Webhook limit reached: ${maxWebhooks} for ${plan} plan`, 403, 'PLAN_LIMIT_REACHED', { upgradeUrl: '/configuracion/facturacion' })

  const body = c.req.valid('json')
  const secret = `whsec_${nanoid(32)}`

  const { data, error } = await supabase.from('webhook_endpoints').insert({
    business_id: businessId,
    url: body.url,
    events: body.events,
    secret,
    enabled: true,
  }).select('id, url, events, enabled, created_at').single()
  if (error) return err(c, 'Failed to create webhook', 500, 'DB_ERROR')

  // Send test ping
  try {
    await fetch(body.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-SINPEpay-Event': 'ping' },
      body: JSON.stringify({ event: 'ping', message: 'SINPEpay webhook connected' }),
      signal: AbortSignal.timeout(5000),
    })
  } catch (_) { /* ping failure is non-fatal */ }

  return c.json({ success: true, data: { ...data, secret } }, 201)
})

// DELETE /api/v1/webhooks/:id
app.delete('/:id', async (c) => {
  const supabase = adminClient()
  const { error } = await supabase.from('webhook_endpoints')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
  if (error) return err(c, 'Not found', 404, 'NOT_FOUND')
  return ok(c, { deleted: true })
})

// GET /api/v1/webhooks/:id/deliveries
app.get('/:id/deliveries', async (c) => {
  const supabase = adminClient()
  const { data: endpoint } = await supabase.from('webhook_endpoints')
    .select('id').eq('id', c.req.param('id')).eq('business_id', c.get('businessId')).single()
  if (!endpoint) return err(c, 'Endpoint not found', 404, 'NOT_FOUND')
  const { data } = await supabase.from('webhook_deliveries')
    .select('*').eq('endpoint_id', endpoint.id)
    .order('delivered_at', { ascending: false }).limit(50)
  return ok(c, data ?? [])
})

// POST /api/v1/webhooks/:id/redeliver/:delivery_id
app.post('/:id/redeliver/:delivery_id', async (c) => {
  const supabase = adminClient()
  const { data: delivery } = await supabase.from('webhook_deliveries')
    .select('*, webhook_endpoints(url, secret, business_id)')
    .eq('id', c.req.param('delivery_id'))
    .single()
  if (!delivery || delivery.webhook_endpoints?.business_id !== c.get('businessId'))
    return err(c, 'Delivery not found', 404, 'NOT_FOUND')
  // Re-fire webhook (simplified — no retry backoff for manual redeliver)
  const { url, secret } = delivery.webhook_endpoints
  try {
    const body = JSON.stringify(delivery.payload)
    const sig = await hmacSha256(secret, body)
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SINPEpay-Event': delivery.event_type,
        'X-SINPEpay-Signature': sig,
        'X-SINPEpay-Delivery': delivery.id,
      },
      body,
      signal: AbortSignal.timeout(10000),
    })
  } catch (e) {
    return err(c, 'Delivery failed: ' + e.message, 502, 'DELIVERY_FAILED')
  }
  return ok(c, { redelivered: true })
})

async function hmacSha256(secret, body) {
  const { createHmac } = await import('crypto')
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')
}

export default app

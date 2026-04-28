import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ONVO_SECRET      = Deno.env.get('ONVO_SECRET_KEY')!
const APP_URL          = Deno.env.get('APP_URL') || 'https://marketcr.vercel.app'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { link_id: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  if (!body.link_id) return json({ error: 'link_id required' }, 400)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
  const { data: link } = await supabase
    .from('payment_links')
    .select('id, monto, descripcion, estado, business_id, businesses(plan, plan_period_end, trial_end)')
    .eq('id', body.link_id)
    .single()

  if (!link) return json({ error: 'Link not found' }, 404)
  if (link.estado !== 'activo') return json({ error: 'Link is not active' }, 409)

  // Verify business has card payments enabled (Pro+)
  const biz = (link as any).businesses
  const now = new Date()
  const effectivePlan = (biz?.trial_end && new Date(biz.trial_end) > now)
    ? biz.plan
    : (biz?.plan_period_end && new Date(biz.plan_period_end) > now)
    ? biz.plan
    : 'starter'

  if (effectivePlan === 'starter') return json({ error: 'Card payments require Pro plan' }, 403)

  try {
    const res = await fetch('https://api.onvopay.com/v1/payment-intents', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ONVO_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: link.monto,
        currency: 'CRC',
        description: link.descripcion,
        metadata: { link_id: link.id, business_id: link.business_id },
      }),
    })
    if (!res.ok) throw new Error(await res.text())
    const intent = await res.json()
    return json({ clientSecret: intent.client_secret, id: intent.id })
  } catch (e) {
    console.error('Onvopay payment intent error:', e)
    return json({ error: 'Error al iniciar pago' }, 502)
  }
})

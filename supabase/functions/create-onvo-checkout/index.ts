import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON    = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ONVO_SECRET      = Deno.env.get('ONVO_SECRET_KEY')!
const APP_URL          = Deno.env.get('APP_URL') || 'https://marketcr.vercel.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)

const CORS = {
  'Access-Control-Allow-Origin':  APP_URL,
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })
}

async function onvo(path: string, method: string, body?: unknown) {
  const res = await fetch(`https://api.onvopay.com/v1${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${ONVO_SECRET}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Onvopay ${path} ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

  const { data: profile } = await supabase.from('profiles').select('business_id').eq('id', user.id).single()
  if (!profile?.business_id) return json({ error: 'No business' }, 403)

  const { data: business } = await supabase.from('businesses')
    .select('id, nombre, onvo_customer_id')
    .eq('id', profile.business_id).single()
  if (!business) return json({ error: 'Business not found' }, 404)

  let body: { plan: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  if (!['pro','business'].includes(body.plan)) return json({ error: 'Invalid plan' }, 400)

  const priceId = body.plan === 'pro'
    ? Deno.env.get('ONVO_PRO_PRICE_ID')
    : Deno.env.get('ONVO_BUSINESS_PRICE_ID')
  if (!priceId) return json({ error: 'Price not configured' }, 500)

  try {
    // Create or retrieve Onvopay customer
    let customerId = business.onvo_customer_id
    if (!customerId) {
      const { data: userRec } = await supabase.auth.admin.getUserById(user.id)
      const customer = await onvo('/customers', 'POST', {
        email: userRec?.user?.email ?? user.email,
        name: business.nombre,
      })
      customerId = customer.id
      await supabase.from('businesses').update({ onvo_customer_id: customerId }).eq('id', business.id)
    }

    // Create checkout session
    const session = await onvo('/checkout/sessions', 'POST', {
      customerId,
      items: [{ priceId, quantity: 1 }],
      successUrl: `${APP_URL}/configuracion/facturacion?upgraded=true`,
      cancelUrl:  `${APP_URL}/configuracion/facturacion`,
    })

    return json({ url: session.url })
  } catch (e) {
    console.error('Onvopay checkout error:', e)
    return json({ error: 'Error al procesar pago. Intente de nuevo.' }, 502)
  }
})

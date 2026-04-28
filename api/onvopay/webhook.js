import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

function verifySignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(sigHeader, 'hex'), Buffer.from(expected, 'hex'))
  } catch { return false }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })

  const sig = req.headers['onvopay-signature'] ?? req.headers['x-onvopay-signature'] ?? ''
  const webhookSecret = process.env.ONVO_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('ONVO_WEBHOOK_SECRET not configured — rejecting Onvopay webhook')
    return res.status(403).json({ error: 'Webhook not configured' })
  }
  if (!verifySignature(rawBody, sig, webhookSecret)) {
    return res.status(400).json({ error: 'Invalid signature' })
  }

  let event
  try { event = JSON.parse(rawBody) }
  catch { return res.status(400).json({ error: 'Invalid JSON' }) }

  const { type, data } = event
  console.log('Onvopay event:', type, data?.id)

  try {
    switch (type) {
      case 'payment-intent.succeeded':
        await handlePaymentSucceeded(data)
        break
      case 'subscription.updated':
        await handleSubscriptionUpdated(data)
        break
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(data)
        break
      case 'payment-intent.failed':
        await handlePaymentFailed(data)
        break
      default:
        console.log('Unhandled Onvopay event type:', type)
    }
  } catch (e) {
    console.error('Error processing Onvopay event:', e)
    return res.status(500).json({ error: 'Processing error' })
  }

  return res.status(200).json({ received: true })
}

async function handlePaymentSucceeded(data) {
  if (!data?.metadata?.subscription_id) return
  const { subscription_id, business_id, plan } = data.metadata
  if (!business_id || !plan) return

  const periodEnd = data.current_period_end
    ? new Date(data.current_period_end * 1000)
    : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d })()

  await supabase.from('businesses').update({
    plan,
    onvo_subscription_id: subscription_id ?? null,
    plan_period_end: periodEnd.toISOString(),
  }).eq('id', business_id)

  // TODO: send welcome email via Resend when RESEND_API_KEY is set
}

async function handleSubscriptionUpdated(data) {
  const { customer, status, items, current_period_end } = data
  const { data: business } = await supabase.from('businesses')
    .select('id').eq('onvo_customer_id', customer).single()
  if (!business) return

  const plan = items?.[0]?.price?.id === process.env.ONVO_BUSINESS_PRICE_ID ? 'business' : 'pro'
  const updates = { plan, onvo_subscription_id: data.id }
  if (current_period_end) updates.plan_period_end = new Date(current_period_end * 1000).toISOString()

  await supabase.from('businesses').update(updates).eq('id', business.id)
}

async function handleSubscriptionCancelled(data) {
  const { customer, current_period_end } = data
  const { data: business } = await supabase.from('businesses')
    .select('id').eq('onvo_customer_id', customer).single()
  if (!business) return

  // Downgrade at period end (keep plan until then)
  if (current_period_end) {
    await supabase.from('businesses')
      .update({ plan_period_end: new Date(current_period_end * 1000).toISOString() })
      .eq('id', business.id)
  } else {
    await supabase.from('businesses')
      .update({ plan: 'starter', plan_period_end: null, onvo_subscription_id: null })
      .eq('id', business.id)
  }
  // TODO: send "plan ends on X" email
}

async function handlePaymentFailed(data) {
  const { customer } = data
  if (!customer) return
  // TODO: send payment failure email + set flag for in-app warning
  console.log('Payment failed for customer:', customer)
}

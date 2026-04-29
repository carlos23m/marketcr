import { Hono } from 'hono'
import { adminClient } from '../../_lib/supabase.js'
import { effectivePlan, PLAN_LIMITS } from '../../_lib/plans.js'

const app = new Hono()

function ok(c, data) { return c.json({ success: true, data }) }
function err(c, message, status = 400, code = 'ERROR') {
  return c.json({ success: false, error: { code, message } }, status)
}

// GET /api/v1/me
app.get('/', async (c) => {
  const supabase = adminClient()
  const businessId = c.get('businessId')

  const [{ data: business }, { data: usage }] = await Promise.all([
    supabase.from('businesses')
      .select('id, nombre, plan, plan_period_end, trial_end, onvo_customer_id, onvo_subscription_id, created_at')
      .eq('id', businessId).single(),
    (async () => {
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
      const [{ count: links }, { count: txns }, { count: invoices }] = await Promise.all([
        supabase.from('payment_links').select('id', { count: 'exact', head: true })
          .eq('business_id', businessId).gte('created_at', startOfMonth.toISOString()),
        supabase.from('transactions').select('id', { count: 'exact', head: true })
          .eq('business_id', businessId).gte('created_at', startOfMonth.toISOString()),
        supabase.from('invoices').select('id', { count: 'exact', head: true })
          .eq('business_id', businessId).gte('created_at', startOfMonth.toISOString()),
      ])
      return { data: { links_this_month: links ?? 0, txns_this_month: txns ?? 0, invoices_this_month: invoices ?? 0 } }
    })(),
  ])

  if (!business) return err(c, 'Business not found', 404, 'NOT_FOUND')
  const plan = effectivePlan(business)
  const limits = PLAN_LIMITS[plan]

  return ok(c, {
    business: { ...business, effective_plan: plan },
    usage: usage,
    limits,
  })
})

export default app

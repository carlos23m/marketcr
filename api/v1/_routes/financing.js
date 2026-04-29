import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { adminClient } from '../../_lib/supabase.js'
import { planGte } from '../../_lib/plans.js'

const app = new Hono()

function ok(c, data, meta) { return c.json({ success: true, data, ...(meta && { meta }) }) }
function err(c, message, status = 400, code = 'ERROR') {
  return c.json({ success: false, error: { code, message } }, status)
}

// All financing routes require pro or business plan
app.use('*', async (c, next) => {
  if (!planGte(c.get('plan'), 'pro'))
    return err(c, 'Financing requires Pro or Business plan', 403, 'PLAN_REQUIRED')
  await next()
})

// GET /api/v1/financing — list applications for this business
app.get('/', async (c) => {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('financing_applications')
    .select('id, status, amount_requested, amount_approved, amount_remaining, repayment_rate, purpose, created_at, disbursed_at')
    .eq('business_id', c.get('businessId'))
    .order('created_at', { ascending: false })
  if (error) return err(c, 'DB error', 500, 'DB_ERROR')
  return ok(c, data)
})

// GET /api/v1/financing/:id — single application with repayments
app.get('/:id', async (c) => {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('financing_applications')
    .select('*, financing_repayments(id, amount, withheld_at, transaction_id)')
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .single()
  if (error || !data) return err(c, 'Application not found', 404, 'NOT_FOUND')
  return ok(c, data)
})

// POST /api/v1/financing — submit a new application
app.post('/', zValidator('json', z.object({
  amount_requested: z.number().int().min(100_000).max(5_000_000),
  repayment_rate:   z.number().min(0.08).max(0.18),
  purpose:          z.string().min(5).max(500),
  monthly_revenue_avg: z.number().int().positive().optional(),
})), async (c) => {
  const body = c.req.valid('json')
  const businessId = c.get('businessId')
  const supabase = adminClient()

  // Only one active application at a time
  const { data: existing } = await supabase
    .from('financing_applications')
    .select('id, status')
    .eq('business_id', businessId)
    .in('status', ['pending', 'under_review', 'approved', 'disbursed'])
    .maybeSingle()
  if (existing)
    return err(c, 'An active application already exists', 409, 'DUPLICATE_APPLICATION')

  const { data, error } = await supabase
    .from('financing_applications')
    .insert({
      business_id: businessId,
      amount_requested: body.amount_requested,
      amount_remaining: body.amount_requested,
      repayment_rate: body.repayment_rate,
      purpose: body.purpose.trim(),
      monthly_revenue_avg: body.monthly_revenue_avg ?? null,
      status: 'pending',
    })
    .select()
    .single()
  if (error) return err(c, 'Failed to submit application', 500, 'DB_ERROR')
  return c.json({ success: true, data }, 201)
})

export default app

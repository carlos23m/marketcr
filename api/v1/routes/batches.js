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

app.use('*', async (c, next) => {
  if (!planGte(c.get('plan'), 'pro'))
    return err(c, 'Bulk payments require Pro or Business plan', 403, 'PLAN_REQUIRED')
  await next()
})

const paymentSchema = z.object({
  recipient_name: z.string().min(1).max(150),
  sinpe_numero:   z.string().min(8).max(20),
  amount:         z.number().int().min(1),
  concept:        z.string().max(200).optional(),
})

// GET /api/v1/batches
app.get('/', async (c) => {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('payment_batches')
    .select('id, name, total_amount, status, scheduled_for, processed_at, created_at')
    .eq('business_id', c.get('businessId'))
    .order('created_at', { ascending: false })
  if (error) return err(c, 'DB error', 500, 'DB_ERROR')
  return ok(c, data)
})

// GET /api/v1/batches/:id — with payments
app.get('/:id', async (c) => {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('payment_batches')
    .select('*, batch_payments(*)')
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .single()
  if (error || !data) return err(c, 'Batch not found', 404, 'NOT_FOUND')
  return ok(c, data)
})

// POST /api/v1/batches — create batch with payments
app.post('/', zValidator('json', z.object({
  name:          z.string().min(1).max(200),
  payments:      z.array(paymentSchema).min(1).max(500),
  scheduled_for: z.string().datetime().optional(),
})), async (c) => {
  const body = c.req.valid('json')
  const businessId = c.get('businessId')
  const supabase = adminClient()
  const total = body.payments.reduce((s, p) => s + p.amount, 0)

  const { data: batch, error: bErr } = await supabase
    .from('payment_batches')
    .insert({
      business_id: businessId,
      name: body.name.trim(),
      total_amount: total,
      scheduled_for: body.scheduled_for ?? null,
    })
    .select()
    .single()
  if (bErr) return err(c, 'Failed to create batch', 500, 'DB_ERROR')

  const payments = body.payments.map(p => ({ ...p, batch_id: batch.id }))
  const { error: pErr } = await supabase.from('batch_payments').insert(payments)
  if (pErr) return err(c, 'Failed to add payments to batch', 500, 'DB_ERROR')

  return c.json({ success: true, data: batch }, 201)
})

// PATCH /api/v1/batches/:id — update status or mark payment sent/failed
app.patch('/:id', zValidator('json', z.object({
  status:     z.enum(['processing','completed','failed']).optional(),
  payment_id: z.string().uuid().optional(),
  payment_status: z.enum(['sent','failed']).optional(),
  error:      z.string().max(200).optional(),
})), async (c) => {
  const body = c.req.valid('json')
  const supabase = adminClient()
  const batchId = c.req.param('id')

  // Verify ownership
  const { data: batch } = await supabase
    .from('payment_batches')
    .select('id, status')
    .eq('id', batchId)
    .eq('business_id', c.get('businessId'))
    .single()
  if (!batch) return err(c, 'Batch not found', 404, 'NOT_FOUND')

  if (body.status) {
    const updates = { status: body.status }
    if (body.status === 'completed') updates.processed_at = new Date().toISOString()
    await supabase.from('payment_batches').update(updates).eq('id', batchId)
  }

  if (body.payment_id && body.payment_status) {
    const updates = { status: body.payment_status }
    if (body.payment_status === 'sent') updates.sent_at = new Date().toISOString()
    if (body.error) updates.error = body.error
    await supabase.from('batch_payments').update(updates).eq('id', body.payment_id).eq('batch_id', batchId)
  }

  const { data: updated } = await supabase
    .from('payment_batches').select('*, batch_payments(*)').eq('id', batchId).single()
  return ok(c, updated)
})

// DELETE /api/v1/batches/:id — only draft batches
app.delete('/:id', async (c) => {
  const supabase = adminClient()
  const { data } = await supabase
    .from('payment_batches')
    .select('id, status')
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .single()
  if (!data) return err(c, 'Batch not found', 404, 'NOT_FOUND')
  if (data.status !== 'draft') return err(c, 'Only draft batches can be deleted', 409, 'INVALID_STATE')
  await supabase.from('payment_batches').delete().eq('id', data.id)
  return ok(c, { deleted: true })
})

export default app

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { adminClient } from '../../_lib/supabase.js'

const app = new Hono()

function ok(c, data, meta) { return c.json({ success: true, data, ...(meta && { meta }) }) }
function err(c, message, status = 400, code = 'ERROR') {
  return c.json({ success: false, error: { code, message } }, status)
}

const PAGE_SIZE = 20

// GET /api/v1/transactions
app.get('/', async (c) => {
  const { page: pageStr = '1', limit: limitStr = String(PAGE_SIZE), banco, link_id, desde, hasta } = c.req.query()
  const page  = Math.max(1, parseInt(pageStr))
  const limit = Math.min(100, Math.max(1, parseInt(limitStr)))
  const supabase = adminClient()
  let q = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('business_id', c.get('businessId'))
    .order('fecha', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  if (banco)   q = q.eq('banco', banco)
  if (link_id) q = q.eq('payment_link_id', link_id)
  if (desde)   q = q.gte('fecha', desde)
  if (hasta)   q = q.lte('fecha', hasta)
  const { data, error, count } = await q
  if (error) return err(c, 'DB error', 500, 'DB_ERROR')
  return ok(c, data, { page, total: count, limit })
})

// GET /api/v1/transactions/:id
app.get('/:id', async (c) => {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .single()
  if (error || !data) return err(c, 'Transaction not found', 404, 'NOT_FOUND')
  return ok(c, data)
})

// POST /api/v1/transactions  (manual recording)
app.post('/', zValidator('json', z.object({
  monto:           z.number().int().positive(),
  nombre_remitente: z.string().min(1).max(150),
  banco:           z.string().min(1).max(80),
  fecha:           z.string().datetime().optional(),
  referencia:      z.string().max(100).optional(),
  payment_link_id: z.string().max(16).optional(),
  notas:           z.string().max(500).optional(),
})), async (c) => {
  const body = c.req.valid('json')
  const businessId = c.get('businessId')
  const supabase = adminClient()

  // If linking to a payment link, verify ownership
  if (body.payment_link_id) {
    const { data: link } = await supabase
      .from('payment_links')
      .select('id, business_id')
      .eq('id', body.payment_link_id)
      .single()
    if (!link || link.business_id !== businessId)
      return err(c, 'Payment link not found', 404, 'NOT_FOUND')
  }

  const { data, error } = await supabase.from('transactions').insert({
    business_id: businessId,
    monto: body.monto,
    nombre_remitente: body.nombre_remitente.trim(),
    banco: body.banco.trim(),
    fecha: body.fecha ?? new Date().toISOString(),
    referencia: body.referencia ?? null,
    payment_link_id: body.payment_link_id ?? null,
    notas: body.notas ?? null,
    parse_method: 'api',
  }).select().single()
  if (error) return err(c, 'Failed to create transaction', 500, 'DB_ERROR')
  return c.json({ success: true, data }, 201)
})

export default app

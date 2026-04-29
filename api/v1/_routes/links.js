import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { adminClient } from '../../_lib/supabase.js'
import { PLAN_LIMITS, planGte } from '../../_lib/plans.js'

const app = new Hono()

function ok(c, data, meta) { return c.json({ success: true, data, ...(meta && { meta }) }) }
function err(c, message, status = 400, code = 'ERROR', extra = {}) {
  return c.json({ success: false, error: { code, message, ...extra } }, status)
}

const PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

// GET /api/v1/links
app.get('/', async (c) => {
  const { estado, page: pageStr = '1', limit: limitStr = String(PAGE_SIZE) } = c.req.query()
  const page  = Math.max(1, parseInt(pageStr))
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limitStr)))
  const supabase = adminClient()
  let q = supabase
    .from('payment_links')
    .select('*', { count: 'exact' })
    .eq('business_id', c.get('businessId'))
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  if (estado) q = q.eq('estado', estado)
  const { data, error, count } = await q
  if (error) return err(c, 'DB error', 500, 'DB_ERROR')
  return ok(c, data, { page, total: count, limit })
})

// POST /api/v1/links
app.post('/', zValidator('json', z.object({
  descripcion: z.string().min(3).max(200),
  monto:       z.number().int().min(100).max(99_999_999),
  cliente:     z.string().max(100).optional(),
  vencimiento: z.string().datetime().optional().refine(v => !v || new Date(v) > new Date(), {
    message: 'vencimiento must be in the future',
  }),
  notas:       z.string().max(500).optional(),
})), async (c) => {
  const body = c.req.valid('json')
  const businessId = c.get('businessId')
  const plan = c.get('plan')

  // Enforce monthly link limit for starter
  const limit = PLAN_LIMITS[plan]?.links_per_month
  if (limit !== null && limit !== undefined) {
    const supabase = adminClient()
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
    const { count } = await supabase
      .from('payment_links')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('created_at', startOfMonth.toISOString())
    if ((count ?? 0) >= limit)
      return err(c, `Plan limit reached: ${limit} links/month on ${plan} plan`, 403, 'PLAN_LIMIT_REACHED',
        { limit, current: count, plan, upgradeUrl: '/configuracion/facturacion' })
  }

  const idempotencyKey = c.req.header('Idempotency-Key')
  const supabase = adminClient()

  // Idempotency: check for existing link with same key
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('payment_links')
      .select('*')
      .eq('business_id', businessId)
      .eq('notas', `__idempotency:${idempotencyKey}`)
      .maybeSingle()
    if (existing) return ok(c, existing)
  }

  const id = nanoid(8)
  const payload = {
    id,
    business_id: businessId,
    descripcion: body.descripcion.trim(),
    monto: body.monto,
    cliente: body.cliente ?? null,
    vencimiento: body.vencimiento ?? null,
    notas: idempotencyKey ? `__idempotency:${idempotencyKey}` : (body.notas ?? null),
    estado: 'activo',
  }
  const { data, error } = await supabase.from('payment_links').insert(payload).select().single()
  if (error) return err(c, 'Failed to create link', 500, 'DB_ERROR')
  return c.json({ success: true, data }, 201)
})

// GET /api/v1/links/:id
app.get('/:id', async (c) => {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('payment_links')
    .select('*')
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .single()
  if (error || !data) return err(c, 'Link not found', 404, 'NOT_FOUND')
  return ok(c, data)
})

// PATCH /api/v1/links/:id
app.patch('/:id', zValidator('json', z.object({
  estado: z.enum(['pagado']).optional(),
  notas:  z.string().max(500).optional(),
}).refine(b => Object.keys(b).length > 0, { message: 'At least one field required' })), async (c) => {
  const body = c.req.valid('json')
  const supabase = adminClient()
  const updates = {}
  if (body.estado === 'pagado') { updates.estado = 'pagado'; updates.pagado_en = new Date().toISOString() }
  if (body.notas !== undefined) updates.notas = body.notas
  const { data, error } = await supabase
    .from('payment_links')
    .update(updates)
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .select()
    .single()
  if (error || !data) return err(c, 'Link not found', 404, 'NOT_FOUND')
  return ok(c, data)
})

// DELETE /api/v1/links/:id
app.delete('/:id', async (c) => {
  const supabase = adminClient()
  // Block delete if linked to a transaction
  const { data: link } = await supabase
    .from('payment_links')
    .select('id, transaction_id')
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .single()
  if (!link) return err(c, 'Link not found', 404, 'NOT_FOUND')
  if (link.transaction_id) return err(c, 'Cannot delete a paid link', 409, 'HAS_TRANSACTION')
  await supabase.from('payment_links').delete().eq('id', link.id)
  return ok(c, { deleted: true })
})

export default app

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { adminClient } from '../../_lib/supabase.js'
import { planGte } from '../../_lib/plans.js'

const app = new Hono()

function ok(c, data) { return c.json({ success: true, data }) }
function err(c, message, status = 400, code = 'ERROR') {
  return c.json({ success: false, error: { code, message } }, status)
}

app.use('*', async (c, next) => {
  if (!planGte(c.get('plan'), 'pro'))
    return err(c, 'Recipients require Pro or Business plan', 403, 'PLAN_REQUIRED')
  await next()
})

const recipientSchema = z.object({
  nombre:       z.string().min(1).max(150),
  sinpe_numero: z.string().min(8).max(20),
  categoria:    z.enum(['proveedor','empleado','contratista','otro']).optional(),
  notas:        z.string().max(300).optional(),
})

// GET /api/v1/recipients
app.get('/', async (c) => {
  const { categoria } = c.req.query()
  const supabase = adminClient()
  let q = supabase
    .from('recipients')
    .select('*')
    .eq('business_id', c.get('businessId'))
    .order('nombre')
  if (categoria) q = q.eq('categoria', categoria)
  const { data, error } = await q
  if (error) return err(c, 'DB error', 500, 'DB_ERROR')
  return ok(c, data)
})

// POST /api/v1/recipients
app.post('/', zValidator('json', recipientSchema), async (c) => {
  const body = c.req.valid('json')
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('recipients')
    .insert({
      business_id:  c.get('businessId'),
      nombre:       body.nombre.trim(),
      sinpe_numero: body.sinpe_numero.trim(),
      categoria:    body.categoria ?? null,
      notas:        body.notas ?? null,
    })
    .select()
    .single()
  if (error?.code === '23505') return err(c, 'This SINPE number is already in your recipient list', 409, 'DUPLICATE')
  if (error) return err(c, 'Failed to create recipient', 500, 'DB_ERROR')
  return c.json({ success: true, data }, 201)
})

// PATCH /api/v1/recipients/:id
app.patch('/:id', zValidator('json', recipientSchema.partial()), async (c) => {
  const body = c.req.valid('json')
  const supabase = adminClient()
  const updates = {}
  if (body.nombre)       updates.nombre       = body.nombre.trim()
  if (body.sinpe_numero) updates.sinpe_numero = body.sinpe_numero.trim()
  if (body.categoria !== undefined) updates.categoria = body.categoria
  if (body.notas !== undefined)     updates.notas     = body.notas
  const { data, error } = await supabase
    .from('recipients')
    .update(updates)
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .select()
    .single()
  if (error || !data) return err(c, 'Recipient not found', 404, 'NOT_FOUND')
  return ok(c, data)
})

// DELETE /api/v1/recipients/:id
app.delete('/:id', async (c) => {
  const supabase = adminClient()
  const { data } = await supabase
    .from('recipients')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .select('id')
  if (!data?.length) return err(c, 'Recipient not found', 404, 'NOT_FOUND')
  return ok(c, { deleted: true })
})

export default app

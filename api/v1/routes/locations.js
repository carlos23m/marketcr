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
  if (!planGte(c.get('plan'), 'business'))
    return err(c, 'Multi-location requires Business plan', 403, 'PLAN_REQUIRED')
  await next()
})

const locationSchema = z.object({
  nombre:       z.string().min(1).max(150),
  direccion:    z.string().max(300).optional(),
  sinpe_numero: z.string().max(20).optional(),
  is_main:      z.boolean().optional(),
  activo:       z.boolean().optional(),
})

// GET /api/v1/locations
app.get('/', async (c) => {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('business_id', c.get('businessId'))
    .order('is_main', { ascending: false })
    .order('nombre')
  if (error) return err(c, 'DB error', 500, 'DB_ERROR')
  return ok(c, data)
})

// POST /api/v1/locations
app.post('/', zValidator('json', locationSchema), async (c) => {
  const body = c.req.valid('json')
  const businessId = c.get('businessId')
  const supabase = adminClient()

  // If setting as main, clear existing main
  if (body.is_main) {
    await supabase.from('locations').update({ is_main: false }).eq('business_id', businessId)
  }

  const { data, error } = await supabase
    .from('locations')
    .insert({
      business_id:  businessId,
      nombre:       body.nombre.trim(),
      direccion:    body.direccion ?? null,
      sinpe_numero: body.sinpe_numero ?? null,
      is_main:      body.is_main ?? false,
    })
    .select()
    .single()
  if (error) return err(c, 'Failed to create location', 500, 'DB_ERROR')
  return c.json({ success: true, data }, 201)
})

// PATCH /api/v1/locations/:id
app.patch('/:id', zValidator('json', locationSchema.partial()), async (c) => {
  const body = c.req.valid('json')
  const businessId = c.get('businessId')
  const supabase = adminClient()

  if (body.is_main) {
    await supabase.from('locations').update({ is_main: false }).eq('business_id', businessId)
  }

  const { data, error } = await supabase
    .from('locations')
    .update(body)
    .eq('id', c.req.param('id'))
    .eq('business_id', businessId)
    .select()
    .single()
  if (error || !data) return err(c, 'Location not found', 404, 'NOT_FOUND')
  return ok(c, data)
})

// DELETE /api/v1/locations/:id
app.delete('/:id', async (c) => {
  const supabase = adminClient()
  const { data: loc } = await supabase
    .from('locations').select('id, is_main').eq('id', c.req.param('id')).eq('business_id', c.get('businessId')).single()
  if (!loc) return err(c, 'Location not found', 404, 'NOT_FOUND')
  if (loc.is_main) return err(c, 'Cannot delete the main location', 409, 'MAIN_LOCATION')
  await supabase.from('locations').delete().eq('id', loc.id)
  return ok(c, { deleted: true })
})

// PUT /api/v1/locations/:id/staff — assign staff (profile IDs) to location
app.put('/:id/staff', zValidator('json', z.object({
  profile_ids: z.array(z.string().uuid()),
})), async (c) => {
  const { profile_ids } = c.req.valid('json')
  const locationId = c.req.param('id')
  const supabase = adminClient()

  // Verify location belongs to this business
  const { data: loc } = await supabase
    .from('locations').select('id').eq('id', locationId).eq('business_id', c.get('businessId')).single()
  if (!loc) return err(c, 'Location not found', 404, 'NOT_FOUND')

  // Replace all assignments for this location
  await supabase.from('profile_locations').delete().eq('location_id', locationId)
  if (profile_ids.length) {
    await supabase.from('profile_locations').insert(profile_ids.map(id => ({ profile_id: id, location_id: locationId })))
  }
  return ok(c, { updated: true })
})

export default app

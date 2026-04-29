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
  if (!planGte(c.get('plan'), 'business'))
    return err(c, 'Payroll requires Business plan', 403, 'PLAN_REQUIRED')
  await next()
})

// ── Employees ─────────────────────────────────────────────────────────

app.get('/employees', async (c) => {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('payroll_employees')
    .select('*')
    .eq('business_id', c.get('businessId'))
    .order('nombre')
  if (error) return err(c, 'DB error', 500, 'DB_ERROR')
  return ok(c, data)
})

app.post('/employees', zValidator('json', z.object({
  nombre:        z.string().min(1).max(150),
  sinpe_numero:  z.string().min(8).max(20),
  salario_bruto: z.number().int().positive(),
  tipo:          z.enum(['planilla','freelance','temporal']).optional(),
  location_id:   z.string().uuid().optional(),
})), async (c) => {
  const body = c.req.valid('json')
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('payroll_employees')
    .insert({
      business_id:   c.get('businessId'),
      nombre:        body.nombre.trim(),
      sinpe_numero:  body.sinpe_numero.trim(),
      salario_bruto: body.salario_bruto,
      tipo:          body.tipo ?? 'planilla',
      location_id:   body.location_id ?? null,
    })
    .select()
    .single()
  if (error) return err(c, 'Failed to create employee', 500, 'DB_ERROR')
  return c.json({ success: true, data }, 201)
})

app.patch('/employees/:id', zValidator('json', z.object({
  nombre:        z.string().min(1).max(150).optional(),
  sinpe_numero:  z.string().min(8).max(20).optional(),
  salario_bruto: z.number().int().positive().optional(),
  tipo:          z.enum(['planilla','freelance','temporal']).optional(),
  activo:        z.boolean().optional(),
  location_id:   z.string().uuid().nullable().optional(),
})), async (c) => {
  const body = c.req.valid('json')
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('payroll_employees')
    .update(body)
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .select()
    .single()
  if (error || !data) return err(c, 'Employee not found', 404, 'NOT_FOUND')
  return ok(c, data)
})

app.delete('/employees/:id', async (c) => {
  const supabase = adminClient()
  const { data } = await supabase
    .from('payroll_employees')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .select('id')
  if (!data?.length) return err(c, 'Employee not found', 404, 'NOT_FOUND')
  return ok(c, { deleted: true })
})

// ── Payroll Runs ──────────────────────────────────────────────────────

app.get('/runs', async (c) => {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('payroll_runs')
    .select('id, periodo, frecuencia, total_bruto, total_neto, status, created_at, location_id')
    .eq('business_id', c.get('businessId'))
    .order('created_at', { ascending: false })
  if (error) return err(c, 'DB error', 500, 'DB_ERROR')
  return ok(c, data)
})

app.get('/runs/:id', async (c) => {
  const supabase = adminClient()
  const { data, error } = await supabase
    .from('payroll_runs')
    .select('*, payroll_payments(*, payroll_employees(nombre, sinpe_numero))')
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
    .single()
  if (error || !data) return err(c, 'Run not found', 404, 'NOT_FOUND')
  return ok(c, data)
})

app.post('/runs', zValidator('json', z.object({
  periodo:     z.string().min(4).max(20),
  frecuencia:  z.enum(['semanal','quincenal','mensual']),
  location_id: z.string().uuid().optional(),
  overrides:   z.record(z.object({ deducciones: z.number().int().min(0) })).optional(),
})), async (c) => {
  const body = c.req.valid('json')
  const businessId = c.get('businessId')
  const supabase = adminClient()

  let empQ = supabase
    .from('payroll_employees')
    .select('id, nombre, sinpe_numero, salario_bruto, tipo, frecuencia_pago')
    .eq('business_id', businessId)
    .eq('activo', true)
  if (body.location_id) empQ = empQ.eq('location_id', body.location_id)
  const { data: employees } = await empQ
  if (!employees?.length) return err(c, 'No active employees found', 400, 'NO_EMPLOYEES')

  const overrides = body.overrides ?? {}
  const payments = employees.map(e => {
    const deduccion = overrides[e.id]?.deducciones ?? 0
    const bruto = e.salario_bruto
    const neto  = Math.max(0, bruto - deduccion)
    return { employee_id: e.id, monto_bruto: bruto, deducciones: deduccion, monto_neto: neto }
  })

  const totalBruto = payments.reduce((s, p) => s + p.monto_bruto, 0)
  const totalNeto  = payments.reduce((s, p) => s + p.monto_neto, 0)

  const { data: run, error: rErr } = await supabase
    .from('payroll_runs')
    .insert({
      business_id: businessId,
      periodo: body.periodo,
      frecuencia: body.frecuencia,
      total_bruto: totalBruto,
      total_neto: totalNeto,
      location_id: body.location_id ?? null,
    })
    .select()
    .single()
  if (rErr) return err(c, 'Failed to create run', 500, 'DB_ERROR')

  await supabase.from('payroll_payments').insert(payments.map(p => ({ ...p, run_id: run.id })))

  return c.json({ success: true, data: run }, 201)
})

// Mark individual payment as sent/failed
app.patch('/runs/:id/payments/:paymentId', zValidator('json', z.object({
  status: z.enum(['enviado','fallido']),
})), async (c) => {
  const { status } = c.req.valid('json')
  const supabase = adminClient()
  const { data: run } = await supabase
    .from('payroll_runs').select('id').eq('id', c.req.param('id')).eq('business_id', c.get('businessId')).single()
  if (!run) return err(c, 'Run not found', 404, 'NOT_FOUND')
  const { data } = await supabase
    .from('payroll_payments').update({ status }).eq('id', c.req.param('paymentId')).eq('run_id', run.id).select().single()
  if (!data) return err(c, 'Payment not found', 404, 'NOT_FOUND')
  return ok(c, data)
})

export default app

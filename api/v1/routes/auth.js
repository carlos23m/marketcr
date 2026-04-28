import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { adminClient, userClient } from '../../_lib/supabase.js'

const app = new Hono()

function ok(c, data) { return c.json({ success: true, data }) }
function err(c, message, status = 400, code = 'ERROR') {
  return c.json({ success: false, error: { code, message } }, status)
}

// All key-management routes require Supabase session (not API key auth)
async function requireSession(c, next) {
  const authHeader = c.req.header('Authorization') ?? ''
  if (!authHeader) return err(c, 'Unauthorized', 401, 'UNAUTHORIZED')
  const client = userClient(authHeader)
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return err(c, 'Unauthorized', 401, 'UNAUTHORIZED')
  const supabase = adminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id, rol')
    .eq('id', user.id)
    .single()
  if (!profile?.business_id) return err(c, 'No business found', 403, 'NO_BUSINESS')
  c.set('userId', user.id)
  c.set('businessId', profile.business_id)
  c.set('rol', profile.rol)
  await next()
}

app.use('*', requireSession)

// GET /api/v1/keys
app.get('/', async (c) => {
  const supabase = adminClient()
  const { data } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, permissions, environment, last_used_at, expires_at, revoked_at, created_at')
    .eq('business_id', c.get('businessId'))
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
  return ok(c, data ?? [])
})

// POST /api/v1/keys
app.post('/', zValidator('json', z.object({
  name:        z.string().min(1).max(80),
  permissions: z.array(z.string()).default(['links:read','txns:read']),
  environment: z.enum(['live','test']).default('live'),
  expires_at:  z.string().datetime().optional(),
})), async (c) => {
  const body = c.req.valid('json')
  const env = body.environment
  const rawKey = `sp_${env}_${nanoid(32)}`
  const prefix = rawKey.slice(0, 16)
  const hash = await bcrypt.hash(rawKey, 10)
  const supabase = adminClient()
  const { data, error } = await supabase.from('api_keys').insert({
    business_id: c.get('businessId'),
    name: body.name,
    key_prefix: prefix,
    key_hash: hash,
    permissions: body.permissions,
    environment: env,
    expires_at: body.expires_at ?? null,
  }).select('id, name, key_prefix, permissions, environment, created_at').single()
  if (error) return err(c, 'Failed to create key', 500, 'DB_ERROR')
  // Return raw key only once
  return ok(c, { ...data, key: rawKey })
})

// DELETE /api/v1/keys/:id
app.delete('/:id', async (c) => {
  const supabase = adminClient()
  const { error } = await supabase.from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', c.req.param('id'))
    .eq('business_id', c.get('businessId'))
  if (error) return err(c, 'Failed to revoke key', 500, 'DB_ERROR')
  return ok(c, { revoked: true })
})

export default app

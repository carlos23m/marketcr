import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { authenticateApiKey } from '../_middleware.js'
import linksRouter        from './routes/links.js'
import transactionsRouter from './routes/transactions.js'
import webhooksRouter     from './routes/webhooks.js'
import meRouter           from './routes/me.js'
import keysRouter         from './routes/auth.js'

export const config = { runtime: 'nodejs' }

const app = new Hono().basePath('/api/v1')

// OPTIONS preflight
app.options('*', (c) => c.text('', 204))

// Public: API key management (uses Supabase session auth, not API key)
app.route('/keys', keysRouter)

// API key auth middleware for all other routes
app.use('*', async (c, next) => {
  const result = await authenticateApiKey(c.req.raw)
  if (result.error) {
    const headers = result.headers ?? {}
    return c.json({ success: false, error: { code: result.status === 429 ? 'RATE_LIMITED' : 'UNAUTHORIZED', message: result.error } }, result.status, headers)
  }
  c.set('businessId', result.businessId)
  c.set('keyId', result.keyId)
  c.set('permissions', result.permissions)
  c.set('plan', result.plan)
  await next()
})

// Permission guard helper
function requirePermission(perm) {
  return async (c, next) => {
    const perms = c.get('permissions') ?? []
    if (!perms.includes(perm) && !perms.includes('*')) {
      return c.json({ success: false, error: { code: 'FORBIDDEN', message: `Missing permission: ${perm}` } }, 403)
    }
    await next()
  }
}

app.route('/links',        linksRouter)
app.route('/transactions', transactionsRouter)
app.route('/webhooks',     webhooksRouter)
app.route('/me',           meRouter)

// 404 fallback
app.all('*', (c) => c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, 404))

export default handle(app)

import { supabase } from '@/lib/supabase'

const SLACK_WEBHOOK = import.meta.env.VITE_ERROR_SLACK_WEBHOOK ?? ''

// Fields that must never appear in error reports
const SENSITIVE = /sinpe|monto|amount|token|api_key|password|secret|card|cvv/i

function sanitize(obj, depth = 0) {
  if (depth > 3 || !obj || typeof obj !== 'object') return obj
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE.test(k)) result[k] = '[redacted]'
    else result[k] = sanitize(v, depth + 1)
  }
  return result
}

async function report(message, stack = null, extra = {}) {
  if (import.meta.env.DEV) {
    console.error('[ErrorReporter]', message, stack)
    return
  }

  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: {} }))

  const payload = {
    message: String(message).slice(0, 500),
    stack:   stack ? String(stack).slice(0, 2000) : null,
    url:     window.location.href,
    user_agent: navigator.userAgent.slice(0, 200),
    profile_id:  user?.id ?? null,
  }

  // Write to Supabase error_logs (via Edge Function or direct if service-role available)
  await supabase.functions.invoke('log-error', { body: payload }).catch(() => null)
}

export function initErrorReporter(app) {
  app.config.errorHandler = (err, instance, info) => {
    report(err?.message ?? String(err), err?.stack, { info, component: instance?.$options?.name })
  }

  window.addEventListener('unhandledrejection', (event) => {
    const err = event.reason
    report(err?.message ?? String(err), err?.stack)
  })
}

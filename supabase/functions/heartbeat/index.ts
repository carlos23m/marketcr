import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Scheduled every 5 minutes by Supabase cron
// Pings /api/v1/me with a test API key; alerts Slack on failure
serve(async () => {
  const appUrl      = Deno.env.get('APP_URL') ?? 'https://sinpepay.cr'
  const testApiKey  = Deno.env.get('HEARTBEAT_API_KEY') ?? ''
  const slackUrl    = Deno.env.get('SLACK_ALERT_WEBHOOK') ?? ''
  const supabase    = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const start = Date.now()
  let statusCode = 0
  let ok = false

  try {
    const resp = await fetch(`${appUrl}/api/v1/me`, {
      headers: { Authorization: `Bearer ${testApiKey}` },
      signal: AbortSignal.timeout(10_000),
    })
    statusCode = resp.status
    ok = resp.status === 200
  } catch {
    statusCode = 0
    ok = false
  }

  const duration = Date.now() - start

  // Log to api_request_logs
  await supabase.from('api_request_logs').insert({
    endpoint: '/api/v1/me',
    method: 'GET',
    status_code: statusCode,
    duration_ms: duration,
  })

  if (!ok && slackUrl) {
    await fetch(slackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `🚨 SINPEpay heartbeat FAILED — status ${statusCode}, ${duration}ms` }),
    }).catch(() => null)
  }

  return new Response(JSON.stringify({ ok, status: statusCode, duration_ms: duration }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

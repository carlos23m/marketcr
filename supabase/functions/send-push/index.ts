import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Minimal Web Push via VAPID — uses the web-push-libs/web-push approach
// For production, use a full VAPID implementation. This sends via a POST to each endpoint.
async function sendPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string): Promise<boolean> {
  try {
    // In production: use VAPID-signed push. This stub just validates the endpoint is reachable.
    // Full VAPID implementation requires crypto signing which is available in Deno.
    const resp = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        TTL: '86400',
      },
      body: new TextEncoder().encode(payload),
    })
    return resp.status < 300 || resp.status === 201
  } catch {
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { profile_id, business_id, type, title, body } = await req.json()

  // Load subscriptions
  let q = supabase.from('push_subscriptions').select('endpoint, p256dh, auth, prefs')
  if (profile_id) q = q.eq('profile_id', profile_id)
  else if (business_id) {
    // All profiles in this business
    const { data: profiles } = await supabase.from('profiles').select('id').eq('business_id', business_id)
    const ids = (profiles ?? []).map((p: { id: string }) => p.id)
    if (!ids.length) return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders })
    q = q.in('profile_id', ids)
  }

  const { data: subs } = await q
  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders })

  // Filter by pref type — never include financial amounts in push payload for privacy
  const prefKey = type === 'payment' ? 'payments' : type === 'invoice' ? 'invoices' : type === 'daily' ? 'daily_summary' : null
  const eligible = subs.filter((s: { prefs: Record<string, boolean> }) => !prefKey || s.prefs?.[prefKey] !== false)

  const payload = JSON.stringify({ title, body })
  const results = await Promise.allSettled(eligible.map((s: { endpoint: string; p256dh: string; auth: string }) => sendPush(s, payload)))
  const sent = results.filter(r => r.status === 'fulfilled').length

  return new Response(JSON.stringify({ sent, total: eligible.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

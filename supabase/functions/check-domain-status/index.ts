import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

  const { data: { user } } = await supabase.auth.getUser(jwt)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

  const { domain } = await req.json()

  const vercelToken   = Deno.env.get('VERCEL_API_TOKEN')!
  const vercelProject = Deno.env.get('VERCEL_PROJECT_ID')!

  const resp = await fetch(`https://api.vercel.com/v10/projects/${vercelProject}/domains/${domain}`, {
    headers: { Authorization: `Bearer ${vercelToken}` },
  })
  const data = await resp.json()

  const verified  = data.verified === true
  const sslActive = data.certs?.length > 0

  if (verified) {
    await supabase.from('custom_domains')
      .update({ status: 'active', ssl_active: sslActive, verified_at: new Date().toISOString() })
      .eq('domain', domain)
  }

  return new Response(JSON.stringify({ verified, ssl_active: sslActive, raw: data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

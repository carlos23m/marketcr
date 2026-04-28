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

  // Authenticate caller via JWT
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

  const { data: { user } } = await supabase.auth.getUser(jwt)
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

  const { domain, business_id } = await req.json()

  // Validate domain format
  const domainRe = /^([a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i
  if (!domain || !domainRe.test(domain))
    return new Response(JSON.stringify({ error: 'Invalid domain format' }), { status: 400, headers: corsHeaders })

  // Reject sinpepay.cr variants
  if (domain.includes('sinpepay'))
    return new Response(JSON.stringify({ error: 'Cannot use SINPEpay domain' }), { status: 400, headers: corsHeaders })

  // Check domain not already taken
  const { data: existing } = await supabase.from('custom_domains').select('id').eq('domain', domain).maybeSingle()
  if (existing)
    return new Response(JSON.stringify({ error: 'Domain already registered' }), { status: 409, headers: corsHeaders })

  const vercelToken   = Deno.env.get('VERCEL_API_TOKEN')!
  const vercelProject = Deno.env.get('VERCEL_PROJECT_ID')!

  // Add domain to Vercel project with retry on 5xx
  let vercelDomainId: string | null = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    const resp = await fetch(`https://api.vercel.com/v10/projects/${vercelProject}/domains`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: domain }),
    })
    const body = await resp.json()
    if (resp.ok) { vercelDomainId = body.name ?? domain; break }
    if (resp.status < 500) {
      return new Response(JSON.stringify({ error: body.error?.message ?? 'Vercel error' }), { status: 400, headers: corsHeaders })
    }
    if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 1000))
  }

  // Save to DB
  const { error: dbErr } = await supabase.from('custom_domains').insert({
    business_id,
    domain,
    vercel_domain_id: vercelDomainId,
    status: 'dns_pending',
  })
  if (dbErr)
    return new Response(JSON.stringify({ error: 'Failed to save domain' }), { status: 500, headers: corsHeaders })

  const dnsInstructions = {
    type: 'CNAME',
    name: domain.split('.').slice(0, -2).join('.') || '@',
    value: 'cname.vercel-dns.com',
  }

  return new Response(JSON.stringify({ ok: true, domain, dns: dnsInstructions }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

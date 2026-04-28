import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Scheduled nightly by Supabase cron
// Deletes api_request_logs and error_logs older than 30 days
serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error } = await supabase.rpc('cleanup_old_logs')

  return new Response(JSON.stringify({ ok: !error, error: error?.message ?? null }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

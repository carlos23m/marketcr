import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    // ── Auth: verify the caller is a legitimate authenticated user ──────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    // ── Service-role client for actual DB work ───────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { invitation_id } = await req.json()
    if (!invitation_id) return json({ error: 'Parámetros inválidos' }, 400)

    // ── Ownership: caller must belong to the invitation's business ───────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_id, rol')
      .eq('id', user.id)
      .single()

    const { data: invite } = await supabase
      .from('invitations')
      .select('*, businesses(nombre)')
      .eq('id', invitation_id)
      .single()

    if (!invite) return json({ error: 'Invitación no encontrada' }, 404)

    if (!profile?.business_id || profile.business_id !== invite.business_id) {
      return json({ error: 'Forbidden' }, 403)
    }

    // Only owners can send invitations
    if (profile.rol !== 'dueno') return json({ error: 'Forbidden' }, 403)

    // ── Send email ───────────────────────────────────────────────────────────
    const appUrl = Deno.env.get('APP_URL') || 'https://sinpepay.vercel.app'
    const acceptUrl = `${appUrl}/invite/accept?token=${invite.token}`
    const resendKey = Deno.env.get('RESEND_API_KEY')

    if (!resendKey) {
      await supabase.from('notification_logs').insert({
        business_id: invite.business_id,
        tipo: 'invitation',
        canal: 'stub',
        payload: { to: invite.email, accept_url: acceptUrl },
        enviado: false,
      })
      return json({ data: { stub: true, accept_url: acceptUrl } })
    }

    const emailBody = {
      from: 'SINPEpay <noreply@sinpepay.cr>',
      to: [invite.email],
      subject: `${invite.businesses.nombre} te invitó a SINPEpay`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <div style="width:48px;height:48px;background:#1D9E75;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:24px">
            <span style="color:white;font-weight:700;font-size:18px">SP</span>
          </div>
          <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 8px">Usted fue invitado</h1>
          <p style="color:#6b7280;font-size:15px;margin:0 0 24px">
            <strong>${invite.businesses.nombre}</strong> le está invitando a unirse a SINPEpay
            como <strong>${invite.rol}</strong> para gestionar cobros con SINPE Móvil.
          </p>
          <a href="${acceptUrl}" style="display:inline-block;background:#1D9E75;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
            Aceptar invitación
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">
            Este enlace expira en 7 días. Si no esperaba este correo, puede ignorarlo.
          </p>
        </div>
      `,
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailBody),
    })

    const sent = res.ok
    await supabase.from('notification_logs').insert({
      business_id: invite.business_id,
      tipo: 'invitation',
      canal: 'email',
      payload: { to: invite.email, accept_url: acceptUrl },
      enviado: sent,
    })

    return json({ data: { sent } })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})

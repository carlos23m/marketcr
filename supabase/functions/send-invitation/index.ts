import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { invitation_id } = await req.json()

    const { data: invite } = await supabase
      .from('invitations')
      .select('*, businesses(nombre)')
      .eq('id', invitation_id)
      .single()

    if (!invite) {
      return new Response(JSON.stringify({ error: 'Invitación no encontrada' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

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
      return new Response(JSON.stringify({ data: { stub: true, accept_url: acceptUrl } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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

    return new Response(JSON.stringify({ data: { sent } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

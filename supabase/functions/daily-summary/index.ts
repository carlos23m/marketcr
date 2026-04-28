import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Schedule this via Supabase cron at: 0 2 * * * (2AM UTC = 8PM Costa Rica UTC-6)
// Set CRON_SECRET in Supabase edge function secrets and pass it as x-cron-secret header
// from the cron job configuration.

serve(async (req) => {
  // ── Guard: only allow requests with the correct cron secret ─────────────
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const incoming = req.headers.get('x-cron-secret')
    if (incoming !== cronSecret) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const resendKey = Deno.env.get('RESEND_API_KEY')

    const { data: businesses } = await supabase.from('businesses').select('*')
    if (!businesses) return new Response('no businesses', { status: 200 })

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()
    const results = []

    for (const biz of businesses) {
      const { data: txns } = await supabase
        .from('transactions')
        .select('monto, banco')
        .eq('business_id', biz.id)
        .gte('fecha', todayStart)
        .lt('fecha', todayEnd)

      const { count: activeLinks } = await supabase
        .from('payment_links')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', biz.id)
        .eq('estado', 'activo')

      const { count: pendingInvoices } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', biz.id)
        .eq('estado', 'borrador')

      const total = (txns || []).reduce((s, t) => s + t.monto, 0)
      const count = txns?.length || 0

      const bancoCounts: Record<string, number> = {}
      for (const t of txns || []) bancoCounts[t.banco] = (bancoCounts[t.banco] || 0) + 1
      const topBanco = Object.entries(bancoCounts).sort((a, b) => b[1] - a[1])[0]

      const summary = {
        negocio: biz.nombre,
        fecha: today.toLocaleDateString('es-CR'),
        cobros: count,
        total: `₡${total.toLocaleString('es-CR')}`,
        metodo_top: topBanco ? `${topBanco[0]} (${topBanco[1]} cobros)` : '—',
        links_activos: activeLinks || 0,
        facturas_pendientes: pendingInvoices || 0,
      }

      await supabase.from('notification_logs').insert({
        business_id: biz.id,
        tipo: 'daily_summary',
        canal: biz.email && resendKey ? 'email' : 'stub',
        payload: summary,
        enviado: false,
      })

      if (biz.email && resendKey) {
        const html = `
          <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="color:#1D9E75;margin:0 0 4px">Resumen del día · ${summary.fecha}</h2>
            <p style="color:#6b7280;margin:0 0 24px;font-size:14px">${biz.nombre}</p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#6b7280">Cobros recibidos</td><td style="text-align:right;font-weight:600">${summary.cobros}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Total</td><td style="text-align:right;font-weight:700;color:#1D9E75;font-size:18px">${summary.total}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Método más usado</td><td style="text-align:right">${summary.metodo_top}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Links activos</td><td style="text-align:right">${summary.links_activos}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Facturas pendientes</td><td style="text-align:right">${summary.facturas_pendientes}</td></tr>
            </table>
          </div>`

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'SINPEpay <resumen@sinpepay.cr>',
            to: [biz.email],
            subject: `Resumen del día — ${summary.total} recibido hoy`,
            html,
          }),
        })
        if (res.ok) {
          await supabase.from('notification_logs')
            .update({ enviado: true })
            .eq('business_id', biz.id)
            .eq('tipo', 'daily_summary')
            .order('created_at', { ascending: false })
            .limit(1)
        }
      }

      results.push(summary)
    }

    return new Response(JSON.stringify({ processed: results.length, summaries: results }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

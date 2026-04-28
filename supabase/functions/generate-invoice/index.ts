import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cryptoRandom8(): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return (buf[0] % 100_000_000).toString().padStart(8, '0')
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

    // ── Service-role client for actual DB work (bypasses RLS) ───────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { transaction_id, business_id } = await req.json()
    if (!transaction_id || !business_id) return json({ error: 'Parámetros inválidos' }, 400)

    // ── Ownership: caller's business_id must match the claimed business_id ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (!profile?.business_id || profile.business_id !== business_id) {
      return json({ error: 'Forbidden' }, 403)
    }

    // ── Fetch transaction + business ─────────────────────────────────────────
    const { data: txn } = await supabase
      .from('transactions')
      .select('*, payment_links(descripcion)')
      .eq('id', transaction_id)
      .single()

    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business_id)
      .single()

    if (!txn || !biz) return json({ error: 'Datos no encontrados' }, 404)

    // Belt-and-suspenders: the transaction must belong to the claimed business
    if (txn.business_id !== business_id) return json({ error: 'Forbidden' }, 403)

    // ── Consecutive number ───────────────────────────────────────────────────
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business_id)

    const seq = String((count || 0) + 1).padStart(10, '0')
    const consecutivo = `001-00001-${seq}`

    // ── Clave (Costa Rica FE v4.4) — crypto random security code ────────────
    const now = new Date(txn.fecha)
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const yy = String(now.getFullYear()).slice(2)
    const cedula = (biz.cedula_juridica || '3000000000').replace(/\D/g, '').padStart(12, '0')
    const security = cryptoRandom8()
    const clave = `506${dd}${mm}${yy}${cedula}${seq}1${security}`.padEnd(50, '0')

    // ── XML — all user-supplied values are XML-escaped ───────────────────────
    const descripcion = escapeXml(txn.payment_links?.descripcion || 'Servicio')
    const montoStr = escapeXml(txn.monto)
    const fechaEmision = new Date().toISOString().replace('Z', '+00:00')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<FacturaElectronica xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica
  https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/facturaElectronica.xsd">
  <Clave>${clave}</Clave>
  <CodigoActividad>621900</CodigoActividad>
  <NumeroConsecutivo>${consecutivo}</NumeroConsecutivo>
  <FechaEmision>${fechaEmision}</FechaEmision>
  <Emisor>
    <Nombre>${escapeXml(biz.nombre)}</Nombre>
    <Identificacion>
      <Tipo>02</Tipo>
      <Numero>${escapeXml((biz.cedula_juridica || '').replace(/\D/g, ''))}</Numero>
    </Identificacion>
    <CorreoElectronico>${escapeXml(biz.email || '')}</CorreoElectronico>
  </Emisor>
  <Receptor>
    <Nombre>${escapeXml(txn.nombre_remitente)}</Nombre>
  </Receptor>
  <CondicionVenta>01</CondicionVenta>
  <MedioPago>06</MedioPago>
  <DetalleServicio>
    <LineaDetalle>
      <NumeroLinea>1</NumeroLinea>
      <Cantidad>1</Cantidad>
      <UnidadMedida>Sp</UnidadMedida>
      <Detalle>${descripcion}</Detalle>
      <PrecioUnitario>${montoStr}</PrecioUnitario>
      <MontoTotal>${montoStr}</MontoTotal>
      <SubTotal>${montoStr}</SubTotal>
      <MontoTotalLinea>${montoStr}</MontoTotalLinea>
    </LineaDetalle>
  </DetalleServicio>
  <ResumenFactura>
    <CodigoTipoMoneda>
      <CodigoMoneda>CRC</CodigoMoneda>
      <TipoCambio>1</TipoCambio>
    </CodigoTipoMoneda>
    <TotalServExentos>${montoStr}</TotalServExentos>
    <TotalExento>${montoStr}</TotalExento>
    <TotalVenta>${montoStr}</TotalVenta>
    <TotalVentaNeta>${montoStr}</TotalVentaNeta>
    <TotalComprobante>${montoStr}</TotalComprobante>
  </ResumenFactura>
</FacturaElectronica>`

    // ── Persist ──────────────────────────────────────────────────────────────
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        business_id,
        transaction_id,
        numero_consecutivo: consecutivo,
        clave,
        estado: 'borrador',
        xml_firmado: xml,
        fecha_emision: new Date().toISOString(),
      })
      .select()
      .single()

    if (invError) throw invError

    await supabase
      .from('transactions')
      .update({ invoice_id: invoice.id })
      .eq('id', transaction_id)

    return json({ data: invoice })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
})

/*
 * PRODUCTION NOTES:
 * - Real invoices require a .p12 digital certificate from the empresa's ATV account
 *   (Administración Tributaria Virtual: https://www.hacienda.go.cr/ATV)
 * - MedioPago "06" = SINPE Móvil — mandatory per BCCR regulation effective Sep 2025
 * - CodigoActividad must match the business's actual CIIU code registered with Hacienda
 * - IVA (13%) applies to most services — this uses exento (exempt) for simplicity
 * - For real submission: POST to https://api.comprobanteselectronicos.go.cr/recepcion/v2/recepcion
 *   using an OAuth token obtained from https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token
 */

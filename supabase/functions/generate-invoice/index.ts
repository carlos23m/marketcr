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

    const { transaction_id, business_id } = await req.json()

    // Fetch transaction + business
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

    if (!txn || !biz) {
      return new Response(JSON.stringify({ error: 'Datos no encontrados' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get next consecutive number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business_id)

    const seq = String((count || 0) + 1).padStart(10, '0')
    const consecutivo = `001-00001-${seq}`

    // Generate 50-digit clave (Costa Rica FE v4.4 algorithm)
    const now = new Date(txn.fecha)
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const yy = String(now.getFullYear()).slice(2)
    const cedula = (biz.cedula_juridica || '3000000000').replace(/\D/g, '').padStart(12, '0')
    const security = String(Math.floor(Math.random() * 99999999)).padStart(8, '0')
    // pais(3) + fecha(8) + cedula(12) + consecutivo_numeros(10) + situacion(1) + security(8) = 42 chars
    // Full clave: 506 + DDMMYYYY + cedula(12) + seq(10) + 1 + security(8) = 42, padded to 50
    const clave = `506${dd}${mm}${yy}${cedula}${seq}1${security}`.padEnd(50, '0')

    // Build XML (FE v4.4 sandbox — no real signature)
    const descripcion = txn.payment_links?.descripcion || 'Servicio'
    const montoStr = txn.monto.toString()
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
    <Nombre>${biz.nombre}</Nombre>
    <Identificacion>
      <Tipo>02</Tipo>
      <Numero>${(biz.cedula_juridica || '').replace(/\D/g, '')}</Numero>
    </Identificacion>
    <CorreoElectronico>${biz.email || ''}</CorreoElectronico>
  </Emisor>
  <Receptor>
    <Nombre>${txn.nombre_remitente}</Nombre>
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

    // Save invoice record (sandbox — skips real Hacienda submission)
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

    // Link invoice to transaction
    await supabase
      .from('transactions')
      .update({ invoice_id: invoice.id })
      .eq('id', transaction_id)

    return new Response(JSON.stringify({ data: invoice }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
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

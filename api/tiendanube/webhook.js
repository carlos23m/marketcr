import { adminClient } from '../_lib/supabase.js'
import { nanoid } from 'nanoid'

// POST /api/tiendanube/webhook — Tiendanube new_order events
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { event, store_id, payload } = req.body ?? {}
  if (event !== 'order/created' && event !== 'order/paid') return res.status(200).json({ ok: true })

  const supabase = adminClient()

  // Look up the business that owns this store
  const { data: store } = await supabase
    .from('tiendanube_stores')
    .select('business_id, tn_access_token')
    .eq('tn_store_id', String(store_id))
    .single()
  if (!store) return res.status(200).json({ ok: true }) // unknown store — silently ignore

  if (event === 'order/created') {
    // Create a payment link for this order
    const orderId    = payload?.id
    const orderTotal = payload?.total ?? 0
    const customer   = payload?.customer?.name ?? ''
    const amountCRC  = Math.round(Number(orderTotal))

    if (!orderId || amountCRC < 1) return res.status(200).json({ ok: true })

    const linkId = nanoid(8)
    const { data: link } = await supabase
      .from('payment_links')
      .insert({
        id:          linkId,
        business_id: store.business_id,
        descripcion: `Orden Tiendanube #${orderId}`,
        monto:       amountCRC,
        cliente:     customer || null,
        vencimiento: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2h
        estado:      'activo',
        notas:       `tn_order_id:${orderId}`,
      })
      .select()
      .single()

    if (link) {
      // Return payment URL to Tiendanube
      const payUrl = `${process.env.APP_URL}/p/${linkId}`
      try {
        await fetch(`https://api.tiendanube.com/v1/${store_id}/orders/${orderId}/transactions`, {
          method: 'POST',
          headers: {
            Authentication: `bearer ${store.tn_access_token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'SINPEpay/1.0',
          },
          body: JSON.stringify({ redirect_url: payUrl, payment_method: 'sinpepay' }),
        })
      } catch { /* non-fatal */ }
    }
  }

  return res.status(200).json({ ok: true })
}

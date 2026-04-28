import { adminClient } from '../_lib/supabase.js'

// GET /api/tiendanube/callback?code=...&state=...
export default async function handler(req, res) {
  const { code, state } = req.query
  if (!code || !state) return res.status(400).json({ error: 'Missing code or state' })

  let businessId
  try {
    businessId = JSON.parse(Buffer.from(state, 'base64url').toString()).business_id
  } catch {
    return res.status(400).json({ error: 'Invalid state' })
  }

  const clientId     = process.env.TIENDANUBE_CLIENT_ID
  const clientSecret = process.env.TIENDANUBE_CLIENT_SECRET
  if (!clientId || !clientSecret) return res.status(503).json({ error: 'Tiendanube integration not configured' })

  // Exchange code for access token
  let tokenData
  try {
    const resp = await fetch('https://www.tiendanube.com/apps/authorize/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'authorization_code', code }),
    })
    tokenData = await resp.json()
    if (!tokenData.access_token) throw new Error('No access_token in response')
  } catch (e) {
    console.error('Tiendanube token exchange failed:', e)
    return res.status(502).json({ error: 'Token exchange failed' })
  }

  const { access_token, user_id: storeId } = tokenData

  // Fetch store info
  let storeUrl = ''
  try {
    const storeResp = await fetch(`https://api.tiendanube.com/v1/${storeId}/store`, {
      headers: { Authentication: `bearer ${access_token}`, 'User-Agent': 'SINPEpay/1.0' },
    })
    const storeData = await storeResp.json()
    storeUrl = storeData.main_domain ?? ''
  } catch { /* non-fatal */ }

  // Upsert into tiendanube_stores
  const supabase = adminClient()
  const { error } = await supabase
    .from('tiendanube_stores')
    .upsert({
      business_id:     businessId,
      tn_store_id:     String(storeId),
      tn_access_token: access_token,
      store_url:       storeUrl,
    }, { onConflict: 'tn_store_id' })

  if (error) {
    console.error('Tiendanube store save failed:', error)
    return res.status(500).json({ error: 'Failed to save store connection' })
  }

  // Register SINPEpay as payment provider
  try {
    await fetch(`https://api.tiendanube.com/v1/${storeId}/payment_providers`, {
      method: 'POST',
      headers: {
        Authentication: `bearer ${access_token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SINPEpay/1.0',
      },
      body: JSON.stringify({
        name: 'SINPEpay',
        logo: `${process.env.APP_URL}/icons/icon-192.png`,
        checkout_payment_method_id: 'sinpepay',
      }),
    })
  } catch { /* non-fatal if payment provider registration fails */ }

  return res.redirect(302, `${process.env.APP_URL}/developers/plugins?tiendanube=connected`)
}

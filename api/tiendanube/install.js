// Tiendanube OAuth entry point
// GET /api/tiendanube/install?business_id=<uuid>
export default function handler(req, res) {
  const clientId = process.env.TIENDANUBE_CLIENT_ID
  if (!clientId) return res.status(503).json({ error: 'Tiendanube integration not configured' })

  const { business_id } = req.query
  if (!business_id) return res.status(400).json({ error: 'business_id required' })

  const clientId     = process.env.TIENDANUBE_CLIENT_ID
  const redirectUri  = `${process.env.APP_URL}/api/tiendanube/callback`
  const state        = Buffer.from(JSON.stringify({ business_id })).toString('base64url')
  const authUrl      = `https://www.tiendanube.com/apps/${clientId}/authorize?response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`

  res.redirect(302, authUrl)
}

import { adminClient } from '../_lib/supabase.js'

// POST /api/tiendanube/uninstall
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { store_id } = req.body ?? {}
  if (!store_id) return res.status(200).json({ ok: true })

  const supabase = adminClient()
  await supabase.from('tiendanube_stores').delete().eq('tn_store_id', String(store_id))
  return res.status(200).json({ ok: true })
}

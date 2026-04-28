import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

// Shared SMS patterns (Node port of useSmsParser.js patterns)
const SMS_PATTERNS = [
  // BCR
  { banco: 'BCR', regex: /SINPE\s+M[oó]vil.*?₡\s*([\d,]+(?:\.\d{2})?).*?(?:de|De)\s+([A-Z\s]+?)(?:\s+T[ée]l|\.|Ref|$)/i, confidence: 95 },
  // Banco Nacional
  { banco: 'BN',  regex: /SINPE\s+M[oó]vil.*?₡\s*([\d,]+(?:\.\d{2})?).*?(?:de|De)\s+([A-Z\s]+?)(?:\s+T[ée]l|\.|Ref|$)/i, confidence: 95 },
  // BAC
  { banco: 'BAC', regex: /BAC.*?SINPE.*?Monto:\s*₡([\d,]+(?:\.\d{2})?).*?De:\s+([A-Z\s]+?)\s+\d{4}-\d{4}/i, confidence: 92 },
  // Scotiabank
  { banco: 'Scotiabank', regex: /Scotiabank.*?transferencia SINPE\s+₡([\d,]+(?:\.\d{2})?).*?de\s+([A-Z\s]+?)\./i, confidence: 92 },
  // Banco Popular
  { banco: 'Banco Popular', regex: /SINPE.*?₡\s*([\d,]+(?:\.\d{2})?).*?(?:de|De)\s+([A-Z\s]+?)(?:\s+|\.|Ref|$)/i, confidence: 88 },
  // Promerica
  { banco: 'Promerica', regex: /PROMERICA.*?SINPE.*?ha recibido\s+₡([\d,]+(?:\.\d{2})?).*?de\s+([A-Z\s]+?)\./i, confidence: 90 },
  // Generic fallback
  { banco: 'Otro', regex: /₡\s*([\d,]+(?:\.\d{2})?).*?(?:de|De)\s+([A-Z\s]+?)(?:\s|$)/i, confidence: 60 },
]

function parseSms(body) {
  for (const p of SMS_PATTERNS) {
    const m = body.match(p.regex)
    if (m) {
      const rawAmount = m[1].replace(/,/g, '')
      const monto = Math.round(parseFloat(rawAmount))
      return {
        banco: p.banco,
        monto: isNaN(monto) ? 0 : monto,
        nombre_remitente: (m[2] ?? '').trim(),
        confidence: p.confidence,
      }
    }
  }
  return null
}

async function findMatchingLink(businessId, monto) {
  const since = new Date()
  since.setHours(since.getHours() - 72)
  const { data: links } = await supabase
    .from('payment_links')
    .select('id, monto')
    .eq('business_id', businessId)
    .eq('estado', 'activo')
    .gte('created_at', since.toISOString())

  if (!links?.length) return null

  // Exact match first, then ±50 fuzzy
  const exact = links.filter(l => l.monto === monto)
  if (exact.length === 1) return { link: exact[0], confidence: 'exact' }
  const fuzzy = links.filter(l => Math.abs(l.monto - monto) <= 50)
  if (fuzzy.length === 1) return { link: fuzzy[0], confidence: 'fuzzy' }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Validate Twilio signature — reject if secret is not configured (fail closed)
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not configured — rejecting inbound SMS')
    return res.status(403).json({ error: 'Webhook not configured' })
  }
  const twilioSig = req.headers['x-twilio-signature'] ?? ''
  const url = `${process.env.APP_URL || 'https://marketcr.vercel.app'}/api/sms/inbound`
  if (!twilio.validateRequest(authToken, twilioSig, url, req.body)) {
    return res.status(403).json({ error: 'Invalid Twilio signature' })
  }

  const { To: toNumber, Body: smsBody, MessageSid: messageSid } = req.body
  if (!toNumber || !smsBody) return res.status(400).end()

  // Look up business by Twilio number
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('twilio_number', toNumber)
    .single()
  if (!business) return res.status(200).send('<Response/>')

  // Deduplicate Twilio retries using MessageSid
  if (messageSid) {
    const { data: dup } = await supabase
      .from('transactions')
      .select('id')
      .eq('business_id', business.id)
      .like('notas', `%sid:${messageSid}%`)
      .maybeSingle()
    if (dup) return res.status(200).send('<Response/>')
  }

  const parsed = parseSms(smsBody)
  if (!parsed || parsed.confidence < 60) {
    console.log('SMS parse failed or low confidence:', smsBody.slice(0, 80))
    return res.status(200).send('<Response/>')
  }

  let paymentLinkId = null
  let matchStatus = 'unmatched'

  if (parsed.confidence >= 85 && parsed.monto > 0) {
    const match = await findMatchingLink(business.id, parsed.monto)
    if (match) {
      paymentLinkId = match.link.id
      matchStatus = 'auto_matched'
      // Mark link as paid
      await supabase.from('payment_links').update({
        estado: 'pagado',
        pagado_en: new Date().toISOString(),
      }).eq('id', paymentLinkId)
    } else {
      matchStatus = 'no_match'
    }
  } else {
    matchStatus = 'low_confidence'
  }

  // Record transaction
  await supabase.from('transactions').insert({
    business_id: business.id,
    monto: parsed.monto,
    nombre_remitente: parsed.nombre_remitente || 'Desconocido',
    banco: parsed.banco,
    fecha: new Date().toISOString(),
    payment_link_id: paymentLinkId,
    parse_method: 'sms_auto',
    notas: `SMS ingestion. Confidence: ${parsed.confidence}%. Status: ${matchStatus}${messageSid ? `. sid:${messageSid}` : ''}`,
  })

  // Reply with empty TwiML (no SMS reply to sender)
  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send('<Response/>')
}

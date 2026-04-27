export const SMS_PATTERNS = [
  {
    banco: 'BCR',
    regex: /SINPE\s+M[oó]vil[:\s]+Recib[ií][oó]\s+[₡CRC]*([\d,.]+)\s+de\s+([A-ZÁÉÍÓÚÑ\s]+)\s+Ref[:\s]*(\w+)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/i,
    extract(m) {
      return {
        banco: 'BCR',
        monto: parseMonto(m[1]),
        nombreRemitente: m[2].trim(),
        referencia: m[3],
        fecha: parseDate(m[4], m[5]),
        telefono: null,
        confianza: 95,
        parseMethod: 'sms',
      }
    },
  },
  {
    banco: 'BN',
    regex: /BN[:\s]+Transferencia\s+recibida\s+[₡CRC]*([\d,.]+)\s+de\s+([A-ZÁÉÍÓÚÑ\s]+)\s+Tel[:\s]*(\d+)\s+Ref[:\s]*(\w+)/i,
    extract(m) {
      return {
        banco: 'BN',
        monto: parseMonto(m[1]),
        nombreRemitente: m[2].trim(),
        telefono: m[3],
        referencia: m[4],
        fecha: new Date().toISOString(),
        confianza: 92,
        parseMethod: 'sms',
      }
    },
  },
  {
    banco: 'BP',
    regex: /BP\s+SINPE[:\s]+Monto\s+[₡CRC]*([\d,.]+)[.\s]+De[:\s]+([A-ZÁÉÍÓÚÑ\s]+)[.\s]+Referencia[:\s]*([\w-]+)[.\s]+Fecha[:\s]*([\d-]+)/i,
    extract(m) {
      return {
        banco: 'BP',
        monto: parseMonto(m[1]),
        nombreRemitente: m[2].trim(),
        referencia: m[3],
        fecha: parseDateDash(m[4]),
        telefono: null,
        confianza: 90,
        parseMethod: 'sms',
      }
    },
  },
]

function parseMonto(str) {
  return parseFloat(str.replace(/,/g, '')) || 0
}

function parseDate(dateStr, timeStr) {
  const [d, mo, y] = dateStr.split('/')
  return new Date(`${y}-${mo}-${d}T${timeStr}:00`).toISOString()
}

function parseDateDash(dateStr) {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const [a, b, c] = parts
    if (a.length === 2) return new Date(`20${a}-${b}-${c}`).toISOString()
    return new Date(`${a}-${b}-${c}`).toISOString()
  }
  return new Date().toISOString()
}

export function fallbackParse(sms) {
  const montoMatch = sms.match(/[₡CRC]+([\d,]+(?:\.\d{2})?)/i)
  const nameMatch = sms.match(/de[:\s]+([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s]+)/i)
  const refMatch = sms.match(/Ref[:\s]*([\w-]+)/i)
  const dateMatch = sms.match(/(\d{2}[\/-]\d{2}[\/-]\d{2,4})/i)

  return {
    banco: 'Otro',
    monto: montoMatch ? parseMonto(montoMatch[1]) : 0,
    nombreRemitente: nameMatch ? nameMatch[1].trim() : 'Desconocido',
    telefono: null,
    referencia: refMatch ? refMatch[1] : `MANUAL-${Date.now()}`,
    fecha: dateMatch ? new Date().toISOString() : new Date().toISOString(),
    confianza: 60,
    parseMethod: 'sms',
  }
}

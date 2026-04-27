const formatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const formatterDecimals = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCRC(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₡0'
  const num = Number(amount)
  const result = num >= 1_000_000 ? formatterDecimals.format(num) : formatter.format(num)
  return result.replace('CRC', '₡').replace(/\s/g, '')
}

export function parseCRC(str) {
  if (!str) return 0
  const clean = String(str).replace(/[₡,\s]/g, '').replace('.', '')
  return parseInt(clean, 10) || 0
}

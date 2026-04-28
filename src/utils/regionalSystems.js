export const REGIONAL_SYSTEMS = {
  costa_rica: {
    name: 'SINPE Móvil',
    currency: 'CRC',
    currencySymbol: '₡',
    country: 'CR',
    flag: '🇨🇷',
    phoneFormat: 'XXXX-XXXX',
    available: true,
  },
  panama: {
    name: 'ACH / Yappy',
    currency: 'PAB',
    currencySymbol: 'B/.',
    country: 'PA',
    flag: '🇵🇦',
    phoneFormat: 'XXXX-XXXX',
    available: false,
  },
  guatemala: {
    name: 'Transfermóvil',
    currency: 'GTQ',
    currencySymbol: 'Q',
    country: 'GT',
    flag: '🇬🇹',
    phoneFormat: 'XXXX-XXXX',
    available: false,
  },
  honduras: {
    name: 'Tigo Money',
    currency: 'HNL',
    currencySymbol: 'L',
    country: 'HN',
    flag: '🇭🇳',
    phoneFormat: 'XXXX-XXXX',
    available: false,
  },
}

export function getSystemByCountry(countryCode) {
  return Object.values(REGIONAL_SYSTEMS).find(s => s.country === countryCode) ?? REGIONAL_SYSTEMS.costa_rica
}

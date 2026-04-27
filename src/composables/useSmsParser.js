import { SMS_PATTERNS, fallbackParse } from '@/utils/smsPatterns'

export function useSmsParser() {
  function parseSms(rawSms) {
    const text = rawSms.trim()
    for (const pattern of SMS_PATTERNS) {
      const m = text.match(pattern.regex)
      if (m) {
        return { ...pattern.extract(m), rawSms: text }
      }
    }
    return { ...fallbackParse(text), rawSms: text }
  }

  return { parseSms }
}

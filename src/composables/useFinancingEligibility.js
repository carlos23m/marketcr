import { computed } from 'vue'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'

const MIN_DAYS      = 60
const MIN_TXN_COUNT = 30
const MIN_AVG_CRC   = 200_000
const MAX_LOAN_CRC  = 5_000_000

export function useFinancingEligibility() {
  const auth    = useAuthStore()
  const txnStore = useTransactionsStore()

  async function computeMetrics() {
    const bid = auth.business?.id
    if (!bid) return null

    const now     = new Date()
    const m3ago   = new Date(now); m3ago.setMonth(m3ago.getMonth() - 3); m3ago.setDate(1); m3ago.setHours(0,0,0,0)
    const m2ago   = new Date(now); m2ago.setMonth(m2ago.getMonth() - 2); m2ago.setDate(1)
    const m1ago   = new Date(now); m1ago.setMonth(m1ago.getMonth() - 1); m1ago.setDate(1)
    const m0start = new Date(now.getFullYear(), now.getMonth(), 1)

    const [{ data: allTxns }, { data: recentTxns }] = await Promise.all([
      supabase.from('transactions').select('fecha, monto').eq('business_id', bid).order('fecha'),
      supabase.from('transactions').select('fecha, monto').eq('business_id', bid).gte('fecha', m3ago.toISOString()),
    ])

    if (!allTxns?.length) return null

    const firstDate  = new Date(allTxns[0].fecha)
    const accountAge = Math.floor((now - firstDate) / 86_400_000)
    const txnCount   = allTxns.length

    // Monthly buckets (last 3 months)
    function sumMonth(from, to) {
      return (recentTxns ?? [])
        .filter(t => new Date(t.fecha) >= from && new Date(t.fecha) < to)
        .reduce((s, t) => s + t.monto, 0)
    }
    const m3 = sumMonth(m3ago, m2ago)
    const m2 = sumMonth(m2ago, m1ago)
    const m1 = sumMonth(m1ago, m0start)
    const m0 = sumMonth(m0start, new Date(9999,0,1))

    const monthlyRevs = [m3, m2, m1].filter(v => v > 0)
    const monthlyAvg  = monthlyRevs.length ? Math.round(monthlyRevs.reduce((s, v) => s + v, 0) / monthlyRevs.length) : 0
    const monthlyMin  = monthlyRevs.length ? Math.min(...monthlyRevs) : 0
    const revenueGrowth = monthlyAvg > 0 ? Math.round(((m1 - monthlyAvg) / monthlyAvg) * 100) : 0

    // Consistency: % of days in last 30d with at least 1 txn
    const d30ago = new Date(now); d30ago.setDate(d30ago.getDate() - 30)
    const days30 = (recentTxns ?? []).filter(t => new Date(t.fecha) >= d30ago)
    const uniqueDays = new Set(days30.map(t => t.fecha.slice(0,10))).size
    const consistencyScore = Math.round((uniqueDays / 30) * 100)

    // Eligibility check
    const eligible = accountAge >= MIN_DAYS && txnCount >= MIN_TXN_COUNT && monthlyAvg >= MIN_AVG_CRC && monthlyMin > 0

    // Max loan
    let maxLoan = Math.min(monthlyAvg * 2.5, MAX_LOAN_CRC)
    if (revenueGrowth > 15) maxLoan = Math.min(monthlyAvg * 4, MAX_LOAN_CRC)
    maxLoan = Math.round(maxLoan / 1000) * 1000

    return {
      accountAge,
      txnCount,
      monthlyAvg,
      monthlyMin,
      revenueGrowth,
      consistencyScore,
      eligible,
      maxLoan: eligible ? maxLoan : 0,
      // Progress toward eligibility
      progress: {
        days:  { current: accountAge,  required: MIN_DAYS,      done: accountAge >= MIN_DAYS },
        txns:  { current: txnCount,    required: MIN_TXN_COUNT, done: txnCount >= MIN_TXN_COUNT },
        revenue: { current: monthlyAvg, required: MIN_AVG_CRC,  done: monthlyAvg >= MIN_AVG_CRC },
        nonZeroMonths: { done: monthlyMin > 0 },
      },
    }
  }

  function serviceFee(repaymentRate) {
    if (repaymentRate >= 0.18) return 0.04
    if (repaymentRate >= 0.12) return 0.05
    return 0.06
  }

  function estimatedRepaymentDays(loanAmount, repaymentRate, monthlyAvg) {
    if (!monthlyAvg || !repaymentRate) return null
    const dailyAvg = monthlyAvg / 30
    const dailyRepayment = dailyAvg * repaymentRate
    return Math.ceil(loanAmount / dailyRepayment)
  }

  return { computeMetrics, serviceFee, estimatedRepaymentDays }
}

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getTransactions, createTransaction, getDailyRevenue, getRevenueTotals } from '@/lib/database'
import { useAuthStore } from './useAuthStore'

export const useTransactionsStore = defineStore('transactions', () => {
  const transactions = ref([])
  const loading = ref(false)
  const totalCount = ref(0)
  const page = ref(0)
  const pageSize = 20
  const todayTotal = ref(0)
  const monthTotal = ref(0)

  const recent = computed(() =>
    [...transactions.value].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10)
  )

  function businessId() {
    return useAuthStore().business?.id
  }

  async function fetchTotals() {
    const bid = businessId()
    if (!bid) return
    const totals = await getRevenueTotals(bid)
    todayTotal.value = totals.todayTotal
    monthTotal.value = totals.monthTotal
  }

  async function fetchTransactions(reset = true) {
    const bid = businessId()
    if (!bid) return
    loading.value = true
    if (reset) { page.value = 0; transactions.value = [] }
    const [{ data, count }] = await Promise.all([
      getTransactions(bid, { limit: pageSize, offset: page.value * pageSize }),
      reset ? fetchTotals() : Promise.resolve(),
    ])
    if (data) {
      const normalized = data.map(normalizeTxn)
      transactions.value = reset ? normalized : [...transactions.value, ...normalized]
      totalCount.value = count || 0
    }
    loading.value = false
  }

  async function fetchNextPage() {
    page.value++
    await fetchTransactions(false)
  }

  async function addTransaction(data) {
    const bid = businessId()
    if (!bid) return null
    const payload = {
      business_id: bid,
      link_id: data.linkId || null,
      monto: Number(data.monto),
      nombre_remitente: data.nombreRemitente,
      banco: data.banco || 'Otro',
      telefono: data.telefono || null,
      referencia: data.referencia || `MANUAL-${Date.now()}`,
      fecha: data.fecha || new Date().toISOString(),
      raw_sms: data.rawSms || null,
      confianza: data.confianza ?? 100,
      parse_method: data.parseMethod || 'manual',
    }
    const { data: txn } = await createTransaction(payload)
    if (txn) {
      transactions.value.unshift(normalizeTxn(txn))
      fetchTotals()
    }
    return txn ? normalizeTxn(txn) : null
  }

  async function getRevenueChart(days = 30) {
    const bid = businessId()
    if (!bid) return []
    const { data } = await getDailyRevenue(bid, days)
    return data || []
  }

  function exportCsv() {
    const headers = ['Fecha', 'Monto', 'Remitente', 'Banco', 'Referencia', 'Método', 'Cobro vinculado']
    const rows = transactions.value.map(t => [
      t.fecha, t.monto, t.nombreRemitente, t.banco,
      t.referencia, t.parseMethod, t.linkId || '',
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sinpepay_transacciones_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function normalizeTxn(t) {
    return {
      id: t.id,
      monto: t.monto,
      nombreRemitente: t.nombre_remitente,
      banco: t.banco,
      telefono: t.telefono,
      referencia: t.referencia,
      fecha: t.fecha,
      rawSms: t.raw_sms,
      confianza: t.confianza,
      parseMethod: t.parse_method,
      linkId: t.link_id,
      invoiceId: t.invoice_id,
      creadoEn: t.created_at,
    }
  }

  return {
    transactions, loading, totalCount, recent,
    todayTotal, monthTotal,
    fetchTransactions, fetchNextPage, fetchTotals, addTransaction,
    getRevenueChart, exportCsv,
  }
})

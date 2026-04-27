import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import { nanoid } from 'nanoid'
import { MOCK_TRANSACTIONS } from '@/utils/mockData'
import { isToday, isThisMonth } from 'date-fns'

export const useTransactionsStore = defineStore('transactions', () => {
  const transactions = useLocalStorage('sinpepay_transactions', [])

  const todayTotal = computed(() =>
    transactions.value
      .filter(t => isToday(new Date(t.fecha)))
      .reduce((s, t) => s + t.monto, 0)
  )

  const monthTotal = computed(() =>
    transactions.value
      .filter(t => isThisMonth(new Date(t.fecha)))
      .reduce((s, t) => s + t.monto, 0)
  )

  const recent = computed(() =>
    [...transactions.value].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10)
  )

  function addTransaction(data) {
    const txn = {
      id: nanoid(8),
      monto: Number(data.monto),
      nombreRemitente: data.nombreRemitente,
      banco: data.banco || 'Otro',
      telefono: data.telefono || null,
      referencia: data.referencia || `MANUAL-${Date.now()}`,
      fecha: data.fecha || new Date().toISOString(),
      rawSms: data.rawSms || null,
      confianza: data.confianza ?? 100,
      parseMethod: data.parseMethod || 'manual',
      linkId: data.linkId || null,
      creadoEn: new Date().toISOString(),
    }
    transactions.value.unshift(txn)
    return txn
  }

  function seedMockData() {
    transactions.value = [...MOCK_TRANSACTIONS]
  }

  function clearAll() {
    transactions.value = []
  }

  function exportCsv() {
    const headers = ['Fecha', 'Monto', 'Remitente', 'Banco', 'Referencia', 'Método', 'Cobro vinculado']
    const rows = transactions.value.map(t => [
      t.fecha,
      t.monto,
      t.nombreRemitente,
      t.banco,
      t.referencia,
      t.parseMethod,
      t.linkId || '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sinpepay_transacciones_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    transactions,
    todayTotal,
    monthTotal,
    recent,
    addTransaction,
    seedMockData,
    clearAll,
    exportCsv,
  }
})

import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'
import { nanoid } from 'nanoid'
import { MOCK_PAYMENT_LINKS } from '@/utils/mockData'

export const usePaymentsStore = defineStore('payments', () => {
  const links = useLocalStorage('sinpepay_links', [])

  const activeLinks = computed(() => links.value.filter(l => l.estado === 'activo'))
  const pendingCount = computed(() => links.value.filter(l => l.estado === 'activo').length)

  function createLink(data) {
    const id = nanoid(8)
    const link = {
      id,
      descripcion: data.descripcion,
      monto: Number(data.monto),
      cliente: data.cliente || null,
      vencimiento: data.vencimiento || null,
      notas: data.notas || null,
      estado: 'activo',
      creadoEn: new Date().toISOString(),
      pagadoEn: null,
      transaccionId: null,
      url: `sinpepay.cr/p/${id}`,
    }
    links.value.unshift(link)
    return link
  }

  function markAsPaid(id, txnData = {}) {
    const link = links.value.find(l => l.id === id)
    if (!link) return
    link.estado = 'pagado'
    link.pagadoEn = txnData.fecha || new Date().toISOString()
    if (txnData.transaccionId) link.transaccionId = txnData.transaccionId
  }

  function deleteLink(id) {
    const idx = links.value.findIndex(l => l.id === id)
    if (idx !== -1) links.value.splice(idx, 1)
  }

  function getById(id) {
    return links.value.find(l => l.id === id) || null
  }

  function checkExpired() {
    const now = new Date()
    links.value.forEach(l => {
      if (l.estado === 'activo' && l.vencimiento && new Date(l.vencimiento) < now) {
        l.estado = 'vencido'
      }
    })
  }

  function seedMockData() {
    links.value = [...MOCK_PAYMENT_LINKS]
  }

  function clearAll() {
    links.value = []
  }

  return {
    links,
    activeLinks,
    pendingCount,
    createLink,
    markAsPaid,
    deleteLink,
    getById,
    checkExpired,
    seedMockData,
    clearAll,
  }
})

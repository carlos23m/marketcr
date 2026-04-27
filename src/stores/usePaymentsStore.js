import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import { supabase } from '@/lib/supabase'
import {
  getPaymentLinks, createPaymentLink,
  updatePaymentLink, deletePaymentLink, getPaymentLink,
} from '@/lib/database'
import { useAuthStore } from './useAuthStore'

export const usePaymentsStore = defineStore('payments', () => {
  const links = ref([])
  const loading = ref(false)
  let realtimeSub = null

  const activeLinks = computed(() => links.value.filter(l => l.estado === 'activo'))
  const pendingCount = computed(() => activeLinks.value.length)

  function businessId() {
    return useAuthStore().business?.id
  }

  async function fetchLinks() {
    const bid = businessId()
    if (!bid) return
    loading.value = true
    const { data } = await getPaymentLinks(bid)
    if (data) links.value = data.map(normalizeLink)
    loading.value = false
  }

  function subscribeRealtime() {
    if (realtimeSub) return
    const bid = businessId()
    if (!bid) return
    realtimeSub = supabase
      .channel('payment_links_changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'payment_links',
        filter: `business_id=eq.${bid}`,
      }, () => fetchLinks())
      .subscribe()
  }

  function unsubscribeRealtime() {
    if (realtimeSub) { supabase.removeChannel(realtimeSub); realtimeSub = null }
  }

  async function createLink(data) {
    const bid = businessId()
    if (!bid) return null
    const id = nanoid(8)
    const payload = {
      id,
      business_id: bid,
      descripcion: data.descripcion,
      monto: Number(data.monto),
      cliente: data.cliente || null,
      vencimiento: data.vencimiento ? new Date(data.vencimiento).toISOString() : null,
      notas: data.notas || null,
      estado: 'activo',
    }
    const { data: link } = await createPaymentLink(payload)
    if (link) links.value.unshift(normalizeLink(link))
    return link ? normalizeLink(link) : null
  }

  async function markAsPaid(id, txnData = {}) {
    const { data: updated } = await updatePaymentLink(id, {
      estado: 'pagado',
      pagado_en: txnData.fecha || new Date().toISOString(),
    })
    if (updated) {
      const idx = links.value.findIndex(l => l.id === id)
      if (idx !== -1) links.value[idx] = normalizeLink(updated)
    }
  }

  async function deleteLink(id) {
    await deletePaymentLink(id)
    links.value = links.value.filter(l => l.id !== id)
  }

  function getById(id) {
    return links.value.find(l => l.id === id) || null
  }

  function checkExpired() {
    const now = new Date()
    links.value.forEach(async (l) => {
      if (l.estado === 'activo' && l.vencimiento && new Date(l.vencimiento) < now) {
        await updatePaymentLink(l.id, { estado: 'vencido' })
        l.estado = 'vencido'
      }
    })
  }

  // Map DB snake_case → component camelCase
  function normalizeLink(l) {
    return {
      id: l.id,
      descripcion: l.descripcion,
      monto: l.monto,
      cliente: l.cliente,
      vencimiento: l.vencimiento,
      notas: l.notas,
      estado: l.estado,
      creadoEn: l.created_at,
      pagadoEn: l.pagado_en,
      transaccionId: l.transaction_id || null,
      url: `sinpepay.cr/p/${l.id}`,
    }
  }

  return {
    links, loading, activeLinks, pendingCount,
    fetchLinks, subscribeRealtime, unsubscribeRealtime,
    createLink, markAsPaid, deleteLink, getById, checkExpired,
  }
})

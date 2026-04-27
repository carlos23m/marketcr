import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { getInvoices, getInvoice } from '@/lib/database'
import { useAuthStore } from './useAuthStore'

export const useInvoicesStore = defineStore('invoices', () => {
  const invoices = ref([])
  const loading = ref(false)
  const generating = ref(false)

  function businessId() {
    return useAuthStore().business?.id
  }

  async function fetchInvoices() {
    const bid = businessId()
    if (!bid) return
    loading.value = true
    const { data } = await getInvoices(bid)
    if (data) invoices.value = data
    loading.value = false
  }

  async function generateInvoice(transactionId) {
    const bid = businessId()
    if (!bid) return { error: new Error('Sin negocio') }
    generating.value = true

    const { data, error } = await supabase.functions.invoke('generate-invoice', {
      body: { transaction_id: transactionId, business_id: bid },
    })

    generating.value = false
    if (!error && data?.data) {
      invoices.value.unshift(data.data)
    }
    return { data: data?.data, error }
  }

  async function downloadXml(invoiceId) {
    const inv = invoices.value.find(i => i.id === invoiceId)
    if (!inv?.xml_firmado) {
      const { data } = await getInvoice(invoiceId)
      if (!data?.xml_firmado) return
      const blob = new Blob([data.xml_firmado], { type: 'text/xml' })
      triggerDownload(blob, `factura-${data.numero_consecutivo}.xml`)
      return
    }
    const blob = new Blob([inv.xml_firmado], { type: 'text/xml' })
    triggerDownload(blob, `factura-${inv.numero_consecutivo}.xml`)
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    invoices, loading, generating,
    fetchInvoices, generateInvoice, downloadXml,
  }
})

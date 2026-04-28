import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'

export const useBatchStore = defineStore('batches', () => {
  const batches = ref([])
  const currentBatch = ref(null)
  const recipients = ref([])
  const loading = ref(false)

  function businessId() { return useAuthStore().business?.id }

  async function fetchBatches() {
    const bid = businessId()
    if (!bid) return
    loading.value = true
    const { data } = await supabase
      .from('payment_batches')
      .select('id, name, total_amount, status, scheduled_for, processed_at, created_at')
      .eq('business_id', bid)
      .order('created_at', { ascending: false })
    if (data) batches.value = data
    loading.value = false
  }

  async function fetchBatch(id) {
    const { data } = await supabase
      .from('payment_batches')
      .select('*, batch_payments(*)')
      .eq('id', id)
      .eq('business_id', businessId())
      .single()
    if (data) currentBatch.value = data
    return data
  }

  async function createBatch(payload) {
    const bid = businessId()
    if (!bid) return null
    const total = payload.payments.reduce((s, p) => s + p.amount, 0)
    const { data: batch, error } = await supabase
      .from('payment_batches')
      .insert({ business_id: bid, name: payload.name, total_amount: total, scheduled_for: payload.scheduled_for ?? null })
      .select()
      .single()
    if (error || !batch) return null
    const rows = payload.payments.map(p => ({ ...p, batch_id: batch.id }))
    await supabase.from('batch_payments').insert(rows)
    batches.value.unshift(batch)
    return batch
  }

  async function updatePaymentStatus(batchId, paymentId, status, errorMsg = null) {
    const updates = { status }
    if (status === 'sent') updates.sent_at = new Date().toISOString()
    if (errorMsg) updates.error = errorMsg
    await supabase.from('batch_payments').update(updates).eq('id', paymentId).eq('batch_id', batchId)
    if (currentBatch.value?.id === batchId) {
      const p = currentBatch.value.batch_payments.find(p => p.id === paymentId)
      if (p) Object.assign(p, updates)
    }
  }

  async function completeBatch(batchId) {
    await supabase.from('payment_batches').update({ status: 'completed', processed_at: new Date().toISOString() }).eq('id', batchId)
    const b = batches.value.find(b => b.id === batchId)
    if (b) b.status = 'completed'
    if (currentBatch.value?.id === batchId) currentBatch.value.status = 'completed'
  }

  async function deleteBatch(id) {
    await supabase.from('payment_batches').delete().eq('id', id).eq('business_id', businessId())
    batches.value = batches.value.filter(b => b.id !== id)
  }

  async function fetchRecipients(categoria = null) {
    const bid = businessId()
    if (!bid) return
    let q = supabase.from('recipients').select('*').eq('business_id', bid).order('nombre')
    if (categoria) q = q.eq('categoria', categoria)
    const { data } = await q
    if (data) recipients.value = data
  }

  async function saveRecipient(payload) {
    const bid = businessId()
    if (!bid) return null
    const { data, error } = await supabase
      .from('recipients')
      .upsert({ business_id: bid, ...payload }, { onConflict: 'business_id,sinpe_numero' })
      .select()
      .single()
    if (data) {
      const idx = recipients.value.findIndex(r => r.id === data.id)
      if (idx !== -1) recipients.value[idx] = data
      else recipients.value.push(data)
    }
    return { data, error }
  }

  async function deleteRecipient(id) {
    await supabase.from('recipients').delete().eq('id', id).eq('business_id', businessId())
    recipients.value = recipients.value.filter(r => r.id !== id)
  }

  return {
    batches, currentBatch, recipients, loading,
    fetchBatches, fetchBatch, createBatch,
    updatePaymentStatus, completeBatch, deleteBatch,
    fetchRecipients, saveRecipient, deleteRecipient,
  }
})

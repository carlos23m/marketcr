import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'

export const useFinancingStore = defineStore('financing', () => {
  const applications = ref([])
  const active = ref(null)
  const loading = ref(false)

  function businessId() { return useAuthStore().business?.id }

  async function fetchApplications() {
    const bid = businessId()
    if (!bid) return
    loading.value = true
    const { data } = await supabase
      .from('financing_applications')
      .select('id, status, amount_requested, amount_approved, amount_remaining, repayment_rate, purpose, created_at, disbursed_at')
      .eq('business_id', bid)
      .order('created_at', { ascending: false })
    if (data) {
      applications.value = data
      active.value = data.find(a => ['pending','under_review','approved','disbursed'].includes(a.status)) ?? null
    }
    loading.value = false
  }

  async function fetchActive() {
    const bid = businessId()
    if (!bid) return null
    const { data } = await supabase
      .from('financing_applications')
      .select('*, financing_repayments(id, amount, withheld_at, transaction_id)')
      .eq('business_id', bid)
      .in('status', ['pending','under_review','approved','disbursed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    active.value = data ?? null
    return data
  }

  async function submitApplication(payload) {
    const bid = businessId()
    if (!bid) return null
    const { data, error } = await supabase
      .from('financing_applications')
      .insert({
        business_id: bid,
        amount_requested: payload.amount_requested,
        amount_remaining: payload.amount_requested,
        repayment_rate: payload.repayment_rate,
        purpose: payload.purpose,
        monthly_revenue_avg: payload.monthly_revenue_avg ?? null,
        status: 'pending',
      })
      .select()
      .single()
    if (data) {
      applications.value.unshift(data)
      active.value = data
    }
    return { data, error }
  }

  return { applications, active, loading, fetchApplications, fetchActive, submitApplication }
})

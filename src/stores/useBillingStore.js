import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'

export const useBillingStore = defineStore('billing', () => {
  const history = ref([])
  const loadingHistory = ref(false)
  const checkoutLoading = ref(false)

  async function startCheckout(plan) {
    checkoutLoading.value = true
    try {
      const { data, error } = await supabase.functions.invoke('create-onvo-checkout', {
        body: { plan },
      })
      if (error || !data?.url) throw new Error(error?.message || 'No checkout URL returned')
      window.location.href = data.url
    } catch (e) {
      checkoutLoading.value = false
      throw e
    }
  }

  async function fetchBillingHistory() {
    const auth = useAuthStore()
    const customerId = auth.business?.onvo_customer_id
    if (!customerId) return

    loadingHistory.value = true
    try {
      // Fetch from Onvopay via our API route
      const res = await fetch(`/api/billing/history?customer_id=${customerId}`, {
        headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
      })
      if (res.ok) history.value = await res.json()
    } catch (e) {
      console.error('Failed to fetch billing history', e)
    } finally {
      loadingHistory.value = false
    }
  }

  return { history, loadingHistory, checkoutLoading, startCheckout, fetchBillingHistory }
})

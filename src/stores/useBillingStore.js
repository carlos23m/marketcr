import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useBillingStore = defineStore('billing', () => {
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

  return { checkoutLoading, startCheckout }
})

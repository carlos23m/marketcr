import { computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

export function usePermissions() {
  const auth = useAuthStore()

  const isDueno = computed(() => auth.rol === 'dueno')
  const isCajero = computed(() => auth.rol === 'cajero')

  const can = {
    createLink: computed(() => true),
    deleteLink: computed(() => isDueno.value),
    viewRevenueTotals: computed(() => isDueno.value),
    manageTeam: computed(() => isDueno.value),
    viewInvoices: computed(() => isDueno.value),
    manageSettings: computed(() => isDueno.value),
  }

  return { isDueno, isCajero, can }
}

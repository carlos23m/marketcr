<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PlanCard from '@/components/billing/PlanCard.vue'
import UsageMeter from '@/components/billing/UsageMeter.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBillingStore } from '@/stores/useBillingStore'
import { usePlanLimits } from '@/composables/usePlanLimits'
import { useToastStore } from '@/stores/useToastStore'
import { supabase } from '@/lib/supabase'

const route   = useRoute()
const auth    = useAuthStore()
const billing = useBillingStore()
const toast   = useToastStore()
const { plan, trialDaysLeft, isTrialing, limits } = usePlanLimits()

const usage = ref({ links: 0, txns: 0, invoices: 0 })
const loadingUsage = ref(false)
const cancelModal = ref(false)

const renewalDate = computed(() => {
  const biz = auth.business
  const d = biz?.plan_period_end || biz?.trial_end
  if (!d) return null
  return new Date(d).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })
})

async function fetchUsage() {
  loadingUsage.value = true
  const bid = auth.business?.id
  if (!bid) return
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
  const [{ count: l }, { count: t }, { count: i }] = await Promise.all([
    supabase.from('payment_links').select('id', { count: 'exact', head: true }).eq('business_id', bid).gte('created_at', startOfMonth.toISOString()),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('business_id', bid).gte('created_at', startOfMonth.toISOString()),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('business_id', bid).gte('created_at', startOfMonth.toISOString()),
  ])
  usage.value = { links: l ?? 0, txns: t ?? 0, invoices: i ?? 0 }
  loadingUsage.value = false
}

async function selectPlan(selectedPlan) {
  if (selectedPlan === 'starter') { cancelModal.value = true; return }
  try {
    await billing.startCheckout(selectedPlan)
  } catch (e) {
    toast.show(e.message || 'Error al iniciar el pago', 'error')
  }
}

onMounted(async () => {
  fetchUsage()
  if (route.query.upgraded) {
    toast.show('¡Plan actualizado con éxito!', 'success')
    await auth.updateBusinessProfile({})  // refresh business data
  }
})
</script>

<template>
  <AppShell title="Facturación">
    <!-- Trial banner -->
    <div v-if="isTrialing" class="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
      <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="text-amber-800 font-medium">Prueba Pro</span>
      <span class="text-amber-700">· {{ trialDaysLeft }} {{ trialDaysLeft === 1 ? 'día restante' : 'días restantes' }}</span>
      <button @click="selectPlan('pro')" class="ml-auto text-amber-700 font-semibold hover:underline">Ver planes →</button>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Current plan + usage -->
      <div class="lg:col-span-1 flex flex-col gap-4">
        <AppCard>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-900">Plan actual</h2>
            <span :class="[
              'text-xs font-semibold px-2.5 py-0.5 rounded-full',
              plan === 'business' ? 'bg-purple-100 text-purple-700' :
              plan === 'pro'      ? 'bg-primary-light text-primary'  :
              'bg-gray-100 text-gray-600'
            ]">{{ plan === 'starter' ? 'Starter' : plan === 'pro' ? 'Pro' : 'Business' }}</span>
          </div>
          <div v-if="renewalDate" class="text-xs text-gray-500 mb-4">
            {{ isTrialing ? 'Prueba termina' : 'Renueva' }}: {{ renewalDate }}
          </div>

          <div class="flex flex-col gap-3">
            <UsageMeter label="Cobros este mes" :used="usage.links" :limit="limits?.links ?? null" />
            <UsageMeter label="Transacciones" :used="usage.txns" :limit="limits?.txns ?? null" />
            <UsageMeter label="Facturas" :used="usage.invoices" :limit="limits?.invoices ?? null" />
          </div>
        </AppCard>
      </div>

      <!-- Plan comparison -->
      <div class="lg:col-span-2">
        <h2 class="text-sm font-semibold text-gray-900 mb-4">Planes disponibles</h2>
        <div class="grid sm:grid-cols-3 gap-4">
          <PlanCard
            v-for="p in ['starter','pro','business']"
            :key="p"
            :plan="p"
            :current="plan === p"
            :trialing="isTrialing && plan === p"
            :loading="billing.checkoutLoading"
            @select="selectPlan"
          />
        </div>
      </div>
    </div>

    <!-- Cancel confirmation modal -->
    <div v-if="cancelModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 class="text-base font-semibold text-gray-900 mb-2">¿Cancelar suscripción?</h3>
        <p class="text-sm text-gray-600 mb-5">Tu plan Pro continuará hasta el final del período facturado. Después pasarás al plan Starter.</p>
        <div class="flex gap-3">
          <AppButton variant="ghost" class="flex-1" @click="cancelModal = false">Cancelar</AppButton>
          <AppButton variant="primary" class="flex-1 !bg-red-500 hover:!bg-red-600" @click="cancelModal = false">
            Confirmar
          </AppButton>
        </div>
      </div>
    </div>
  </AppShell>
</template>

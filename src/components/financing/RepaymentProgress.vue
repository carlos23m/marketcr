<script setup>
import AppCard from '@/components/ui/AppCard.vue'
import { computed } from 'vue'
import { formatCRC } from '@/utils/currency'

const props = defineProps({ application: Object, metrics: Object })

const repaid = computed(() => {
  const app = props.application
  if (!app) return 0
  return (app.amount_approved ?? app.amount_requested) - (app.amount_remaining ?? app.amount_approved ?? app.amount_requested)
})

const total = computed(() => props.application?.amount_approved ?? props.application?.amount_requested ?? 0)
const pct   = computed(() => total.value ? Math.min(100, Math.round((repaid.value / total.value) * 100)) : 0)

const estDaysLeft = computed(() => {
  const remaining = props.application?.amount_remaining
  const avg = props.metrics?.monthlyAvg
  const rate = props.application?.repayment_rate
  if (!remaining || !avg || !rate) return null
  return Math.ceil(remaining / ((avg / 30) * rate))
})

const repayments = computed(() => props.application?.financing_repayments?.slice(0, 10) ?? [])
</script>

<template>
  <div class="space-y-6">
    <AppCard>
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-gray-900 dark:text-white">Adelanto activo</h2>
        <span class="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">Activo</span>
      </div>

      <!-- Progress ring (CSS-based) -->
      <div class="flex items-center gap-6 mb-6">
        <div class="relative w-24 h-24 shrink-0">
          <svg class="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E5E7EB" stroke-width="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1D9E75" stroke-width="3"
              :stroke-dasharray="`${pct} ${100 - pct}`" stroke-dashoffset="25" stroke-linecap="round" />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-lg font-bold text-gray-900 dark:text-white">{{ pct }}%</span>
          </div>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">Repagado</p>
          <p class="font-bold text-gray-900 dark:text-white text-lg">{{ formatCRC(repaid) }}</p>
          <p class="text-sm text-gray-400 mt-1">de {{ formatCRC(total) }}</p>
          <p v-if="estDaysLeft" class="text-xs text-gray-400 mt-1">~{{ estDaysLeft }} días estimados</p>
        </div>
      </div>

      <!-- Info -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
          <p class="text-xs text-gray-500">Pendiente</p>
          <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ formatCRC(application?.amount_remaining ?? 0) }}</p>
        </div>
        <div class="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
          <p class="text-xs text-gray-500">Retención por cobro</p>
          <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ Math.round((application?.repayment_rate ?? 0) * 100) }}%</p>
        </div>
      </div>
      <p class="text-xs text-gray-400">Cada pago recibido abona automáticamente a este adelanto.</p>
    </AppCard>

    <!-- Recent deductions -->
    <AppCard v-if="repayments.length">
      <h3 class="font-medium text-gray-900 dark:text-white mb-3">Últimas deducciones</h3>
      <div class="space-y-2">
        <div v-for="r in repayments" :key="r.id" class="flex justify-between items-center text-sm">
          <span class="text-gray-500">{{ new Date(r.withheld_at).toLocaleDateString('es-CR') }}</span>
          <span class="font-medium text-gray-900 dark:text-white">{{ formatCRC(r.amount) }}</span>
        </div>
      </div>
    </AppCard>
  </div>
</template>

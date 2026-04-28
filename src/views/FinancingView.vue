<script setup>
import { ref, computed, onMounted } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
import UpgradeBanner from '@/components/billing/UpgradeBanner.vue'
import EligibilityCard from '@/components/financing/EligibilityCard.vue'
import LoanCalculator from '@/components/financing/LoanCalculator.vue'
import ApplicationForm from '@/components/financing/ApplicationForm.vue'
import RepaymentProgress from '@/components/financing/RepaymentProgress.vue'
import FinancingTimeline from '@/components/financing/FinancingTimeline.vue'
import { useFinancingStore } from '@/stores/useFinancingStore'
import { usePlanLimits } from '@/composables/usePlanLimits'
import { useFinancingEligibility } from '@/composables/useFinancingEligibility'
import { formatCRC } from '@/utils/currency'

const store = useFinancingStore()
const { plan, planGte } = usePlanLimits()
const { computeMetrics, serviceFee, estimatedRepaymentDays } = useFinancingEligibility()

const metrics = ref(null)
const showForm = ref(false)
const confetti = ref(false)

onMounted(async () => {
  await store.fetchActive()
  metrics.value = await computeMetrics()
  if (store.active?.status === 'repaid') confetti.value = true
})

const canAccess = computed(() => planGte('pro'))
</script>

<template>
  <AppShell>
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Adelanto de ingresos</h1>
        <p class="text-sm text-gray-500 mt-1">Capital rápido basado en el historial de tu negocio en SINPEpay</p>
      </div>

      <!-- Legal disclaimer -->
      <div class="mb-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
        Este servicio es un adelanto de ingresos, no un préstamo regulado. No reemplaza productos financieros regulados por SUGEF. Consulte a un asesor financiero.
      </div>

      <UpgradeBanner v-if="!canAccess" feature="Adelantos de ingresos" required-plan="pro" />

      <template v-else>
        <!-- REPAID STATE: Celebration -->
        <template v-if="store.active?.status === 'repaid'">
          <AppCard class="text-center py-12">
            <div class="text-5xl mb-4">🎉</div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">¡Adelanto completado!</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">Ha completado su adelanto de ingresos. Felicidades.</p>
            <button @click="showForm = true" class="btn-primary">Solicitar otro adelanto</button>
          </AppCard>
        </template>

        <!-- ACTIVE / DISBURSED STATE -->
        <template v-else-if="store.active?.status === 'disbursed'">
          <RepaymentProgress :application="store.active" :metrics="metrics" />
        </template>

        <!-- UNDER REVIEW / APPROVED STATE -->
        <template v-else-if="['pending','under_review','approved'].includes(store.active?.status ?? '')">
          <FinancingTimeline :application="store.active" />
        </template>

        <!-- APPLICATION FORM -->
        <template v-else-if="showForm">
          <ApplicationForm :metrics="metrics" @submitted="showForm = false; store.fetchActive()" @cancel="showForm = false" />
        </template>

        <!-- ELIGIBLE — no application -->
        <template v-else-if="metrics?.eligible">
          <EligibilityCard :metrics="metrics" />
          <div class="mt-6">
            <LoanCalculator :metrics="metrics" :service-fee-fn="serviceFee" :repayment-days-fn="estimatedRepaymentDays" @apply="showForm = true" />
          </div>
        </template>

        <!-- NOT ELIGIBLE YET -->
        <template v-else>
          <AppCard>
            <h2 class="font-semibold text-gray-900 dark:text-white mb-4">Tu progreso hacia el adelanto</h2>
            <div v-if="metrics" class="space-y-4">
              <div v-for="(check, key) in metrics.progress" :key="key" class="flex items-center gap-3">
                <span :class="['w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0', check.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400']">
                  {{ check.done ? '✓' : '○' }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    <template v-if="key === 'days'">{{ check.current }} / {{ check.required }} días de actividad</template>
                    <template v-else-if="key === 'txns'">{{ check.current }} / {{ check.required }} transacciones registradas</template>
                    <template v-else-if="key === 'revenue'">Ingreso promedio mensual: {{ formatCRC(check.current) }} / {{ formatCRC(check.required) }} requerido</template>
                    <template v-else>Al menos un mes con ingresos confirmados</template>
                  </p>
                  <div v-if="'required' in check && !check.done" class="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full transition-all" :style="`width:${Math.min(100, Math.round((check.current/check.required)*100))}%`" />
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500">Cargando métricas de elegibilidad…</p>
            <p class="mt-6 text-xs text-gray-400">Sigue registrando tus cobros en SINPEpay para calificar.</p>
          </AppCard>
        </template>
      </template>
    </div>
  </AppShell>
</template>

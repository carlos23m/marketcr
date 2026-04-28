<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import UpgradeBanner from '@/components/billing/UpgradeBanner.vue'
import EmployeeList from '@/components/payroll/EmployeeList.vue'
import PayrollRun from '@/components/payroll/PayrollRun.vue'
import PayrollSummary from '@/components/payroll/PayrollSummary.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { usePayrollStore } from '@/stores/usePayrollStore'
import { usePlanLimits } from '@/composables/usePlanLimits'
import { formatCRC } from '@/utils/currency'

const store = usePayrollStore()
const { planGte } = usePlanLimits()
const canAccess = planGte('business')

const tab = ref('historial')
const viewingRun = ref(null)

onMounted(async () => {
  if (canAccess) {
    await Promise.all([store.fetchEmployees(), store.fetchRuns()])
  }
})

function statusColor(s) {
  return { draft:'bg-gray-100 text-gray-600', processing:'bg-amber-100 text-amber-700',
    completed:'bg-green-100 text-green-700', failed:'bg-red-100 text-red-700' }[s] ?? ''
}

async function openRun(id) {
  const data = await store.fetchRun(id)
  if (data) viewingRun.value = data
}
</script>

<template>
  <AppShell>
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Planilla</h1>
        <p class="text-sm text-gray-500 mt-1">Gestión de empleados y pago de salarios vía SINPE Móvil</p>
      </div>

      <!-- Legal disclaimer — mandatory -->
      <div class="mb-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
        <strong>Aviso legal:</strong> SINPEpay es una herramienta de registro y pago. No reemplaza la planilla oficial ante la CCSS ni el MTSS. Consulte a un contador para el cálculo correcto de cargas sociales y deducciones legales.
      </div>

      <UpgradeBanner v-if="!canAccess" feature="Planilla" required-plan="business" />

      <template v-else>
        <!-- Run detail overlay -->
        <PayrollSummary v-if="viewingRun" :run="viewingRun" @close="viewingRun = null; store.fetchRuns()" @mark-payment="(runId, payId, st) => store.markPayment(runId, payId, st)" />

        <template v-else>
          <!-- Tabs -->
          <div class="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            <button v-for="t in [{id:'historial',label:'Historial'},{id:'nueva',label:'Nueva planilla'},{id:'empleados',label:'Empleados'}]"
              :key="t.id" @click="tab = t.id"
              :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', tab === t.id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700']">
              {{ t.label }}
            </button>
          </div>

          <!-- History -->
          <div v-if="tab === 'historial'">
            <div v-if="!store.runs.length" class="text-center py-12">
              <p class="text-gray-500 text-sm">No hay planillas registradas.</p>
              <button @click="tab = 'nueva'" class="mt-3 btn-primary text-sm">Crear primera planilla</button>
            </div>
            <div v-else class="space-y-3">
              <AppCard v-for="r in store.runs" :key="r.id" class="flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow" @click="openRun(r.id)">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ r.periodo }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ r.frecuencia }} · Neto: {{ formatCRC(r.total_neto) }}</p>
                </div>
                <span :class="['text-xs font-medium px-2.5 py-1 rounded-full', statusColor(r.status)]">
                  {{ { draft:'Borrador', processing:'En proceso', completed:'Completado', failed:'Fallido' }[r.status] }}
                </span>
              </AppCard>
            </div>
          </div>

          <!-- New payroll run -->
          <div v-else-if="tab === 'nueva'">
            <PayrollRun :employees="store.employees" @created="store.fetchRuns(); tab = 'historial'" />
          </div>

          <!-- Employees -->
          <div v-else-if="tab === 'empleados'">
            <EmployeeList :employees="store.employees" @updated="store.fetchEmployees()" />
          </div>
        </template>
      </template>
    </div>
  </AppShell>
</template>

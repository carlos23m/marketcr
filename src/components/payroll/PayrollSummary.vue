<script setup>
import { computed } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import { formatCRC } from '@/utils/currency'

const props = defineProps({ run: Object })
const emit = defineEmits(['close', 'mark-payment'])

const pending = computed(() => props.run?.payroll_payments?.filter(p => p.status === 'pendiente') ?? [])
const sent    = computed(() => props.run?.payroll_payments?.filter(p => p.status === 'enviado').length ?? 0)
const total   = computed(() => props.run?.payroll_payments?.length ?? 0)

async function markSent(paymentId) {
  emit('mark-payment', props.run.id, paymentId, 'enviado')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <div>
        <h2 class="font-semibold text-gray-900 dark:text-white">Planilla: {{ run?.periodo }}</h2>
        <p class="text-xs text-gray-400 mt-0.5">{{ run?.frecuencia }} · {{ sent }}/{{ total }} enviados</p>
      </div>
      <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
    </div>

    <!-- Payment queue -->
    <div class="space-y-3">
      <AppCard v-for="p in run?.payroll_payments" :key="p.id" class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="font-medium text-gray-900 dark:text-white text-sm">{{ p.payroll_employees?.nombre ?? 'Empleado' }}</p>
          <p class="text-xs text-gray-400 font-mono">{{ p.payroll_employees?.sinpe_numero }}</p>
          <p class="text-xs text-gray-500">Bruto: {{ formatCRC(p.monto_bruto) }} | Deducción: {{ formatCRC(p.deducciones) }} | Neto: <span class="font-semibold text-primary">{{ formatCRC(p.monto_neto) }}</span></p>
        </div>
        <div class="shrink-0">
          <span v-if="p.status === 'enviado'" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Enviado</span>
          <span v-else-if="p.status === 'fallido'" class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Fallido</span>
          <button v-else @click="markSent(p.id)" class="btn-primary text-xs">Marcar enviado</button>
        </div>
      </AppCard>
    </div>

    <!-- Totals -->
    <AppCard class="mt-4">
      <div class="flex justify-between text-sm mb-1"><span class="text-gray-600">Total bruto</span><span>{{ formatCRC(run?.total_bruto ?? 0) }}</span></div>
      <div class="flex justify-between font-semibold"><span>Total neto</span><span class="text-primary">{{ formatCRC(run?.total_neto ?? 0) }}</span></div>
    </AppCard>
  </div>
</template>

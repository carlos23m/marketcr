<script setup>
import { ref, computed } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import { formatCRC } from '@/utils/currency'

const props = defineProps({
  metrics: Object,
  serviceFeeF: Function,
  repaymentDaysFn: Function,
})
const emit = defineEmits(['apply'])

const amount  = ref(Math.min(500_000, props.metrics?.maxLoan ?? 500_000))
const rate    = ref(0.12)

const fee = computed(() => props.serviceFeeF ? props.serviceFeeF(rate.value) : 0.05)
const feeAmount = computed(() => Math.round(amount.value * fee.value))
const disbursed = computed(() => amount.value - feeAmount.value)
const estDays = computed(() => props.repaymentDaysFn ? props.repaymentDaysFn(amount.value, rate.value, props.metrics?.monthlyAvg) : null)

const rates = [
  { value: 0.08, label: '8%', desc: 'Más lento · menos impacto en flujo' },
  { value: 0.12, label: '12%', desc: 'Estándar' },
  { value: 0.18, label: '18%', desc: 'Más rápido · comisión menor' },
]
</script>

<template>
  <AppCard>
    <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Calculador de adelanto</h3>

    <!-- Amount slider -->
    <div class="mb-5">
      <div class="flex justify-between mb-2">
        <label class="text-sm text-gray-600 dark:text-gray-400">Monto del adelanto</label>
        <span class="text-sm font-bold text-primary">{{ formatCRC(amount) }}</span>
      </div>
      <input type="range" v-model.number="amount" :min="100_000" :max="metrics?.maxLoan ?? 1_000_000" step="25000" class="w-full accent-primary" />
      <div class="flex justify-between text-xs text-gray-400 mt-1">
        <span>₡100,000</span>
        <span>{{ formatCRC(metrics?.maxLoan ?? 1_000_000) }}</span>
      </div>
    </div>

    <!-- Repayment rate -->
    <div class="mb-5">
      <label class="text-sm text-gray-600 dark:text-gray-400 block mb-2">Tasa de retención por cobro</label>
      <div class="grid grid-cols-3 gap-2">
        <button v-for="r in rates" :key="r.value" @click="rate = r.value"
          :class="['rounded-lg border px-3 py-2 text-left transition-colors', rate === r.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300']">
          <p class="font-bold text-sm">{{ r.label }}</p>
          <p class="text-[10px] mt-0.5 leading-tight">{{ r.desc }}</p>
        </button>
      </div>
    </div>

    <!-- Summary -->
    <div class="rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-4 space-y-2 mb-5">
      <div class="flex justify-between text-sm"><span class="text-gray-600">Monto solicitado</span><span class="font-medium">{{ formatCRC(amount) }}</span></div>
      <div class="flex justify-between text-sm"><span class="text-gray-600">Comisión ({{ Math.round(fee * 100) }}%)</span><span class="text-red-600">−{{ formatCRC(feeAmount) }}</span></div>
      <div class="flex justify-between font-semibold"><span>Recibirá</span><span class="text-primary">{{ formatCRC(disbursed) }}</span></div>
      <div v-if="estDays" class="flex justify-between text-sm pt-1 border-t border-gray-200"><span class="text-gray-500">Tiempo estimado de repago</span><span>~{{ estDays }} días</span></div>
    </div>

    <button @click="emit('apply', { amount, rate, fee: feeAmount })" class="w-full btn-primary">Solicitar adelanto</button>
  </AppCard>
</template>

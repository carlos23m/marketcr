<script setup>
import { ref } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import { useFinancingStore } from '@/stores/useFinancingStore'
import { useFinancingEligibility } from '@/composables/useFinancingEligibility'
import { formatCRC } from '@/utils/currency'

const props = defineProps({ metrics: Object })
const emit = defineEmits(['submitted', 'cancel'])

const store = useFinancingStore()
const { serviceFee } = useFinancingEligibility()

const amount   = ref(Math.min(500_000, props.metrics?.maxLoan ?? 500_000))
const rate     = ref(0.12)
const purpose  = ref('')
const customPurpose = ref('')
const loading  = ref(false)
const step     = ref(1) // 1=form, 2=confirm

const PURPOSES = ['Inventario','Equipo','Local','Contratación','Capital de trabajo','Otro']
const fee = () => serviceFee(rate.value)

async function submit() {
  loading.value = true
  const { error } = await store.submitApplication({
    amount_requested: amount.value,
    repayment_rate: rate.value,
    purpose: purpose.value === 'Otro' ? customPurpose.value : purpose.value,
    monthly_revenue_avg: props.metrics?.monthlyAvg,
  })
  loading.value = false
  if (!error) emit('submitted')
}
</script>

<template>
  <AppCard>
    <h3 class="font-semibold text-gray-900 dark:text-white mb-6">Solicitud de adelanto</h3>

    <!-- Step 1: Form -->
    <template v-if="step === 1">
      <div class="space-y-4">
        <div>
          <label class="form-label">Monto solicitado</label>
          <input v-model.number="amount" type="number" :min="100000" :max="metrics?.maxLoan" step="10000" class="form-input" />
          <p class="text-xs text-gray-400 mt-1">Máximo disponible: {{ formatCRC(metrics?.maxLoan ?? 0) }}</p>
        </div>
        <div>
          <label class="form-label">Tasa de retención</label>
          <select v-model.number="rate" class="form-input">
            <option :value="0.08">8% por cobro — comisión 6%</option>
            <option :value="0.12">12% por cobro — comisión 5%</option>
            <option :value="0.18">18% por cobro — comisión 4%</option>
          </select>
        </div>
        <div>
          <label class="form-label">Propósito del adelanto</label>
          <select v-model="purpose" class="form-input">
            <option value="">Seleccionar…</option>
            <option v-for="p in PURPOSES" :key="p" :value="p">{{ p }}</option>
          </select>
          <textarea v-if="purpose === 'Otro'" v-model="customPurpose" placeholder="Describe el uso del adelanto…" rows="3" class="form-input mt-2" />
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button @click="emit('cancel')" class="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm">Cancelar</button>
        <button @click="step = 2" :disabled="!purpose || (purpose==='Otro' && !customPurpose)" class="flex-1 btn-primary text-sm">Revisar solicitud</button>
      </div>
    </template>

    <!-- Step 2: Confirm -->
    <template v-else>
      <div class="space-y-3 mb-6">
        <div class="flex justify-between text-sm"><span class="text-gray-600">Monto solicitado</span><span class="font-medium">{{ formatCRC(amount) }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-600">Tasa de retención</span><span>{{ Math.round(rate * 100) }}% por cobro</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-600">Comisión SINPEpay</span><span>{{ Math.round(fee() * 100) }}% ({{ formatCRC(Math.round(amount * fee())) }})</span></div>
        <div class="flex justify-between text-sm font-semibold border-t pt-3"><span>Recibirá</span><span class="text-primary">{{ formatCRC(amount - Math.round(amount * fee())) }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-600">Propósito</span><span>{{ purpose === 'Otro' ? customPurpose : purpose }}</span></div>
      </div>
      <p class="text-xs text-gray-400 mb-4">Al enviar esta solicitud, un asesor de SINPEpay revisará su historial y se comunicará con usted en 1–5 días hábiles.</p>
      <div class="flex gap-3">
        <button @click="step = 1" class="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm">Editar</button>
        <button @click="submit" :disabled="loading" class="flex-1 btn-primary text-sm">{{ loading ? 'Enviando…' : 'Confirmar solicitud' }}</button>
      </div>
    </template>
  </AppCard>
</template>

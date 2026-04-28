<script setup>
import { ref, computed } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import CsvImporter from './CsvImporter.vue'
import { useBatchStore } from '@/stores/useBatchStore'
import { formatCRC } from '@/utils/currency'

const props = defineProps({ recipients: Array })
const emit = defineEmits(['created'])

const store = useBatchStore()
const name  = ref('')
const payments = ref([])
const scheduledFor = ref('')
const loading = ref(false)
const showCsv = ref(false)

function addPayment() {
  payments.value.push({ recipient_name: '', sinpe_numero: '', amount: 0, concept: '' })
}

function addFromRecipient(r) {
  payments.value.push({ recipient_name: r.nombre, sinpe_numero: r.sinpe_numero, amount: 0, concept: '' })
}

function removePayment(i) { payments.value.splice(i, 1) }

function onCsvImport(rows) {
  rows.forEach(r => payments.value.push({ recipient_name: r.nombre ?? '', sinpe_numero: r.sinpe_numero ?? '', amount: Number(r.monto ?? 0), concept: r.concepto ?? '' }))
  showCsv.value = false
}

const total = computed(() => payments.value.reduce((s, p) => s + Number(p.amount), 0))
const valid  = computed(() => name.value.trim() && payments.value.length > 0 && payments.value.every(p => p.recipient_name && p.sinpe_numero && p.amount > 0))

async function create() {
  if (!valid.value) return
  loading.value = true
  const result = await store.createBatch({ name: name.value, payments: payments.value.map(p => ({ ...p, amount: Number(p.amount) })), scheduled_for: scheduledFor.value || null })
  loading.value = false
  if (result) emit('created', result)
}
</script>

<template>
  <AppCard>
    <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Nuevo lote de pagos</h3>
    <div class="space-y-4 mb-4">
      <div>
        <label class="form-label">Nombre del lote</label>
        <input v-model="name" type="text" placeholder="Ej: Proveedores semana 18" class="form-input" />
      </div>
      <div>
        <label class="form-label">Programar para (opcional)</label>
        <input v-model="scheduledFor" type="datetime-local" class="form-input" />
      </div>
    </div>

    <!-- Recipients from address book -->
    <div v-if="props.recipients?.length" class="mb-4">
      <p class="text-xs text-gray-500 mb-2">Agregar desde destinatarios guardados:</p>
      <div class="flex flex-wrap gap-2">
        <button v-for="r in props.recipients" :key="r.id" @click="addFromRecipient(r)"
          class="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-primary hover:text-primary transition-colors">
          {{ r.nombre }}
        </button>
      </div>
    </div>

    <!-- Payment rows -->
    <div class="space-y-3 mb-4">
      <div v-for="(p, i) in payments" :key="i" class="grid grid-cols-12 gap-2 items-start">
        <input v-model="p.recipient_name" placeholder="Nombre" class="form-input col-span-3 text-sm" />
        <input v-model="p.sinpe_numero" placeholder="SINPE" class="form-input col-span-3 text-sm" />
        <input v-model.number="p.amount" type="number" placeholder="Monto ₡" class="form-input col-span-2 text-sm" />
        <input v-model="p.concept" placeholder="Concepto" class="form-input col-span-3 text-sm" />
        <button @click="removePayment(i)" class="col-span-1 text-red-400 hover:text-red-600 text-lg leading-none">×</button>
      </div>
    </div>

    <div class="flex gap-2 mb-6">
      <button @click="addPayment" class="btn-secondary text-sm">+ Agregar fila</button>
      <button @click="showCsv = !showCsv" class="btn-secondary text-sm">Importar CSV</button>
    </div>

    <CsvImporter v-if="showCsv" @imported="onCsvImport" @cancel="showCsv = false" />

    <div v-if="payments.length" class="flex items-center justify-between mb-4 pt-4 border-t border-gray-100">
      <span class="text-sm text-gray-600">Total: <span class="font-bold text-gray-900 dark:text-white">{{ formatCRC(total) }}</span> · {{ payments.length }} pagos</span>
    </div>

    <button @click="create" :disabled="!valid || loading" class="w-full btn-primary">
      {{ loading ? 'Creando lote…' : 'Crear lote' }}
    </button>
  </AppCard>
</template>

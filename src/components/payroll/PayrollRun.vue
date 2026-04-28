<script setup>
import { ref, computed } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import { usePayrollStore } from '@/stores/usePayrollStore'
import { formatCRC } from '@/utils/currency'

const props = defineProps({ employees: Array })
const emit = defineEmits(['created'])

const store = usePayrollStore()
const periodo   = ref('')
const frecuencia = ref('mensual')
const overrides = ref({}) // { [employee_id]: { deducciones: 0 } }
const loading   = ref(false)

const active = computed(() => (props.employees ?? []).filter(e => e.activo))

const payments = computed(() => active.value.map(e => {
  const ded  = Number(overrides.value[e.id]?.deducciones ?? 0)
  const neto = Math.max(0, e.salario_bruto - ded)
  return { ...e, deduccion: ded, neto }
}))

const totalBruto = computed(() => payments.value.reduce((s, p) => s + p.salario_bruto, 0))
const totalNeto  = computed(() => payments.value.reduce((s, p) => s + p.neto, 0))

function setDeduccion(id, val) {
  overrides.value[id] = { deducciones: Number(val) }
}

async function create() {
  if (!periodo.value || !active.value.length) return
  loading.value = true
  const result = await store.createRun({ periodo: periodo.value, frecuencia: frecuencia.value, overrides: overrides.value })
  loading.value = false
  if (result?.data) emit('created', result.data)
}
</script>

<template>
  <AppCard>
    <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Nueva planilla</h3>
    <div class="grid grid-cols-2 gap-4 mb-5">
      <div>
        <label class="form-label">Período</label>
        <input v-model="periodo" type="text" placeholder="Ej: 2025-05 o 2025-W20" class="form-input" />
      </div>
      <div>
        <label class="form-label">Frecuencia</label>
        <select v-model="frecuencia" class="form-input">
          <option value="semanal">Semanal</option>
          <option value="quincenal">Quincenal</option>
          <option value="mensual">Mensual</option>
        </select>
      </div>
    </div>

    <div v-if="!active.length" class="text-sm text-gray-400 mb-4">No hay empleados activos. Agréguelos en la pestaña Empleados.</div>
    <div v-else class="mb-5">
      <div class="grid grid-cols-12 gap-2 text-xs text-gray-400 px-1 mb-1">
        <span class="col-span-4">Empleado</span><span class="col-span-2">Bruto</span><span class="col-span-3">Deducción (₡)</span><span class="col-span-3">Neto</span>
      </div>
      <div v-for="p in payments" :key="p.id" class="grid grid-cols-12 gap-2 items-center mb-2">
        <span class="col-span-4 text-sm text-gray-700 dark:text-gray-300 truncate">{{ p.nombre }}</span>
        <span class="col-span-2 text-sm">{{ formatCRC(p.salario_bruto) }}</span>
        <input :value="overrides[p.id]?.deducciones ?? 0" @input="setDeduccion(p.id, $event.target.value)" type="number" min="0" class="col-span-3 form-input text-sm py-1" />
        <span class="col-span-3 text-sm font-medium text-gray-900 dark:text-white">{{ formatCRC(p.neto) }}</span>
      </div>
      <div class="grid grid-cols-12 gap-2 pt-3 border-t border-gray-100 font-semibold text-sm">
        <span class="col-span-4 text-gray-700">Totales</span>
        <span class="col-span-2">{{ formatCRC(totalBruto) }}</span>
        <span class="col-span-3"></span>
        <span class="col-span-3 text-primary">{{ formatCRC(totalNeto) }}</span>
      </div>
    </div>

    <button @click="create" :disabled="!periodo || !active.length || loading" class="w-full btn-primary">
      {{ loading ? 'Creando planilla…' : 'Crear planilla' }}
    </button>
  </AppCard>
</template>

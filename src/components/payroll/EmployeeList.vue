<script setup>
import { ref } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { usePayrollStore } from '@/stores/usePayrollStore'
import { formatCRC } from '@/utils/currency'

const props = defineProps({ employees: Array })
const emit = defineEmits(['updated'])

const store = usePayrollStore()
const editing = ref(null)
const form = ref({ nombre: '', sinpe_numero: '', salario_bruto: 0, tipo: 'planilla', activo: true })
const saving = ref(false)

function openNew() { editing.value = {}; form.value = { nombre: '', sinpe_numero: '', salario_bruto: 0, tipo: 'planilla', activo: true } }
function openEdit(e) { editing.value = e; form.value = { id: e.id, nombre: e.nombre, sinpe_numero: e.sinpe_numero, salario_bruto: e.salario_bruto, tipo: e.tipo, activo: e.activo } }

async function save() {
  saving.value = true
  await store.saveEmployee({ ...form.value, salario_bruto: Number(form.value.salario_bruto) })
  saving.value = false
  editing.value = null
  emit('updated')
}

async function remove(id) {
  if (!confirm('¿Eliminar este empleado?')) return
  await store.deleteEmployee(id)
  emit('updated')
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-semibold text-gray-900 dark:text-white">Empleados</h3>
      <button @click="openNew" class="btn-primary text-sm">+ Agregar empleado</button>
    </div>

    <div v-if="!props.employees?.length" class="text-center py-12 text-gray-400 text-sm">No hay empleados registrados.</div>
    <div v-else class="space-y-2">
      <AppCard v-for="e in props.employees" :key="e.id" class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-medium text-gray-900 dark:text-white text-sm truncate">{{ e.nombre }}</p>
            <span v-if="!e.activo" class="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Inactivo</span>
          </div>
          <p class="text-xs text-gray-400 font-mono">{{ e.sinpe_numero }}</p>
          <p class="text-xs text-gray-500">{{ formatCRC(e.salario_bruto) }} · {{ e.tipo }}</p>
        </div>
        <div class="flex gap-2 shrink-0">
          <button @click="openEdit(e)" class="text-xs text-gray-400 hover:text-primary">Editar</button>
          <button @click="remove(e.id)" class="text-xs text-red-400 hover:text-red-600">Eliminar</button>
        </div>
      </AppCard>
    </div>

    <AppModal v-if="editing !== null" @close="editing = null">
      <div class="p-6 w-full max-w-sm">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-4">{{ editing?.id ? 'Editar' : 'Nuevo' }} empleado</h4>
        <div class="space-y-3">
          <div><label class="form-label">Nombre</label><input v-model="form.nombre" class="form-input" /></div>
          <div><label class="form-label">Número SINPE</label><input v-model="form.sinpe_numero" class="form-input font-mono" /></div>
          <div><label class="form-label">Salario bruto mensual (₡)</label><input v-model.number="form.salario_bruto" type="number" class="form-input" /></div>
          <div><label class="form-label">Tipo</label>
            <select v-model="form.tipo" class="form-input">
              <option value="planilla">Planilla</option>
              <option value="freelance">Freelance</option>
              <option value="temporal">Temporal</option>
            </select>
          </div>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input v-model="form.activo" type="checkbox" class="rounded" />
            <span class="text-gray-700 dark:text-gray-300">Activo</span>
          </label>
        </div>
        <div class="flex gap-3 mt-5">
          <button @click="editing = null" class="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm">Cancelar</button>
          <button @click="save" :disabled="saving || !form.nombre || !form.sinpe_numero || !form.salario_bruto" class="flex-1 btn-primary text-sm">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

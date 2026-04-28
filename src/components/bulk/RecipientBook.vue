<script setup>
import { ref } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useBatchStore } from '@/stores/useBatchStore'

const props = defineProps({ recipients: Array })
const emit = defineEmits(['updated'])

const store = useBatchStore()
const editing = ref(null)
const form = ref({ nombre: '', sinpe_numero: '', categoria: '', notas: '' })
const saving = ref(false)

const CATS = ['proveedor','empleado','contratista','otro']

function openNew() { editing.value = {}; form.value = { nombre: '', sinpe_numero: '', categoria: 'proveedor', notas: '' } }
function openEdit(r) { editing.value = r; form.value = { nombre: r.nombre, sinpe_numero: r.sinpe_numero, categoria: r.categoria ?? '', notas: r.notas ?? '' } }

async function save() {
  saving.value = true
  const payload = editing.value?.id ? { id: editing.value.id, ...form.value } : form.value
  await store.saveRecipient(payload)
  saving.value = false
  editing.value = null
  emit('updated')
}

async function remove(id) {
  if (!confirm('¿Eliminar este destinatario?')) return
  await store.deleteRecipient(id)
  emit('updated')
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-semibold text-gray-900 dark:text-white">Destinatarios guardados</h3>
      <button @click="openNew" class="btn-primary text-sm">+ Agregar</button>
    </div>

    <div v-if="!props.recipients?.length" class="text-center py-12 text-gray-400 text-sm">
      No hay destinatarios guardados.
    </div>
    <div v-else class="space-y-2">
      <AppCard v-for="r in props.recipients" :key="r.id" class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="font-medium text-gray-900 dark:text-white text-sm truncate">{{ r.nombre }}</p>
          <p class="text-xs text-gray-400 font-mono">{{ r.sinpe_numero }}</p>
          <span v-if="r.categoria" class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{{ r.categoria }}</span>
        </div>
        <div class="flex gap-2 shrink-0">
          <button @click="openEdit(r)" class="text-xs text-gray-400 hover:text-primary">Editar</button>
          <button @click="remove(r.id)" class="text-xs text-red-400 hover:text-red-600">Eliminar</button>
        </div>
      </AppCard>
    </div>

    <AppModal v-if="editing !== null" @close="editing = null">
      <div class="p-6 w-full max-w-sm">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-4">{{ editing?.id ? 'Editar' : 'Nuevo' }} destinatario</h4>
        <div class="space-y-3">
          <div><label class="form-label">Nombre</label><input v-model="form.nombre" class="form-input" /></div>
          <div><label class="form-label">Número SINPE</label><input v-model="form.sinpe_numero" class="form-input font-mono" /></div>
          <div><label class="form-label">Categoría</label>
            <select v-model="form.categoria" class="form-input"><option v-for="c in CATS" :key="c" :value="c">{{ c }}</option></select>
          </div>
          <div><label class="form-label">Notas</label><textarea v-model="form.notas" rows="2" class="form-input" /></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button @click="editing = null" class="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm">Cancelar</button>
          <button @click="save" :disabled="saving || !form.nombre || !form.sinpe_numero" class="flex-1 btn-primary text-sm">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
        </div>
      </div>
    </AppModal>
  </div>
</template>

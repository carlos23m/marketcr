<script setup>
import { onMounted, ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import LocationCard from '@/components/locations/LocationCard.vue'
import UpgradeBanner from '@/components/billing/UpgradeBanner.vue'
import { useLocationsStore } from '@/stores/useLocationsStore'
import { usePlanLimits } from '@/composables/usePlanLimits'

const store = useLocationsStore()
const { planGte } = usePlanLimits()
const canAccess = planGte('business')

const editing = ref(null)
const form = ref({ nombre: '', direccion: '', sinpe_numero: '', is_main: false, activo: true })
const saving = ref(false)

onMounted(() => { if (canAccess) store.fetchLocations() })

function openNew() { editing.value = {}; form.value = { nombre: '', direccion: '', sinpe_numero: '', is_main: false, activo: true } }
function openEdit(l) { editing.value = l; form.value = { id: l.id, nombre: l.nombre, direccion: l.direccion ?? '', sinpe_numero: l.sinpe_numero ?? '', is_main: l.is_main, activo: l.activo } }

async function save() {
  saving.value = true
  await store.saveLocation({ ...form.value })
  saving.value = false
  editing.value = null
}

async function del(id) {
  const { error } = await store.deleteLocation(id)
  if (error) alert('No se puede eliminar la sucursal principal.')
}
</script>

<template>
  <AppShell title="Sucursales">
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Sucursales</h1>
        <button v-if="canAccess" @click="openNew" class="btn-primary text-sm">+ Nueva sucursal</button>
      </div>

      <UpgradeBanner v-if="!canAccess" feature="Multi-sucursal" required-plan="business" />

      <template v-else>
        <div v-if="store.loading" class="text-center py-12 text-gray-400 text-sm">Cargando…</div>
        <div v-else-if="!store.locations.length" class="text-center py-12 text-gray-400 text-sm">
          No hay sucursales configuradas. Su negocio opera como una sola ubicación.
        </div>
        <div v-else class="space-y-3">
          <LocationCard v-for="l in store.locations" :key="l.id" :location="l" @edit="openEdit" @delete="del" />
        </div>
      </template>

      <AppModal v-if="editing !== null" @close="editing = null">
        <div class="p-6 w-full max-w-sm">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4">{{ editing?.id ? 'Editar' : 'Nueva' }} sucursal</h3>
          <div class="space-y-3">
            <div><label class="form-label">Nombre</label><input v-model="form.nombre" class="form-input" placeholder="Ej: Sucursal Escazú" /></div>
            <div><label class="form-label">Dirección (opcional)</label><input v-model="form.direccion" class="form-input" /></div>
            <div><label class="form-label">Número SINPE (opcional)</label><input v-model="form.sinpe_numero" class="form-input font-mono" /></div>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input v-model="form.is_main" type="checkbox" class="rounded" />
              <span class="text-gray-700 dark:text-gray-300">Sucursal principal</span>
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input v-model="form.activo" type="checkbox" class="rounded" />
              <span class="text-gray-700 dark:text-gray-300">Activa</span>
            </label>
          </div>
          <div class="flex gap-3 mt-5">
            <button @click="editing = null" class="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm">Cancelar</button>
            <button @click="save" :disabled="saving || !form.nombre" class="flex-1 btn-primary text-sm">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
          </div>
        </div>
      </AppModal>
    </div>
  </AppShell>
</template>

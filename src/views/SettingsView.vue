<script setup>
import { ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePaymentsStore } from '@/stores/usePaymentsStore'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import { useToastStore } from '@/stores/useToastStore'

const auth = useAuthStore()
const paymentsStore = usePaymentsStore()
const txnStore = useTransactionsStore()
const toastStore = useToastStore()

const saving = ref(false)

const form = ref({
  nombre: auth.profile.nombre,
  tipo: auth.profile.tipo,
  sinpeNumero: auth.profile.sinpeNumero,
  cedulaJuridica: auth.profile.cedulaJuridica || '',
  whatsapp: auth.profile.whatsapp || '',
})

const tipos = [
  'Restaurante / Soda',
  'Artesanías',
  'Freelancer / Servicios',
  'Vendedor de mercado',
  'Tienda / Comercio',
  'Otro',
]

function formatPhone(e) {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
  form.value.sinpeNumero = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits
}

async function save() {
  saving.value = true
  await new Promise(r => setTimeout(r, 500))
  auth.saveProfile({
    nombre: form.value.nombre.trim(),
    tipo: form.value.tipo,
    sinpeNumero: form.value.sinpeNumero,
    cedulaJuridica: form.value.cedulaJuridica || null,
    whatsapp: form.value.whatsapp || null,
  })
  toastStore.show('Perfil actualizado')
  saving.value = false
}

function seedData() {
  paymentsStore.seedMockData()
  txnStore.seedMockData()
  toastStore.show('Datos de prueba cargados')
}

function clearData() {
  if (!confirm('¿Borrar todos los datos? Esta acción no se puede deshacer.')) return
  paymentsStore.clearAll()
  txnStore.clearAll()
  toastStore.show('Todos los datos han sido eliminados', 'info')
}
</script>

<template>
  <AppShell title="Configuración">
    <div class="max-w-2xl space-y-6">
      <!-- Profile -->
      <AppCard>
        <h2 class="text-sm font-semibold text-gray-900 mb-5">Perfil del negocio</h2>
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre del negocio</label>
            <input v-model="form.nombre" type="text" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Tipo de negocio</label>
            <select v-model="form.tipo" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Número SINPE Móvil</label>
            <input :value="form.sinpeNumero" type="tel" placeholder="8888-8888" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" @input="formatPhone" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Cédula jurídica <span class="text-gray-400 font-normal">(opcional)</span></label>
            <input v-model="form.cedulaJuridica" type="text" placeholder="3-XXX-XXXXXX" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp para alertas <span class="text-gray-400 font-normal">(opcional)</span></label>
            <input v-model="form.whatsapp" type="tel" placeholder="8888-8888" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <AppButton variant="primary" :loading="saving" @click="save">
            Guardar cambios
          </AppButton>
        </div>
      </AppCard>

      <!-- Demo data -->
      <AppCard>
        <h2 class="text-sm font-semibold text-gray-900 mb-2">Datos de demostración</h2>
        <p class="text-xs text-gray-500 mb-4">Use estos botones para probar SINPEpay con datos de ejemplo</p>
        <div class="flex flex-col sm:flex-row gap-3">
          <AppButton variant="secondary" @click="seedData">
            Cargar datos de prueba
          </AppButton>
          <AppButton variant="danger" @click="clearData">
            Limpiar todos los datos
          </AppButton>
        </div>
      </AppCard>

      <!-- About -->
      <AppCard>
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Sobre SINPEpay</h2>
        <div class="space-y-2 text-sm text-gray-500">
          <div class="flex justify-between">
            <span>Versión</span>
            <span class="text-gray-900 font-medium">1.0.0 — Milestone 1</span>
          </div>
          <div class="flex justify-between">
            <span>Estado</span>
            <span class="text-primary font-medium">Demo / MVP</span>
          </div>
          <div class="flex justify-between">
            <span>Moneda</span>
            <span class="text-gray-900">Colón Costarricense (₡ CRC)</span>
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-4">
          SINPEpay es una herramienta de gestión empresarial para SINPE Móvil.
          En esta versión los datos se almacenan localmente en su dispositivo.
        </p>
      </AppCard>
    </div>
  </AppShell>
</template>

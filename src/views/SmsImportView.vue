<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { useSmsParser } from '@/composables/useSmsParser'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import { usePaymentsStore } from '@/stores/usePaymentsStore'
import { useToastStore } from '@/stores/useToastStore'
import { formatCRC } from '@/utils/currency'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const route = useRoute()
const router = useRouter()
const { parseSms } = useSmsParser()
const txnStore = useTransactionsStore()
const paymentsStore = usePaymentsStore()
const toastStore = useToastStore()

const smsText = ref('')
const parsed = ref(null)
const analyzing = ref(false)
const selectedLinkId = ref('')
const saving = ref(false)
const editMode = ref(false)

const editForm = ref({})

const activeLinks = computed(() => paymentsStore.links.filter(l => l.estado === 'activo'))

onMounted(async () => {
  if (!paymentsStore.links.length) await paymentsStore.fetchLinks()
  if (route.query.monto) {
    const matching = activeLinks.value.find(l => String(l.monto) === String(route.query.monto))
    if (matching) selectedLinkId.value = matching.id
  }
  if (route.query.linkId) selectedLinkId.value = route.query.linkId
})

function analyze() {
  if (!smsText.value.trim()) {
    toastStore.show('Pegue el texto del SMS primero', 'warning')
    return
  }
  analyzing.value = true
  setTimeout(() => {
    parsed.value = parseSms(smsText.value)
    editForm.value = { ...parsed.value }
    editMode.value = false
    analyzing.value = false
  }, 700)
}

function fmtDate(iso) {
  try { return format(new Date(iso), "d 'de' MMMM, yyyy · HH:mm", { locale: es }) }
  catch { return iso }
}

const confidenceColor = computed(() => {
  if (!parsed.value) return 'info'
  if (parsed.value.confianza >= 80) return 'success'
  if (parsed.value.confianza >= 50) return 'warning'
  return 'error'
})

async function save() {
  if (!parsed.value) return
  saving.value = true
  const data = editMode.value ? editForm.value : parsed.value
  await new Promise(r => setTimeout(r, 400))
  txnStore.addTransaction({
    ...data,
    linkId: selectedLinkId.value || null,
    rawSms: smsText.value,
  })
  if (selectedLinkId.value) {
    const link = paymentsStore.getById(selectedLinkId.value)
    if (link && link.estado === 'activo') {
      paymentsStore.markAsPaid(selectedLinkId.value, { fecha: data.fecha })
    }
  }
  toastStore.show('Transacción guardada correctamente')
  saving.value = false
  router.push('/transacciones')
}
</script>

<template>
  <AppShell title="Importar SMS">
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Input -->
      <AppCard>
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Pegue aquí el SMS de confirmación de SINPE</h2>
        <textarea
          v-model="smsText"
          rows="6"
          placeholder="Ejemplo:&#10;SINPE Movil: Recibio ₡15,000.00 de JUAN PEREZ&#10;Ref:20240115143022 15/01/2024 14:30"
          class="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors resize-none"
        />
        <AppButton variant="primary" class="w-full mt-3" :loading="analyzing" @click="analyze">
          Analizar SMS
        </AppButton>

        <div class="mt-4">
          <p class="text-xs font-medium text-gray-500 mb-2">Formatos compatibles</p>
          <div class="flex flex-wrap gap-1">
            <AppBadge variant="info">BCR</AppBadge>
            <AppBadge variant="info">Banco Nacional</AppBadge>
            <AppBadge variant="info">Banco Popular</AppBadge>
            <AppBadge variant="info">Genérico</AppBadge>
          </div>
        </div>
      </AppCard>

      <!-- Result -->
      <div>
        <AppCard v-if="!parsed" class="flex flex-col items-center justify-center py-12 text-center">
          <svg class="w-12 h-12 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
          <p class="text-sm text-gray-400">El resultado del análisis aparecerá aquí</p>
        </AppCard>

        <AppCard v-else>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-900">Resultado del análisis</h2>
            <div class="flex items-center gap-2">
              <AppBadge :variant="confidenceColor">{{ parsed.confianza }}% confianza</AppBadge>
              <AppBadge variant="info">{{ parsed.banco }}</AppBadge>
            </div>
          </div>

          <div v-if="parsed.confianza < 80" class="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5 mb-4">
            <p class="text-xs text-yellow-700">Confianza baja — revise y corrija los datos si es necesario</p>
          </div>

          <div v-if="!editMode" class="space-y-3 text-sm mb-4">
            <div class="flex justify-between">
              <span class="text-gray-500">Monto</span>
              <span class="font-semibold text-gray-900 amount">{{ formatCRC(parsed.monto) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Remitente</span>
              <span class="text-gray-900">{{ parsed.nombreRemitente }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Referencia</span>
              <span class="text-gray-900 font-mono text-xs">{{ parsed.referencia }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Fecha</span>
              <span class="text-gray-900">{{ fmtDate(parsed.fecha) }}</span>
            </div>
            <div v-if="parsed.telefono" class="flex justify-between">
              <span class="text-gray-500">Teléfono</span>
              <span class="text-gray-900">{{ parsed.telefono }}</span>
            </div>
          </div>

          <!-- Edit mode -->
          <div v-else class="flex flex-col gap-3 mb-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Monto (₡)</label>
              <input v-model.number="editForm.monto" type="number" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Remitente</label>
              <input v-model="editForm.nombreRemitente" type="text" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Banco</label>
              <select v-model="editForm.banco" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option v-for="b in ['BCR','BN','BP','BAC','Scotiabank','Otro']" :key="b" :value="b">{{ b }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Referencia</label>
              <input v-model="editForm.referencia" type="text" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
          </div>

          <button class="text-xs text-primary hover:underline mb-4" @click="editMode = !editMode">
            {{ editMode ? 'Ver resultado original' : 'Editar datos manualmente' }}
          </button>

          <!-- Link to payment -->
          <div v-if="activeLinks.length > 0" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Vincular a un cobro activo</label>
            <select v-model="selectedLinkId" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="">Sin vincular</option>
              <option v-for="l in activeLinks" :key="l.id" :value="l.id">
                {{ l.descripcion }} — {{ formatCRC(l.monto) }}
              </option>
            </select>
          </div>

          <AppButton variant="primary" class="w-full" :loading="saving" @click="save">
            Guardar transacción
          </AppButton>
        </AppCard>
      </div>
    </div>
  </AppShell>
</template>

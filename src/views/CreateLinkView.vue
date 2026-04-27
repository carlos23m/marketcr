<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { usePaymentsStore } from '@/stores/usePaymentsStore'
import { useAppClipboard } from '@/composables/useClipboard'
import { useLinkUrl } from '@/composables/useLinkUrl'
import { formatCRC } from '@/utils/currency'
import QrcodeVue from 'qrcode.vue'

const router = useRouter()
const store = usePaymentsStore()
const { copyWithToast } = useAppClipboard()

onMounted(() => { if (!store.links.length) store.fetchLinks() })
const { linkUrl } = useLinkUrl()

const saving = ref(false)
const createdLink = ref(null)

const form = ref({
  descripcion: '',
  monto: '',
  cliente: '',
  vencimiento: '',
  notas: '',
})

const errors = ref({})

const montoDisplay = ref('')

function formatMontoBlur() {
  const num = parseFloat(String(form.value.monto).replace(/[^0-9.]/g, ''))
  if (!isNaN(num)) {
    form.value.monto = Math.round(num)
    montoDisplay.value = formatCRC(form.value.monto)
  }
}

function montoInput(e) {
  const raw = e.target.value.replace(/[^0-9]/g, '')
  form.value.monto = raw
  montoDisplay.value = raw
}

function validate() {
  errors.value = {}
  if (!form.value.descripcion.trim()) errors.value.descripcion = 'La descripción es obligatoria'
  if (!form.value.monto || Number(form.value.monto) <= 0) errors.value.monto = 'Ingrese un monto válido'
  return Object.keys(errors.value).length === 0
}

async function submit() {
  if (!validate()) return
  saving.value = true
  await new Promise(r => setTimeout(r, 500))
  createdLink.value = store.createLink(form.value)
  saving.value = false
}

function whatsappShare() {
  if (!createdLink.value) return
  const text = encodeURIComponent(
    `Hola! Le comparto el enlace de cobro por ${formatCRC(createdLink.value.monto)} para "${createdLink.value.descripcion}":\n${linkUrl(createdLink.value.id)}`
  )
  window.open(`https://wa.me/?text=${text}`, '_blank')
}

const defaultExpiry = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
})
</script>

<template>
  <AppShell title="Crear cobro">
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Form -->
      <AppCard>
        <h2 class="text-sm font-semibold text-gray-900 mb-5">Detalles del cobro</h2>

        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Descripción <span class="text-red-400">*</span></label>
            <input
              v-model="form.descripcion"
              type="text"
              placeholder="Ej: Almuerzo del día, Aretes artesanales..."
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
              :class="{ 'border-red-400': errors.descripcion }"
            />
            <p v-if="errors.descripcion" class="text-xs text-red-500 mt-1">{{ errors.descripcion }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Monto (₡) <span class="text-red-400">*</span></label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₡</span>
              <input
                :value="montoDisplay"
                type="text"
                inputmode="numeric"
                placeholder="0"
                class="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                :class="{ 'border-red-400': errors.monto }"
                @input="montoInput"
                @blur="formatMontoBlur"
              />
            </div>
            <p v-if="errors.monto" class="text-xs text-red-500 mt-1">{{ errors.monto }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre del cliente <span class="text-gray-400 font-normal">(opcional)</span></label>
            <input
              v-model="form.cliente"
              type="text"
              placeholder="Ej: Juan Vargas"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Vencimiento <span class="text-gray-400 font-normal">(opcional)</span></label>
            <input
              v-model="form.vencimiento"
              type="date"
              :min="new Date().toISOString().split('T')[0]"
              :placeholder="defaultExpiry"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Notas adicionales <span class="text-gray-400 font-normal">(opcional)</span></label>
            <textarea
              v-model="form.notas"
              rows="2"
              placeholder="Instrucciones o detalles extra..."
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors resize-none"
            />
          </div>

          <AppButton variant="primary" :loading="saving" @click="submit">
            Generar cobro
          </AppButton>
        </div>
      </AppCard>

      <!-- Preview -->
      <div>
        <AppCard v-if="!createdLink" class="flex flex-col items-center justify-center py-12 text-center">
          <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
            </svg>
          </div>
          <p class="text-sm text-gray-400">Complete el formulario y genere su cobro para ver el QR aquí</p>
        </AppCard>

        <AppCard v-else>
          <h2 class="text-sm font-semibold text-gray-900 mb-5">Enlace generado</h2>
          <div class="flex flex-col items-center gap-4">
            <div class="bg-white p-3 rounded-xl border border-gray-100">
              <QrcodeVue :value="linkUrl(createdLink.id)" :size="200" level="H" render-as="svg" />
            </div>
            <div class="text-center">
              <p class="text-2xl font-semibold text-gray-900 amount">{{ formatCRC(createdLink.monto) }}</p>
              <p class="text-sm text-gray-600 mt-0.5">{{ createdLink.descripcion }}</p>
              <p v-if="createdLink.cliente" class="text-xs text-gray-400 mt-0.5">Para: {{ createdLink.cliente }}</p>
              <p class="text-xs text-gray-400 mt-2 font-mono">{{ createdLink.url }}</p>
            </div>
            <div class="flex flex-col gap-2 w-full">
              <AppButton variant="secondary" @click="copyWithToast(linkUrl(createdLink.id))">
                Copiar enlace
              </AppButton>
              <AppButton variant="primary" @click="whatsappShare">
                Compartir por WhatsApp
              </AppButton>
              <AppButton variant="ghost" @click="router.push(`/links/${createdLink.id}`)">
                Ver detalle
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  </AppShell>
</template>

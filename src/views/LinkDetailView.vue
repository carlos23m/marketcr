<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge.vue'
import { usePaymentsStore } from '@/stores/usePaymentsStore'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import { useAppClipboard } from '@/composables/useClipboard'
import { useLinkUrl } from '@/composables/useLinkUrl'
import { formatCRC } from '@/utils/currency'
import QrcodeVue from 'qrcode.vue'

const route = useRoute()
const router = useRouter()
const store = usePaymentsStore()
const txnStore = useTransactionsStore()
const { copyWithToast } = useAppClipboard()
const { linkUrl } = useLinkUrl()

const link = computed(() => store.getById(route.params.id))
const savingPaid = ref(false)

onMounted(async () => {
  if (!store.links.length) await store.fetchLinks()
})

const markPaidModal = ref(false)
const markPaidForm = ref({ nombrePagador: '', fecha: new Date().toISOString().split('T')[0], referencia: '' })

function fmtDate(iso) {
  try { return format(new Date(iso), "d 'de' MMMM, yyyy · HH:mm", { locale: es }) }
  catch { return '—' }
}

function fmtDateShort(iso) {
  try { return format(new Date(iso), "d 'de' MMMM, yyyy", { locale: es }) }
  catch { return '—' }
}

async function confirmMarkPaid() {
  if (!link.value) return
  savingPaid.value = true
  const txn = await txnStore.addTransaction({
    monto: link.value.monto,
    nombreRemitente: markPaidForm.value.nombrePagador || link.value.cliente || 'Sin nombre',
    banco: 'Otro',
    referencia: markPaidForm.value.referencia || `MANUAL-${Date.now()}`,
    fecha: markPaidForm.value.fecha ? new Date(markPaidForm.value.fecha).toISOString() : new Date().toISOString(),
    confianza: 100,
    parseMethod: 'manual',
    linkId: link.value.id,
  })
  await store.markAsPaid(link.value.id, { fecha: txn?.fecha })
  savingPaid.value = false
  markPaidModal.value = false
}

function whatsappShare() {
  if (!link.value) return
  const text = encodeURIComponent(
    `Hola! Le comparto el enlace de cobro por ${formatCRC(link.value.monto)} para "${link.value.descripcion}":\n${linkUrl(link.value.id)}`
  )
  window.open(`https://wa.me/?text=${text}`, '_blank')
}

const timelineSteps = computed(() => {
  if (!link.value) return []
  const steps = [
    { label: 'Creado', date: fmtDate(link.value.creadoEn), done: true },
    { label: 'Enviado al cliente', date: link.value.cliente ? `Para ${link.value.cliente}` : 'Listo para compartir', done: true },
    { label: 'Pago confirmado', date: link.value.pagadoEn ? fmtDate(link.value.pagadoEn) : 'Pendiente', done: link.value.estado === 'pagado' },
  ]
  return steps
})
</script>

<template>
  <AppShell :title="link?.descripcion || 'Detalle del cobro'">
    <div v-if="!link" class="flex flex-col items-center justify-center py-20">
      <p class="text-gray-400">Cobro no encontrado</p>
      <AppButton variant="ghost" class="mt-4" @click="router.push('/payment-links')">Volver a cobros</AppButton>
    </div>

    <div v-else class="grid lg:grid-cols-2 gap-6">
      <!-- Left: QR + actions -->
      <div class="flex flex-col gap-4">
        <AppCard>
          <div class="flex flex-col items-center gap-4">
            <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <QrcodeVue :value="linkUrl(link.id)" :size="220" level="H" render-as="svg" />
            </div>
            <div class="text-center">
              <p class="text-3xl font-semibold text-gray-900 amount">{{ formatCRC(link.monto) }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ link.descripcion }}</p>
              <p v-if="link.cliente" class="text-xs text-gray-400 mt-0.5">Para: {{ link.cliente }}</p>
              <p class="text-xs text-gray-400 font-mono mt-2">{{ link.url }}</p>
            </div>
            <div class="flex flex-col gap-2 w-full">
              <AppButton variant="secondary" @click="copyWithToast(linkUrl(link.id))">
                Copiar enlace
              </AppButton>
              <AppButton variant="primary" @click="whatsappShare">
                Compartir por WhatsApp
              </AppButton>
              <AppButton variant="ghost" @click="router.push(`/sms-import?monto=${link.monto}&linkId=${link.id}`)">
                Registrar confirmación SMS
              </AppButton>
              <AppButton
                v-if="link.estado === 'activo'"
                variant="secondary"
                @click="markPaidModal = true"
              >
                Marcar como pagado manualmente
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Right: Info + timeline -->
      <div class="flex flex-col gap-4">
        <AppCard>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-900">Información del cobro</h2>
            <PaymentStatusBadge :estado="link.estado" />
          </div>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Monto</span>
              <span class="font-semibold text-gray-900 amount">{{ formatCRC(link.monto) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Cliente</span>
              <span class="text-gray-900">{{ link.cliente || '—' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Vencimiento</span>
              <span class="text-gray-900">{{ link.vencimiento ? fmtDateShort(link.vencimiento) : 'Sin vencimiento' }}</span>
            </div>
            <div v-if="link.notas" class="flex justify-between">
              <span class="text-gray-500">Notas</span>
              <span class="text-gray-900 text-right max-w-[200px]">{{ link.notas }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Creado</span>
              <span class="text-gray-900">{{ fmtDateShort(link.creadoEn) }}</span>
            </div>
          </div>
        </AppCard>

        <AppCard>
          <h2 class="text-sm font-semibold text-gray-900 mb-4">Estado del cobro</h2>
          <div class="space-y-4">
            <div v-for="(step, i) in timelineSteps" :key="i" class="flex items-start gap-3">
              <div :class="['w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', step.done ? 'bg-primary' : 'bg-gray-200']">
                <svg v-if="step.done" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
                <div v-else class="w-2 h-2 rounded-full bg-gray-400" />
              </div>
              <div>
                <p :class="['text-sm font-medium', step.done ? 'text-gray-900' : 'text-gray-400']">{{ step.label }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ step.date }}</p>
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Mark Paid Modal -->
    <AppModal :show="markPaidModal" title="Registrar pago manual" @close="markPaidModal = false">
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre del pagador</label>
          <input v-model="markPaidForm.nombrePagador" type="text" :placeholder="link?.cliente || 'Nombre'" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Fecha de pago</label>
          <input v-model="markPaidForm.fecha" type="date" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Referencia de SINPE</label>
          <input v-model="markPaidForm.referencia" type="text" placeholder="Número de referencia" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
      </div>
      <template #footer>
        <AppButton variant="ghost" @click="markPaidModal = false">Cancelar</AppButton>
        <AppButton variant="primary" :loading="savingPaid" @click="confirmMarkPaid">Confirmar</AppButton>
      </template>
    </AppModal>
  </AppShell>
</template>

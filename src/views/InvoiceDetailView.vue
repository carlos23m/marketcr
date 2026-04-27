<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge.vue'
import { getInvoice } from '@/lib/database'
import { useInvoicesStore } from '@/stores/useInvoicesStore'
import { formatCRC } from '@/utils/currency'

const route = useRoute()
const router = useRouter()
const store = useInvoicesStore()

const invoice = ref(null)
const loading = ref(true)
const showXml = ref(false)
const showResponse = ref(false)

onMounted(async () => {
  const { data } = await getInvoice(route.params.id)
  invoice.value = data
  loading.value = false
})

function fmtDate(iso) {
  try { return format(new Date(iso), "d 'de' MMMM, yyyy · HH:mm", { locale: es }) }
  catch { return '—' }
}

const timelineSteps = [
  { key: 'borrador', label: 'Borrador generado' },
  { key: 'enviada', label: 'Enviada a Hacienda' },
  { key: 'aceptada', label: 'Aceptada por Hacienda' },
]

const estadoOrder = ['borrador', 'enviada', 'aceptada', 'rechazada']
function stepDone(stepKey) {
  if (!invoice.value) return false
  const cur = estadoOrder.indexOf(invoice.value.estado)
  const step = estadoOrder.indexOf(stepKey)
  return cur >= step
}
</script>

<template>
  <AppShell title="Detalle de factura">
    <div v-if="loading" class="py-16 text-center text-gray-400">Cargando...</div>

    <div v-else-if="!invoice" class="py-16 text-center">
      <p class="text-gray-400">Factura no encontrada</p>
      <AppButton variant="ghost" class="mt-4" @click="router.push('/facturas')">Volver</AppButton>
    </div>

    <div v-else class="grid lg:grid-cols-2 gap-6">
      <div class="flex flex-col gap-4">
        <AppCard>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-gray-900">Factura electrónica</h2>
            <InvoiceStatusBadge :estado="invoice.estado" />
          </div>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Número</span><span class="font-mono text-xs">{{ invoice.numero_consecutivo }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Clave</span><span class="font-mono text-[10px] break-all text-right max-w-[200px]">{{ invoice.clave }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Fecha emisión</span><span>{{ fmtDate(invoice.fecha_emision) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Cliente</span><span>{{ invoice.transactions?.nombre_remitente || '—' }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Monto</span><span class="amount font-semibold">{{ formatCRC(invoice.transactions?.monto || 0) }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Medio de pago</span><span class="text-primary font-medium">06 — SINPE Móvil</span></div>
          </div>

          <div class="flex gap-2 mt-5">
            <AppButton variant="secondary" size="sm" @click="store.downloadXml(invoice.id)">
              Descargar XML
            </AppButton>
          </div>
        </AppCard>

        <AppCard>
          <h2 class="text-sm font-semibold text-gray-900 mb-4">Estado del trámite</h2>
          <div class="space-y-4">
            <div v-for="step in timelineSteps" :key="step.key" class="flex items-center gap-3">
              <div :class="['w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', stepDone(step.key) ? 'bg-primary' : 'bg-gray-200']">
                <svg v-if="stepDone(step.key)" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
                <div v-else class="w-2 h-2 rounded-full bg-gray-400" />
              </div>
              <span :class="['text-sm', stepDone(step.key) ? 'text-gray-900 font-medium' : 'text-gray-400']">{{ step.label }}</span>
            </div>
            <div v-if="invoice.estado === 'rechazada'" class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100">
                <svg class="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <span class="text-sm text-red-600 font-medium">Rechazada por Hacienda</span>
            </div>
          </div>
        </AppCard>
      </div>

      <div class="flex flex-col gap-4">
        <AppCard v-if="invoice.xml_firmado">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-900">XML de la factura</h2>
            <button class="text-xs text-primary hover:underline" @click="showXml = !showXml">
              {{ showXml ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
          <div v-if="showXml" class="bg-gray-50 rounded-lg p-3 overflow-auto max-h-80">
            <pre class="text-[10px] text-gray-600 whitespace-pre-wrap">{{ invoice.xml_firmado }}</pre>
          </div>
        </AppCard>

        <AppCard v-if="invoice.hacienda_response">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-900">Respuesta de Hacienda</h2>
            <button class="text-xs text-primary hover:underline" @click="showResponse = !showResponse">
              {{ showResponse ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
          <div v-if="showResponse" class="bg-gray-50 rounded-lg p-3 overflow-auto max-h-60">
            <pre class="text-[10px] text-gray-600">{{ JSON.stringify(invoice.hacienda_response, null, 2) }}</pre>
          </div>
        </AppCard>

        <AppCard>
          <h2 class="text-sm font-semibold text-gray-900 mb-3">Notas importantes</h2>
          <ul class="text-xs text-gray-500 space-y-2">
            <li>• Esta factura usa modo <strong>sandbox</strong> (sin firma real de certificado .p12)</li>
            <li>• Para producción, se requiere el certificado digital de la ATV de Hacienda</li>
            <li>• El código de actividad <strong>621900</strong> es genérico — actualice según su CIIU</li>
            <li>• MedioPago <strong>06 (SINPE Móvil)</strong> es obligatorio desde septiembre 2025</li>
          </ul>
        </AppCard>
      </div>
    </div>
  </AppShell>
</template>

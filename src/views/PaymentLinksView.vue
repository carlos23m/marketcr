<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import PaymentStatusBadge from '@/components/payments/PaymentStatusBadge.vue'
import PaymentQRModal from '@/components/payments/PaymentQRModal.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { usePaymentsStore } from '@/stores/usePaymentsStore'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import { useAppClipboard } from '@/composables/useClipboard'
import { formatCRC } from '@/utils/currency'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const router = useRouter()
const store = usePaymentsStore()
const txnStore = useTransactionsStore()
const { copyWithToast } = useAppClipboard()

store.checkExpired()

const filterTab = ref('all')
const searchQuery = ref('')
const qrModal = ref({ show: false, link: null })
const markPaidModal = ref({ show: false, link: null })
const markPaidForm = ref({ nombrePagador: '', fecha: '', referencia: '' })

const tabs = [
  { key: 'all', label: 'Todos' },
  { key: 'activo', label: 'Activos' },
  { key: 'pagado', label: 'Pagados' },
  { key: 'vencido', label: 'Vencidos' },
]

const filteredLinks = computed(() => {
  let list = store.links
  if (filterTab.value !== 'all') list = list.filter(l => l.estado === filterTab.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(l =>
      l.descripcion.toLowerCase().includes(q) ||
      (l.cliente && l.cliente.toLowerCase().includes(q))
    )
  }
  return list
})

function fmtDate(iso) {
  try { return format(new Date(iso), "d MMM yyyy", { locale: es }) }
  catch { return '—' }
}

function openQr(link) {
  qrModal.value = { show: true, link }
}

function openMarkPaid(link) {
  markPaidModal.value = { show: true, link }
  markPaidForm.value = {
    nombrePagador: link.cliente || '',
    fecha: new Date().toISOString().split('T')[0],
    referencia: '',
  }
}

function confirmMarkPaid() {
  const link = markPaidModal.value.link
  if (!link) return
  const txn = txnStore.addTransaction({
    monto: link.monto,
    nombreRemitente: markPaidForm.value.nombrePagador || link.cliente || 'Sin nombre',
    banco: 'Otro',
    referencia: markPaidForm.value.referencia || `MANUAL-${Date.now()}`,
    fecha: markPaidForm.value.fecha ? new Date(markPaidForm.value.fecha).toISOString() : new Date().toISOString(),
    confianza: 100,
    parseMethod: 'manual',
    linkId: link.id,
  })
  store.markAsPaid(link.id, { fecha: txn.fecha, transaccionId: txn.id })
  markPaidModal.value.show = false
}

function deleteLink(id) {
  if (confirm('¿Eliminar este cobro?')) store.deleteLink(id)
}
</script>

<template>
  <AppShell title="Cobros">
    <template #topbar-actions>
      <AppButton variant="primary" size="sm" @click="router.push('/create-link')">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nuevo cobro
      </AppButton>
    </template>

    <AppCard padding="">
      <!-- Filters -->
      <div class="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100">
        <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="[
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              filterTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            ]"
            @click="filterTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar cobros..."
          class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>

      <!-- Empty -->
      <AppEmptyState
        v-if="filteredLinks.length === 0"
        title="No hay cobros aquí"
        description="Cree su primer cobro para empezar a recibir pagos."
      >
        <template #action>
          <AppButton variant="primary" @click="router.push('/create-link')">Crear cobro</AppButton>
        </template>
      </AppEmptyState>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Descripción</th>
              <th class="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Monto</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">Cliente</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
              <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Creado</th>
              <th class="py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="link in filteredLinks"
              :key="link.id"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
              @click="router.push(`/links/${link.id}`)"
            >
              <td class="py-3 px-4 font-medium text-gray-800">{{ link.descripcion }}</td>
              <td class="py-3 px-4 text-right amount">{{ formatCRC(link.monto) }}</td>
              <td class="py-3 px-4 text-gray-500 hidden sm:table-cell">{{ link.cliente || '—' }}</td>
              <td class="py-3 px-4"><PaymentStatusBadge :estado="link.estado" /></td>
              <td class="py-3 px-4 text-gray-400 text-xs hidden md:table-cell">{{ fmtDate(link.creadoEn) }}</td>
              <td class="py-3 px-4" @click.stop>
                <div class="flex items-center gap-1">
                  <button class="p-1.5 text-gray-400 hover:text-primary rounded" title="Ver QR" @click="openQr(link)">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                    </svg>
                  </button>
                  <button class="p-1.5 text-gray-400 hover:text-primary rounded" title="Copiar enlace" @click="copyWithToast(`https://${link.url}`)">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </button>
                  <button
                    v-if="link.estado === 'activo'"
                    class="p-1.5 text-gray-400 hover:text-green-600 rounded"
                    title="Marcar como pagado"
                    @click="openMarkPaid(link)"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </button>
                  <button class="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Eliminar" @click="deleteLink(link.id)">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <!-- QR Modal -->
    <PaymentQRModal
      :show="qrModal.show"
      :link="qrModal.link"
      @close="qrModal.show = false"
    />

    <!-- Mark Paid Modal -->
    <AppModal :show="markPaidModal.show" title="Marcar como pagado" @close="markPaidModal.show = false">
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre del pagador</label>
          <input v-model="markPaidForm.nombrePagador" type="text" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Fecha de pago</label>
          <input v-model="markPaidForm.fecha" type="date" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Referencia</label>
          <input v-model="markPaidForm.referencia" type="text" placeholder="Número de referencia" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
      </div>
      <template #footer>
        <AppButton variant="ghost" @click="markPaidModal.show = false">Cancelar</AppButton>
        <AppButton variant="primary" @click="confirmMarkPaid">Confirmar pago</AppButton>
      </template>
    </AppModal>
  </AppShell>
</template>

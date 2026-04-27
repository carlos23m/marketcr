<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import InvoiceStatusBadge from '@/components/invoices/InvoiceStatusBadge.vue'
import { useInvoicesStore } from '@/stores/useInvoicesStore'
import { formatCRC } from '@/utils/currency'

const router = useRouter()
const store = useInvoicesStore()

onMounted(() => store.fetchInvoices())

function fmtDate(iso) {
  try { return format(new Date(iso), "d 'de' MMM yyyy", { locale: es }) }
  catch { return '—' }
}
</script>

<template>
  <AppShell title="Facturas electrónicas">
    <div class="space-y-4">
      <div class="bg-primary-light border border-primary/10 rounded-xl px-4 py-3 text-sm text-primary">
        <strong>Código de medio de pago 06:</strong> Todas las facturas generadas incluyen el código SINPE Móvil
        (MedioPago 06), obligatorio según regulación del BCCR a partir de septiembre 2025.
      </div>

      <AppCard padding="">
        <div v-if="store.loading" class="p-8 text-center text-gray-400 text-sm">Cargando facturas...</div>

        <AppEmptyState
          v-else-if="store.invoices.length === 0"
          title="Sin facturas aún"
          description="Las facturas se generan desde la vista de transacciones al marcar un pago como recibido."
        />

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Número</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">Fecha</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Cliente</th>
                <th class="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Monto</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
                <th class="py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="inv in store.invoices"
                :key="inv.id"
                class="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                @click="router.push(`/facturas/${inv.id}`)"
              >
                <td class="py-3 px-4 font-mono text-xs text-gray-700">{{ inv.numero_consecutivo }}</td>
                <td class="py-3 px-4 text-gray-500 text-xs hidden sm:table-cell">{{ fmtDate(inv.fecha_emision) }}</td>
                <td class="py-3 px-4 text-gray-700 hidden md:table-cell">{{ inv.transactions?.nombre_remitente || '—' }}</td>
                <td class="py-3 px-4 text-right amount">{{ formatCRC(inv.transactions?.monto || 0) }}</td>
                <td class="py-3 px-4"><InvoiceStatusBadge :estado="inv.estado" /></td>
                <td class="py-3 px-4" @click.stop>
                  <button
                    class="text-xs text-primary hover:underline"
                    @click="store.downloadXml(inv.id)"
                  >
                    XML
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  </AppShell>
</template>

<script setup>
import { computed } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { formatCRC } from '@/utils/currency'

const store = useTransactionsStore()

const rows = computed(() => store.recent)

function fmtDate(iso) {
  try { return format(new Date(iso), "d 'de' MMMM · HH:mm", { locale: es }) }
  catch { return '—' }
}
</script>

<template>
  <div>
    <AppEmptyState
      v-if="rows.length === 0"
      title="Aún no hay transacciones"
      description="Cuando reciba su primer cobro aparecerá aquí."
    />
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Cliente</th>
            <th class="text-right py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Monto</th>
            <th class="text-left py-3 pl-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">Banco</th>
            <th class="text-left py-3 pl-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="txn in rows" :key="txn.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="py-3 text-gray-800 font-medium">{{ txn.nombreRemitente }}</td>
            <td class="py-3 text-right amount">{{ formatCRC(txn.monto) }}</td>
            <td class="py-3 pl-4 hidden sm:table-cell">
              <AppBadge variant="info">{{ txn.banco }}</AppBadge>
            </td>
            <td class="py-3 pl-4 text-gray-400 text-xs hidden md:table-cell">{{ fmtDate(txn.fecha) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

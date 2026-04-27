<script setup>
import { ref, computed } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import { formatCRC } from '@/utils/currency'
import { format, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const store = useTransactionsStore()

const sortKey = ref('fecha')
const sortDir = ref('desc')
const filterBanco = ref('')
const filterMethod = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const amountMin = ref('')
const amountMax = ref('')

const bancos = ['BCR', 'BN', 'BP', 'BAC', 'Scotiabank', 'Otro']
const methods = [
  { key: 'sms', label: 'SMS' },
  { key: 'manual', label: 'Manual' },
  { key: 'link', label: 'Cobro vinculado' },
]

const filtered = computed(() => {
  let list = [...store.transactions]

  if (filterBanco.value) list = list.filter(t => t.banco === filterBanco.value)
  if (filterMethod.value) list = list.filter(t => t.parseMethod === filterMethod.value)
  if (amountMin.value) list = list.filter(t => t.monto >= Number(amountMin.value))
  if (amountMax.value) list = list.filter(t => t.monto <= Number(amountMax.value))

  if (dateFrom.value && dateTo.value) {
    list = list.filter(t => {
      try {
        return isWithinInterval(parseISO(t.fecha), { start: parseISO(dateFrom.value), end: parseISO(dateTo.value) })
      } catch { return true }
    })
  }

  list.sort((a, b) => {
    let av = a[sortKey.value]
    let bv = b[sortKey.value]
    if (sortKey.value === 'fecha') { av = new Date(av); bv = new Date(bv) }
    if (av < bv) return sortDir.value === 'asc' ? -1 : 1
    if (av > bv) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })

  return list
})

const runningTotal = computed(() => filtered.value.reduce((s, t) => s + t.monto, 0))

function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'desc' }
}

function fmtDate(iso) {
  try { return format(new Date(iso), "d 'de' MMM · HH:mm", { locale: es }) }
  catch { return '—' }
}

function methodLabel(method) {
  return { sms: 'SMS', manual: 'Manual', link: 'Cobro' }[method] || method
}

function methodVariant(method) {
  return { sms: 'success', manual: 'info', link: 'pagado' }[method] || 'info'
}

function clearFilters() {
  filterBanco.value = ''
  filterMethod.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  amountMin.value = ''
  amountMax.value = ''
}
</script>

<template>
  <AppShell title="Transacciones">
    <template #topbar-actions>
      <AppButton variant="secondary" size="sm" @click="store.exportCsv()">
        Exportar CSV
      </AppButton>
    </template>

    <div class="space-y-4">
      <!-- Summary -->
      <div class="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-4">
        <div>
          <p class="text-xs text-gray-500">Total filtrado</p>
          <p class="text-2xl font-semibold text-gray-900 amount mt-0.5">{{ formatCRC(runningTotal) }}</p>
        </div>
        <p class="text-sm text-gray-400">{{ filtered.length }} transacciones</p>
      </div>

      <!-- Filters -->
      <AppCard padding="p-4">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select v-model="filterBanco" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
            <option value="">Todos los bancos</option>
            <option v-for="b in bancos" :key="b" :value="b">{{ b }}</option>
          </select>
          <select v-model="filterMethod" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
            <option value="">Todos los métodos</option>
            <option v-for="m in methods" :key="m.key" :value="m.key">{{ m.label }}</option>
          </select>
          <input v-model="dateFrom" type="date" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Desde" />
          <input v-model="dateTo" type="date" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Hasta" />
          <input v-model.number="amountMin" type="number" placeholder="₡ Mínimo" class="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          <AppButton variant="ghost" size="sm" @click="clearFilters">Limpiar</AppButton>
        </div>
      </AppCard>

      <!-- Table -->
      <AppCard padding="">
        <AppEmptyState
          v-if="filtered.length === 0"
          title="Sin transacciones"
          description="No se encontraron transacciones con los filtros actuales."
        />
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide cursor-pointer select-none" @click="toggleSort('fecha')">
                  Fecha <span v-if="sortKey === 'fecha'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th class="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide cursor-pointer select-none" @click="toggleSort('monto')">
                  Monto <span v-if="sortKey === 'monto'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide cursor-pointer select-none" @click="toggleSort('nombreRemitente')">
                  Remitente <span v-if="sortKey === 'nombreRemitente'">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
                </th>
                <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">Banco</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Cobro</th>
                <th class="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">Método</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="txn in filtered" :key="txn.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4 text-gray-500 text-xs">{{ fmtDate(txn.fecha) }}</td>
                <td class="py-3 px-4 text-right amount">{{ formatCRC(txn.monto) }}</td>
                <td class="py-3 px-4 font-medium text-gray-800">{{ txn.nombreRemitente }}</td>
                <td class="py-3 px-4 hidden sm:table-cell">
                  <AppBadge variant="info">{{ txn.banco }}</AppBadge>
                </td>
                <td class="py-3 px-4 hidden md:table-cell text-xs text-gray-400 font-mono">{{ txn.linkId || '—' }}</td>
                <td class="py-3 px-4 hidden lg:table-cell">
                  <AppBadge :variant="methodVariant(txn.parseMethod)">{{ methodLabel(txn.parseMethod) }}</AppBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  </AppShell>
</template>

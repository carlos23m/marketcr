<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
import UpgradeBanner from '@/components/billing/UpgradeBanner.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePlanLimits } from '@/composables/usePlanLimits'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import { supabase } from '@/lib/supabase'
import { formatCRC } from '@/utils/currency'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

const auth = useAuthStore()
const txnStore = useTransactionsStore()
const { canUseAnalytics, plan } = usePlanLimits()

const period = ref('30')
const loading = ref(false)
const dailyData = ref([])
const bankData = ref([])
const stats = ref({ total: 0, count: 0, avgTxn: 0, conversionRate: 0 })

const BANCO_COLORS = {
  'BCR': '#1D9E75', 'BN': '#3B82F6', 'Banco Popular': '#8B5CF6',
  'BAC': '#F59E0B', 'Scotiabank': '#EF4444', 'Otro': '#9CA3AF',
}

async function fetchAnalytics() {
  if (!canUseAnalytics.value) return
  loading.value = true
  const bid = auth.business?.id
  if (!bid) { loading.value = false; return }

  const days = parseInt(period.value)
  const since = new Date(); since.setDate(since.getDate() - days); since.setHours(0,0,0,0)

  const [{ data: txns }, { count: linksCreated }, { count: linksPaid }] = await Promise.all([
    supabase.from('transactions').select('monto, banco, fecha').eq('business_id', bid).gte('fecha', since.toISOString()),
    supabase.from('payment_links').select('id', { count: 'exact', head: true }).eq('business_id', bid).gte('created_at', since.toISOString()),
    supabase.from('payment_links').select('id', { count: 'exact', head: true }).eq('business_id', bid).eq('estado', 'pagado').gte('created_at', since.toISOString()),
  ])

  if (txns) {
    const total = txns.reduce((s, t) => s + t.monto, 0)
    const count = txns.length
    stats.value = {
      total,
      count,
      avgTxn: count ? Math.round(total / count) : 0,
      conversionRate: linksCreated ? Math.round(((linksPaid ?? 0) / linksCreated) * 100) : 0,
    }

    // Build daily buckets
    const buckets = {}
    for (let i = 0; i < days; i++) {
      const d = new Date(since); d.setDate(d.getDate() + i)
      buckets[d.toISOString().split('T')[0]] = 0
    }
    txns.forEach(t => {
      const day = t.fecha?.split('T')[0]
      if (day && buckets[day] !== undefined) buckets[day] += t.monto
    })
    dailyData.value = Object.entries(buckets).map(([date, monto]) => ({ date, monto }))

    // Bank breakdown
    const bankTotals = {}
    txns.forEach(t => { bankTotals[t.banco] = (bankTotals[t.banco] ?? 0) + t.monto })
    bankData.value = Object.entries(bankTotals).map(([banco, monto]) => ({ banco, monto }))
  }
  loading.value = false
}

const lineChartData = computed(() => ({
  labels: dailyData.value.map(d => {
    const [,, day] = d.date.split('-')
    return day
  }),
  datasets: [{
    label: 'Ingresos',
    data: dailyData.value.map(d => d.monto),
    borderColor: '#1D9E75',
    backgroundColor: 'rgba(29,158,117,0.08)',
    fill: true,
    tension: 0.4,
    pointRadius: 3,
  }],
}))

const doughnutData = computed(() => ({
  labels: bankData.value.map(b => b.banco),
  datasets: [{
    data: bankData.value.map(b => b.monto),
    backgroundColor: bankData.value.map(b => BANCO_COLORS[b.banco] ?? '#9CA3AF'),
    borderWidth: 0,
  }],
}))

// Simple linear regression forecast
const forecast = computed(() => {
  const data = dailyData.value
  if (data.length < 7) return null
  const n = data.length
  const xs = data.map((_, i) => i)
  const ys = data.map(d => d.monto)
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0)
  const sumXX = xs.reduce((s, x) => s + x * x, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  const today = n
  const endOfMonth = new Date(); const daysLeft = new Date(endOfMonth.getFullYear(), endOfMonth.getMonth()+1, 0).getDate() - endOfMonth.getDate()
  let projected = 0
  for (let i = today; i < today + daysLeft; i++) {
    projected += Math.max(0, slope * i + intercept)
  }
  const monthSoFar = ys.reduce((a, b) => a + b, 0)
  return Math.round(monthSoFar + projected)
})

function exportCsv() {
  const rows = [['Fecha','Monto'], ...dailyData.value.map(d => [d.date, d.monto])]
  const csv = rows.map(r => r.join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = `analitica_${period.value}d.csv`
  a.click(); URL.revokeObjectURL(url)
}

onMounted(fetchAnalytics)
watch(period, fetchAnalytics)
</script>

<template>
  <AppShell title="Analítica">
    <!-- Plan gate -->
    <UpgradeBanner v-if="!canUseAnalytics" label="Analítica avanzada requiere plan Pro" class="mb-6" />

    <template v-if="canUseAnalytics">
      <!-- Controls -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex gap-2">
          <button v-for="p in [['7','7 días'],['30','30 días'],['90','90 días'],['365','12 meses']]" :key="p[0]"
            @click="period = p[0]"
            :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', period === p[0] ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']"
          >{{ p[1] }}</button>
        </div>
        <button @click="exportCsv" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Exportar CSV
        </button>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AppCard v-for="s in [
          { label: 'Ingresos totales', value: formatCRC(stats.total), sub: `${period} días` },
          { label: 'Transacciones', value: stats.count, sub: `${period} días` },
          { label: 'Valor promedio', value: formatCRC(stats.avgTxn), sub: 'por transacción' },
          { label: 'Tasa de conversión', value: stats.conversionRate + '%', sub: 'cobros pagados' },
        ]" :key="s.label">
          <p class="text-xs text-gray-500 mb-1">{{ s.label }}</p>
          <p class="text-2xl font-bold text-gray-900 amount">{{ s.value }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ s.sub }}</p>
        </AppCard>
      </div>

      <!-- Revenue chart -->
      <AppCard class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900">Ingresos diarios</h2>
          <div v-if="forecast" class="text-xs text-gray-500">
            Proyección del mes: <strong class="text-primary amount">{{ formatCRC(forecast) }}</strong>
            <span class="text-gray-400 ml-1">(estimado)</span>
          </div>
        </div>
        <div v-if="loading" class="h-48 flex items-center justify-center text-gray-400 text-sm">Cargando...</div>
        <Line v-else :data="lineChartData" :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '₡' + v.toLocaleString() } } } }" style="height:220px" />
      </AppCard>

      <!-- Bank breakdown -->
      <div class="grid lg:grid-cols-2 gap-6">
        <AppCard>
          <h2 class="text-sm font-semibold text-gray-900 mb-4">Por banco</h2>
          <div v-if="!bankData.length" class="text-center py-8 text-gray-400 text-sm">Sin datos</div>
          <div v-else class="flex gap-6 items-center">
            <Doughnut :data="doughnutData" :options="{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }" style="height:160px;width:160px" />
            <div class="flex flex-col gap-2 flex-1">
              <div v-for="b in bankData" :key="b.banco" class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full" :style="`background:${BANCO_COLORS[b.banco] ?? '#9CA3AF'}`" />
                  <span class="text-gray-700">{{ b.banco }}</span>
                </div>
                <span class="font-medium text-gray-900 amount">{{ formatCRC(b.monto) }}</span>
              </div>
            </div>
          </div>
        </AppCard>

        <AppCard>
          <h2 class="text-sm font-semibold text-gray-900 mb-4">Resumen del período</h2>
          <div class="flex flex-col gap-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Total transacciones</span>
              <span class="font-medium text-gray-900">{{ stats.count }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Ingreso total</span>
              <span class="font-medium text-gray-900 amount">{{ formatCRC(stats.total) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Promedio diario</span>
              <span class="font-medium text-gray-900 amount">{{ formatCRC(Math.round(stats.total / Math.max(1, parseInt(period)))) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Mejor banco</span>
              <span class="font-medium text-gray-900">{{ bankData.sort((a,b) => b.monto - a.monto)[0]?.banco || '—' }}</span>
            </div>
          </div>
        </AppCard>
      </div>
    </template>
  </AppShell>
</template>

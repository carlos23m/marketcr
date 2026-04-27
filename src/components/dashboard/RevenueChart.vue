<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Filler,
} from 'chart.js'
import { format, eachDayOfInterval, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import { formatCRC } from '@/utils/currency'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

const store = useTransactionsStore()

const range = ref(30)
const rawData = ref([])

onMounted(() => loadData())
watch(range, loadData)

async function loadData() {
  rawData.value = await store.getRevenueChart(range.value)
}

const chartData = computed(() => {
  const days = eachDayOfInterval({ start: subDays(new Date(), range.value - 1), end: new Date() })
  const labels = days.map(d => format(d, 'd MMM', { locale: es }))
  const totals = days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    return rawData.value
      .filter(t => t.fecha?.startsWith(dayStr))
      .reduce((s, t) => s + (t.monto || 0), 0)
  })
  return {
    labels,
    datasets: [{
      label: 'Cobros',
      data: totals,
      borderColor: '#1D9E75',
      backgroundColor: 'rgba(29,158,117,0.08)',
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: '#1D9E75',
      fill: true,
      tension: 0.4,
    }],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: ctx => ` ${formatCRC(ctx.raw)}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, maxTicksLimit: 7 } },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: { font: { size: 11 }, callback: v => `₡${(v/1000).toFixed(0)}k` },
    },
  },
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-sm font-semibold text-gray-900">Ingresos</h2>
      <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button v-for="d in [7,30,90]" :key="d"
          :class="['px-2.5 py-1 rounded-md text-xs font-medium transition-colors', range === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
          @click="range = d"
        >
          {{ d }}d
        </button>
      </div>
    </div>
    <div class="h-52">
      <Line v-if="rawData !== null" :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

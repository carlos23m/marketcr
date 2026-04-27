<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import StatsCard from '@/components/dashboard/StatsCard.vue'
import RecentPaymentsTable from '@/components/dashboard/RecentPaymentsTable.vue'
import RevenueChart from '@/components/dashboard/RevenueChart.vue'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import { usePaymentsStore } from '@/stores/usePaymentsStore'
import { useInvoicesStore } from '@/stores/useInvoicesStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePermissions } from '@/composables/usePermissions'
import { formatCRC } from '@/utils/currency'
import { MOCK_PAYMENT_LINKS, MOCK_TRANSACTIONS } from '@/utils/mockData'

const router = useRouter()
const txnStore = useTransactionsStore()
const paymentsStore = usePaymentsStore()
const invoicesStore = useInvoicesStore()
const auth = useAuthStore()
const { can } = usePermissions()

const showMigrationBanner = ref(false)
const migrating = ref(false)

onMounted(async () => {
  await Promise.all([
    txnStore.fetchTransactions(),
    paymentsStore.fetchLinks(),
    invoicesStore.fetchInvoices(),
  ])
  paymentsStore.checkExpired()
  paymentsStore.subscribeRealtime()
  checkLegacyData()
})

onUnmounted(() => paymentsStore.unsubscribeRealtime())

function checkLegacyData() {
  const hasLegacy = localStorage.getItem('sinpepay_transactions') || localStorage.getItem('sinpepay_links')
  if (hasLegacy) showMigrationBanner.value = true
}

async function importLegacyData() {
  migrating.value = true
  try {
    const rawLinks = JSON.parse(localStorage.getItem('sinpepay_links') || '[]')
    const rawTxns = JSON.parse(localStorage.getItem('sinpepay_transactions') || '[]')
    for (const link of rawLinks) {
      await paymentsStore.createLink({
        descripcion: link.descripcion,
        monto: link.monto,
        cliente: link.cliente,
        vencimiento: link.vencimiento,
        notas: link.notas,
      })
    }
    for (const txn of rawTxns) {
      await txnStore.addTransaction({
        monto: txn.monto,
        nombreRemitente: txn.nombreRemitente,
        banco: txn.banco,
        telefono: txn.telefono,
        referencia: txn.referencia,
        fecha: txn.fecha,
        rawSms: txn.rawSms,
        confianza: txn.confianza,
        parseMethod: txn.parseMethod,
      })
    }
    localStorage.removeItem('sinpepay_links')
    localStorage.removeItem('sinpepay_transactions')
    localStorage.removeItem('sinpepay_profile')
    showMigrationBanner.value = false
    await Promise.all([txnStore.fetchTransactions(), paymentsStore.fetchLinks()])
  } finally {
    migrating.value = false
  }
}

function discardLegacy() {
  localStorage.removeItem('sinpepay_links')
  localStorage.removeItem('sinpepay_transactions')
  localStorage.removeItem('sinpepay_profile')
  showMigrationBanner.value = false
}

const pendingInvoices = computed(() =>
  invoicesStore.invoices.filter(i => i.estado === 'borrador').length
)

const stats = computed(() => [
  { label: 'Cobros hoy', value: formatCRC(txnStore.todayTotal), sub: 'Total recibido hoy', color: 'primary' },
  { label: 'Cobros este mes', value: formatCRC(txnStore.monthTotal), sub: 'Total del mes', color: 'gray' },
  { label: 'Links activos', value: String(paymentsStore.activeLinks.length), sub: 'Cobros por pagar', color: 'gray' },
  { label: 'Facturas pendientes', value: String(pendingInvoices.value), sub: 'Por enviar a Hacienda', color: 'gray' },
])
</script>

<template>
  <AppShell title="Panel principal">
    <template #topbar-actions>
      <AppButton variant="primary" size="sm" @click="router.push('/create-link')">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Crear cobro
      </AppButton>
    </template>

    <div class="space-y-6">
      <!-- Migration banner -->
      <div v-if="showMigrationBanner" class="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
        <p class="text-sm font-medium text-yellow-900 mb-1">Detectamos datos locales de una sesión anterior</p>
        <p class="text-xs text-yellow-700 mb-3">¿Desea importar sus cobros y transacciones a su cuenta en la nube?</p>
        <div class="flex gap-2">
          <AppButton variant="primary" size="sm" :loading="migrating" @click="importLegacyData">Importar datos</AppButton>
          <AppButton variant="ghost" size="sm" @click="discardLegacy">Descartar</AppButton>
        </div>
      </div>

      <div>
        <p class="text-sm text-gray-500 mb-4">Buenas, <span class="font-medium text-gray-900">{{ auth.business?.nombre || auth.profile?.nombre }}</span></p>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard v-for="stat in stats" :key="stat.label" v-bind="stat" />
        </div>
      </div>

      <AppCard>
        <RevenueChart />
      </AppCard>

      <AppCard>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900">Transacciones recientes</h2>
          <router-link to="/transacciones" class="text-xs text-primary hover:underline">Ver todas</router-link>
        </div>
        <RecentPaymentsTable />
      </AppCard>
    </div>
  </AppShell>
</template>

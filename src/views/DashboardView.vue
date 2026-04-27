<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import StatsCard from '@/components/dashboard/StatsCard.vue'
import RecentPaymentsTable from '@/components/dashboard/RecentPaymentsTable.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import { usePaymentsStore } from '@/stores/usePaymentsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { formatCRC } from '@/utils/currency'

const router = useRouter()
const txnStore = useTransactionsStore()
const paymentsStore = usePaymentsStore()
const auth = useAuthStore()

paymentsStore.checkExpired()

const stats = computed(() => [
  {
    label: 'Cobros hoy',
    value: formatCRC(txnStore.todayTotal),
    sub: 'Total recibido hoy',
    color: 'primary',
  },
  {
    label: 'Cobros este mes',
    value: formatCRC(txnStore.monthTotal),
    sub: 'Total del mes',
    color: 'gray',
  },
  {
    label: 'Links activos',
    value: String(paymentsStore.activeLinks.length),
    sub: 'Cobros pendientes de pago',
    color: 'gray',
  },
  {
    label: 'Pendientes',
    value: String(paymentsStore.pendingCount),
    sub: 'Por confirmar',
    color: 'gray',
  },
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
      <div>
        <p class="text-sm text-gray-500 mb-4">Buenas, <span class="font-medium text-gray-900">{{ auth.profile.nombre }}</span> 👋</p>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            v-for="stat in stats"
            :key="stat.label"
            :label="stat.label"
            :value="stat.value"
            :sub="stat.sub"
            :color="stat.color"
          />
        </div>
      </div>

      <AppCard>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-900">Transacciones recientes</h2>
          <router-link to="/transacciones" class="text-xs text-primary hover:underline">Ver todas</router-link>
        </div>
        <RecentPaymentsTable />
      </AppCard>

      <AppCard>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-sm font-semibold text-gray-900">Crear nuevo cobro</h2>
            <p class="text-xs text-gray-500 mt-0.5">Genere un enlace de cobro con QR para compartir por WhatsApp</p>
          </div>
          <AppButton variant="primary" @click="router.push('/create-link')">
            Crear cobro
          </AppButton>
        </div>
      </AppCard>
    </div>
  </AppShell>
</template>

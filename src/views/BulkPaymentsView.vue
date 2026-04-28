<script setup>
import { ref, onMounted } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import UpgradeBanner from '@/components/billing/UpgradeBanner.vue'
import BatchBuilder from '@/components/bulk/BatchBuilder.vue'
import PaymentQueue from '@/components/bulk/PaymentQueue.vue'
import RecipientBook from '@/components/bulk/RecipientBook.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { useBatchStore } from '@/stores/useBatchStore'
import { usePlanLimits } from '@/composables/usePlanLimits'
import { formatCRC } from '@/utils/currency'

const store = useBatchStore()
const { planGte } = usePlanLimits()
const canAccess = planGte('pro')

const tab = ref('batches')
const activeQueue = ref(null)

onMounted(async () => {
  if (canAccess) {
    await Promise.all([store.fetchBatches(), store.fetchRecipients()])
  }
})

function statusColor(s) {
  return { draft: 'bg-gray-100 text-gray-600', scheduled: 'bg-blue-100 text-blue-700',
    processing: 'bg-amber-100 text-amber-700', completed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700' }[s] ?? 'bg-gray-100 text-gray-500'
}

function statusLabel(s) {
  return { draft: 'Borrador', scheduled: 'Programado', processing: 'En proceso',
    completed: 'Completado', failed: 'Fallido' }[s] ?? s
}
</script>

<template>
  <AppShell>
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Pagos masivos</h1>
        <p class="text-sm text-gray-500 mt-1">Organiza y ejecuta pagos a múltiples proveedores o destinatarios</p>
      </div>

      <!-- SINPE limitation notice -->
      <div class="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-4 py-3 text-xs text-blue-800 dark:text-blue-300">
        <strong>Nota:</strong> SINPEpay organiza y registra los pagos. La transferencia SINPE Móvil la ejecuta usted manualmente desde su app bancaria, marcando cada pago como enviado en SINPEpay.
      </div>

      <UpgradeBanner v-if="!canAccess" feature="Pagos masivos" required-plan="pro" />

      <template v-else>
        <!-- Active payment queue -->
        <PaymentQueue v-if="activeQueue" :batch="activeQueue" @done="activeQueue = null; store.fetchBatches()" @close="activeQueue = null" />

        <template v-else>
          <!-- Tabs -->
          <div class="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            <button v-for="t in [{id:'batches',label:'Lotes'},{id:'new',label:'Nuevo lote'},{id:'recipients',label:'Destinatarios'}]"
              :key="t.id" @click="tab = t.id"
              :class="['px-4 py-1.5 rounded-md text-sm font-medium transition-colors', tab === t.id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700']">
              {{ t.label }}
            </button>
          </div>

          <!-- Batches list -->
          <div v-if="tab === 'batches'">
            <div v-if="store.loading" class="text-center py-12 text-gray-400 text-sm">Cargando lotes…</div>
            <div v-else-if="!store.batches.length" class="text-center py-12">
              <p class="text-gray-500 text-sm">No hay lotes de pago creados aún.</p>
              <button @click="tab = 'new'" class="mt-3 btn-primary text-sm">Crear primer lote</button>
            </div>
            <div v-else class="space-y-3">
              <AppCard v-for="b in store.batches" :key="b.id" class="flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
                @click="store.fetchBatch(b.id).then(d => { if(d && d.status !== 'completed') activeQueue = d })">
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">{{ b.name }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ new Date(b.created_at).toLocaleDateString('es-CR') }} · {{ formatCRC(b.total_amount) }}</p>
                </div>
                <span :class="['text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap', statusColor(b.status)]">{{ statusLabel(b.status) }}</span>
              </AppCard>
            </div>
          </div>

          <!-- New batch -->
          <div v-else-if="tab === 'new'">
            <BatchBuilder :recipients="store.recipients" @created="store.fetchBatches(); tab = 'batches'" />
          </div>

          <!-- Recipients -->
          <div v-else-if="tab === 'recipients'">
            <RecipientBook :recipients="store.recipients" @updated="store.fetchRecipients()" />
          </div>
        </template>
      </template>
    </div>
  </AppShell>
</template>

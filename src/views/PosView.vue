<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import QrcodeVue from 'qrcode.vue'
import { usePaymentsStore } from '@/stores/usePaymentsStore'
import { useTransactionsStore } from '@/stores/useTransactionsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useLinkUrl } from '@/composables/useLinkUrl'
import { usePlanLimits } from '@/composables/usePlanLimits'
import { useOfflineQueue } from '@/composables/useOfflineQueue'
import { formatCRC } from '@/utils/currency'
import InstallBanner from '@/components/ui/InstallBanner.vue'

const router = useRouter()
const payments = usePaymentsStore()
const txns = useTransactionsStore()
const auth = useAuthStore()
const { linkUrl } = useLinkUrl()
const { canUsePosMode } = usePlanLimits()
const { queue, syncing, isOnline, enqueue } = useOfflineQueue()

const amount = ref('')
const description = ref('')
const createdLink = ref(null)
const creating = ref(false)
const timer = ref(null)
const clock = ref('')

function tick() { clock.value = new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }

onMounted(() => {
  tick()
  timer.value = setInterval(tick, 1000)
  payments.subscribeRealtime()
  txns.fetchTransactions()
})
onUnmounted(() => {
  clearInterval(timer.value)
  payments.unsubscribeRealtime()
})

const quickItems = computed(() => auth.business?.quick_items ?? [])
const recentTxns = computed(() => txns.transactions.slice(0, 10))

function numpadPress(val) {
  if (val === 'DEL') {
    amount.value = amount.value.slice(0, -1)
  } else if (val === '000') {
    amount.value += '000'
  } else {
    if (amount.value.length >= 9) return
    amount.value += val
  }
}

function selectQuickItem(item) {
  amount.value = String(item.monto)
  description.value = item.nombre
}

async function createCharge() {
  const monto = parseInt(amount.value)
  if (!monto || monto < 1) return
  creating.value = true
  const payload = { descripcion: description.value || 'Cobro en POS', monto }
  if (isOnline.value) {
    createdLink.value = await payments.createLink(payload)
  } else {
    await enqueue(payload)
    createdLink.value = null
  }
  creating.value = false
  amount.value = ''
  description.value = ''
}

function confirmPaid() {
  if (!createdLink.value) return
  payments.markAsPaid(createdLink.value.id)
  createdLink.value = null
}

function exitPos() { router.push('/dashboard') }

const displayAmount = computed(() => {
  const n = parseInt(amount.value)
  return isNaN(n) ? '₡0' : formatCRC(n)
})
</script>

<template>
  <!-- Plan gate -->
  <div v-if="!canUsePosMode" class="min-h-screen flex items-center justify-center bg-gray-50 p-6">
    <div class="text-center max-w-sm">
      <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
      </div>
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Modo POS requiere Pro</h2>
      <p class="text-sm text-gray-500 mb-4">Actualice su plan para acceder al punto de venta en tablet.</p>
      <button @click="router.push('/configuracion/facturacion')" class="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
        Ver planes →
      </button>
    </div>
  </div>

  <!-- Full-screen POS -->
  <div v-else class="h-screen bg-gray-900 flex flex-col overflow-hidden text-white">
    <!-- Offline banner -->
    <div v-if="!isOnline" class="bg-amber-500 text-amber-950 text-xs font-semibold text-center py-1.5 px-4 flex items-center justify-center gap-2">
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 13a1 1 0 100-2 1 1 0 000 2zm-4.243-4.243a9 9 0 0113.486 0"/></svg>
      Sin conexión · los cobros se guardarán y sincronizarán al reconectarse
      <span v-if="queue.length" class="ml-1 bg-amber-700/30 rounded px-1">{{ queue.length }} en cola</span>
    </div>
    <div v-else-if="syncing" class="bg-primary/90 text-white text-xs font-medium text-center py-1">
      Sincronizando cobros guardados…
    </div>

    <!-- Top bar -->
    <div class="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
      <div>
        <p class="text-sm font-semibold">{{ auth.business?.nombre }}</p>
        <p class="text-xs text-gray-400">{{ auth.profile?.nombre }}</p>
      </div>
      <p class="text-2xl font-mono tabular-nums text-gray-300">{{ clock }}</p>
      <button @click="exitPos" class="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        Salir del POS
      </button>
    </div>

    <!-- Main area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left: numpad + quick items -->
      <div class="flex flex-col w-[60%] p-6 gap-4">
        <!-- QR Display (when link created) -->
        <div v-if="createdLink" class="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-800 rounded-2xl p-6">
          <p class="text-lg font-semibold text-gray-200">{{ formatCRC(createdLink.monto) }}</p>
          <div class="bg-white p-4 rounded-xl">
            <QrcodeVue :value="linkUrl(createdLink.id)" :size="280" level="H" render-as="svg" />
          </div>
          <p class="text-sm text-gray-400">{{ createdLink.descripcion }}</p>
          <div class="flex gap-3 w-full max-w-xs">
            <button @click="confirmPaid" class="flex-1 bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary/90 transition-colors">
              ✓ Confirmar pago
            </button>
            <button @click="createdLink = null" class="flex-1 bg-gray-700 text-gray-200 rounded-xl py-3 text-sm font-semibold hover:bg-gray-600 transition-colors">
              Cancelar
            </button>
          </div>
        </div>

        <!-- Numpad -->
        <div v-else class="flex flex-col gap-4 flex-1">
          <!-- Amount display -->
          <div class="bg-gray-800 rounded-2xl p-5 text-right">
            <input
              v-model="description"
              class="w-full bg-transparent text-gray-400 text-sm outline-none text-right mb-2"
              placeholder="Descripción (opcional)"
            />
            <p class="text-5xl font-bold tabular-nums text-white">{{ displayAmount }}</p>
          </div>

          <!-- Quick items -->
          <div v-if="quickItems.length" class="grid grid-cols-4 gap-2">
            <button
              v-for="item in quickItems.slice(0,8)"
              :key="item.nombre"
              @click="selectQuickItem(item)"
              class="bg-gray-700 hover:bg-gray-600 rounded-xl py-2 px-2 text-center transition-colors"
            >
              <p class="text-xs text-gray-300 leading-tight truncate">{{ item.nombre }}</p>
              <p class="text-sm font-semibold text-white">{{ formatCRC(item.monto) }}</p>
            </button>
          </div>

          <!-- Numpad grid -->
          <div class="grid grid-cols-3 gap-3 flex-1">
            <button
              v-for="key in ['1','2','3','4','5','6','7','8','9','000','0','DEL']"
              :key="key"
              @click="numpadPress(key)"
              :class="[
                'rounded-2xl text-2xl font-semibold transition-colors flex items-center justify-center',
                key === 'DEL' ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-700 hover:bg-gray-600 text-white',
              ]"
            >
              <svg v-if="key === 'DEL'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"/></svg>
              <span v-else>{{ key }}</span>
            </button>
          </div>

          <button
            @click="createCharge"
            :disabled="!amount || creating"
            :class="[
              'w-full rounded-2xl py-5 text-xl font-bold transition-colors disabled:opacity-40 text-white',
              isOnline ? 'bg-primary hover:bg-primary/90' : 'bg-amber-500 hover:bg-amber-400',
            ]"
          >
            {{ creating ? '...' : isOnline ? `Cobrar ${displayAmount}` : `Guardar ${displayAmount} (sin conexión)` }}
          </button>
        </div>
      </div>

      <!-- Right: recent transactions -->
      <div class="w-[40%] bg-gray-800 border-l border-gray-700 flex flex-col">
        <p class="text-sm font-semibold text-gray-400 px-5 py-4 border-b border-gray-700">Últimas transacciones</p>
        <div class="flex-1 overflow-y-auto">
          <div v-if="!recentTxns.length" class="text-center py-12 text-gray-500 text-sm">Sin transacciones hoy</div>
          <div
            v-for="txn in recentTxns"
            :key="txn.id"
            class="flex items-center justify-between px-5 py-3 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors"
          >
            <div>
              <p class="text-sm font-medium text-gray-200">{{ txn.nombreRemitente }}</p>
              <p class="text-xs text-gray-500">{{ txn.banco }} · {{ new Date(txn.fecha).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) }}</p>
            </div>
            <p class="text-sm font-semibold text-primary amount">{{ formatCRC(txn.monto) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <InstallBanner v-if="canUsePosMode" />
</template>

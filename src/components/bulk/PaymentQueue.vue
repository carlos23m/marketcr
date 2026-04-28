<script setup>
import { ref, computed } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useBatchStore } from '@/stores/useBatchStore'
import { useToastStore } from '@/stores/useToastStore'
import { formatCRC } from '@/utils/currency'

const props = defineProps({ batch: Object })
const emit = defineEmits(['done', 'close'])

const store = useBatchStore()
const toast = useToastStore()
const currentIdx = ref(0)
const copied = ref(false)

const pending = computed(() => props.batch?.batch_payments?.filter(p => p.status === 'pending') ?? [])
const current = computed(() => pending.value[currentIdx.value] ?? null)
const progress = computed(() => {
  const total = props.batch?.batch_payments?.length ?? 0
  const done  = props.batch?.batch_payments?.filter(p => p.status === 'sent').length ?? 0
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
})

async function copySinpe() {
  if (!current.value) return
  await navigator.clipboard.writeText(current.value.sinpe_numero)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

async function markSent() {
  if (!current.value) return
  await store.updatePaymentStatus(props.batch.id, current.value.id, 'sent')
  if (pending.value.length === 0) {
    await store.completeBatch(props.batch.id)
    toast.show('Lote completado', 'success')
    emit('done')
  }
}

async function markFailed(errorMsg = 'Error') {
  if (!current.value) return
  await store.updatePaymentStatus(props.batch.id, current.value.id, 'failed', errorMsg)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-semibold text-gray-900 dark:text-white">{{ batch?.name }}</h2>
      <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
    </div>

    <!-- Progress bar -->
    <div class="mb-6">
      <div class="flex justify-between text-xs text-gray-500 mb-1">
        <span>{{ progress.done }} de {{ progress.total }} completados</span>
        <span>{{ progress.pct }}%</span>
      </div>
      <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div class="h-full bg-primary rounded-full transition-all" :style="`width:${progress.pct}%`" />
      </div>
    </div>

    <!-- Current payment -->
    <AppCard v-if="current" class="mb-4">
      <p class="text-xs text-gray-400 mb-3">Pago {{ currentIdx + 1 }} de {{ pending.length }}</p>
      <div class="text-center mb-6">
        <p class="text-sm text-gray-500 mb-1">{{ current.recipient_name }}</p>
        <p class="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-mono tracking-wider">{{ current.sinpe_numero }}</p>
        <p class="text-2xl font-bold text-primary mb-2">{{ formatCRC(current.amount) }}</p>
        <p v-if="current.concept" class="text-sm text-gray-500">{{ current.concept }}</p>
      </div>
      <div class="flex gap-3 mb-4">
        <button @click="copySinpe" :class="['flex-1 btn-secondary text-sm', copied ? 'bg-green-50 text-green-700 border-green-200' : '']">
          {{ copied ? 'Copiado ✓' : 'Copiar número SINPE' }}
        </button>
      </div>
      <div class="flex gap-3">
        <button @click="markFailed()" class="flex-1 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">Fallido</button>
        <button @click="markSent" class="flex-1 btn-primary text-sm">Marcar como enviado</button>
      </div>
    </AppCard>

    <!-- All done -->
    <AppCard v-else class="text-center py-8">
      <p class="text-3xl mb-2">🎉</p>
      <p class="font-semibold text-gray-900 dark:text-white">Todos los pagos completados</p>
      <p class="text-sm text-gray-500 mt-1">{{ progress.done }} de {{ progress.total }} enviados</p>
      <button @click="emit('done')" class="mt-4 btn-primary text-sm">Finalizar</button>
    </AppCard>
  </div>
</template>

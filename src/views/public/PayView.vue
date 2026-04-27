<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPublicPaymentLink } from '@/lib/database'
import { formatCRC } from '@/utils/currency'
import QrcodeVue from 'qrcode.vue'

const route = useRoute()

const link = ref(null)
const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  const { data, error } = await getPublicPaymentLink(route.params.id)
  if (error || !data) { notFound.value = true }
  else { link.value = data }
  loading.value = false

  if (data) {
    document.title = `Pago — ${data.businesses?.nombre || 'SINPEpay'}`
  }
})

const sinpeNumber = computed(() => link.value?.businesses?.sinpe_numero?.replace(/\D/g, '') || '')

const sinpeDeepLink = computed(() => {
  if (!sinpeNumber.value || !link.value?.monto) return '#'
  return `sinpe://pay?phone=${sinpeNumber.value}&amount=${link.value.monto}`
})

const qrValue = computed(() => {
  if (!sinpeNumber.value) return window.location.href
  return `sinpe://pay?phone=${sinpeNumber.value}&amount=${link.value?.monto || 0}`
})

const isExpired = computed(() => {
  if (!link.value?.vencimiento) return false
  return new Date(link.value.vencimiento) < new Date()
})

const isPaid = computed(() => link.value?.estado === 'pagado')
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col items-center justify-start py-8 px-4">
    <!-- Loading -->
    <div v-if="loading" class="mt-20 text-gray-400 text-sm">Cargando...</div>

    <!-- Not found -->
    <div v-else-if="notFound" class="mt-20 text-center">
      <p class="text-gray-900 font-medium">Enlace de cobro no encontrado</p>
      <p class="text-gray-500 text-sm mt-1">Es posible que haya sido eliminado o expirado.</p>
    </div>

    <!-- Expired -->
    <div v-else-if="isExpired" class="w-full max-w-[420px]">
      <div class="text-center mb-6">
        <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-2">
          <span class="text-white font-bold text-sm">SP</span>
        </div>
        <p class="text-xs text-gray-400">Pago seguro · SINPEpay</p>
      </div>
      <div class="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
        <div class="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="font-semibold text-gray-900">Enlace vencido</p>
        <p class="text-sm text-gray-500 mt-1">Este cobro ya no está disponible. Solicite uno nuevo al negocio.</p>
      </div>
    </div>

    <!-- Paid -->
    <div v-else-if="isPaid" class="w-full max-w-[420px]">
      <div class="text-center mb-6">
        <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-2">
          <span class="text-white font-bold text-sm">SP</span>
        </div>
        <p class="text-xs text-gray-400">Pago seguro · SINPEpay</p>
      </div>
      <div class="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm">
        <div class="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p class="font-semibold text-gray-900">¡Pago confirmado!</p>
        <p class="text-2xl font-bold text-primary amount mt-1">{{ formatCRC(link.monto) }}</p>
        <p class="text-sm text-gray-500 mt-1">{{ link.descripcion }}</p>
      </div>
    </div>

    <!-- Active payment page -->
    <div v-else class="w-full max-w-[420px]">
      <div class="text-center mb-6">
        <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-2">
          <span class="text-white font-bold text-sm">SP</span>
        </div>
        <p class="text-xs text-gray-400">Pago seguro · SINPEpay</p>
      </div>

      <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
        <!-- Business + Amount -->
        <div class="text-center">
          <p class="text-sm text-gray-500">{{ link.businesses?.nombre }}</p>
          <p class="text-4xl font-bold text-gray-900 amount mt-1">{{ formatCRC(link.monto) }}</p>
          <p class="text-sm text-gray-600 mt-1">{{ link.descripcion }}</p>
        </div>

        <!-- QR Code -->
        <div class="flex flex-col items-center gap-3">
          <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Escanee para pagar</p>
          <div class="bg-white p-3 rounded-xl border border-gray-100">
            <QrcodeVue :value="qrValue" :size="220" level="H" render-as="svg" />
          </div>
          <p class="text-xs text-gray-400">El monto se ingresa automáticamente</p>
        </div>

        <!-- Steps -->
        <div class="bg-surface rounded-xl p-4">
          <p class="text-xs font-semibold text-gray-700 mb-3">Cómo pagar con SINPE Móvil</p>
          <ol class="space-y-2">
            <li class="flex items-start gap-2 text-xs text-gray-600">
              <span class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">1</span>
              Abra su app bancaria
            </li>
            <li class="flex items-start gap-2 text-xs text-gray-600">
              <span class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">2</span>
              Vaya a SINPE Móvil → Enviar
            </li>
            <li class="flex items-start gap-2 text-xs text-gray-600">
              <span class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">3</span>
              Escanee el QR o use el número:
              <strong class="text-gray-900 font-mono">{{ link.businesses?.sinpe_numero }}</strong>
            </li>
            <li class="flex items-start gap-2 text-xs text-gray-600">
              <span class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">4</span>
              Monto ya ingresado: <strong class="text-gray-900 amount">{{ formatCRC(link.monto) }}</strong>
            </li>
            <li class="flex items-start gap-2 text-xs text-gray-600">
              <span class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">5</span>
              Envíe el pago y listo
            </li>
          </ol>
        </div>

        <!-- Deep link button -->
        <a
          :href="sinpeDeepLink"
          class="w-full bg-primary text-white rounded-lg px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          Pagar con SINPE Móvil
        </a>
      </div>

      <p class="text-center text-xs text-gray-400 mt-6">
        Powered by <strong class="text-primary">SINPEpay</strong> · Pago 100% costarricense
      </p>
    </div>
  </div>
</template>

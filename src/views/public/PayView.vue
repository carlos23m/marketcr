<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPublicPaymentLink } from '@/lib/database'
import { formatCRC } from '@/utils/currency'
import QrcodeVue from 'qrcode.vue'
import { supabase } from '@/lib/supabase'

const route = useRoute()

const link = ref(null)
const loading = ref(true)
const notFound = ref(false)
const tab = ref('sinpe')  // 'sinpe' | 'card'
const cardLoading = ref(false)
const cardError = ref('')
const cardSuccess = ref(false)
const brand = ref(null)  // whitelabel_config row

const canPayCard = computed(() => {
  const biz = link.value?.businesses
  if (!biz) return false
  const now = new Date()
  const effectivePlan = (biz.trial_end && new Date(biz.trial_end) > now)
    ? biz.plan
    : (biz.plan_period_end && new Date(biz.plan_period_end) > now)
    ? biz.plan
    : 'starter'
  return effectivePlan !== 'starter'
})

async function loadOnvoSdk() {
  if (window.onvo) return
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://sdk.onvopay.com/sdk.js'
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function initCardPayment() {
  if (!link.value || cardLoading.value) return
  cardLoading.value = true
  cardError.value = ''
  try {
    await loadOnvoSdk()
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { link_id: link.value.id },
    })
    if (error || !data?.id) throw new Error(error?.message || 'Error al iniciar pago')
    window.onvo.pay({
      publicKey: import.meta.env.VITE_ONVO_PUBLISHABLE_KEY,
      paymentIntentId: data.id,
      paymentType: 'one_time',
      onSuccess: async (result) => {
        // Record transaction
        await supabase.from('transactions').insert({
          business_id: link.value.businesses?.id || link.value.business_id,
          monto: link.value.monto,
          nombre_remitente: 'Pago con tarjeta',
          banco: 'Tarjeta',
          fecha: new Date().toISOString(),
          payment_link_id: link.value.id,
          referencia: result?.id,
          parse_method: 'api',
        })
        link.value = { ...link.value, estado: 'pagado' }
        cardSuccess.value = true
      },
      onError: (e) => { cardError.value = e?.message || 'Error al procesar tarjeta' },
    }).render('#onvo-container')
  } catch (e) {
    cardError.value = e.message || 'Error al iniciar pago con tarjeta'
  } finally {
    cardLoading.value = false
  }
}

onMounted(async () => {
  const { data, error } = await getPublicPaymentLink(route.params.id)
  if (error || !data) { notFound.value = true }
  else {
    link.value = data
    const businessId = data.businesses?.id || data.business_id
    if (businessId) {
      const { data: wb } = await supabase
        .from('whitelabel_config')
        .select('logo_url, brand_color, business_name, font')
        .eq('business_id', businessId)
        .maybeSingle()
      if (wb) brand.value = wb
    }
  }
  loading.value = false
  if (data) document.title = `Pago — ${brand.value?.business_name || data.businesses?.nombre || 'SINPEpay'}`
})

const brandColor = computed(() => brand.value?.brand_color || null)
const brandStyle = computed(() => brandColor.value ? { '--brand': brandColor.value } : {})
const sinpeNumber = computed(() => link.value?.businesses?.sinpe_numero?.replace(/\D/g, '') || '')

// CRC-16/CCITT-FALSE (polynomial 0x1021, init 0xFFFF) — required by EMV QR spec
function crc16(str) {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF
    }
  }
  return crc
}

function pad(n) { return String(n).padStart(2, '0') }

// Builds BCCR SINPE Móvil EMV QR string (ISO 20022 / EMVCo Merchant Presented QR)
// GUID cr.bccr.sinpe is the BCCR application identifier for SINPE Móvil
function buildSinpeEmvQr(phone, amount) {
  const ph = String(phone).replace(/\D/g, '').slice(-8)
  if (ph.length < 7) return null
  const amt = Number(amount).toFixed(2)          // e.g. "5000.00"
  const GUID = 'cr.bccr.sinpe'
  const f00  = '00' + pad(GUID.length) + GUID    // sub-field 00: GUID
  const f01  = '01' + pad(ph.length)   + ph       // sub-field 01: phone number
  const d26  = f00 + f01
  const f26  = '26' + pad(d26.length)  + d26      // template 26: Merchant Account Info
  const f54  = '54' + pad(amt.length)  + amt      // field 54: transaction amount
  const body = '000201'   // Payload Format Indicator = 01
    + '010212'            // Point of Initiation = 12 (dynamic, single-use)
    + f26                 // Merchant Account Info (SINPE)
    + '5303188'           // Transaction Currency = 188 (CRC colón)
    + f54                 // Transaction Amount
    + '5802CR'            // Country Code = CR
    + '6304'              // CRC tag (value appended below)
  const checksum = crc16(body).toString(16).toUpperCase().padStart(4, '0')
  return body + checksum
}

const sinpeDeepLink = computed(() => {
  if (!sinpeNumber.value || !link.value?.monto) return '#'
  return `sinpe://pay?phone=${sinpeNumber.value}&amount=${link.value.monto}`
})

const qrValue = computed(() => {
  if (!sinpeNumber.value || !link.value?.monto) return window.location.href
  return buildSinpeEmvQr(sinpeNumber.value, link.value.monto) ?? window.location.href
})
const isExpired = computed(() => {
  if (!link.value?.vencimiento) return false
  return new Date(link.value.vencimiento) < new Date()
})
const isPaid = computed(() => link.value?.estado === 'pagado')
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col items-center justify-start py-8 px-4" :style="brandStyle">
    <div v-if="loading" class="mt-20 text-gray-400 text-sm">Cargando...</div>

    <div v-else-if="notFound" class="mt-20 text-center">
      <p class="text-gray-900 font-medium">Enlace de cobro no encontrado</p>
      <p class="text-gray-500 text-sm mt-1">Es posible que haya sido eliminado o expirado.</p>
    </div>

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
        <p class="text-sm text-gray-500 mt-1">Este cobro ya no está disponible.</p>
      </div>
    </div>

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
        <template v-if="brand?.logo_url">
          <img :src="brand.logo_url" alt="Logo" class="h-10 w-auto mx-auto mb-2 object-contain" />
        </template>
        <template v-else>
          <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto mb-2" :style="brandColor ? { background: brandColor } : {}">
            <span class="text-white font-bold text-sm">SP</span>
          </div>
        </template>
        <p class="text-xs text-gray-400">{{ brand ? `Pago seguro · ${brand.business_name || link.businesses?.nombre}` : 'Pago seguro · SINPEpay' }}</p>
      </div>

      <div class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <!-- Business + Amount -->
        <div class="p-6 text-center border-b border-gray-100">
          <p class="text-sm text-gray-500">{{ link.businesses?.nombre }}</p>
          <p class="text-4xl font-bold text-gray-900 amount mt-1">{{ formatCRC(link.monto) }}</p>
          <p class="text-sm text-gray-600 mt-1">{{ link.descripcion }}</p>
        </div>

        <!-- Payment method tabs (only if card is available) -->
        <div v-if="canPayCard" class="flex border-b border-gray-100">
          <button
            @click="tab = 'sinpe'"
            :class="['flex-1 py-3 text-sm font-medium transition-colors', tab === 'sinpe' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700']"
          >SINPE Móvil</button>
          <button
            @click="tab = 'card'; initCardPayment()"
            :class="['flex-1 py-3 text-sm font-medium transition-colors', tab === 'card' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700']"
          >Tarjeta</button>
        </div>

        <!-- SINPE tab -->
        <div v-if="tab === 'sinpe'" class="p-6 space-y-5">
          <div class="flex flex-col items-center gap-3">
            <p class="text-xs text-gray-400 font-medium uppercase tracking-wide">Escanee para pagar</p>
            <div class="bg-white p-3 rounded-xl border border-gray-100">
              <QrcodeVue :value="qrValue" :size="220" level="H" render-as="svg" />
            </div>
            <p class="text-xs text-gray-400">Escanee desde SINPE Móvil → Enviar → Escanear QR</p>
          </div>
          <div class="bg-surface rounded-xl p-4">
            <p class="text-xs font-semibold text-gray-700 mb-3">Cómo pagar con SINPE Móvil</p>
            <ol class="space-y-2">
              <li class="flex items-start gap-2 text-xs text-gray-600">
                <span class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">1</span>
                Abra su app bancaria (BAC, BCR, BN, etc.)
              </li>
              <li class="flex items-start gap-2 text-xs text-gray-600">
                <span class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">2</span>
                Vaya a <strong class="text-gray-900">SINPE Móvil → Enviar → Escanear QR</strong>
              </li>
              <li class="flex items-start gap-2 text-xs text-gray-600">
                <span class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">3</span>
                Apunte la cámara al código QR — número y monto se llenan solos
              </li>
              <li class="flex items-start gap-2 text-xs text-gray-600">
                <span class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">4</span>
                Confirme el envío de <strong class="text-gray-900 amount">{{ formatCRC(link.monto) }}</strong> al <strong class="font-mono text-gray-900">{{ link.businesses?.sinpe_numero }}</strong>
              </li>
            </ol>
          </div>
          <a :href="sinpeDeepLink" class="w-full bg-primary text-white rounded-lg px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            Pagar con SINPE Móvil
          </a>
        </div>

        <!-- Card tab -->
        <div v-else class="p-6">
          <div v-if="cardLoading" class="text-center py-8 text-gray-400 text-sm">Cargando formulario de pago...</div>
          <div v-else-if="cardError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">{{ cardError }}</div>
          <div id="onvo-container" class="min-h-[200px]" />
          <p class="text-xs text-gray-400 text-center mt-4">Pagos con tarjeta procesados por Onvopay · SUGEF certificado</p>
        </div>
      </div>

      <p class="text-center text-xs text-gray-400 mt-6">
        <template v-if="brand">{{ brand.business_name || link.businesses?.nombre }} · </template>
        Powered by <strong class="text-primary">SINPEpay</strong>
      </p>
    </div>
  </div>
</template>

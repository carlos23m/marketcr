<script setup>
const props = defineProps({
  plan:        { type: String, required: true },  // starter | pro | business
  current:     { type: Boolean, default: false },
  trialing:    { type: Boolean, default: false },
  loading:     { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

const config = {
  starter: {
    name: 'Starter',
    price: 'Gratis',
    period: 'para siempre',
    features: ['50 cobros/mes','100 transacciones/mes','1 usuario','Importación manual de SMS','Marca SINPEpay en cobros'],
    missing: ['Sin API','Sin SMS automático','Sin webhooks'],
    color: 'border-gray-200',
    badge: null,
  },
  pro: {
    name: 'Pro',
    price: '₡9.900',
    period: '/mes',
    features: ['Cobros y transacciones ilimitados','3 usuarios','SMS automático (1 número Twilio)','API (2.000 req/hora)','3 webhooks','Sin marca SINPEpay'],
    missing: [],
    color: 'border-primary',
    badge: 'Más popular',
  },
  business: {
    name: 'Business',
    price: '₡24.900',
    period: '/mes',
    features: ['Todo lo de Pro','10 usuarios + 3 números Twilio','API (10.000 req/hora)','Webhooks ilimitados','Modo POS tablet','Analítica avanzada + pronósticos'],
    missing: [],
    color: 'border-purple-500',
    badge: null,
  },
}
const cfg = computed(() => config[props.plan] ?? config.starter)

const ctaLabel = computed(() => {
  if (props.current && !props.trialing) return 'Plan actual'
  if (props.plan === 'starter' && !props.current) return 'Bajar a Starter'
  return 'Comenzar prueba de 14 días'
})

import { computed } from 'vue'
</script>

<template>
  <div :class="['relative border-2 rounded-2xl p-6 flex flex-col gap-4 transition-shadow', cfg.color, current ? 'shadow-md' : 'hover:shadow-sm']">
    <div v-if="cfg.badge" class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-0.5 rounded-full">
      {{ cfg.badge }}
    </div>
    <div>
      <p class="text-sm font-semibold text-gray-500 uppercase tracking-wide">{{ cfg.name }}</p>
      <p class="text-3xl font-bold text-gray-900 mt-1">{{ cfg.price }}<span class="text-base font-normal text-gray-500">{{ cfg.period }}</span></p>
    </div>
    <ul class="flex flex-col gap-2 flex-1">
      <li v-for="f in cfg.features" :key="f" class="flex items-start gap-2 text-sm text-gray-700">
        <svg class="w-4 h-4 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
        {{ f }}
      </li>
      <li v-for="f in cfg.missing" :key="f" class="flex items-start gap-2 text-sm text-gray-400">
        <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        {{ f }}
      </li>
    </ul>
    <button
      v-if="!(current && !trialing) || plan === 'starter'"
      :disabled="current && !trialing || loading"
      @click="emit('select', plan)"
      :class="[
        'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors',
        plan === 'pro' ? 'bg-primary text-white hover:bg-primary/90' :
        plan === 'business' ? 'bg-purple-600 text-white hover:bg-purple-700' :
        'bg-gray-100 text-gray-700 hover:bg-gray-200',
        (current && !trialing) && 'opacity-50 cursor-default',
      ]"
    >
      <span v-if="loading">...</span>
      <span v-else>{{ ctaLabel }}</span>
    </button>
    <div v-if="current && !trialing" class="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-gray-50 text-gray-500 border border-gray-200">
      Plan actual
    </div>
  </div>
</template>

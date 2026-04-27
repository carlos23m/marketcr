<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import PaymentStatusBadge from './PaymentStatusBadge.vue'
import { formatCRC } from '@/utils/currency'

const props = defineProps({
  link: { type: Object, required: true },
})

const emit = defineEmits(['copyLink', 'viewQr', 'markPaid', 'delete'])

const dateStr = computed(() => {
  try {
    return format(new Date(props.link.creadoEn), "d MMM yyyy", { locale: es })
  } catch { return '—' }
})
</script>

<template>
  <div class="flex items-center gap-4 py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors group">
    <RouterLink :to="`/links/${link.id}`" class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-900 truncate">{{ link.descripcion }}</p>
      <p class="text-xs text-gray-400 mt-0.5">{{ link.cliente || 'Sin cliente' }} · {{ dateStr }}</p>
    </RouterLink>

    <span class="amount text-sm">{{ formatCRC(link.monto) }}</span>
    <PaymentStatusBadge :estado="link.estado" />

    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        class="p-1.5 text-gray-400 hover:text-primary rounded transition-colors"
        title="Copiar enlace"
        @click.prevent="$emit('copyLink', link)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      </button>
      <button
        class="p-1.5 text-gray-400 hover:text-primary rounded transition-colors"
        title="Ver QR"
        @click.prevent="$emit('viewQr', link)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const props = defineProps({
  label: { type: String, required: true },
  used:  { type: Number, default: null },
  limit: { type: Number, default: null },
})
</script>

<template>
  <div class="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
    <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
    <span class="text-amber-800">
      <span v-if="used !== null && limit !== null">Usaste {{ used }}/{{ limit }} {{ label }} este mes · </span>
      <span v-else>{{ label }} · </span>
    </span>
    <button @click="router.push('/configuracion/facturacion')" class="ml-auto text-amber-700 font-semibold hover:underline whitespace-nowrap">
      Actualizar a Pro →
    </button>
  </div>
</template>

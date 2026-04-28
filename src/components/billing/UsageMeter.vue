<script setup>
const props = defineProps({
  label:   { type: String, required: true },
  used:    { type: Number, required: true },
  limit:   { type: Number, default: null },
})

const pct = computed(() => {
  if (props.limit === null) return 0
  return Math.min(100, Math.round((props.used / props.limit) * 100))
})

const barColor = computed(() => {
  if (props.limit === null) return 'bg-primary'
  if (pct.value >= 90) return 'bg-red-500'
  if (pct.value >= 70) return 'bg-amber-500'
  return 'bg-primary'
})

import { computed } from 'vue'
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-center justify-between text-sm">
      <span class="text-gray-600">{{ label }}</span>
      <span class="font-medium text-gray-900">
        <span v-if="limit === null">{{ used }} <span class="text-gray-400 font-normal">/ ilimitado</span></span>
        <span v-else>{{ used }} <span class="text-gray-400 font-normal">/ {{ limit }}</span></span>
      </span>
    </div>
    <div v-if="limit !== null" class="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div :class="barColor" class="h-full rounded-full transition-all duration-500" :style="`width:${pct}%`" />
    </div>
  </div>
</template>

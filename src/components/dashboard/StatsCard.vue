<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  sub: { type: String, default: '' },
  color: { type: String, default: 'primary' },
})
</script>

<template>
  <div class="bg-white border border-gray-100 rounded-xl p-5">
    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ label }}</p>
    <p :class="['text-2xl font-semibold mt-1 amount', color === 'primary' ? 'text-primary' : 'text-gray-900']">
      {{ value }}
    </p>
    <p v-if="sub" class="text-xs text-gray-400 mt-1">{{ sub }}</p>
  </div>
</template>

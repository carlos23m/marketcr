<script setup>
defineProps({
  padding: { type: String, default: 'p-5' },
})
</script>

<template>
  <div :class="['bg-white border border-gray-100 rounded-xl', padding]">
    <slot />
  </div>
</template>

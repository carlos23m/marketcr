<script setup>
defineProps({
  padding: { type: String, default: 'p-5' },
})
</script>

<template>
  <div :class="['bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl', padding]">
    <slot />
  </div>
</template>

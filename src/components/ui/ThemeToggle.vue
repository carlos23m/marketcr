<script setup>
import { useTheme } from '@/composables/useTheme'
const { isDark, toggle } = useTheme()
</script>

<template>
  <button
    :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    class="relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 flex-shrink-0"
    :class="isDark ? 'bg-primary' : 'bg-gray-200'"
    @click="toggle"
  >
    <span
      class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 flex items-center justify-center"
      :class="isDark ? 'translate-x-5' : 'translate-x-0'"
    >
      <!-- Sun -->
      <svg v-if="!isDark" class="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17a5 5 0 100-10 5 5 0 000 10zm0-13a1 1 0 011 1v1a1 1 0 11-2 0V5a1 1 0 011-1zm0 14a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm9-9a1 1 0 110 2h-1a1 1 0 110-2h1zM4 12a1 1 0 110 2H3a1 1 0 110-2h1zm14.95-6.364a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zm-12.728 12.728a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zm12.021.707a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414zm-12.728-12.02a1 1 0 01-1.414 0L4.394 6.35a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414z"/>
      </svg>
      <!-- Moon -->
      <svg v-else class="w-3 h-3 text-primary" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
      </svg>
    </span>
  </button>
</template>

<script setup>
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import LocationSelector from '@/components/locations/LocationSelector.vue'
import { useLocationsStore } from '@/stores/useLocationsStore'

defineProps({
  title: { type: String, default: '' },
  mobileMenuOpen: { type: Boolean, default: false },
})
defineEmits(['toggleMenu'])

const locationsStore = useLocationsStore()
</script>

<template>
  <header class="h-14 flex items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-20">
    <div class="flex items-center gap-3">
      <button
        class="lg:hidden p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        @click="$emit('toggleMenu')"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <h1 class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h1>
    </div>
    <div class="flex items-center gap-3">
      <LocationSelector />
      <ThemeToggle />
      <slot name="actions" />
    </div>
  </header>
</template>

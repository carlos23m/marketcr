<script setup>
import { useLocationsStore } from '@/stores/useLocationsStore'
import { usePermissions } from '@/composables/usePermissions'

const store = useLocationsStore()
const { can } = usePermissions()
</script>

<template>
  <div v-if="store.locations.length > 1 && can.isOwner?.value" class="relative">
    <select
      :value="store.selectedLocationId ?? ''"
      @change="store.selectLocation($event.target.value || null)"
      class="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20">
      <option value="">Todas las sucursales</option>
      <option v-for="l in store.locations" :key="l.id" :value="l.id">{{ l.nombre }}</option>
    </select>
  </div>
</template>

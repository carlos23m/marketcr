<script setup>
import AppCard from '@/components/ui/AppCard.vue'
defineProps({ location: Object })
defineEmits(['edit', 'delete'])
</script>

<template>
  <AppCard class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <p class="font-medium text-gray-900 dark:text-white text-sm">{{ location.nombre }}</p>
        <span v-if="location.is_main" class="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Principal</span>
        <span v-if="!location.activo" class="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Inactiva</span>
      </div>
      <p v-if="location.direccion" class="text-xs text-gray-400">{{ location.direccion }}</p>
      <p v-if="location.sinpe_numero" class="text-xs text-gray-400 font-mono">SINPE: {{ location.sinpe_numero }}</p>
    </div>
    <div class="flex gap-2 shrink-0">
      <button @click="$emit('edit', location)" class="text-xs text-gray-400 hover:text-primary">Editar</button>
      <button v-if="!location.is_main" @click="$emit('delete', location.id)" class="text-xs text-red-400 hover:text-red-600">Eliminar</button>
    </div>
  </AppCard>
</template>

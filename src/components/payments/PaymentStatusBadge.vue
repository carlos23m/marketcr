<script setup>
import AppBadge from '@/components/ui/AppBadge.vue'

defineProps({
  estado: { type: String, required: true },
})

const labels = {
  activo: 'Activo',
  pagado: 'Pagado',
  vencido: 'Vencido',
  borrador: 'Borrador',
}
</script>

<template>
  <AppBadge :variant="estado">{{ labels[estado] || estado }}</AppBadge>
</template>

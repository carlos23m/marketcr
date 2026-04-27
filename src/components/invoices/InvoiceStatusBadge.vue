<script setup>
import AppBadge from '@/components/ui/AppBadge.vue'
defineProps({ estado: { type: String, required: true } })
const labels = { borrador: 'Borrador', enviada: 'Enviada', aceptada: 'Aceptada', rechazada: 'Rechazada' }
const variants = { borrador: 'borrador', enviada: 'info', aceptada: 'pagado', rechazada: 'vencido' }
</script>
<template>
  <AppBadge :variant="variants[estado] || 'info'">{{ labels[estado] || estado }}</AppBadge>
</template>

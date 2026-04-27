<script setup>
/**
 * @prop {'activo'|'pagado'|'vencido'|'borrador'|'success'|'warning'|'error'|'info'} variant
 */
defineProps({
  variant: { type: String, default: 'info' },
})

const styles = {
  activo: 'bg-green-100 text-green-700',
  pagado: 'bg-primary-light text-primary',
  vencido: 'bg-red-100 text-red-600',
  borrador: 'bg-gray-100 text-gray-500',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-600',
  info: 'bg-blue-100 text-blue-600',
}
</script>

<template>
  <span :class="['rounded-full px-2.5 py-0.5 text-xs font-medium', styles[variant] || styles.info]">
    <slot />
  </span>
</template>

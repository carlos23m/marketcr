<script setup>
import AppCard from '@/components/ui/AppCard.vue'
import { formatCRC } from '@/utils/currency'
defineProps({ metrics: Object })
</script>

<template>
  <AppCard>
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">✓</div>
      <div>
        <p class="font-semibold text-gray-900 dark:text-white">Califica para un adelanto</p>
        <p class="text-xs text-gray-500">Tu negocio cumple todos los requisitos</p>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3">
        <p class="text-xs text-gray-500 mb-1">Ingreso promedio mensual</p>
        <p class="font-bold text-gray-900 dark:text-white">{{ formatCRC(metrics.monthlyAvg) }}</p>
      </div>
      <div class="rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3">
        <p class="text-xs text-gray-500 mb-1">Máximo disponible</p>
        <p class="font-bold text-primary">{{ formatCRC(metrics.maxLoan) }}</p>
      </div>
      <div class="rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3">
        <p class="text-xs text-gray-500 mb-1">Días activo</p>
        <p class="font-bold text-gray-900 dark:text-white">{{ metrics.accountAge }}</p>
      </div>
      <div class="rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3">
        <p class="text-xs text-gray-500 mb-1">Consistencia (30d)</p>
        <p class="font-bold text-gray-900 dark:text-white">{{ metrics.consistencyScore }}%</p>
      </div>
    </div>
  </AppCard>
</template>

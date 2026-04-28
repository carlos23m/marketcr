<script setup>
import AppCard from '@/components/ui/AppCard.vue'
import { computed } from 'vue'
import { formatCRC } from '@/utils/currency'

const props = defineProps({ application: Object })

const steps = computed(() => [
  { key: 'pending',      label: 'Solicitud enviada',       desc: 'Recibimos tu solicitud.' },
  { key: 'under_review', label: 'En revisión',             desc: '1–5 días hábiles.' },
  { key: 'approved',     label: 'Aprobado',                desc: 'Tu adelanto fue aprobado.' },
  { key: 'disbursed',    label: 'Depositado',              desc: 'El dinero está en camino.' },
])

const ORDER = ['pending','under_review','approved','rejected','disbursed']
const currentIdx = computed(() => ORDER.indexOf(props.application?.status ?? 'pending'))
</script>

<template>
  <AppCard>
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-semibold text-gray-900 dark:text-white">Estado de tu solicitud</h2>
      <span v-if="application?.status === 'rejected'" class="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full">Rechazada</span>
      <span v-else class="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">En proceso</span>
    </div>

    <!-- Rejected state -->
    <template v-if="application?.status === 'rejected'">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Su solicitud fue rechazada.</p>
      <p v-if="application?.rejection_reason" class="text-sm text-red-600 dark:text-red-400">Motivo: {{ application.rejection_reason }}</p>
    </template>

    <!-- Timeline -->
    <template v-else>
      <div class="space-y-4">
        <div v-for="(step, i) in steps" :key="step.key" class="flex gap-4">
          <div class="flex flex-col items-center">
            <div :class="['w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
              currentIdx >= i ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400']">
              {{ currentIdx > i ? '✓' : i + 1 }}
            </div>
            <div v-if="i < steps.length - 1" :class="['w-0.5 h-8 mt-1', currentIdx > i ? 'bg-primary' : 'bg-gray-200']" />
          </div>
          <div class="pt-0.5 pb-4">
            <p :class="['text-sm font-medium', currentIdx >= i ? 'text-gray-900 dark:text-white' : 'text-gray-400']">{{ step.label }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ step.desc }}</p>
          </div>
        </div>
      </div>
      <p class="mt-4 text-xs text-gray-400">Si tiene preguntas, contáctenos en soporte@sinpepay.cr</p>
    </template>
  </AppCard>
</template>

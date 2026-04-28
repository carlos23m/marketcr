<script setup>
import { onMounted } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { usePushStore } from '@/stores/usePushStore'

const push = usePushStore()

onMounted(() => push.checkSubscription())

const prefLabels = {
  payments:       'Pagos recibidos',
  invoices:       'Facturas procesadas',
  daily_summary:  'Resumen diario (8pm)',
  plan_reminders: 'Recordatorios de plan',
}
</script>

<template>
  <AppShell title="Notificaciones">
    <div class="max-w-xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Notificaciones push</h1>

      <AppCard v-if="!push.supported" class="text-center py-8">
        <p class="text-gray-500 text-sm">Su navegador no soporta notificaciones push.</p>
      </AppCard>

      <template v-else>
        <AppCard class="mb-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Estado de notificaciones</p>
              <p class="text-sm text-gray-500 mt-0.5">
                {{ push.subscribed ? 'Activas en este dispositivo' : push.permission === 'denied' ? 'Bloqueadas por el navegador' : 'No activadas' }}
              </p>
            </div>
            <button v-if="!push.subscribed && push.permission !== 'denied'" @click="push.requestPermission()" :disabled="push.loading"
              class="btn-primary text-sm">
              {{ push.loading ? 'Activando…' : 'Activar notificaciones' }}
            </button>
            <button v-else-if="push.subscribed" @click="push.unsubscribe()" class="btn-secondary text-sm">Desactivar</button>
          </div>
          <p v-if="push.permission === 'denied'" class="mt-3 text-xs text-red-600">Ha bloqueado las notificaciones. Habilítelas en la configuración del navegador.</p>
        </AppCard>

        <AppCard v-if="push.subscribed">
          <h3 class="font-medium text-gray-900 dark:text-white mb-4">Tipos de notificaciones</h3>
          <div class="space-y-3">
            <label v-for="(label, key) in prefLabels" :key="key" class="flex items-center justify-between cursor-pointer">
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ label }}</span>
              <input type="checkbox" :checked="push.prefs[key]" @change="push.updatePrefs({ [key]: $event.target.checked })" class="rounded" />
            </label>
          </div>
          <button @click="push.sendTest()" class="mt-5 btn-secondary text-sm w-full">Probar notificación</button>
        </AppCard>
      </template>
    </div>
  </AppShell>
</template>

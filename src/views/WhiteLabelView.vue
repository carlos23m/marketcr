<script setup>
import AppShell from '@/components/layout/AppShell.vue'
import UpgradeBanner from '@/components/billing/UpgradeBanner.vue'
import DomainSetup from '@/components/whitelabel/DomainSetup.vue'
import BrandEditor from '@/components/whitelabel/BrandEditor.vue'
import { usePlanLimits } from '@/composables/usePlanLimits'

const { planGte } = usePlanLimits()
const canAccess = planGte('business')
</script>

<template>
  <AppShell title="Marca personalizada">
    <div class="max-w-2xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Marca personalizada</h1>
        <p class="text-sm text-gray-500 mt-1">Personalice sus páginas de cobro con su logo, colores y dominio propio.</p>
      </div>
      <UpgradeBanner v-if="!canAccess" feature="Marca personalizada" required-plan="business" />
      <template v-else>
        <div class="space-y-6">
          <DomainSetup />
          <BrandEditor />
        </div>
      </template>
    </div>
  </AppShell>
</template>

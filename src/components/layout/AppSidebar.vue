<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePermissions } from '@/composables/usePermissions'
import { usePlanLimits } from '@/composables/usePlanLimits'
import { RouterLink, useRoute } from 'vue-router'

const auth = useAuthStore()
const { can } = usePermissions()
const route = useRoute()
const { plan, isTrialing, trialDaysLeft } = usePlanLimits()

function isActive(to) {
  return route.path === to || (to !== '/dashboard' && route.path.startsWith(to + '/'))
}

const planBadge = computed(() => {
  if (isTrialing.value) return { label: `Prueba · ${trialDaysLeft.value}d`, cls: 'bg-amber-100 text-amber-700' }
  if (plan.value === 'business') return { label: 'Business', cls: 'bg-purple-100 text-purple-700' }
  if (plan.value === 'pro') return { label: 'Pro', cls: 'bg-primary/10 text-primary' }
  return null
})
</script>

<template>
  <aside class="fixed left-0 top-0 h-full w-[240px] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-30">
    <div class="flex items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800">
      <img src="/mainlogo.png" alt="SINPEpay" class="w-36 h-auto dark:hidden" />
      <img src="/lightlogo.png" alt="SINPEpay" class="w-36 h-auto hidden dark:block" />
    </div>

    <nav class="flex-1 px-3 py-4 overflow-y-auto">
      <!-- Main -->
      <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-3 mb-1">Principal</p>

      <RouterLink to="/dashboard"
        :class="['flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5', isActive('/dashboard') ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800']">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        Inicio
      </RouterLink>

      <RouterLink to="/payment-links"
        :class="['flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5', isActive('/payment-links') || isActive('/create-link') || isActive('/links') ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800']">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        Cobros
      </RouterLink>

      <RouterLink to="/transacciones"
        :class="['flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5', isActive('/transacciones') ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800']">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        Transacciones
      </RouterLink>

      <RouterLink v-if="can.viewInvoices.value" to="/facturas"
        :class="['flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5', isActive('/facturas') ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800']">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        Facturas
      </RouterLink>

      <!-- Analytics (Pro+) -->
      <RouterLink to="/analitica"
        :class="['flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5', isActive('/analitica') ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800']">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        Analítica
        <span v-if="plan === 'starter'" class="ml-auto text-gray-300">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </span>
      </RouterLink>

      <!-- POS (Pro+) -->
      <RouterLink to="/pos"
        :class="['flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5', isActive('/pos') ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800']">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
        Punto de venta
        <span v-if="plan === 'starter'" class="ml-auto text-gray-300">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </span>
      </RouterLink>

      <!-- Developers -->
      <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-3 mt-4 mb-1">Desarrolladores</p>

      <RouterLink to="/developers"
        :class="['flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5', isActive('/developers') ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800']">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
        API y Webhooks
        <span v-if="plan === 'starter'" class="ml-auto text-gray-300">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </span>
      </RouterLink>

      <RouterLink to="/developers/plugins"
        :class="['flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5', isActive('/developers/plugins') ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800']">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"/></svg>
        Plugins
      </RouterLink>

      <!-- Settings -->
      <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-3 mt-4 mb-1">Configuración</p>

      <RouterLink to="/configuracion"
        :class="['flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5', route.path === '/configuracion' ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800']">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        General
      </RouterLink>

      <RouterLink to="/configuracion/facturacion"
        :class="['flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5', isActive('/configuracion/facturacion') ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800']">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
        Facturación
      </RouterLink>

      <RouterLink to="/sms-import"
        :class="['flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5', isActive('/sms-import') ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800']">
        <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
        SMS
      </RouterLink>
    </nav>

    <!-- Business footer with plan badge -->
    <div class="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{{ auth.business?.nombre || auth.profile?.nombre || 'Mi negocio' }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{{ auth.business?.sinpe_numero || auth.user?.email || '—' }}</p>
        </div>
        <span v-if="planBadge" :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', planBadge.cls]">
          {{ planBadge.label }}
        </span>
      </div>
    </div>
  </aside>
</template>

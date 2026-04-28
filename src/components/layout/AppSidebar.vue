<script setup>
import { useAuthStore } from '@/stores/useAuthStore'
import { usePermissions } from '@/composables/usePermissions'
import { RouterLink, useRoute } from 'vue-router'

const auth = useAuthStore()
const { can } = usePermissions()
const route = useRoute()

const navItems = [
  { to: '/dashboard', label: 'Inicio', icon: 'home' },
  { to: '/payment-links', label: 'Cobros', icon: 'link' },
  { to: '/create-link', label: 'Nuevo cobro', icon: 'plus' },
  { to: '/transacciones', label: 'Transacciones', icon: 'list' },
  { to: '/sms-import', label: 'Importar SMS', icon: 'message' },
  { to: '/facturas', label: 'Facturas', icon: 'invoice', requireDueno: true },
  { to: '/configuracion', label: 'Configuración', icon: 'settings' },
]

function isActive(to) {
  return route.path === to || (to !== '/dashboard' && route.path.startsWith(to + '/'))
}
</script>

<template>
  <aside class="fixed left-0 top-0 h-full w-[240px] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-30">
    <div class="flex items-center px-5 py-4 border-b border-gray-100 dark:border-gray-800">
      <img src="/mainlogo.png" alt="SINPEpay" class="h-12 w-auto" />
    </div>

    <nav class="flex-1 px-3 py-4 overflow-y-auto">
      <template v-for="item in navItems" :key="item.to">
        <RouterLink
          v-if="!item.requireDueno || can.viewInvoices.value"
          :to="item.to"
          :class="[
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5',
            isActive(item.to)
              ? 'bg-primary-light dark:bg-primary/20 text-primary font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          ]"
        >
          <!-- Home -->
          <svg v-if="item.icon === 'home'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <!-- Link -->
          <svg v-else-if="item.icon === 'link'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          <!-- Plus -->
          <svg v-else-if="item.icon === 'plus'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <!-- List -->
          <svg v-else-if="item.icon === 'list'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <!-- Message -->
          <svg v-else-if="item.icon === 'message'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
          <!-- Invoice -->
          <svg v-else-if="item.icon === 'invoice'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <!-- Settings -->
          <svg v-else-if="item.icon === 'settings'" class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          {{ item.label }}
        </RouterLink>
      </template>
    </nav>

    <div class="px-5 py-4 border-t border-gray-100 dark:border-gray-800">
      <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{{ auth.business?.nombre || auth.profile?.nombre || 'Mi negocio' }}</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ auth.business?.sinpe_numero || auth.user?.email || '—' }}</p>
    </div>
  </aside>
</template>

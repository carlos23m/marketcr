<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'

const props = defineProps({
  title: { type: String, default: '' },
})

const mobileMenuOpen = ref(false)
const route = useRoute()

const mobileNav = [
  { to: '/dashboard', label: 'Inicio', icon: 'home' },
  { to: '/payment-links', label: 'Cobros', icon: 'link' },
  { to: '/transacciones', label: 'Transacciones', icon: 'list' },
  { to: '/configuracion', label: 'Config', icon: 'settings' },
]
</script>

<template>
  <div class="min-h-screen bg-surface dark:bg-gray-950">
    <!-- Sidebar desktop -->
    <AppSidebar class="hidden lg:flex lg:flex-col" />

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-40 bg-black/40 lg:hidden"
        @click="mobileMenuOpen = false"
      />
    </Transition>
    <Transition name="slide">
      <AppSidebar
        v-if="mobileMenuOpen"
        class="flex flex-col lg:hidden"
        @click="mobileMenuOpen = false"
      />
    </Transition>

    <!-- Main -->
    <div class="lg:ml-[240px] min-h-screen flex flex-col pb-16 lg:pb-0">
      <AppTopbar
        :title="title"
        :mobile-menu-open="mobileMenuOpen"
        @toggle-menu="mobileMenuOpen = !mobileMenuOpen"
      >
        <template #actions>
          <slot name="topbar-actions" />
        </template>
      </AppTopbar>

      <main class="flex-1 p-5 max-w-[1100px] w-full mx-auto">
        <slot />
      </main>
    </div>

    <!-- Mobile bottom nav -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 z-30 flex">
      <RouterLink
        v-for="item in mobileNav"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors',
          route.path === item.to ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
        ]"
      >
        <svg v-if="item.icon === 'home'" class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
        <svg v-if="item.icon === 'link'" class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
        </svg>
        <svg v-if="item.icon === 'list'" class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <svg v-if="item.icon === 'settings'" class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 0.25s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }
</style>

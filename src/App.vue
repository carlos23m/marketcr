<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import AppToast from '@/components/ui/AppToast.vue'

const auth = useAuthStore()
</script>

<template>
  <div v-if="auth.loading" class="min-h-screen bg-surface flex items-center justify-center">
    <div class="flex flex-col items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
        <span class="text-white font-bold text-sm">SP</span>
      </div>
      <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
  <RouterView v-else />
  <AppToast />
</template>

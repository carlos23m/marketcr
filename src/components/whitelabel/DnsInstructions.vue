<script setup>
import AppCard from '@/components/ui/AppCard.vue'
import { ref } from 'vue'
defineProps({ dns: Object })
const copied = ref(false)
async function copy(text) { await navigator.clipboard.writeText(text); copied.value = true; setTimeout(() => copied.value = false, 2000) }
</script>

<template>
  <AppCard>
    <h4 class="font-medium text-gray-900 dark:text-white mb-3">Configuración DNS requerida</h4>
    <p class="text-sm text-gray-500 mb-4">Agregue el siguiente registro en el panel DNS de su dominio:</p>
    <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 font-mono text-sm">
      <div class="grid grid-cols-3 gap-4">
        <div><p class="text-xs text-gray-400 mb-1">Tipo</p><p class="font-bold">{{ dns?.type ?? 'CNAME' }}</p></div>
        <div><p class="text-xs text-gray-400 mb-1">Nombre</p><p class="font-bold">{{ dns?.name ?? '@' }}</p></div>
        <div>
          <p class="text-xs text-gray-400 mb-1">Valor</p>
          <div class="flex items-center gap-2">
            <p class="font-bold truncate">{{ dns?.value ?? 'cname.vercel-dns.com' }}</p>
            <button @click="copy(dns?.value ?? 'cname.vercel-dns.com')" class="text-primary text-xs shrink-0">{{ copied ? '✓' : 'Copiar' }}</button>
          </div>
        </div>
      </div>
    </div>
    <p class="text-xs text-gray-400 mt-3">Los cambios DNS pueden tardar hasta 24 horas en propagarse. Haga clic en "Verificar DNS" después de configurarlo.</p>
  </AppCard>
</template>

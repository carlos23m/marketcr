<script setup>
import { ref } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import DnsInstructions from './DnsInstructions.vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

const auth = useAuthStore()
const domain = ref('')
const status = ref(null) // null | {domain, dns, status}
const loading = ref(false)
const checking = ref(false)
const error = ref('')

async function provision() {
  if (!domain.value.trim()) return
  error.value = ''
  loading.value = true
  const jwt = (await supabase.auth.getSession()).data.session?.access_token
  const { data, error: fnErr } = await supabase.functions.invoke('provision-domain', {
    body: { domain: domain.value.trim(), business_id: auth.business?.id },
  })
  loading.value = false
  if (fnErr || data?.error) { error.value = data?.error ?? fnErr?.message ?? 'Error'; return }
  status.value = data
}

async function checkStatus() {
  if (!status.value?.domain) return
  checking.value = true
  const { data } = await supabase.functions.invoke('check-domain-status', {
    body: { domain: status.value.domain },
  })
  checking.value = false
  if (data?.verified) status.value = { ...status.value, verified: true, ssl: data.ssl_active }
}
</script>

<template>
  <div class="space-y-4">
    <AppCard v-if="!status">
      <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Dominio personalizado</h3>
      <p class="text-sm text-gray-500 mb-4">Sirva sus páginas de cobro bajo su propio dominio, ej: <code class="bg-gray-100 px-1 rounded">pago.tutienda.cr</code></p>
      <div class="flex gap-3">
        <input v-model="domain" type="text" placeholder="pago.tutienda.cr" class="form-input flex-1" @keydown.enter="provision" />
        <button @click="provision" :disabled="loading || !domain" class="btn-primary whitespace-nowrap">{{ loading ? 'Configurando…' : 'Agregar dominio' }}</button>
      </div>
      <p v-if="error" class="text-xs text-red-600 mt-2">{{ error }}</p>
    </AppCard>

    <template v-else>
      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ status.domain }}</p>
            <p class="text-xs mt-1" :class="status.verified ? 'text-green-600' : 'text-amber-600'">
              {{ status.verified ? '✓ Activo' : 'Esperando configuración DNS' }}
            </p>
          </div>
          <button @click="checkStatus" :disabled="checking" class="btn-secondary text-sm">{{ checking ? 'Verificando…' : 'Verificar DNS' }}</button>
        </div>
      </AppCard>
      <DnsInstructions v-if="!status.verified" :dns="status.dns" />
    </template>
  </div>
</template>

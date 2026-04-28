<script setup>
import { ref, onMounted } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const stats = ref({ p50: 0, p95: 0, errorRate: 0, totalRequests: 0 })
const recentErrors = ref([])
const tableCounts = ref([])
const loading = ref(false)

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.replace('/login'); return }
  const { data: profile } = await supabase.from('profiles').select('is_sinpepay_admin').eq('id', user.id).single()
  if (!profile?.is_sinpepay_admin) { router.replace('/dashboard'); return }
  await fetchHealth()
})

async function fetchHealth() {
  loading.value = true
  const since24h = new Date(Date.now() - 86_400_000).toISOString()

  const [{ data: logs }, { data: errors }] = await Promise.all([
    supabase.from('api_request_logs').select('duration_ms, status_code, endpoint').gte('created_at', since24h),
    supabase.from('error_logs').select('message, url, created_at').order('created_at', { ascending: false }).limit(10),
  ])

  if (logs?.length) {
    const durations = logs.map(l => l.duration_ms).sort((a, b) => a - b)
    const p50 = durations[Math.floor(durations.length * 0.5)] ?? 0
    const p95 = durations[Math.floor(durations.length * 0.95)] ?? 0
    const errors5xx = logs.filter(l => l.status_code >= 500).length
    stats.value = { p50, p95, errorRate: Math.round((errors5xx / logs.length) * 100), totalRequests: logs.length }
  }

  recentErrors.value = errors ?? []
  loading.value = false
}
</script>

<template>
  <AppShell>
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Salud de la plataforma</h1>
        <button @click="fetchHealth" class="btn-secondary text-sm">Actualizar</button>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">Cargando métricas…</div>
      <template v-else>
        <!-- API latency stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <AppCard v-for="(val, label) in { 'p50 latencia': `${stats.p50}ms`, 'p95 latencia': `${stats.p95}ms`, 'Tasa error (5xx)': `${stats.errorRate}%`, 'Requests (24h)': stats.totalRequests }" :key="label">
            <p class="text-xs text-gray-500 mb-1">{{ label }}</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ val }}</p>
          </AppCard>
        </div>

        <!-- Recent errors -->
        <AppCard>
          <h2 class="font-semibold text-gray-900 dark:text-white mb-4">Últimos errores</h2>
          <div v-if="!recentErrors.length" class="text-sm text-gray-400">Sin errores recientes.</div>
          <div v-else class="space-y-2">
            <div v-for="e in recentErrors" :key="e.created_at" class="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2">
              <p class="text-xs font-medium text-red-800 dark:text-red-300 truncate">{{ e.message }}</p>
              <p class="text-[10px] text-red-500 mt-0.5">{{ e.url }} · {{ new Date(e.created_at).toLocaleString('es-CR') }}</p>
            </div>
          </div>
        </AppCard>
      </template>
    </div>
  </AppShell>
</template>

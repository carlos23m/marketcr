<script setup>
import { ref, onMounted } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToastStore } from '@/stores/useToastStore'

const auth = useAuthStore()
const toast = useToastStore()

const tiendanubeStores = ref([])
const loadingStores = ref(false)
const disconnecting = ref(null)
const downloadingPlugin = ref(false)
const tiendanubeEnabled = ref(true)

async function fetchStores() {
  if (!auth.business?.id) return
  loadingStores.value = true

  // Check if integration is configured
  const probe = await fetch('/api/tiendanube/install', { method: 'GET' })
  if (probe.status === 503) tiendanubeEnabled.value = false

  const { data } = await supabase
    .from('tiendanube_stores')
    .select('id, store_id, store_name, store_url, created_at')
    .eq('business_id', auth.business.id)
  tiendanubeStores.value = data ?? []
  loadingStores.value = false
}

function connectTiendanube() {
  window.location.href = `/api/tiendanube/install?business_id=${auth.business?.id}`
}

async function disconnectStore(storeId) {
  disconnecting.value = storeId
  const { error } = await supabase
    .from('tiendanube_stores')
    .delete()
    .eq('id', storeId)
    .eq('business_id', auth.business?.id)
  if (error) {
    toast.show('Error al desconectar la tienda', 'error')
  } else {
    tiendanubeStores.value = tiendanubeStores.value.filter(s => s.id !== storeId)
    toast.show('Tienda desconectada', 'success')
  }
  disconnecting.value = null
}

async function downloadWcPlugin() {
  downloadingPlugin.value = true
  try {
    const { data, error } = await supabase.functions.invoke('generate-wc-plugin', {
      body: { business_id: auth.business?.id },
    })
    if (error) throw error

    // Build zip client-side with JSZip if available, else show files info
    const files = data?.files
    if (!files) throw new Error('No plugin files returned')

    // Dynamically load JSZip and generate zip
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    const folder = zip.folder('sinpepay-woocommerce')
    for (const [path, content] of Object.entries(files)) {
      folder.file(path, content)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sinpepay-woocommerce.zip'
    a.click()
    URL.revokeObjectURL(url)
    toast.show('Plugin descargado', 'success')
  } catch {
    toast.show('Error al generar el plugin. Intente de nuevo.', 'error')
  } finally {
    downloadingPlugin.value = false
  }
}

onMounted(fetchStores)
</script>

<template>
  <AppShell title="Plugins e integraciones">
    <div class="max-w-2xl space-y-6">
      <!-- WooCommerce SINPEpay Plugin -->
      <AppCard>
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <span class="text-2xl">🛒</span>
          </div>
          <div class="flex-1">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-base font-semibold text-gray-900">WooCommerce — Plugin SINPEpay</h2>
                <p class="text-sm text-gray-500 mt-0.5 mb-4">Plugin nativo de SINPEpay para WooCommerce. Acepta SINPE Móvil directamente en su tienda WordPress, con conciliación automática vía SMS.</p>
              </div>
              <button
                @click="downloadWcPlugin"
                :disabled="downloadingPlugin"
                class="shrink-0 btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <svg v-if="!downloadingPlugin" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                {{ downloadingPlugin ? 'Generando…' : 'Descargar .zip' }}
              </button>
            </div>

            <ol class="flex flex-col gap-3 text-sm">
              <li class="flex gap-3">
                <span class="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p class="font-medium text-gray-900">Descargue e instale el plugin</p>
                  <p class="text-gray-500 mt-0.5">Descargue el .zip con el botón de arriba. En WordPress: <strong>Plugins → Subir plugin</strong>.</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p class="font-medium text-gray-900">Configure su API Key de SINPEpay</p>
                  <p class="text-gray-500 mt-0.5">En WooCommerce → Ajustes → Pagos → SINPEpay: pegue su API Key desde <strong>Desarrolladores → API</strong>.</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p class="font-medium text-gray-900">Active y pruebe</p>
                  <p class="text-gray-500 mt-0.5">Active el método de pago y realice un pedido de prueba de ₡100.</p>
                </div>
              </li>
            </ol>

            <div class="mt-4 pt-4 border-t border-gray-100">
              <p class="text-xs text-gray-400 mb-2">¿Prefiere usar Onvopay directamente?</p>
              <a href="https://wordpress.org/plugins/onvo-pay/" target="_blank" rel="noopener"
                class="inline-flex items-center gap-1 text-primary text-xs font-medium hover:underline">
                Plugin oficial de Onvopay en wordpress.org
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              </a>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- Tiendanube -->
      <AppCard>
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <span class="text-2xl">☁️</span>
          </div>
          <div class="flex-1">
            <div class="flex items-start justify-between gap-4 mb-3">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-semibold text-gray-900">Tiendanube</h2>
                  <span v-if="!tiendanubeEnabled" class="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full">No configurado</span>
                </div>
                <p class="text-sm text-gray-500 mt-0.5">Conecte su tienda Tiendanube para aceptar SINPE Móvil automáticamente en cada pedido.</p>
              </div>
              <button
                v-if="tiendanubeEnabled"
                @click="connectTiendanube"
                class="shrink-0 btn-primary text-sm flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                Conectar tienda
              </button>
            </div>
            <p v-if="!tiendanubeEnabled" class="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
              Para activar esta integración, configure <code class="font-mono">TIENDANUBE_CLIENT_ID</code> y <code class="font-mono">TIENDANUBE_CLIENT_SECRET</code> en las variables de entorno del servidor.
            </p>

            <!-- Connected stores -->
            <div v-if="loadingStores" class="text-xs text-gray-400 py-2">Cargando tiendas…</div>
            <div v-else-if="tiendanubeStores.length" class="mt-2 space-y-2">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiendas conectadas</p>
              <div
                v-for="store in tiendanubeStores"
                :key="store.id"
                class="flex items-center justify-between bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2.5"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ store.store_name || `Tienda #${store.store_id}` }}</p>
                  <a v-if="store.store_url" :href="store.store_url" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">{{ store.store_url }}</a>
                </div>
                <button
                  @click="disconnectStore(store.id)"
                  :disabled="disconnecting === store.id"
                  class="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 font-medium"
                >
                  {{ disconnecting === store.id ? 'Desconectando…' : 'Desconectar' }}
                </button>
              </div>
            </div>
            <div v-else class="text-xs text-gray-400 mt-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-3">
              Ninguna tienda conectada. Haga clic en "Conectar tienda" para comenzar.
            </div>
          </div>
        </div>
      </AppCard>

      <!-- Magento -->
      <AppCard>
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <span class="text-2xl">🔶</span>
          </div>
          <div class="flex-1">
            <h2 class="text-base font-semibold text-gray-900">Magento / Adobe Commerce</h2>
            <p class="text-sm text-gray-500 mt-0.5 mb-2">Onvopay tiene una extensión oficial para Magento 2.</p>
            <a href="https://docs.onvopay.com/integrations/magento" target="_blank" rel="noopener"
              class="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline">
              Documentación de la extensión
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          </div>
        </div>
      </AppCard>
    </div>
  </AppShell>
</template>

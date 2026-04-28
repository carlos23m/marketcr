<script setup>
import { ref, computed } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import UpgradeBanner from '@/components/billing/UpgradeBanner.vue'
import { usePlanLimits } from '@/composables/usePlanLimits'
import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase'
import { useToastStore } from '@/stores/useToastStore'

const { canAccessApi } = usePlanLimits()
const auth = useAuthStore()
const toast = useToastStore()

const activeGroup = ref('links')
const tryResponse = ref('')
const tryLoading = ref(false)
const apiKey = ref('')

const groups = [
  { id: 'start',        label: 'Empezar' },
  { id: 'links',        label: 'Cobros' },
  { id: 'transactions', label: 'Transacciones' },
  { id: 'webhooks',     label: 'Webhooks' },
  { id: 'me',           label: 'Mi negocio' },
]

const endpoints = {
  links: [
    { method: 'GET',    path: '/api/v1/links',    desc: 'Listar cobros', perm: 'links:read',  body: null,
      curl: `curl https://marketcr.vercel.app/api/v1/links \\
  -H "Authorization: Bearer sp_live_..."` },
    { method: 'POST',   path: '/api/v1/links',    desc: 'Crear cobro',   perm: 'links:write',
      body: `{ "descripcion": "Servicio", "monto": 5000 }`,
      curl: `curl -X POST https://marketcr.vercel.app/api/v1/links \\
  -H "Authorization: Bearer sp_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"descripcion":"Servicio","monto":5000}'` },
    { method: 'GET',    path: '/api/v1/links/:id', desc: 'Ver cobro',    perm: 'links:read',  body: null,  curl: '' },
    { method: 'PATCH',  path: '/api/v1/links/:id', desc: 'Actualizar',   perm: 'links:write', body: `{ "estado": "pagado" }`, curl: '' },
    { method: 'DELETE', path: '/api/v1/links/:id', desc: 'Eliminar',     perm: 'links:write', body: null,  curl: '' },
  ],
  transactions: [
    { method: 'GET',  path: '/api/v1/transactions',    desc: 'Listar transacciones', perm: 'txns:read', body: null, curl: `curl https://marketcr.vercel.app/api/v1/transactions \\
  -H "Authorization: Bearer sp_live_..."` },
    { method: 'GET',  path: '/api/v1/transactions/:id', desc: 'Ver transacción',     perm: 'txns:read', body: null, curl: '' },
    { method: 'POST', path: '/api/v1/transactions',    desc: 'Registrar pago',       perm: 'txns:write',
      body: `{ "monto": 5000, "nombre_remitente": "Juan Vargas", "banco": "BCR" }`, curl: '' },
  ],
  webhooks: [
    { method: 'GET',    path: '/api/v1/webhooks',     desc: 'Listar webhooks', perm: 'links:read', body: null, curl: '' },
    { method: 'POST',   path: '/api/v1/webhooks',     desc: 'Registrar endpoint', perm: 'links:write',
      body: `{ "url": "https://example.com/webhook", "events": ["payment.link.paid"] }`, curl: '' },
    { method: 'DELETE', path: '/api/v1/webhooks/:id', desc: 'Eliminar',        perm: 'links:write', body: null, curl: '' },
  ],
  me: [
    { method: 'GET', path: '/api/v1/me', desc: 'Info del negocio + uso', perm: '*', body: null,
      curl: `curl https://marketcr.vercel.app/api/v1/me \\
  -H "Authorization: Bearer sp_live_..."` },
  ],
}

const METHOD_COLORS = { GET: 'bg-blue-100 text-blue-700', POST: 'bg-green-100 text-green-700', PATCH: 'bg-amber-100 text-amber-700', DELETE: 'bg-red-100 text-red-700' }

const selectedEndpoint = ref(endpoints.links[0])

function selectEndpoint(ep) { selectedEndpoint.value = ep; tryResponse.value = '' }

async function tryIt() {
  if (!apiKey.value) { toast.show('Ingrese una llave API de prueba', 'error'); return }
  tryLoading.value = true
  tryResponse.value = ''
  try {
    const res = await fetch(selectedEndpoint.value.path.replace(':id', 'test'), {
      method: selectedEndpoint.value.method,
      headers: {
        Authorization: `Bearer ${apiKey.value}`,
        'Content-Type': 'application/json',
      },
      ...(selectedEndpoint.value.body ? { body: selectedEndpoint.value.body } : {}),
    })
    const data = await res.json()
    tryResponse.value = JSON.stringify(data, null, 2)
  } catch (e) {
    tryResponse.value = `Error: ${e.message}`
  }
  tryLoading.value = false
}
</script>

<template>
  <AppShell title="API y Webhooks">
    <UpgradeBanner v-if="!canAccessApi" label="La API pública requiere plan Pro" class="mb-6" />

    <div class="flex gap-6">
      <!-- Sidebar nav -->
      <div class="w-52 shrink-0">
        <nav class="flex flex-col gap-1">
          <button
            v-for="g in groups" :key="g.id"
            @click="activeGroup = g.id"
            :class="['text-left px-3 py-2 rounded-lg text-sm transition-colors', activeGroup === g.id ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-100']"
          >{{ g.label }}</button>
        </nav>

        <div class="mt-6 pt-6 border-t border-gray-100">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tu llave de prueba</p>
          <input
            v-model="apiKey"
            type="password"
            placeholder="sp_live_..."
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary"
          />
        </div>
      </div>

      <!-- Main content -->
      <div class="flex-1 min-w-0">
        <!-- Getting started -->
        <template v-if="activeGroup === 'start'">
          <AppCard>
            <h2 class="text-base font-semibold text-gray-900 mb-4">Empezar con la API de SINPEpay</h2>
            <ol class="flex flex-col gap-5">
              <li class="flex gap-3">
                <span class="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p class="text-sm font-medium text-gray-900">Generar llave API</p>
                  <p class="text-sm text-gray-500 mt-0.5">Vaya a <strong>Configuración → API y Webhooks</strong> y haga clic en "Nueva llave".</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p class="text-sm font-medium text-gray-900">Primera solicitud</p>
                  <pre class="mt-2 bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto">curl https://marketcr.vercel.app/api/v1/me \
  -H "Authorization: Bearer sp_live_SU_LLAVE"</pre>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p class="text-sm font-medium text-gray-900">Configurar webhook</p>
                  <p class="text-sm text-gray-500 mt-0.5">Registre una URL para recibir eventos en tiempo real cuando se paguen cobros.</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                <div>
                  <p class="text-sm font-medium text-gray-900">Pasar a producción</p>
                  <p class="text-sm text-gray-500 mt-0.5">Reemplace las llaves <code class="bg-gray-100 px-1 rounded text-xs">sp_test_</code> por <code class="bg-gray-100 px-1 rounded text-xs">sp_live_</code> cuando esté listo.</p>
                </div>
              </li>
            </ol>
          </AppCard>
        </template>

        <!-- Endpoint list + detail -->
        <template v-else>
          <div class="flex gap-4">
            <!-- Endpoint list -->
            <div class="w-56 shrink-0">
              <div v-for="ep in endpoints[activeGroup] ?? []" :key="ep.path + ep.method"
                @click="selectEndpoint(ep)"
                :class="['cursor-pointer rounded-xl px-3 py-2.5 mb-1.5 transition-colors', selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method ? 'bg-gray-100' : 'hover:bg-gray-50']"
              >
                <div class="flex items-center gap-2">
                  <span :class="['text-xs font-mono font-bold px-1.5 py-0.5 rounded', METHOD_COLORS[ep.method]]">{{ ep.method }}</span>
                  <span class="text-xs text-gray-600 truncate">{{ ep.path.split('/').pop() }}</span>
                </div>
                <p class="text-xs text-gray-400 mt-0.5">{{ ep.desc }}</p>
              </div>
            </div>

            <!-- Detail -->
            <div class="flex-1 min-w-0" v-if="selectedEndpoint">
              <AppCard>
                <div class="flex items-center gap-3 mb-5">
                  <span :class="['text-sm font-mono font-bold px-2 py-1 rounded', METHOD_COLORS[selectedEndpoint.method]]">{{ selectedEndpoint.method }}</span>
                  <code class="text-sm text-gray-700">{{ selectedEndpoint.path }}</code>
                </div>
                <p class="text-sm text-gray-600 mb-4">{{ selectedEndpoint.desc }}</p>
                <p class="text-xs text-gray-400 mb-2">Permiso requerido: <code class="bg-gray-100 px-1 rounded">{{ selectedEndpoint.perm }}</code></p>

                <div v-if="selectedEndpoint.body" class="mb-4">
                  <p class="text-xs font-semibold text-gray-600 mb-2">Cuerpo de la solicitud</p>
                  <pre class="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto">{{ selectedEndpoint.body }}</pre>
                </div>

                <div v-if="selectedEndpoint.curl" class="mb-5">
                  <p class="text-xs font-semibold text-gray-600 mb-2">Ejemplo cURL</p>
                  <pre class="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto whitespace-pre-wrap">{{ selectedEndpoint.curl }}</pre>
                </div>

                <!-- Try it -->
                <div class="border-t border-gray-100 pt-4">
                  <AppButton variant="secondary" :loading="tryLoading" @click="tryIt" class="mb-3">Probar</AppButton>
                  <pre v-if="tryResponse" class="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto max-h-48">{{ tryResponse }}</pre>
                </div>
              </AppCard>
            </div>
          </div>
        </template>
      </div>
    </div>
  </AppShell>
</template>

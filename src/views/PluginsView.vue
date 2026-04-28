<script setup>
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
</script>

<template>
  <AppShell title="Plugins e integraciones">
    <div class="max-w-2xl space-y-6">
      <!-- WooCommerce -->
      <AppCard>
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <span class="text-2xl">🛒</span>
          </div>
          <div class="flex-1">
            <h2 class="text-base font-semibold text-gray-900">WooCommerce</h2>
            <p class="text-sm text-gray-500 mt-0.5 mb-4">Acepte SINPE Móvil y tarjetas en su tienda WordPress usando el plugin oficial de Onvopay.</p>

            <ol class="flex flex-col gap-4 text-sm">
              <li class="flex gap-3">
                <span class="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p class="font-medium text-gray-900">Instalar el plugin de Onvopay</p>
                  <p class="text-gray-500 mt-0.5">En su WordPress: <strong>Plugins → Añadir nuevo</strong> → busque "ONVO Pay".</p>
                  <a href="https://wordpress.org/plugins/onvo-pay/" target="_blank" rel="noopener"
                    class="inline-flex items-center gap-1 text-primary text-xs font-medium mt-1 hover:underline">
                    wordpress.org/plugins/onvo-pay
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  </a>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p class="font-medium text-gray-900">Configurar con llaves de Onvopay</p>
                  <p class="text-gray-500 mt-0.5">El plugin usa sus llaves de Onvopay directamente (no las de SINPEpay). Obténgalas en el <a href="https://dashboard.onvopay.com" target="_blank" rel="noopener" class="text-primary hover:underline">panel de Onvopay</a>.</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p class="font-medium text-gray-900">Activar SINPE Móvil</p>
                  <p class="text-gray-500 mt-0.5">En WooCommerce → <strong>Ajustes → Pagos</strong> → active "ONVO Pay — SINPE Móvil".</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                <div>
                  <p class="font-medium text-gray-900">Probar con ₡100</p>
                  <p class="text-gray-500 mt-0.5">Realice un pedido de prueba en modo sandbox con las llaves <code class="bg-gray-100 px-1 rounded text-xs">onvo_test_*</code>.</p>
                </div>
              </li>
              <li class="flex gap-3">
                <span class="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">5</span>
                <div>
                  <p class="font-medium text-gray-900">Activar en producción</p>
                  <p class="text-gray-500 mt-0.5">Cambie a llaves <code class="bg-gray-100 px-1 rounded text-xs">onvo_live_*</code> cuando esté listo.</p>
                </div>
              </li>
            </ol>
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

      <!-- Tiendanube -->
      <AppCard>
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <span class="text-2xl">☁️</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h2 class="text-base font-semibold text-gray-900">Tiendanube</h2>
              <span class="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Próximamente</span>
            </div>
            <p class="text-sm text-gray-500">Onvopay tiene integración con Tiendanube en proceso. Consulte la documentación de Onvopay para novedades.</p>
          </div>
        </div>
      </AppCard>
    </div>
  </AppShell>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const show = ref(false)
let deferredPrompt = null

onMounted(() => {
  // Only show after 3+ visits and not yet installed
  const visits = Number(localStorage.getItem('sinpepay_visits') ?? 0) + 1
  localStorage.setItem('sinpepay_visits', visits)
  const dismissed = localStorage.getItem('sinpepay_install_dismissed')
  if (visits >= 3 && !dismissed) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e
      show.value = true
    })
  }
})

async function install() {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  show.value = false
  deferredPrompt = null
}

function dismiss() {
  show.value = false
  localStorage.setItem('sinpepay_install_dismissed', '1')
}
</script>

<template>
  <Transition enter-active-class="transition-all duration-300" enter-from-class="translate-y-full opacity-0" leave-active-class="transition-all duration-200" leave-to-class="translate-y-full opacity-0">
    <div v-if="show" class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-4">
      <button @click="dismiss" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
      <div class="flex items-start gap-3 pr-4">
        <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          </div>
        <div>
          <p class="font-semibold text-gray-900 dark:text-white text-sm">Instale SINPEpay</p>
          <p class="text-xs text-gray-500 mt-0.5">Acceso rápido y funciona sin internet en el punto de venta</p>
        </div>
      </div>
      <div class="flex gap-2 mt-3">
        <button @click="dismiss" class="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs">Ahora no</button>
        <button @click="install" class="flex-1 btn-primary text-xs">Instalar</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const password = ref('')
const confirm = ref('')
const errorMsg = ref('')
const success = ref(false)
const saving = ref(false)
const ready = ref(false)
const invalid = ref(false)

let subscription = null

onMounted(() => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' && session) {
      ready.value = true
    }
  })
  subscription = data.subscription

  // If no PASSWORD_RECOVERY event fires within 4 seconds the link is stale/invalid
  setTimeout(() => { if (!ready.value) invalid.value = true }, 4000)
})

onUnmounted(() => { subscription?.unsubscribe() })

async function submit() {
  errorMsg.value = ''
  if (password.value.length < 8) { errorMsg.value = 'Mínimo 8 caracteres'; return }
  if (password.value !== confirm.value) { errorMsg.value = 'Las contraseñas no coinciden'; return }
  saving.value = true
  const { error } = await supabase.auth.updateUser({ password: password.value })
  saving.value = false
  if (error) { errorMsg.value = error.message; return }
  success.value = true
  await supabase.auth.signOut()
  setTimeout(() => router.push('/login'), 2000)
}
</script>

<template>
  <div class="min-h-screen bg-surface flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <img src="/mainlogo.png" alt="SINPEpay" class="w-40 h-auto mx-auto mb-3 dark:hidden" />
        <img src="/lightlogo.png" alt="SINPEpay" class="w-40 h-auto mx-auto mb-3 hidden dark:block" />
        <h1 class="text-xl font-semibold text-gray-900">Nueva contraseña</h1>
      </div>

      <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm">

        <!-- Waiting for recovery token -->
        <div v-if="!ready && !invalid" class="text-center py-6 text-gray-400 text-sm">
          Verificando enlace...
        </div>

        <!-- Invalid / expired link -->
        <div v-else-if="invalid" class="text-center py-4">
          <p class="text-sm text-red-600">El enlace de recuperación expiró o es inválido.</p>
          <AppButton variant="ghost" class="mt-4" @click="router.push('/login')">Volver al inicio</AppButton>
        </div>

        <!-- Success -->
        <div v-else-if="success" class="text-center py-4">
          <div class="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p class="text-sm font-medium text-gray-900">Contraseña actualizada</p>
          <p class="text-xs text-gray-500 mt-1">Redirigiendo al inicio de sesión...</p>
        </div>

        <!-- Form -->
        <div v-else class="flex flex-col gap-4">
          <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ errorMsg }}</p>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Nueva contraseña</label>
            <input
              v-model="password"
              type="password"
              maxlength="128"
              placeholder="Mínimo 8 caracteres"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
            <input
              v-model="confirm"
              type="password"
              maxlength="128"
              placeholder="Repita la contraseña"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <AppButton variant="primary" :loading="saving" @click="submit">
            Cambiar contraseña
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

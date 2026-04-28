<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = ref({ email: '', password: '' })
const errors = ref({})
const loading = ref(false)
const resetSent = ref(false)
const showReset = ref(false)
const resetEmail = ref('')

async function login() {
  errors.value = {}
  if (!form.value.email) errors.value.email = 'Ingrese su correo'
  if (!form.value.password) errors.value.password = 'Ingrese su contraseña'
  if (Object.keys(errors.value).length) return

  loading.value = true
  const { error } = await auth.signIn(form.value.email, form.value.password)
  loading.value = false

  if (error) {
    errors.value.general = 'Correo o contraseña incorrectos'
    return
  }
  const redirect = route.query.redirect || '/dashboard'
  router.push(redirect)
}

async function sendReset() {
  if (!resetEmail.value) return
  const { error } = await auth.sendPasswordReset(resetEmail.value)
  if (!error) resetSent.value = true
}
</script>

<template>
  <div class="min-h-screen bg-surface flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <img src="/mainlogo.png" alt="SINPEpay" class="h-12 w-auto mx-auto mb-3" />
        <h1 class="text-2xl font-semibold text-gray-900">SINPEpay</h1>
        <p class="text-gray-500 text-sm mt-1">Ingrese a su cuenta</p>
      </div>

      <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div v-if="!showReset" class="flex flex-col gap-4">
          <div v-if="errors.general" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-600">
            {{ errors.general }}
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              placeholder="correo@ejemplo.com"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
              :class="{ 'border-red-400': errors.email }"
              @keyup.enter="login"
            />
            <p v-if="errors.email" class="text-xs text-red-500 mt-1">{{ errors.email }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
            <input
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
              :class="{ 'border-red-400': errors.password }"
              @keyup.enter="login"
            />
            <p v-if="errors.password" class="text-xs text-red-500 mt-1">{{ errors.password }}</p>
          </div>
          <AppButton variant="primary" class="w-full" :loading="loading" @click="login">
            Ingresar
          </AppButton>
          <button class="text-xs text-primary hover:underline text-center" @click="showReset = true">
            Olvidé mi contraseña
          </button>
        </div>

        <div v-else class="flex flex-col gap-4">
          <div v-if="resetSent" class="bg-primary-light border border-primary/20 rounded-lg px-3 py-2.5 text-sm text-primary">
            Revise su correo — le enviamos un enlace para restablecer su contraseña.
          </div>
          <div v-else>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
            <input
              v-model="resetEmail"
              type="email"
              placeholder="correo@ejemplo.com"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <AppButton v-if="!resetSent" variant="primary" class="w-full" @click="sendReset">
            Enviar enlace
          </AppButton>
          <button class="text-xs text-gray-500 hover:underline text-center" @click="showReset = false; resetSent = false">
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>

      <p class="text-center text-sm text-gray-500 mt-4">
        ¿No tiene cuenta?
        <router-link to="/register" class="text-primary font-medium hover:underline">Regístrese aquí</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ nombre: '', email: '', password: '', confirm: '' })
const errors = ref({})
const loading = ref(false)

function validate() {
  errors.value = {}
  if (!form.value.nombre.trim()) errors.value.nombre = 'Ingrese su nombre'
  if (!form.value.email) errors.value.email = 'Ingrese su correo'
  else if (!/\S+@\S+\.\S+/.test(form.value.email)) errors.value.email = 'Correo inválido'
  if (!form.value.password) errors.value.password = 'Ingrese una contraseña'
  else if (form.value.password.length < 8) errors.value.password = 'Mínimo 8 caracteres'
  if (form.value.password !== form.value.confirm) errors.value.confirm = 'Las contraseñas no coinciden'
  return Object.keys(errors.value).length === 0
}

async function register() {
  if (!validate()) return
  loading.value = true
  const { error } = await auth.signUp(form.value.email, form.value.password, form.value.nombre.trim())
  loading.value = false
  if (error) {
    errors.value.general = error.message === 'User already registered'
      ? 'Ya existe una cuenta con ese correo'
      : 'Error al registrarse. Intente de nuevo.'
    return
  }
  router.push('/onboarding')
}
</script>

<template>
  <div class="min-h-screen bg-surface flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3">
          <span class="text-white font-bold text-lg">SP</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">Crear cuenta</h1>
        <p class="text-gray-500 text-sm mt-1">Regístrese gratis — sin tarjeta requerida</p>
      </div>

      <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div v-if="errors.general" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-600">
          {{ errors.general }}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
          <input v-model="form.nombre" type="text" autocomplete="name" placeholder="Juan Vargas"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            :class="{ 'border-red-400': errors.nombre }" @keyup.enter="register" />
          <p v-if="errors.nombre" class="text-xs text-red-500 mt-1">{{ errors.nombre }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
          <input v-model="form.email" type="email" autocomplete="email" placeholder="correo@ejemplo.com"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            :class="{ 'border-red-400': errors.email }" @keyup.enter="register" />
          <p v-if="errors.email" class="text-xs text-red-500 mt-1">{{ errors.email }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
          <input v-model="form.password" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            :class="{ 'border-red-400': errors.password }" @keyup.enter="register" />
          <p v-if="errors.password" class="text-xs text-red-500 mt-1">{{ errors.password }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
          <input v-model="form.confirm" type="password" autocomplete="new-password" placeholder="Repita la contraseña"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            :class="{ 'border-red-400': errors.confirm }" @keyup.enter="register" />
          <p v-if="errors.confirm" class="text-xs text-red-500 mt-1">{{ errors.confirm }}</p>
        </div>

        <AppButton variant="primary" class="w-full" :loading="loading" @click="register">
          Crear cuenta
        </AppButton>
      </div>

      <p class="text-center text-sm text-gray-500 mt-4">
        ¿Ya tiene cuenta?
        <router-link to="/login" class="text-primary font-medium hover:underline">Ingrese aquí</router-link>
      </p>
    </div>
  </div>
</template>

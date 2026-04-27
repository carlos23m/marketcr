<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getInvitationByToken, acceptInvitation } from '@/lib/database'
import { useAuthStore } from '@/stores/useAuthStore'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const token = route.query.token
const invite = ref(null)
const loading = ref(true)
const accepting = ref(false)
const error = ref('')

const form = ref({ nombre: '', email: '', password: '', confirm: '' })
const formErrors = ref({})

onMounted(async () => {
  if (!token) { error.value = 'Enlace de invitación inválido.'; loading.value = false; return }
  const { data, error: err } = await getInvitationByToken(token)
  if (err || !data) { error.value = 'Esta invitación ya expiró o fue utilizada.'; loading.value = false; return }
  invite.value = data
  form.value.email = data.email
  loading.value = false
})

async function accept() {
  if (!auth.isLoggedIn) {
    formErrors.value = {}
    if (!form.value.nombre.trim()) formErrors.value.nombre = 'Ingrese su nombre'
    if (!form.value.password || form.value.password.length < 8) formErrors.value.password = 'Mínimo 8 caracteres'
    if (form.value.password !== form.value.confirm) formErrors.value.confirm = 'No coinciden'
    if (Object.keys(formErrors.value).length) return

    accepting.value = true
    const { error: signUpError } = await auth.signUp(form.value.email, form.value.password, form.value.nombre)
    if (signUpError) { error.value = signUpError.message; accepting.value = false; return }
  }

  accepting.value = true
  const { error: acceptErr } = await acceptInvitation(token, auth.user.id)
  if (acceptErr) { error.value = acceptErr.message; accepting.value = false; return }
  await auth.loadProfile(auth.user.id)
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-surface flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3">
          <span class="text-white font-bold text-lg">SP</span>
        </div>
        <h1 class="text-xl font-semibold text-gray-900">Invitación al equipo</h1>
      </div>

      <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div v-if="loading" class="text-center py-8 text-gray-400">Cargando...</div>

        <div v-else-if="error" class="text-center py-4">
          <p class="text-red-600 text-sm">{{ error }}</p>
          <AppButton variant="ghost" class="mt-4" @click="router.push('/login')">Ir al inicio</AppButton>
        </div>

        <div v-else class="flex flex-col gap-4">
          <div class="bg-primary-light rounded-xl p-4 text-center">
            <p class="text-sm text-gray-600">
              <strong class="text-gray-900">{{ invite.businesses.nombre }}</strong> le invita a unirse como
              <span class="font-medium text-primary capitalize">{{ invite.rol }}</span>
            </p>
          </div>

          <div v-if="!auth.isLoggedIn" class="flex flex-col gap-3">
            <p class="text-xs text-gray-500 text-center">Cree su cuenta para aceptar la invitación</p>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
              <input v-model="form.nombre" type="text" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                :class="{ 'border-red-400': formErrors.nombre }" />
              <p v-if="formErrors.nombre" class="text-xs text-red-500 mt-1">{{ formErrors.nombre }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Correo</label>
              <input :value="form.email" type="email" disabled class="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input v-model="form.password" type="password" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                :class="{ 'border-red-400': formErrors.password }" />
              <p v-if="formErrors.password" class="text-xs text-red-500 mt-1">{{ formErrors.password }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
              <input v-model="form.confirm" type="password" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                :class="{ 'border-red-400': formErrors.confirm }" />
              <p v-if="formErrors.confirm" class="text-xs text-red-500 mt-1">{{ formErrors.confirm }}</p>
            </div>
          </div>

          <AppButton variant="primary" class="w-full" :loading="accepting" @click="accept">
            {{ auth.isLoggedIn ? 'Aceptar invitación' : 'Crear cuenta y aceptar' }}
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

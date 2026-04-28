<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePaymentsStore } from '@/stores/usePaymentsStore'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const auth = useAuthStore()
const paymentsStore = usePaymentsStore()

const step = ref(1)
const saving = ref(false)

const form = ref({
  nombre: '',
  tipo: '',
  country: 'CR',
  sinpeNumero: '',
  cedulaJuridica: '',
  whatsapp: '',
})

const countries = [
  { code: 'CR', name: 'Costa Rica', available: true },
  { code: 'PA', name: 'Panamá', available: false },
  { code: 'GT', name: 'Guatemala', available: false },
  { code: 'HN', name: 'Honduras', available: false },
]

const errors = ref({})

const tipos = [
  'Restaurante / Soda', 'Artesanías', 'Freelancer / Servicios',
  'Vendedor de mercado', 'Tienda / Comercio', 'Otro',
]

function validate1() {
  errors.value = {}
  if (!form.value.nombre.trim()) errors.value.nombre = 'El nombre es obligatorio'
  if (!form.value.tipo) errors.value.tipo = 'Seleccione un tipo'
  return !Object.keys(errors.value).length
}

function validate2() {
  errors.value = {}
  const num = form.value.sinpeNumero.replace(/\D/g, '')
  if (!num || num.length !== 8) errors.value.sinpeNumero = 'Ingrese un número válido de 8 dígitos'
  return !Object.keys(errors.value).length
}

function next() {
  if (step.value === 1 && !validate1()) return
  if (step.value === 2 && !validate2()) return
  step.value++
}

function formatPhone(e) {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
  form.value.sinpeNumero = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits
}

async function finish() {
  saving.value = true
  const { error } = await auth.setupBusiness(form.value)
  if (error) {
    errors.value.general = error.message || 'Error al guardar. Intente de nuevo.'
    saving.value = false
    return
  }
  await paymentsStore.fetchLinks()
  paymentsStore.subscribeRealtime()
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-surface dark:bg-gray-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <img src="/mainlogo.png" alt="SINPEpay" class="w-56 h-auto mx-auto mb-3 dark:hidden" />
        <img src="/lightlogo.png" alt="SINPEpay" class="w-56 h-auto mx-auto mb-3 hidden dark:block" />
        <h1 class="text-2xl font-semibold text-gray-900">Configure su negocio</h1>
        <p class="text-gray-500 text-sm mt-1">Solo toma 2 minutos</p>
      </div>

      <div class="flex gap-2 mb-6">
        <div v-for="i in 3" :key="i" :class="['h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-gray-200']" />
      </div>

      <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <p v-if="errors.general" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{{ errors.general }}</p>

        <!-- Step 1 -->
        <div v-if="step === 1" class="flex flex-col gap-4">
          <h2 class="text-base font-semibold text-gray-900">Sobre su negocio</h2>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre del negocio *</label>
            <input v-model="form.nombre" type="text" placeholder="Ej: Soda Doña Carmen"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              :class="{ 'border-red-400': errors.nombre }" />
            <p v-if="errors.nombre" class="text-xs text-red-500 mt-1">{{ errors.nombre }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Tipo de negocio *</label>
            <select v-model="form.tipo"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              :class="{ 'border-red-400': errors.tipo }">
              <option value="" disabled>Seleccione...</option>
              <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
            </select>
            <p v-if="errors.tipo" class="text-xs text-red-500 mt-1">{{ errors.tipo }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">País *</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="c in countries"
                :key="c.code"
                type="button"
                :disabled="!c.available"
                @click="c.available && (form.country = c.code)"
                :class="[
                  'relative flex flex-col items-center justify-center rounded-lg border py-3 px-2 text-sm transition-colors',
                  form.country === c.code ? 'border-primary bg-primary/5 text-primary font-semibold' : 'border-gray-200 text-gray-700',
                  !c.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/40',
                ]"
              >
                <span class="font-medium">{{ c.name }}</span>
                <span v-if="!c.available" class="text-[10px] text-amber-600 font-normal mt-0.5">Próximamente</span>
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Cédula jurídica <span class="text-gray-400 font-normal">(opcional)</span></label>
            <input v-model="form.cedulaJuridica" type="text" placeholder="3-XXX-XXXXXX"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
        </div>

        <!-- Step 2 -->
        <div v-if="step === 2" class="flex flex-col gap-4">
          <h2 class="text-base font-semibold text-gray-900">Número SINPE</h2>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Número SINPE Móvil *</label>
            <input :value="form.sinpeNumero" type="tel" placeholder="8888-8888"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              :class="{ 'border-red-400': errors.sinpeNumero }" @input="formatPhone" />
            <p v-if="errors.sinpeNumero" class="text-xs text-red-500 mt-1">{{ errors.sinpeNumero }}</p>
            <p class="text-xs text-gray-400 mt-1">Número al que recibirá los pagos</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp <span class="text-gray-400 font-normal">(para notificaciones)</span></label>
            <input v-model="form.whatsapp" type="tel" placeholder="8888-8888"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
        </div>

        <!-- Step 3 -->
        <div v-if="step === 3" class="flex flex-col items-center text-center gap-3">
          <h2 class="text-base font-semibold text-gray-900">¡Todo listo!</h2>
          <div class="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center">
            <svg class="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <p class="text-sm text-gray-500">Su cuenta SINPEpay está lista para recibir cobros.</p>
          <div class="bg-surface rounded-xl p-4 w-full text-left mt-1">
            <div class="flex justify-between text-sm mb-2"><span class="text-gray-500">Negocio</span><span class="font-medium text-gray-900">{{ form.nombre }}</span></div>
            <div class="flex justify-between text-sm mb-2"><span class="text-gray-500">Tipo</span><span class="font-medium text-gray-900">{{ form.tipo }}</span></div>
            <div class="flex justify-between text-sm mb-2"><span class="text-gray-500">País</span><span class="font-medium text-gray-900">{{ countries.find(c => c.code === form.country)?.name }}</span></div>
            <div class="flex justify-between text-sm"><span class="text-gray-500">SINPE</span><span class="font-medium text-gray-900">{{ form.sinpeNumero }}</span></div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <AppButton v-if="step > 1" variant="ghost" @click="step--">Atrás</AppButton>
          <AppButton v-if="step < 3" variant="primary" class="flex-1" @click="next">Continuar</AppButton>
          <AppButton v-if="step === 3" variant="primary" class="flex-1" :loading="saving" @click="finish">
            Ir al panel principal
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

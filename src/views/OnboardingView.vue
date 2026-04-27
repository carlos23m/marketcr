<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const auth = useAuthStore()

const step = ref(1)
const saving = ref(false)

const form = ref({
  nombre: '',
  tipo: '',
  sinpeNumero: '',
  cedulaJuridica: '',
  whatsapp: '',
})

const errors = ref({})

const tipos = [
  'Restaurante / Soda',
  'Artesanías',
  'Freelancer / Servicios',
  'Vendedor de mercado',
  'Tienda / Comercio',
  'Otro',
]

const stepTitles = ['Sobre su negocio', 'Número SINPE', 'Listo para comenzar']

function validate1() {
  errors.value = {}
  if (!form.value.nombre.trim()) errors.value.nombre = 'El nombre es obligatorio'
  if (!form.value.tipo) errors.value.tipo = 'Seleccione un tipo'
  return Object.keys(errors.value).length === 0
}

function validate2() {
  errors.value = {}
  const num = form.value.sinpeNumero.replace(/\D/g, '')
  if (!num || num.length !== 8) errors.value.sinpeNumero = 'Ingrese un número válido de 8 dígitos'
  return Object.keys(errors.value).length === 0
}

function next() {
  if (step.value === 1 && !validate1()) return
  if (step.value === 2 && !validate2()) return
  step.value++
}

function prev() {
  step.value--
}

function formatPhone(e) {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
  form.value.sinpeNumero = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits
}

async function finish() {
  saving.value = true
  await new Promise(r => setTimeout(r, 600))
  auth.saveProfile({
    nombre: form.value.nombre.trim(),
    tipo: form.value.tipo,
    sinpeNumero: form.value.sinpeNumero,
    cedulaJuridica: form.value.cedulaJuridica || null,
    whatsapp: form.value.whatsapp || null,
    moneda: 'CRC',
  })
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-surface flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3">
          <span class="text-white font-bold text-lg">SP</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">SINPEpay</h1>
        <p class="text-gray-500 text-sm mt-1">Configure su negocio para comenzar</p>
      </div>

      <!-- Progress -->
      <div class="flex items-center gap-2 mb-8">
        <div v-for="i in 3" :key="i" :class="['h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-gray-200']" />
      </div>

      <div class="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 class="text-base font-semibold text-gray-900 mb-5">{{ stepTitles[step - 1] }}</h2>

        <!-- Step 1 -->
        <div v-if="step === 1" class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre del negocio</label>
            <input
              v-model="form.nombre"
              type="text"
              placeholder="Ej: Soda Doña Carmen"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
              :class="{ 'border-red-400': errors.nombre }"
            />
            <p v-if="errors.nombre" class="text-xs text-red-500 mt-1">{{ errors.nombre }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Tipo de negocio</label>
            <select
              v-model="form.tipo"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
              :class="{ 'border-red-400': errors.tipo }"
            >
              <option value="" disabled>Seleccione...</option>
              <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
            </select>
            <p v-if="errors.tipo" class="text-xs text-red-500 mt-1">{{ errors.tipo }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Cédula jurídica <span class="text-gray-400 font-normal">(opcional)</span></label>
            <input
              v-model="form.cedulaJuridica"
              type="text"
              placeholder="3-XXX-XXXXXX"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
            />
          </div>
        </div>

        <!-- Step 2 -->
        <div v-if="step === 2" class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Número SINPE Móvil</label>
            <input
              :value="form.sinpeNumero"
              type="tel"
              placeholder="8888-8888"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
              :class="{ 'border-red-400': errors.sinpeNumero }"
              @input="formatPhone"
            />
            <p v-if="errors.sinpeNumero" class="text-xs text-red-500 mt-1">{{ errors.sinpeNumero }}</p>
            <p class="text-xs text-gray-400 mt-1.5">Este es el número al que recibirá los pagos por SINPE Móvil</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp para alertas <span class="text-gray-400 font-normal">(opcional)</span></label>
            <input
              :value="form.whatsapp"
              type="tel"
              placeholder="8888-8888"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
              @input="e => form.whatsapp = e.target.value"
            />
          </div>
        </div>

        <!-- Step 3 -->
        <div v-if="step === 3" class="flex flex-col items-center text-center gap-3">
          <div class="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center">
            <svg class="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-gray-900">¡Todo listo, {{ form.nombre }}!</p>
            <p class="text-sm text-gray-500 mt-1">Su cuenta SINPEpay está configurada y lista para recibir cobros.</p>
          </div>
          <div class="bg-surface rounded-xl p-4 w-full text-left mt-2">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-500">Negocio</span>
              <span class="font-medium text-gray-900">{{ form.nombre }}</span>
            </div>
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-500">Tipo</span>
              <span class="font-medium text-gray-900">{{ form.tipo }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">SINPE</span>
              <span class="font-medium text-gray-900">{{ form.sinpeNumero }}</span>
            </div>
          </div>
        </div>

        <!-- Nav buttons -->
        <div class="flex gap-3 mt-6">
          <AppButton v-if="step > 1" variant="ghost" @click="prev">Atrás</AppButton>
          <AppButton v-if="step < 3" variant="primary" class="flex-1" @click="next">Continuar</AppButton>
          <AppButton v-if="step === 3" variant="primary" class="flex-1" :loading="saving" @click="finish">
            Ir al panel principal
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

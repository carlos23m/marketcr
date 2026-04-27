import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const profile = useLocalStorage('sinpepay_profile', {
    nombre: '',
    tipo: '',
    sinpeNumero: '',
    cedulaJuridica: null,
    whatsapp: null,
    moneda: 'CRC',
    setupCompletado: false,
  })

  const isSetup = computed(() => profile.value.setupCompletado)

  function saveProfile(data) {
    Object.assign(profile.value, data, { setupCompletado: true })
  }

  function clearProfile() {
    profile.value = {
      nombre: '',
      tipo: '',
      sinpeNumero: '',
      cedulaJuridica: null,
      whatsapp: null,
      moneda: 'CRC',
      setupCompletado: false,
    }
  }

  return { profile, isSetup, saveProfile, clearProfile }
})

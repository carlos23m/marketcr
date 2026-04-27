import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { getProfile, createProfile, createBusiness, updateBusiness, updateProfile } from '@/lib/database'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const business = ref(null)
  const loading = ref(true)

  const isLoggedIn = computed(() => !!user.value)
  const isSetup = computed(() => !!business.value?.id)
  const rol = computed(() => profile.value?.rol || 'dueno')

  async function init() {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      user.value = session.user
      await loadProfile(session.user.id)
    }
    loading.value = false

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        profile.value = null
        business.value = null
      }
    })
  }

  async function loadProfile(userId) {
    const { data } = await getProfile(userId)
    if (data) {
      profile.value = data
      business.value = data.businesses || null
    }
  }

  async function signUp(email, password, nombre) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    })
    if (error) return { error }
    if (data.user) {
      user.value = data.user
      if (data.session) await loadProfile(data.user.id)
    }
    return { data, error: null }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }
    user.value = data.user
    await loadProfile(data.user.id)
    return { data, error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
    business.value = null
  }

  async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  async function setupBusiness(data) {
    if (!user.value) return { error: new Error('No autenticado') }
    const { data: biz, error } = await createBusiness({
      nombre: data.nombre,
      tipo: data.tipo,
      sinpe_numero: data.sinpeNumero,
      cedula_juridica: data.cedulaJuridica || null,
      whatsapp: data.whatsapp || null,
      email: user.value.email,
    })
    if (error) return { error }
    await updateProfile(user.value.id, { business_id: biz.id })
    business.value = biz
    return { data: biz, error: null }
  }

  async function updateBusinessProfile(data) {
    if (!business.value?.id) return { error: new Error('Sin negocio') }
    const { data: updated, error } = await updateBusiness(business.value.id, {
      nombre: data.nombre,
      tipo: data.tipo,
      sinpe_numero: data.sinpeNumero,
      cedula_juridica: data.cedulaJuridica || null,
      whatsapp: data.whatsapp || null,
    })
    if (!error) business.value = updated
    return { data: updated, error }
  }

  return {
    user, profile, business, loading,
    isLoggedIn, isSetup, rol,
    init, signUp, signIn, signOut, sendPasswordReset,
    setupBusiness, updateBusinessProfile, loadProfile,
  }
})

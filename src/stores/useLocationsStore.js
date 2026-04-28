import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'

export const useLocationsStore = defineStore('locations', () => {
  const locations = ref([])
  const selectedLocationId = ref(null) // null = all locations
  const loading = ref(false)

  function businessId() { return useAuthStore().business?.id }

  const selectedLocation = computed(() =>
    selectedLocationId.value ? locations.value.find(l => l.id === selectedLocationId.value) ?? null : null
  )

  const mainLocation = computed(() => locations.value.find(l => l.is_main) ?? null)

  async function fetchLocations() {
    const bid = businessId()
    if (!bid) return
    loading.value = true
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('business_id', bid)
      .order('is_main', { ascending: false })
      .order('nombre')
    if (data) locations.value = data
    loading.value = false
  }

  async function saveLocation(payload) {
    const bid = businessId()
    if (!bid) return null
    const isNew = !payload.id

    if (payload.is_main) {
      // Clear existing main
      await supabase.from('locations').update({ is_main: false }).eq('business_id', bid)
    }

    let data, error
    if (isNew) {
      ;({ data, error } = await supabase.from('locations').insert({ business_id: bid, ...payload }).select().single())
      if (data) locations.value.push(data)
    } else {
      const { id, ...rest } = payload
      ;({ data, error } = await supabase.from('locations').update(rest).eq('id', id).eq('business_id', bid).select().single())
      if (data) { const idx = locations.value.findIndex(l => l.id === id); if (idx !== -1) locations.value[idx] = data }
    }

    // Re-apply is_main state from DB
    if (data?.is_main) {
      locations.value.forEach(l => { if (l.id !== data.id) l.is_main = false })
    }

    return { data, error }
  }

  async function deleteLocation(id) {
    const { error } = await supabase.from('locations').delete().eq('id', id).eq('business_id', businessId())
    if (!error) {
      locations.value = locations.value.filter(l => l.id !== id)
      if (selectedLocationId.value === id) selectedLocationId.value = null
    }
    return { error }
  }

  async function assignStaff(locationId, profileIds) {
    await supabase.from('profile_locations').delete().eq('location_id', locationId)
    if (profileIds.length) {
      await supabase.from('profile_locations').insert(profileIds.map(id => ({ profile_id: id, location_id: locationId })))
    }
  }

  function selectLocation(id) {
    selectedLocationId.value = id
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('sinpepay_location', id ?? '')
  }

  function restoreLocation() {
    const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sinpepay_location') : null
    if (saved && locations.value.some(l => l.id === saved)) selectedLocationId.value = saved
  }

  return {
    locations, selectedLocationId, selectedLocation, mainLocation, loading,
    fetchLocations, saveLocation, deleteLocation, assignStaff, selectLocation, restoreLocation,
  }
})

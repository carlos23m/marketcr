import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useApiKeysStore = defineStore('apiKeys', () => {
  const keys = ref([])
  const loading = ref(false)
  const newKeySecret = ref(null)  // shown once after creation

  async function authHeader() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? `Bearer ${session.access_token}` : ''
  }

  async function fetchKeys() {
    loading.value = true
    const res = await fetch('/api/v1/keys', {
      headers: { Authorization: await authHeader() },
    })
    if (res.ok) keys.value = await res.json().then(d => d.data ?? [])
    loading.value = false
  }

  async function createKey(name, permissions = ['links:read', 'txns:read'], environment = 'live') {
    const res = await fetch('/api/v1/keys', {
      method: 'POST',
      headers: { Authorization: await authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, permissions, environment }),
    })
    const data = await res.json()
    if (data?.data) {
      newKeySecret.value = data.data.key
      keys.value.unshift({ ...data.data, key: undefined })
    }
    return data
  }

  async function revokeKey(id) {
    await fetch(`/api/v1/keys/${id}`, {
      method: 'DELETE',
      headers: { Authorization: await authHeader() },
    })
    keys.value = keys.value.filter(k => k.id !== id)
  }

  function clearNewKey() { newKeySecret.value = null }

  return { keys, loading, newKeySecret, fetchKeys, createKey, revokeKey, clearNewKey }
})

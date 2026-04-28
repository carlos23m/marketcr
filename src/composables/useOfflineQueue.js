// IndexedDB-backed queue for POS offline operations
import { ref, onMounted, watch } from 'vue'
import { useOnline } from '@vueuse/core'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { usePaymentsStore } from '@/stores/usePaymentsStore'
import { useToastStore } from '@/stores/useToastStore'

const DB_NAME  = 'sinpepay_offline'
const DB_VER   = 1
const STORE_NAME = 'link_queue'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'localId', autoIncrement: true })
      }
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

async function idbGetAll() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx   = db.transaction(STORE_NAME, 'readonly')
    const req  = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

async function idbAdd(item) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).add(item)
    req.onsuccess = e => resolve(e.target.result)
    req.onerror   = e => reject(e.target.error)
  })
}

async function idbDelete(localId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).delete(localId)
    req.onsuccess = () => resolve()
    req.onerror   = e => reject(e.target.error)
  })
}

export function useOfflineQueue() {
  const isOnline  = useOnline()
  const queue     = ref([])
  const syncing   = ref(false)

  async function loadQueue() {
    try { queue.value = await idbGetAll() } catch { queue.value = [] }
  }

  async function enqueue(linkPayload) {
    const item = { ...linkPayload, queuedAt: new Date().toISOString(), status: 'offline' }
    try {
      const localId = await idbAdd(item)
      queue.value.push({ ...item, localId })
    } catch { /* storage not available */ }
  }

  async function flush() {
    if (syncing.value || !isOnline.value) return
    syncing.value = true
    const items = await idbGetAll()
    const paymentsStore = usePaymentsStore()
    const toastStore = useToastStore()
    let synced = 0

    for (const item of items) {
      try {
        const { localId, queuedAt, status, ...payload } = item
        const result = await paymentsStore.createLink(payload)
        if (result) {
          await idbDelete(localId)
          queue.value = queue.value.filter(q => q.localId !== localId)
          synced++
        }
      } catch { /* individual item failed — leave in queue */ }
    }

    if (synced > 0) {
      toastStore.show(`Conexión restaurada · ${synced} cobro${synced !== 1 ? 's' : ''} sincronizado${synced !== 1 ? 's' : ''}`, 'success')
    }
    syncing.value = false
  }

  onMounted(() => {
    loadQueue()
    // Auto-flush when going online
    watch(isOnline, (online) => { if (online) flush() })
  })

  return { queue, syncing, isOnline, enqueue, flush, loadQueue }
}

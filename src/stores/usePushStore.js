import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'

// VAPID public key — set in .env.local as VITE_VAPID_PUBLIC_KEY
const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export const usePushStore = defineStore('push', () => {
  const supported   = ref('serviceWorker' in navigator && 'PushManager' in window)
  const permission  = ref(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const subscribed  = ref(false)
  const prefs       = ref({ payments: true, invoices: true, daily_summary: false, plan_reminders: true })
  const loading     = ref(false)

  async function requestPermission() {
    if (!supported.value) return false
    const result = await Notification.requestPermission()
    permission.value = result
    if (result === 'granted') await subscribe()
    return result === 'granted'
  }

  async function subscribe() {
    if (!supported.value || !VAPID_KEY) return
    loading.value = true
    try {
      const reg  = await navigator.serviceWorker.ready
      const sub  = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      })
      const json = sub.toJSON()
      const profileId = useAuthStore().profile?.id
      if (profileId) {
        const { error } = await supabase.from('push_subscriptions').upsert({
          profile_id: profileId,
          endpoint:   json.endpoint,
          p256dh:     json.keys?.p256dh ?? '',
          auth:       json.keys?.auth ?? '',
          user_agent: navigator.userAgent.slice(0, 200),
          prefs:      prefs.value,
        }, { onConflict: 'endpoint' })
        subscribed.value = !error
      }
    } catch { /* permission denied or browser error */ }
    loading.value = false
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    }
    subscribed.value = false
  }

  async function updatePrefs(newPrefs) {
    prefs.value = { ...prefs.value, ...newPrefs }
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await supabase.from('push_subscriptions').update({ prefs: prefs.value }).eq('endpoint', sub.endpoint)
    }
  }

  async function checkSubscription() {
    if (!supported.value) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    subscribed.value = !!sub
    if (sub) {
      const { data } = await supabase.from('push_subscriptions').select('prefs').eq('endpoint', sub.endpoint).maybeSingle()
      if (data?.prefs) prefs.value = data.prefs
    }
  }

  async function sendTest() {
    await supabase.functions.invoke('send-push', {
      body: {
        profile_id: useAuthStore().profile?.id,
        type: 'payment',
        title: 'SINPEpay',
        body: 'Notificaciones activas en este dispositivo',
      },
    })
  }

  return { supported, permission, subscribed, prefs, loading, requestPermission, subscribe, unsubscribe, updatePrefs, checkSubscription, sendTest }
})

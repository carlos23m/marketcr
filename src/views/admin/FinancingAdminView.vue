<script setup>
import { ref, onMounted } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { formatCRC } from '@/utils/currency'
import { useRouter } from 'vue-router'

const auth = useRouter()
const router = useRouter()
const applications = ref([])
const loading = ref(false)
const selected = ref(null)
const actionType = ref(null) // 'approve' | 'reject'
const form = ref({ amount_approved: '', reviewer_notes: '', rejection_reason: '' })
const saving = ref(false)

onMounted(async () => {
  // Guard: admin only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.replace('/login'); return }
  const { data: profile } = await supabase.from('profiles').select('is_sinpepay_admin').eq('id', user.id).single()
  if (!profile?.is_sinpepay_admin) { router.replace('/dashboard'); return }
  await fetchAll()
})

async function fetchAll() {
  loading.value = true
  const { data } = await supabase
    .from('financing_applications')
    .select('*, businesses(nombre)')
    .order('created_at', { ascending: false })
  if (data) applications.value = data
  loading.value = false
}

function openAction(app, type) {
  selected.value = app
  actionType.value = type
  form.value = { amount_approved: app.amount_requested, reviewer_notes: '', rejection_reason: '' }
}

async function submitAction() {
  if (!selected.value) return
  saving.value = true
  const updates = actionType.value === 'approve'
    ? { status: 'approved', amount_approved: Number(form.value.amount_approved), reviewer_notes: form.value.reviewer_notes }
    : { status: 'rejected', rejection_reason: form.value.rejection_reason, reviewer_notes: form.value.reviewer_notes }
  await supabase.from('financing_applications').update(updates).eq('id', selected.value.id)
  selected.value = null
  saving.value = false
  await fetchAll()
}

function statusColor(s) {
  return { pending:'bg-yellow-100 text-yellow-700', under_review:'bg-blue-100 text-blue-700',
    approved:'bg-green-100 text-green-700', rejected:'bg-red-100 text-red-700',
    disbursed:'bg-purple-100 text-purple-700', repaid:'bg-gray-100 text-gray-600' }[s] ?? ''
}
</script>

<template>
  <AppShell>
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin — Solicitudes de adelanto</h1>

      <div v-if="loading" class="text-center py-12 text-gray-400 text-sm">Cargando…</div>
      <div v-else class="space-y-3">
        <AppCard v-for="app in applications" :key="app.id" class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="font-medium text-gray-900 dark:text-white">{{ app.businesses?.nombre ?? app.business_id }}</p>
            <p class="text-sm text-gray-500 mt-0.5">{{ formatCRC(app.amount_requested) }} · {{ app.purpose?.slice(0,60) }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ new Date(app.created_at).toLocaleString('es-CR') }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span :class="['text-xs font-medium px-2.5 py-1 rounded-full', statusColor(app.status)]">{{ app.status }}</span>
            <template v-if="app.status === 'pending' || app.status === 'under_review'">
              <button @click="openAction(app, 'approve')" class="btn-primary text-xs">Aprobar</button>
              <button @click="openAction(app, 'reject')" class="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-xs hover:bg-red-50 transition-colors">Rechazar</button>
            </template>
          </div>
        </AppCard>
      </div>

      <AppModal v-if="selected" @close="selected = null">
        <div class="p-6 w-full max-w-md">
          <h2 class="font-semibold text-gray-900 dark:text-white mb-4">
            {{ actionType === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud' }}
          </h2>
          <div class="space-y-4">
            <template v-if="actionType === 'approve'">
              <div>
                <label class="form-label">Monto aprobado (₡)</label>
                <input v-model="form.amount_approved" type="number" class="form-input" />
              </div>
              <div>
                <label class="form-label">Notas internas</label>
                <textarea v-model="form.reviewer_notes" rows="3" class="form-input" />
              </div>
            </template>
            <template v-else>
              <div>
                <label class="form-label">Razón de rechazo (visible al cliente)</label>
                <textarea v-model="form.rejection_reason" rows="3" class="form-input" placeholder="Ej: Historial de transacciones insuficiente" />
              </div>
              <div>
                <label class="form-label">Notas internas</label>
                <textarea v-model="form.reviewer_notes" rows="2" class="form-input" />
              </div>
            </template>
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="selected = null" class="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm">Cancelar</button>
            <button @click="submitAction" :disabled="saving" class="flex-1 btn-primary text-sm">
              {{ saving ? 'Guardando…' : actionType === 'approve' ? 'Confirmar aprobación' : 'Confirmar rechazo' }}
            </button>
          </div>
        </div>
      </AppModal>
    </div>
  </AppShell>
</template>

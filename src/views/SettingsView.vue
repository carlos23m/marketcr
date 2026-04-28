<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToastStore } from '@/stores/useToastStore'
import { usePermissions } from '@/composables/usePermissions'
import { getTeamMembers, getInvitations, createInvitation, cancelInvitation } from '@/lib/database'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const auth = useAuthStore()
const toastStore = useToastStore()
const { can, isDueno } = usePermissions()

const saving = ref(false)
const teamMembers = ref([])
const invitations = ref([])
const inviteModal = ref(false)
const inviteForm = ref({ email: '', rol: 'cajero' })
const inviteSending = ref(false)

const form = ref({
  nombre: auth.business?.nombre || '',
  tipo: auth.business?.tipo || '',
  sinpeNumero: auth.business?.sinpe_numero || '',
  cedulaJuridica: auth.business?.cedula_juridica || '',
  whatsapp: auth.business?.whatsapp || '',
})

const tipos = ['Restaurante / Soda', 'Artesanías', 'Freelancer / Servicios', 'Vendedor de mercado', 'Tienda / Comercio', 'Otro']

onMounted(async () => {
  if (isDueno.value && auth.business?.id) {
    const [{ data: members }, { data: invites }] = await Promise.all([
      getTeamMembers(auth.business.id),
      getInvitations(auth.business.id),
    ])
    teamMembers.value = members || []
    invitations.value = invites || []
  }
})

function formatPhone(e) {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
  form.value.sinpeNumero = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits
}

async function save() {
  saving.value = true
  const { error } = await auth.updateBusinessProfile(form.value)
  saving.value = false
  if (error) { toastStore.show('Error al guardar', 'error'); return }
  toastStore.show('Perfil actualizado')
}

async function sendInvite() {
  if (!inviteForm.value.email) return
  inviteSending.value = true
  const { data: invite, error } = await createInvitation({
    business_id: auth.business.id,
    email: inviteForm.value.email,
    rol: inviteForm.value.rol,
  })
  if (!error && invite) {
    await supabase.functions.invoke('send-invitation', { body: { invitation_id: invite.id } })
    invitations.value.unshift(invite)
    toastStore.show('Invitación enviada')
    inviteModal.value = false
    inviteForm.value = { email: '', rol: 'cajero' }
  } else {
    toastStore.show('Error al enviar la invitación', 'error')
  }
  inviteSending.value = false
}

async function cancelInvite(id) {
  await cancelInvitation(id)
  invitations.value = invitations.value.filter(i => i.id !== id)
  toastStore.show('Invitación cancelada')
}

async function signOut() {
  await auth.signOut()
  router.push('/login')
}
</script>

<template>
  <AppShell title="Configuración">
    <div class="max-w-2xl space-y-6">
      <!-- Profile -->
      <AppCard>
        <h2 class="text-sm font-semibold text-gray-900 mb-5">Perfil del negocio</h2>
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre del negocio</label>
            <input v-model="form.nombre" type="text" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Tipo de negocio</label>
            <select v-model="form.tipo" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Número SINPE Móvil</label>
            <input :value="form.sinpeNumero" type="tel" placeholder="8888-8888" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" @input="formatPhone" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Cédula jurídica <span class="text-gray-400 font-normal">(opcional)</span></label>
            <input v-model="form.cedulaJuridica" type="text" placeholder="3-XXX-XXXXXX" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp <span class="text-gray-400 font-normal">(opcional)</span></label>
            <input v-model="form.whatsapp" type="tel" placeholder="8888-8888" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <AppButton variant="primary" :loading="saving" @click="save">Guardar cambios</AppButton>
        </div>
      </AppCard>

      <!-- Team Management (dueño only) -->
      <AppCard v-if="isDueno">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-sm font-semibold text-gray-900">Equipo</h2>
          <AppButton variant="secondary" size="sm" @click="inviteModal = true">Invitar miembro</AppButton>
        </div>

        <!-- Current members -->
        <div class="space-y-3 mb-5">
          <div
            v-for="member in teamMembers"
            :key="member.id"
            class="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                <span class="text-primary text-xs font-semibold">{{ member.nombre.slice(0,2).toUpperCase() }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ member.nombre }}</p>
                <p class="text-xs text-gray-400">{{ member.email }}</p>
              </div>
            </div>
            <AppBadge :variant="member.rol === 'dueno' ? 'pagado' : 'info'">
              {{ member.rol === 'dueno' ? 'Dueño' : 'Cajero' }}
            </AppBadge>
          </div>
        </div>

        <!-- Pending invitations -->
        <div v-if="invitations.length > 0">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Invitaciones pendientes</p>
          <div class="space-y-2">
            <div v-for="inv in invitations" :key="inv.id" class="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded-lg">
              <div>
                <p class="text-sm text-gray-700">{{ inv.email }}</p>
                <p class="text-xs text-gray-400">{{ inv.rol }} · expira en 7 días</p>
              </div>
              <button class="text-xs text-red-500 hover:underline" @click="cancelInvite(inv.id)">Cancelar</button>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- Account -->
      <AppCard>
        <h2 class="text-sm font-semibold text-gray-900 mb-4">Cuenta</h2>
        <div class="flex flex-col gap-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Correo</span>
            <span class="text-gray-900">{{ auth.user?.email }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Plan</span>
            <RouterLink to="/configuracion/facturacion" class="text-primary font-medium capitalize hover:underline">
              {{ auth.business?.plan || 'starter' }} →
            </RouterLink>
          </div>
        </div>
        <AppButton variant="danger" size="sm" class="mt-5" @click="signOut">Cerrar sesión</AppButton>
      </AppCard>

      <!-- About -->
      <AppCard>
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Sobre SINPEpay</h2>
        <div class="space-y-2 text-sm text-gray-500">
          <div class="flex justify-between"><span>Versión</span><span class="text-gray-900 font-medium">3.0.0 — Milestone 3</span></div>
          <div class="flex justify-between"><span>Backend</span><span class="text-gray-900">Supabase</span></div>
          <div class="flex justify-between"><span>Moneda</span><span class="text-gray-900">Colón (₡ CRC)</span></div>
        </div>
      </AppCard>
    </div>

    <!-- Invite Modal -->
    <AppModal :show="inviteModal" title="Invitar al equipo" @close="inviteModal = false">
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
          <input v-model="inviteForm.email" type="email" placeholder="cajero@ejemplo.com" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
          <select v-model="inviteForm.rol" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
            <option value="cajero">Cajero — puede crear y marcar cobros</option>
            <option value="dueno">Dueño — acceso completo</option>
          </select>
        </div>
      </div>
      <template #footer>
        <AppButton variant="ghost" @click="inviteModal = false">Cancelar</AppButton>
        <AppButton variant="primary" :loading="inviteSending" @click="sendInvite">Enviar invitación</AppButton>
      </template>
    </AppModal>
  </AppShell>
</template>

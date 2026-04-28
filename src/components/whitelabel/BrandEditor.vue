<script setup>
import { ref, onMounted } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useToastStore } from '@/stores/useToastStore'

const auth  = useAuthStore()
const toast = useToastStore()

const config = ref({ logo_url: '', primary_color: '#1D9E75', secondary_color: '#085041', business_display_name: '', hide_sinpepay_branding: true, custom_footer: '' })
const saving = ref(false)
const uploading = ref(false)

onMounted(async () => {
  const { data } = await supabase.from('whitelabel_config').select('*').eq('business_id', auth.business?.id).maybeSingle()
  if (data) config.value = { ...config.value, ...data }
})

async function uploadLogo(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploading.value = true
  const path = `whitelabel/${auth.business?.id}/logo${file.name.substring(file.name.lastIndexOf('.'))}`
  const { data, error } = await supabase.storage.from('public-assets').upload(path, file, { upsert: true })
  if (data) {
    const { data: { publicUrl } } = supabase.storage.from('public-assets').getPublicUrl(path)
    config.value.logo_url = publicUrl
  }
  uploading.value = false
}

async function save() {
  saving.value = true
  const payload = { ...config.value, business_id: auth.business?.id, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('whitelabel_config').upsert(payload, { onConflict: 'business_id' })
  saving.value = false
  if (!error) toast.show('Configuración de marca guardada', 'success')
}
</script>

<template>
  <AppCard>
    <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Marca personalizada</h3>
    <div class="space-y-4">
      <div>
        <label class="form-label">Logo (PNG/SVG, máx 2MB)</label>
        <input type="file" accept=".png,.svg,.jpg" @change="uploadLogo" class="text-sm" />
        <img v-if="config.logo_url" :src="config.logo_url" alt="Logo" class="mt-2 h-10 object-contain" />
        <p v-if="uploading" class="text-xs text-gray-400 mt-1">Subiendo…</p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">Color primario</label>
          <div class="flex gap-2">
            <input v-model="config.primary_color" type="color" class="h-10 w-10 rounded border border-gray-200 cursor-pointer" />
            <input v-model="config.primary_color" type="text" class="form-input flex-1 font-mono" />
          </div>
        </div>
        <div>
          <label class="form-label">Color secundario</label>
          <div class="flex gap-2">
            <input v-model="config.secondary_color" type="color" class="h-10 w-10 rounded border border-gray-200 cursor-pointer" />
            <input v-model="config.secondary_color" type="text" class="form-input flex-1 font-mono" />
          </div>
        </div>
      </div>
      <div>
        <label class="form-label">Nombre mostrado (si diferente al nombre registrado)</label>
        <input v-model="config.business_display_name" type="text" class="form-input" />
      </div>
      <div>
        <label class="form-label">Texto del pie de página (máx 100 caracteres)</label>
        <input v-model="config.custom_footer" type="text" maxlength="100" class="form-input" />
      </div>
      <label class="flex items-center gap-2 text-sm cursor-pointer">
        <input v-model="config.hide_sinpepay_branding" type="checkbox" class="rounded" />
        <span class="text-gray-700 dark:text-gray-300">Ocultar "Powered by SINPEpay"</span>
      </label>
    </div>
    <button @click="save" :disabled="saving" class="w-full btn-primary mt-5">{{ saving ? 'Guardando…' : 'Guardar configuración de marca' }}</button>
  </AppCard>
</template>

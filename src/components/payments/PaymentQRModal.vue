<script setup>
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAppClipboard } from '@/composables/useClipboard'
import { formatCRC } from '@/utils/currency'
import QrcodeVue from 'qrcode.vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  link: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { copyWithToast } = useAppClipboard()

function whatsappShare() {
  if (!props.link) return
  const text = encodeURIComponent(
    `Hola! Le comparto el enlace de cobro por ${formatCRC(props.link.monto)} para "${props.link.descripcion}":\nhttps://${props.link.url}`
  )
  window.open(`https://wa.me/?text=${text}`, '_blank')
}
</script>

<template>
  <AppModal :show="show" :title="link?.descripcion || 'Código QR'" size="sm" @close="$emit('close')">
    <div v-if="link" class="flex flex-col items-center gap-4">
      <div class="bg-white p-3 rounded-xl border border-gray-100">
        <QrcodeVue :value="`https://${link.url}`" :size="200" level="H" />
      </div>
      <div class="text-center">
        <p class="text-2xl font-semibold text-gray-900 amount">{{ formatCRC(link.monto) }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ link.url }}</p>
      </div>
      <div class="flex gap-2 w-full">
        <AppButton variant="secondary" class="flex-1" @click="copyWithToast(`https://${link.url}`)">
          Copiar enlace
        </AppButton>
        <AppButton variant="primary" class="flex-1" @click="whatsappShare">
          WhatsApp
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

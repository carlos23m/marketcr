import { useClipboard as _useClipboard } from '@vueuse/core'
import { useToastStore } from '@/stores/useToastStore'

export function useAppClipboard() {
  const { copy, isSupported } = _useClipboard()
  const toastStore = useToastStore()

  async function copyWithToast(text, msg = 'Enlace copiado') {
    if (isSupported.value) {
      await copy(text)
      toastStore.show(msg)
    }
  }

  return { copyWithToast }
}

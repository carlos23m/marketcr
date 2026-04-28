<script setup>
import { ref } from 'vue'

const emit = defineEmits(['imported', 'cancel'])
const errors = ref([])
const parsed = ref([])

// Minimal CSV parser (no papaparse needed for simple format)
function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g,''))
  return lines.slice(1).map((line, i) => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g,''))
    const row = {}
    headers.forEach((h, j) => { row[h] = values[j] ?? '' })
    return row
  })
}

function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    const rows = parseCSV(ev.target.result)
    errors.value = []
    parsed.value = []
    rows.forEach((r, i) => {
      const errs = []
      if (!r.nombre) errs.push(`Fila ${i+2}: falta nombre`)
      if (!r.sinpe_numero) errs.push(`Fila ${i+2}: falta sinpe_numero`)
      if (!r.monto || isNaN(Number(r.monto))) errs.push(`Fila ${i+2}: monto inválido`)
      if (errs.length) errors.value.push(...errs)
      else parsed.value.push(r)
    })
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="rounded-lg border-2 border-dashed border-gray-200 p-5 mb-4">
    <p class="text-xs text-gray-500 mb-2">
      Columnas requeridas: <code class="bg-gray-100 px-1 rounded">nombre, sinpe_numero, monto</code> — Opcional: <code class="bg-gray-100 px-1 rounded">concepto</code>
    </p>
    <input type="file" accept=".csv" @change="onFile" class="text-sm" />
    <div v-if="errors.length" class="mt-3 space-y-1">
      <p v-for="e in errors" :key="e" class="text-xs text-red-600">{{ e }}</p>
    </div>
    <div v-if="parsed.length && !errors.length" class="mt-3">
      <p class="text-xs text-green-600 mb-2">{{ parsed.length }} filas válidas listas para importar.</p>
      <div class="flex gap-2">
        <button @click="emit('cancel')" class="px-3 py-1.5 rounded border border-gray-200 text-sm text-gray-600">Cancelar</button>
        <button @click="emit('imported', parsed)" class="btn-primary text-sm">Importar {{ parsed.length }} pagos</button>
      </div>
    </div>
  </div>
</template>

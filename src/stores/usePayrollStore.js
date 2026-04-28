import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './useAuthStore'

export const usePayrollStore = defineStore('payroll', () => {
  const employees = ref([])
  const runs = ref([])
  const currentRun = ref(null)
  const loading = ref(false)

  function businessId() { return useAuthStore().business?.id }

  async function fetchEmployees() {
    const bid = businessId()
    if (!bid) return
    const { data } = await supabase
      .from('payroll_employees')
      .select('*')
      .eq('business_id', bid)
      .order('nombre')
    if (data) employees.value = data
  }

  async function saveEmployee(payload) {
    const bid = businessId()
    if (!bid) return null
    const isNew = !payload.id
    const { id, ...rest } = payload
    let data, error
    if (isNew) {
      ;({ data, error } = await supabase.from('payroll_employees').insert({ business_id: bid, ...rest }).select().single())
      if (data) employees.value.push(data)
    } else {
      ;({ data, error } = await supabase.from('payroll_employees').update(rest).eq('id', id).eq('business_id', bid).select().single())
      if (data) { const idx = employees.value.findIndex(e => e.id === id); if (idx !== -1) employees.value[idx] = data }
    }
    return { data, error }
  }

  async function deleteEmployee(id) {
    await supabase.from('payroll_employees').delete().eq('id', id).eq('business_id', businessId())
    employees.value = employees.value.filter(e => e.id !== id)
  }

  async function fetchRuns() {
    const bid = businessId()
    if (!bid) return
    const { data } = await supabase
      .from('payroll_runs')
      .select('id, periodo, frecuencia, total_bruto, total_neto, status, created_at')
      .eq('business_id', bid)
      .order('created_at', { ascending: false })
    if (data) runs.value = data
  }

  async function fetchRun(id) {
    const { data } = await supabase
      .from('payroll_runs')
      .select('*, payroll_payments(*, payroll_employees(nombre, sinpe_numero))')
      .eq('id', id)
      .eq('business_id', businessId())
      .single()
    if (data) currentRun.value = data
    return data
  }

  async function createRun(payload) {
    const bid = businessId()
    if (!bid) return null
    loading.value = true

    // Build payments from active employees
    let q = supabase.from('payroll_employees').select('id, salario_bruto').eq('business_id', bid).eq('activo', true)
    if (payload.location_id) q = q.eq('location_id', payload.location_id)
    const { data: emps } = await q
    if (!emps?.length) { loading.value = false; return null }

    const overrides = payload.overrides ?? {}
    const payments = emps.map(e => {
      const ded  = overrides[e.id]?.deducciones ?? 0
      const neto = Math.max(0, e.salario_bruto - ded)
      return { employee_id: e.id, monto_bruto: e.salario_bruto, deducciones: ded, monto_neto: neto }
    })
    const totalBruto = payments.reduce((s, p) => s + p.monto_bruto, 0)
    const totalNeto  = payments.reduce((s, p) => s + p.monto_neto, 0)

    const { data: run, error } = await supabase
      .from('payroll_runs')
      .insert({ business_id: bid, periodo: payload.periodo, frecuencia: payload.frecuencia, total_bruto: totalBruto, total_neto: totalNeto, location_id: payload.location_id ?? null })
      .select()
      .single()

    if (run) {
      await supabase.from('payroll_payments').insert(payments.map(p => ({ ...p, run_id: run.id })))
      runs.value.unshift(run)
    }
    loading.value = false
    return { data: run, error }
  }

  async function markPayment(runId, paymentId, status) {
    await supabase.from('payroll_payments').update({ status }).eq('id', paymentId).eq('run_id', runId)
    if (currentRun.value?.id === runId) {
      const p = currentRun.value.payroll_payments.find(p => p.id === paymentId)
      if (p) p.status = status
    }
  }

  async function completeRun(runId) {
    await supabase.from('payroll_runs').update({ status: 'completed' }).eq('id', runId)
    const r = runs.value.find(r => r.id === runId)
    if (r) r.status = 'completed'
    if (currentRun.value?.id === runId) currentRun.value.status = 'completed'
  }

  return {
    employees, runs, currentRun, loading,
    fetchEmployees, saveEmployee, deleteEmployee,
    fetchRuns, fetchRun, createRun, markPayment, completeRun,
  }
})

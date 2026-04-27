import { supabase } from './supabase'

// ── Business ──────────────────────────────────────────────────────────

export async function createBusiness(data) {
  const { data: business, error } = await supabase
    .from('businesses')
    .insert(data)
    .select()
    .single()
  return { data: business, error }
}

export async function getBusiness(id) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function updateBusiness(id, updates) {
  const { data, error } = await supabase
    .from('businesses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ── Profile ───────────────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, businesses(*)')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function createProfile(data) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert(data)
    .select()
    .single()
  return { data: profile, error }
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// ── Payment Links ─────────────────────────────────────────────────────

export async function getPaymentLinks(businessId) {
  const { data, error } = await supabase
    .from('payment_links')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function getPaymentLink(id) {
  const { data, error } = await supabase
    .from('payment_links')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function getPublicPaymentLink(id) {
  const { data, error } = await supabase
    .from('payment_links')
    .select('id, descripcion, monto, estado, vencimiento, businesses(nombre, sinpe_numero)')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function createPaymentLink(data) {
  const { data: link, error } = await supabase
    .from('payment_links')
    .insert(data)
    .select()
    .single()
  return { data: link, error }
}

export async function updatePaymentLink(id, updates) {
  const { data, error } = await supabase
    .from('payment_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deletePaymentLink(id) {
  const { error } = await supabase
    .from('payment_links')
    .delete()
    .eq('id', id)
  return { error }
}

// ── Transactions ──────────────────────────────────────────────────────

export async function getTransactions(businessId, { limit = 50, offset = 0 } = {}) {
  const { data, error, count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId)
    .order('fecha', { ascending: false })
    .range(offset, offset + limit - 1)
  return { data, error, count }
}

export async function createTransaction(data) {
  const { data: txn, error } = await supabase
    .from('transactions')
    .insert(data)
    .select()
    .single()
  return { data: txn, error }
}

export async function getDailyRevenue(businessId, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await supabase
    .from('transactions')
    .select('fecha, monto, banco')
    .eq('business_id', businessId)
    .gte('fecha', since.toISOString())
    .order('fecha', { ascending: true })
  return { data, error }
}

// ── Invoices ──────────────────────────────────────────────────────────

export async function getInvoices(businessId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, transactions(nombre_remitente, monto)')
    .eq('business_id', businessId)
    .order('fecha_emision', { ascending: false })
  return { data, error }
}

export async function getInvoice(id) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, transactions(*, payment_links(descripcion))')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function createInvoice(data) {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert(data)
    .select()
    .single()
  return { data: invoice, error }
}

export async function updateInvoice(id, updates) {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ── Team ──────────────────────────────────────────────────────────────

export async function getTeamMembers(businessId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, email, rol, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true })
  return { data, error }
}

export async function removeTeamMember(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ business_id: null })
    .eq('id', userId)
  return { error }
}

export async function getInvitations(businessId) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('business_id', businessId)
    .eq('accepted', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createInvitation(data) {
  const { data: invite, error } = await supabase
    .from('invitations')
    .insert(data)
    .select()
    .single()
  return { data: invite, error }
}

export async function getInvitationByToken(token) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*, businesses(nombre)')
    .eq('token', token)
    .eq('accepted', false)
    .gt('expires_at', new Date().toISOString())
    .single()
  return { data, error }
}

export async function acceptInvitation(token, userId) {
  const { data: invite, error: fetchError } = await getInvitationByToken(token)
  if (fetchError || !invite) return { error: fetchError || new Error('Invitación inválida o expirada') }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ business_id: invite.business_id, rol: invite.rol })
    .eq('id', userId)
  if (profileError) return { error: profileError }

  const { error: acceptError } = await supabase
    .from('invitations')
    .update({ accepted: true })
    .eq('token', token)

  return { data: invite, error: acceptError }
}

export async function cancelInvitation(id) {
  const { error } = await supabase.from('invitations').delete().eq('id', id)
  return { error }
}

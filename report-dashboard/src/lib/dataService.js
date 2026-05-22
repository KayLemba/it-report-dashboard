import { supabase } from './supabase'

// ── TICKETS ──────────────────────────────────────────────────

export async function createTicket(ticket) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([ticket])
    .select()
  if (error) throw new Error(error.message)
  return data[0]
}

export async function updateTicket(ticketId, periodTag, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('ticket_id', ticketId)
    .eq('period_tag', periodTag)
    .select()
  if (error) throw new Error(error.message)
  return data[0]
}

export async function deleteTicket(ticketId, periodTag) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('ticket_id', ticketId)
    .eq('period_tag', periodTag)
  if (error) throw new Error(error.message)
}

export async function getTickets(filters = {}) {
  let query = supabase.from('tasks').select('*')
  if (filters.periodTag)  query = query.eq('period_tag', filters.periodTag)
  if (filters.category)   query = query.eq('category',   filters.category)
  if (filters.priority)   query = query.eq('priority',   filters.priority)
  if (filters.status)     query = query.eq('status',     filters.status)
  query = query.order('created_at', { ascending: false })
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

// ── ASSIGNEES ─────────────────────────────────────────────────

export async function getAssignees() {
  const { data, error } = await supabase
    .from('assignees')
    .select('*')
    .order('full_name', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createAssignee(assignee) {
  const { data, error } = await supabase
    .from('assignees')
    .insert([assignee])
    .select()
  if (error) throw new Error(error.message)
  return data[0]
}

export async function updateAssignee(id, updates) {
  const { data, error } = await supabase
    .from('assignees')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw new Error(error.message)
  return data[0]
}

export async function deleteAssignee(id) {
  const { error } = await supabase
    .from('assignees')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ── DEPARTMENTS ───────────────────────────────────────────────

export async function getDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createDepartment(dept) {
  const { data, error } = await supabase
    .from('departments')
    .insert([dept])
    .select()
  if (error) throw new Error(error.message)
  return data[0]
}

export async function updateDepartment(id, updates) {
  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw new Error(error.message)
  return data[0]
}

export async function deleteDepartment(id) {
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ── AUTO-GENERATE TICKET ID ───────────────────────────────────

export async function generateTicketId() {
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
  const num = (count || 0) + 1
  return `TK-${String(num).padStart(4, '0')}`
}

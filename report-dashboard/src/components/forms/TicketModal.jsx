import React, { useState, useEffect } from 'react'
import { createTicket, updateTicket, generateTicketId } from '../../lib/dataService'
import styles from './Modal.module.css'

const CATEGORIES = ['Helpdesk', 'Network', 'Security', 'Hardware', 'Software']
const PRIORITIES = ['P1', 'P2', 'P3', 'P4']
const STATUSES   = ['open', 'in_progress', 'done']
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', done: 'Done' }
const SLA_DEFAULTS  = { P1: 4, P2: 8, P3: 24, P4: 72 }

function currentMonthTag() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const EMPTY_FORM = {
  ticket_id: '',
  title: '',
  category: 'Helpdesk',
  priority: 'P3',
  status: 'open',
  assignee_name: '',
  created_at: new Date().toISOString().slice(0, 16),
  resolved_at: '',
  resolution_time_hrs: '',
  sla_target_hrs: '24',
  sla_met: '',
  period_tag: currentMonthTag(),
  notes: '',
}

export default function TicketModal({ ticket, assignees = [], onClose, onSaved }) {
  const isEdit = !!ticket
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (isEdit) {
      setForm({
        ...EMPTY_FORM,
        ...ticket,
        created_at: ticket.created_at ? ticket.created_at.slice(0, 16) : '',
        resolved_at: ticket.resolved_at ? ticket.resolved_at.slice(0, 16) : '',
        resolution_time_hrs: ticket.resolution_time_hrs ?? '',
        sla_target_hrs: ticket.sla_target_hrs ?? SLA_DEFAULTS[ticket.priority] ?? 24,
        sla_met: ticket.sla_met === true ? 'yes' : ticket.sla_met === false ? 'no' : '',
      })
    } else {
      // Auto-generate ticket ID for new tickets
      generateTicketId().then(id => setForm(f => ({ ...f, ticket_id: id }))).catch(() => {})
    }
  }, [ticket])

  function set(field, value) {
    setForm(prev => {
      const updated = { ...prev, [field]: value }
      // Auto-set SLA target when priority changes
      if (field === 'priority') updated.sla_target_hrs = SLA_DEFAULTS[value]
      // Auto-calculate resolution time from dates
      if ((field === 'resolved_at' || field === 'created_at') && updated.created_at && updated.resolved_at) {
        const diff = (new Date(updated.resolved_at) - new Date(updated.created_at)) / 3600000
        if (diff > 0) {
          updated.resolution_time_hrs = diff.toFixed(1)
          // Auto-calculate sla_met
          if (updated.sla_target_hrs) {
            updated.sla_met = diff <= Number(updated.sla_target_hrs) ? 'yes' : 'no'
          }
        }
      }
      return updated
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.ticket_id.trim()) return setError('Ticket ID is required')
    if (!form.title.trim())     return setError('Title is required')
    if (!form.created_at)       return setError('Created date is required')

    setSaving(true)
    setError(null)

    const payload = {
      ticket_id:           form.ticket_id.trim(),
      title:               form.title.trim(),
      category:            form.category,
      priority:            form.priority,
      status:              form.status,
      assignee_name:       form.assignee_name || null,
      created_at:          form.created_at ? new Date(form.created_at).toISOString() : null,
      resolved_at:         form.resolved_at  ? new Date(form.resolved_at).toISOString() : null,
      resolution_time_hrs: form.resolution_time_hrs !== '' ? Number(form.resolution_time_hrs) : null,
      sla_target_hrs:      form.sla_target_hrs !== '' ? Number(form.sla_target_hrs) : null,
      sla_met:             form.sla_met === 'yes' ? true : form.sla_met === 'no' ? false : null,
      period_tag:          form.period_tag,
      notes:               form.notes || null,
    }

    try {
      if (isEdit) {
        await updateTicket(ticket.ticket_id, ticket.period_tag, payload)
      } else {
        await createTicket(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEdit ? 'Edit ticket' : 'New ticket'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close"><i className="ti ti-x" /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}><i className="ti ti-alert-circle" /> {error}</div>}

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Ticket ID *</label>
              <input value={form.ticket_id} onChange={e => set('ticket_id', e.target.value)} placeholder="TK-0001" disabled={isEdit} />
            </div>
            <div className={styles.field}>
              <label>Report period *</label>
              <input type="month" value={form.period_tag} onChange={e => set('period_tag', e.target.value)} />
            </div>
          </div>

          <div className={styles.field}>
            <label>Title / Description *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. VPN access failure — Finance dept" />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p} — {p==='P1'?'Critical':p==='P2'?'High':p==='P3'?'Medium':'Low'}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(st => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Assignee (technician)</label>
              {assignees.length > 0 ? (
                <select value={form.assignee_name} onChange={e => set('assignee_name', e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {assignees.map(a => <option key={a.id} value={a.full_name}>{a.full_name}</option>)}
                </select>
              ) : (
                <input value={form.assignee_name} onChange={e => set('assignee_name', e.target.value)} placeholder="Technician name" />
              )}
            </div>
            <div className={styles.field}>
              <label>SLA target (hours)</label>
              <input type="number" min="1" value={form.sla_target_hrs} onChange={e => set('sla_target_hrs', e.target.value)} placeholder="24" />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Date opened *</label>
              <input type="datetime-local" value={form.created_at} onChange={e => set('created_at', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Date resolved</label>
              <input type="datetime-local" value={form.resolved_at} onChange={e => set('resolved_at', e.target.value)} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Resolution time (hrs) <span className={styles.auto}>auto-calculated</span></label>
              <input type="number" step="0.1" min="0" value={form.resolution_time_hrs} onChange={e => set('resolution_time_hrs', e.target.value)} placeholder="e.g. 3.5" />
            </div>
            <div className={styles.field}>
              <label>SLA met? <span className={styles.auto}>auto-calculated</span></label>
              <select value={form.sla_met} onChange={e => set('sla_met', e.target.value)}>
                <option value="">— Not set —</option>
                <option value="yes">Yes — SLA met</option>
                <option value="no">No — SLA breached</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label>Notes / comments</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any additional notes about this ticket…" />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

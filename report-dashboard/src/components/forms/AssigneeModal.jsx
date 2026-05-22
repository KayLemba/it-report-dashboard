import React, { useState, useEffect } from 'react'
import { createAssignee, updateAssignee } from '../../lib/dataService'
import styles from './Modal.module.css'

const TEAMS  = ['Infrastructure', 'Support', 'Security', 'Development', 'Network', 'Systems']
const ROLES  = ['IT Technician', 'Senior Technician', 'IT Manager', 'Network Engineer', 'Security Analyst', 'Systems Administrator', 'Help Desk Agent']

const EMPTY = { full_name:'', team:'Support', role:'IT Technician', email:'' }

export default function AssigneeModal({ assignee, onClose, onSaved }) {
  const isEdit = !!assignee
  const [form,   setForm]   = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  useEffect(() => {
    if (isEdit) setForm({ full_name: assignee.full_name || '', team: assignee.team || 'Support', role: assignee.role || 'IT Technician', email: assignee.email || '' })
    else setForm(EMPTY)
  }, [assignee])

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.full_name.trim()) return setError('Full name is required')
    setSaving(true); setError(null)
    try {
      if (isEdit) await updateAssignee(assignee.id, form)
      else        await createAssignee(form)
      onSaved(); onClose()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth: 480 }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEdit ? 'Edit technician' : 'New technician'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}><i className="ti ti-alert-circle" /> {error}</div>}
          <div className={styles.field}>
            <label>Full name *</label>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="e.g. John Banda" />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Team</label>
              <select value={form.team} onChange={e => set('team', e.target.value)}>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label>Email address</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. john.banda@company.com" />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add technician'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

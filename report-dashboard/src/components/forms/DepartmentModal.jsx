import React, { useState, useEffect } from 'react'
import { createDepartment, updateDepartment } from '../../lib/dataService'
import styles from './Modal.module.css'

const EMPTY = { name:'', head:'', email:'', notes:'' }

export default function DepartmentModal({ department, onClose, onSaved }) {
  const isEdit = !!department
  const [form,   setForm]   = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  useEffect(() => {
    if (isEdit) setForm({ name: department.name||'', head: department.head||'', email: department.email||'', notes: department.notes||'' })
    else setForm(EMPTY)
  }, [department])

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Department name is required')
    setSaving(true); setError(null)
    try {
      if (isEdit) await updateDepartment(department.id, form)
      else        await createDepartment(form)
      onSaved(); onClose()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div className={styles.modal} style={{ maxWidth:460 }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEdit ? 'Edit department' : 'New department'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}><i className="ti ti-alert-circle"/> {error}</div>}
          <div className={styles.field}>
            <label>Department name *</label>
            <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Finance" disabled={isEdit}/>
          </div>
          <div className={styles.field}>
            <label>Department head</label>
            <input value={form.head} onChange={e=>set('head',e.target.value)} placeholder="e.g. Jane Mwale"/>
          </div>
          <div className={styles.field}>
            <label>Contact email</label>
            <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="e.g. finance@company.com"/>
          </div>
          <div className={styles.field}>
            <label>Notes</label>
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2} placeholder="Any notes about this department…"/>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

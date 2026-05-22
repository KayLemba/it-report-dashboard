import React, { useState } from 'react'
import styles from './Modal.module.css'

export default function ConfirmDelete({ title, message, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setDeleting(true)
    try { await onConfirm() } finally { setDeleting(false) }
  }

  return (
    <div className={styles.confirmOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.confirmBox}>
        <div style={{ fontSize: 40, color: 'var(--red)', marginBottom: 12 }}>
          <i className="ti ti-trash" />
        </div>
        <h3>{title || 'Delete this item?'}</h3>
        <p>{message || 'This action cannot be undone.'}</p>
        <div className={styles.confirmActions}>
          <button className={styles.btnGhost} onClick={onClose} disabled={deleting}>Cancel</button>
          <button className={styles.btnDanger} onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

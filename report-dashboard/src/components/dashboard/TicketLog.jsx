import React, { useState } from 'react'
import styles from './TicketLog.module.css'

const PRIORITY_COLORS = { P1: '#f87171', P2: '#fbbf24', P3: '#6c8fff', P4: '#34d399' }
const STATUS_LABELS   = { done: 'Done', open: 'Open', in_progress: 'In Progress' }
const STATUS_CLASS    = { done: 'done', open: 'open', in_progress: 'prog' }

export default function TicketLog({ tickets = [] }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const visible = tickets.filter(t => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'open' && (t.status === 'open' || t.status === 'in_progress')) ||
      t.status === filter
    const matchSearch =
      !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_id?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignee_name?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  }).slice(0, 50) // cap at 50 rows for performance; full list in PDF

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Recent tickets</p>
          <p className={styles.sub}>{tickets.length} total · showing {visible.length}</p>
        </div>
        <div className={styles.controls}>
          <input
            className={styles.search}
            placeholder="Search tickets…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search tickets"
          />
          {['all','open','done'].map(f => (
            <button
              key={f}
              className={`${styles.chip} ${filter === f ? styles.chipActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.list} role="list">
        {visible.map(t => (
          <div key={t.ticket_id} className={styles.row} role="listitem">
            <span className={styles.id}>{t.ticket_id}</span>
            <span className={styles.ticketTitle} title={t.title}>{t.title}</span>
            <span className={styles.category}>{t.category}</span>
            <span
              className={styles.priority}
              style={{ background: `${PRIORITY_COLORS[t.priority]}18`, color: PRIORITY_COLORS[t.priority] }}
            >
              {t.priority}
            </span>
            <span className={`${styles.status} ${styles[STATUS_CLASS[t.status] || 'open']}`}>
              {STATUS_LABELS[t.status] || t.status}
            </span>
            <span className={styles.assignee}>{t.assignee_name || '—'}</span>
            <span className={styles.time}>
              {t.resolution_time_hrs != null ? `${t.resolution_time_hrs}h` : '—'}
            </span>
            <span
              className={styles.sla}
              title={t.sla_met === true ? 'SLA met' : t.sla_met === false ? 'SLA missed' : 'N/A'}
            >
              {t.sla_met === true ? '✓' : t.sla_met === false ? '✗' : '—'}
            </span>
          </div>
        ))}

        {!visible.length && (
          <div className={styles.empty}>
            {search ? `No tickets match "${search}"` : 'No tickets for this filter'}
          </div>
        )}
      </div>
    </div>
  )
}

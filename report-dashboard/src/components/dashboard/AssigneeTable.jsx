import React from 'react'
import styles from './AssigneeTable.module.css'

const AVATAR_COLORS = ['#6c8fff','#34d399','#fbbf24','#a78bfa','#2dd4bf','#f87171']

export default function AssigneeTable({ assignees = [] }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Assignee performance</p>
          <p className={styles.sub}>Ranked by SLA compliance</p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Technician</th>
              <th>Assigned</th>
              <th>Done</th>
              <th>Avg time</th>
              <th>SLA %</th>
              <th>P1s</th>
            </tr>
          </thead>
          <tbody>
            {assignees.map((a, i) => {
              const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length]
              const slaColor    = a.slaRate >= 95 ? 'var(--green)' : a.slaRate >= 85 ? 'var(--amber)' : 'var(--red)'
              return (
                <tr key={a.id || a.name}>
                  <td>
                    <div className={styles.person}>
                      <div className={styles.avatar} style={{ background: `${avatarColor}18`, color: avatarColor }}>
                        {a.initials}
                      </div>
                      {a.name}
                    </div>
                  </td>
                  <td className={styles.mono}>{a.tasks}</td>
                  <td className={styles.mono}>{a.done}</td>
                  <td className={styles.mono}>{a.avgTime != null ? `${a.avgTime}h` : '—'}</td>
                  <td>
                    <div className={styles.slaCell}>
                      <div className={styles.slaBar}>
                        <div className={styles.slaFill} style={{ width: `${a.slaRate}%`, background: slaColor }} />
                      </div>
                      <span className={styles.slaVal} style={{ color: slaColor }}>{a.slaRate}%</span>
                    </div>
                  </td>
                  <td className={`${styles.mono} ${a.p1 > 0 ? styles.p1 : ''}`}>{a.p1}</td>
                </tr>
              )
            })}
            {!assignees.length && (
              <tr><td colSpan={6} className={styles.empty}>No assignee data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

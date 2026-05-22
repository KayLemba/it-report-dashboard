import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './PriorityChart.module.css'

export default function PriorityChart({ priorities = [], slaRate = 0 }) {
  const total = priorities.reduce((s, p) => s + p.count, 0)

  const slaColor = slaRate >= 95 ? 'var(--green)' : slaRate >= 85 ? 'var(--amber)' : 'var(--red)'

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Priority breakdown</p>
          <p className={styles.sub}>{total} tickets this period</p>
        </div>
      </div>

      <div className={styles.donutRow}>
        <div className={styles.donutWrap}>
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={priorities}
                dataKey="count"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={2}
                strokeWidth={0}
              >
                {priorities.map(p => <Cell key={p.priority} fill={p.color} />)}
              </Pie>
              <Tooltip
                formatter={(val, name, props) => [val, props.payload.label]}
                contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.donutCenter}>
            <span className={styles.totalNum}>{total}</span>
            <span className={styles.totalLabel}>total</span>
          </div>
        </div>

        <div className={styles.legend}>
          {priorities.map(p => {
            const pct = total ? Math.round((p.count / total) * 100) : 0
            return (
              <div key={p.priority} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: p.color }} />
                <span className={styles.legendName}>{p.label}</span>
                <span className={styles.legendVal}>{p.count}</span>
                <span className={styles.legendPct}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* SLA meter */}
      <div className={styles.slaSection}>
        <div className={styles.slaHeader}>
          <span className={styles.slaLabel}>SLA compliance</span>
          <span className={styles.slaValue} style={{ color: slaColor }}>{slaRate}%</span>
        </div>
        <div className={styles.slaTrack}>
          <div className={styles.slaFill} style={{ width: `${slaRate}%`, background: slaColor }} />
        </div>
        <div className={styles.slaFooter}>
          <span>Target: 95%</span>
          <span style={{ color: slaRate >= 95 ? 'var(--green)' : 'var(--red)' }}>
            {slaRate >= 95 ? '✓ On target' : `↓ ${95 - slaRate}% below target`}
          </span>
        </div>
      </div>
    </div>
  )
}

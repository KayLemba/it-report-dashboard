import React from 'react'
import styles from './KPICard.module.css'

const ICON_MAP = {
  check:  'ti-circle-check',
  clock:  'ti-clock',
  alert:  'ti-alert-circle',
  shield: 'ti-shield-check',
  ticket: 'ti-ticket',
}

export default function KPICard({ label, value, delta, deltaUp, icon, accentColor }) {
  const iconClass = ICON_MAP[icon] || 'ti-chart-bar'
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.iconWrap} style={{ background: `${accentColor}18`, color: accentColor }}>
          <i className={`ti ${iconClass}`} aria-hidden="true" />
        </div>
        {delta != null && (
          <span className={`${styles.delta} ${deltaUp ? styles.deltaUp : styles.deltaDown}`}>
            {delta}
          </span>
        )}
      </div>
      <div className={styles.value} style={{ color: accentColor }}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  )
}

import React from 'react'
import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'

const NAV = [
  {
    label: 'Overview',
    items: [
      { to: '/',        icon: 'ti-layout-dashboard',  label: 'Dashboard' },
      { to: '/tickets', icon: 'ti-ticket',             label: 'All Tickets',   badge: 'incidents' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/trends',    icon: 'ti-chart-line',        label: 'Trends' },
      { to: '/assignees', icon: 'ti-users',              label: 'Assignees' },
      { to: '/sla',       icon: 'ti-shield-check',       label: 'SLA Monitor' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/generate', icon: 'ti-file-description',  label: 'Generate PDF' },
      { to: '/upload',   icon: 'ti-upload',             label: 'Upload CSV' },
    ],
  },
]

export default function Sidebar({ openIncidents = 0 }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <i className="ti ti-report-analytics" aria-hidden="true" />
        </div>
        <span className={styles.logoText}>IT<span>Report</span></span>
      </div>

      {NAV.map(section => (
        <div key={section.label} className={styles.section}>
          <p className={styles.sectionLabel}>{section.label}</p>
          {section.items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              {item.label}
              {item.badge === 'incidents' && openIncidents > 0 && (
                <span className={styles.badge}>{openIncidents}</span>
              )}
            </NavLink>
          ))}
        </div>
      ))}

      <div className={styles.bottom}>
        <NavLink
          to="/settings"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <i className="ti ti-settings" aria-hidden="true" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}

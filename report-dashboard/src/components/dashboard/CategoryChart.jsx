import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import styles from './CategoryChart.module.css'

const METRIC_OPTIONS = [
  { value: 'count', label: 'Task count' },
  { value: 'sla',   label: 'SLA %' },
  { value: 'time',  label: 'Avg time (h)' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function CategoryChart({ data = [] }) {
  const [metric, setMetric] = useState('count')

  const chartData = data.map(c => ({
    name:     c.name,
    Done:     metric === 'count' ? c.done    : metric === 'sla' ? c.slaRate : c.avgTime,
    Open:     metric === 'count' ? c.open + c.inProg : 0,
  }))

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Tasks by category</p>
          <p className={styles.sub}>
            {metric === 'count' ? 'Completed vs open' : metric === 'sla' ? 'SLA compliance %' : 'Avg resolution time (hrs)'}
          </p>
        </div>
        <select
          className={styles.select}
          value={metric}
          onChange={e => setMetric(e.target.value)}
        >
          {METRIC_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barGap={4} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#8b8d9a', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8b8d9a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          {metric === 'count' && <Legend wrapperStyle={{ fontSize: 11, color: '#8b8d9a' }} />}
          <Bar dataKey="Done" fill="#6c8fff" radius={[4,4,0,0]} />
          {metric === 'count' && <Bar dataKey="Open" fill="#f87171" radius={[4,4,0,0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

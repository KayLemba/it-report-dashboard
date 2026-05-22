import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import styles from './TrendChart.module.css'

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

export default function TrendChart({ data = [], granularity = 'day' }) {
  const formatLabel = period => {
    if (granularity === 'day') {
      const d = new Date(period)
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }
    if (granularity === 'week') return `Wk ${period.slice(5,7)}`
    return new Date(period + '-01').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
  }

  const chartData = data.map(d => ({ ...d, period: formatLabel(d.period) }))

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Task volume over time</p>
          <p className={styles.sub}>Opened vs closed — {granularity} view</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gradOpened" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6c8fff" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6c8fff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradClosed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#34d399" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="period" tick={{ fill: '#8b8d9a', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#8b8d9a', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
          <Area type="monotone" dataKey="opened" name="Opened" stroke="#6c8fff" strokeWidth={2} fill="url(#gradOpened)" dot={false} />
          <Area type="monotone" dataKey="closed" name="Closed" stroke="#34d399" strokeWidth={2} fill="url(#gradClosed)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

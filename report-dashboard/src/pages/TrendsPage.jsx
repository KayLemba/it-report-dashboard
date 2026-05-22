import React, { useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTasks } from '../hooks/useTasks'
import { calcTimeSeries, calcByCategory } from '../lib/kpi'
import s from './shared.module.css'

const PERIOD_OPTIONS = [
  { label: 'This month', tag: monthTag(0) },
  { label: 'Last month', tag: monthTag(1) },
  { label: '2 months ago', tag: monthTag(2) },
]

function monthTag(offset) {
  const d = new Date()
  d.setMonth(d.getMonth() - offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <p style={{ fontWeight:600, marginBottom:4 }}>{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color:p.color }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  )
}

export default function TrendsPage() {
  const [periodTag,   setPeriodTag]   = useState(monthTag(0))
  const [granularity, setGranularity] = useState('day')
  const { tasks, loading, error }     = useTasks({ periodTag })

  const timeSeries  = calcTimeSeries(tasks, granularity)
  const byCategory  = calcByCategory(tasks)

  function fmtLabel(period) {
    if (granularity === 'day') return new Date(period).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
    if (granularity === 'week') return `Wk ${period.slice(5,7)}`
    return new Date(period + '-01').toLocaleDateString('en-GB', { month:'short', year:'2-digit' })
  }

  const chartData = timeSeries.map(d => ({ ...d, period: fmtLabel(d.period) }))

  // Category comparison bar data
  const catData = byCategory.map(c => ({ name: c.name, Done: c.done, Open: c.open + c.inProg, 'SLA %': c.slaRate }))

  // Resolution time trend
  const resData = timeSeries.map(d => ({ period: fmtLabel(d.period), opened: d.opened, closed: d.closed, backlog: d.opened - d.closed }))

  return (
    <div className={s.page}>
      <div className={s.topBar}>
        <div>
          <h1 className={s.title}>Trends</h1>
          <p className={s.sub}>Task volume, backlog, and category performance over time</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <select className={s.select} value={periodTag} onChange={e => setPeriodTag(e.target.value)}>
            {PERIOD_OPTIONS.map(o => <option key={o.tag} value={o.tag}>{o.label}</option>)}
          </select>
          <select className={s.select} value={granularity} onChange={e => setGranularity(e.target.value)}>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      {loading && <div style={{ padding:40, textAlign:'center' }}><span className={s.spinner} /></div>}
      {error   && <div className={s.error}><i className="ti ti-alert-circle" />{error}</div>}

      {!loading && !error && (
        <>
          {/* Volume trend */}
          <div className={s.card}>
            <p className={s.cardTitle}>Task volume — opened vs closed</p>
            <p className={s.cardSub}>How many tickets were opened and resolved each {granularity}</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gOpen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6c8fff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6c8fff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="period" tick={{ fill:'#8b8d9a', fontSize:10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill:'#8b8d9a', fontSize:10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<TT />} cursor={{ stroke:'rgba(255,255,255,.08)', strokeWidth:1 }} />
                <Legend wrapperStyle={{ fontSize:11, color:'#8b8d9a' }} />
                <Area type="monotone" dataKey="opened" name="Opened" stroke="#6c8fff" strokeWidth={2} fill="url(#gOpen)" dot={false} />
                <Area type="monotone" dataKey="closed" name="Closed" stroke="#34d399" strokeWidth={2} fill="url(#gClose)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className={s.grid2}>
            {/* Backlog delta */}
            <div className={s.card}>
              <p className={s.cardTitle}>Backlog delta per {granularity}</p>
              <p className={s.cardSub}>Positive = more opened than closed (backlog growing)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={resData} barCategoryGap="35%">
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="period" tick={{ fill:'#8b8d9a', fontSize:10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill:'#8b8d9a', fontSize:10 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<TT />} cursor={{ fill:'rgba(255,255,255,.04)' }} />
                  <Bar dataKey="backlog" name="Backlog delta" radius={[4,4,0,0]}
                    fill="#f87171"
                    label={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category performance */}
            <div className={s.card}>
              <p className={s.cardTitle}>Category comparison</p>
              <p className={s.cardSub}>Done vs open tickets per category</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={catData} barGap={4} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill:'#8b8d9a', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#8b8d9a', fontSize:10 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<TT />} cursor={{ fill:'rgba(255,255,255,.04)' }} />
                  <Legend wrapperStyle={{ fontSize:11, color:'#8b8d9a' }} />
                  <Bar dataKey="Done" fill="#6c8fff" radius={[4,4,0,0]} />
                  <Bar dataKey="Open" fill="#f87171" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SLA % by category table */}
          <div className={s.card}>
            <p className={s.cardTitle}>SLA performance by category</p>
            <p className={s.cardSub}>Compliance rate and average resolution time per category</p>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total</th>
                  <th>Done</th>
                  <th>Open</th>
                  <th>Avg resolution</th>
                  <th>SLA compliance</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.length === 0 && <tr><td colSpan={6} className={s.empty}>No data for this period</td></tr>}
                {byCategory.map(c => {
                  const slaColor = c.slaRate >= 95 ? 'var(--green)' : c.slaRate >= 80 ? 'var(--amber)' : 'var(--red)'
                  return (
                    <tr key={c.name}>
                      <td><span className={`${s.badge} ${s.badgeBlue}`}>{c.name}</span></td>
                      <td className={s.mono}>{c.total}</td>
                      <td className={s.mono} style={{ color:'var(--green)' }}>{c.done}</td>
                      <td className={s.mono} style={{ color: c.open > 0 ? 'var(--amber)' : 'var(--text2)' }}>{c.open + c.inProg}</td>
                      <td className={s.mono}>{c.avgTime != null ? `${c.avgTime}h` : '—'}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div className={s.slaBar}><div className={s.slaFill} style={{ width:`${c.slaRate}%`, background:slaColor }} /></div>
                          <span style={{ fontFamily:'var(--mono)', fontSize:12, color:slaColor }}>{c.slaRate}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

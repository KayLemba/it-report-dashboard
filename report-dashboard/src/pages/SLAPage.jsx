import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTasks } from '../hooks/useTasks'
import { calcByCategory, calcByAssignee } from '../lib/kpi'
import s from './shared.module.css'

function monthTag(offset = 0) {
  const d = new Date(); d.setMonth(d.getMonth() - offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <p style={{ fontWeight:600, marginBottom:4 }}>{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color:p.color }}>{p.name}: <strong>{p.value}{p.dataKey === 'slaRate' ? '%' : ''}</strong></p>)}
    </div>
  )
}

export default function SLAPage() {
  const [periodTag, setPeriodTag] = useState(monthTag(0))
  const [view,      setView]      = useState('overview') // overview | breached | at_risk
  const { tasks, loading, error } = useTasks({ periodTag })

  // SLA metrics
  const slaEligible = tasks.filter(t => t.sla_met !== null)
  const slaMet      = slaEligible.filter(t => t.sla_met === true)
  const slaBreached = slaEligible.filter(t => t.sla_met === false)
  const slaRate     = slaEligible.length ? Math.round((slaMet.length / slaEligible.length) * 100) : 0

  // At-risk = open tickets where time already exceeds 80% of SLA target
  const atRisk = tasks.filter(t => {
    if (t.status === 'done' || !t.sla_target_hrs || !t.created_at) return false
    const hoursOpen = (Date.now() - new Date(t.created_at).getTime()) / 3600000
    return hoursOpen >= t.sla_target_hrs * 0.8
  })

  // P1 SLA
  const p1Tasks    = slaEligible.filter(t => t.priority === 'P1')
  const p1SlaRate  = p1Tasks.length ? Math.round((p1Tasks.filter(t => t.sla_met).length / p1Tasks.length) * 100) : 0

  const byCategory = calcByCategory(tasks)
  const byAssignee = calcByAssignee(tasks)

  const catChartData = byCategory.map(c => ({ name: c.name, slaRate: c.slaRate }))
  const assChartData = byAssignee.map(a => ({ name: a.name.split(' ')[0], slaRate: a.slaRate }))

  // Tickets to show in table
  const tableTickets = view === 'breached' ? slaBreached : view === 'at_risk' ? atRisk : slaBreached

  function hoursOpen(ticket) {
    if (!ticket.created_at) return null
    return +((Date.now() - new Date(ticket.created_at).getTime()) / 3600000).toFixed(1)
  }

  function riskPct(ticket) {
    if (!ticket.sla_target_hrs) return null
    return Math.min(100, Math.round((hoursOpen(ticket) / ticket.sla_target_hrs) * 100))
  }

  const slaColor = slaRate >= 95 ? 'var(--green)' : slaRate >= 80 ? 'var(--amber)' : 'var(--red)'

  return (
    <div className={s.page}>
      <div className={s.topBar}>
        <div>
          <h1 className={s.title}>SLA Monitor</h1>
          <p className={s.sub}>Track SLA compliance, breaches and at-risk tickets</p>
        </div>
        <select className={s.select} value={periodTag} onChange={e => setPeriodTag(e.target.value)}>
          {[0,1,2].map(i => {
            const tag = monthTag(i)
            return <option key={tag} value={tag}>{i===0?'This month':i===1?'Last month':'2 months ago'} ({tag})</option>
          })}
        </select>
      </div>

      {loading && <div style={{ padding:40, textAlign:'center' }}><span className={s.spinner} /></div>}
      {error   && <div className={s.error}><i className="ti ti-alert-circle" />{error}</div>}

      {!loading && !error && (
        <>
          {/* KPI row */}
          <div className={s.kpiGrid}>
            {[
              { label:'Overall SLA rate',  val:`${slaRate}%`,        color: slaColor,        icon:'ti-shield-check' },
              { label:'SLA met',           val: slaMet.length,        color:'var(--green)',   icon:'ti-circle-check' },
              { label:'SLA breached',      val: slaBreached.length,   color:'var(--red)',     icon:'ti-alert-circle' },
              { label:'At risk (open)',    val: atRisk.length,        color:'var(--amber)',   icon:'ti-clock-exclamation' },
            ].map(k => (
              <div key={k.label} className={s.kpiCard}>
                <div className={s.kpiTop}>
                  <div className={s.kpiIcon} style={{ background:`${k.color}18`.replace('var(--green)','#34d399').replace('var(--red)','#f87171').replace('var(--amber)','#fbbf24'), color:k.color }}>
                    <i className={`ti ${k.icon}`} />
                  </div>
                </div>
                <div className={s.kpiVal} style={{ color:k.color }}>{k.val}</div>
                <div className={s.kpiLabel}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* SLA gauge + P1 */}
          <div className={s.grid2}>
            <div className={s.card}>
              <p className={s.cardTitle}>Overall SLA compliance</p>
              <p className={s.cardSub}>Target: 95%</p>
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ position:'relative', display:'inline-block' }}>
                  <svg width="180" height="100" viewBox="0 0 180 100">
                    <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="14" strokeLinecap="round" />
                    <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke={slaColor} strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${(slaRate / 100) * 220} 220`} style={{ transition:'stroke-dasharray .8s' }} />
                    <text x="90" y="78" textAnchor="middle" fontSize="28" fontWeight="600" fill={slaColor} fontFamily="DM Mono">{slaRate}%</text>
                    <text x="90" y="95" textAnchor="middle" fontSize="10" fill="#8b8d9a">compliance</text>
                  </svg>
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:24, marginTop:12, fontSize:12, color:'var(--text2)' }}>
                  <span>✓ Met: <strong style={{ color:'var(--green)' }}>{slaMet.length}</strong></span>
                  <span>✗ Breached: <strong style={{ color:'var(--red)' }}>{slaBreached.length}</strong></span>
                </div>
              </div>
            </div>

            <div className={s.card}>
              <p className={s.cardTitle}>P1 critical SLA rate</p>
              <p className={s.cardSub}>{p1Tasks.length} P1 tickets this period</p>
              <div style={{ marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13 }}>P1 compliance</span>
                  <span style={{ fontFamily:'var(--mono)', fontWeight:600, color: p1SlaRate >= 95 ? 'var(--green)' : 'var(--red)' }}>{p1SlaRate}%</span>
                </div>
                <div style={{ background:'rgba(255,255,255,.06)', borderRadius:6, height:10, overflow:'hidden', marginBottom:16 }}>
                  <div style={{ height:10, borderRadius:6, background: p1SlaRate >= 95 ? 'var(--green)' : 'var(--red)', width:`${p1SlaRate}%`, transition:'width .6s' }} />
                </div>
                {['P1','P2','P3','P4'].map(p => {
                  const pt = slaEligible.filter(t => t.priority === p)
                  const pr = pt.length ? Math.round((pt.filter(t => t.sla_met).length / pt.length) * 100) : 0
                  const pc = pr >= 95 ? 'var(--green)' : pr >= 80 ? 'var(--amber)' : 'var(--red)'
                  return (
                    <div key={p} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <span style={{ fontFamily:'var(--mono)', fontSize:11, width:20, fontWeight:700, color: p==='P1'?'var(--red)':p==='P2'?'var(--amber)':p==='P3'?'var(--accent)':'var(--green)' }}>{p}</span>
                      <div style={{ flex:1, background:'rgba(255,255,255,.06)', borderRadius:4, height:6, overflow:'hidden' }}>
                        <div style={{ height:6, background:pc, borderRadius:4, width:`${pr}%`, transition:'width .5s' }} />
                      </div>
                      <span style={{ fontFamily:'var(--mono)', fontSize:11, color:pc, width:32, textAlign:'right' }}>{pr}%</span>
                      <span style={{ fontSize:11, color:'var(--text3)', width:50 }}>{pt.length} tickets</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className={s.grid2}>
            <div className={s.card}>
              <p className={s.cardTitle}>SLA rate by category</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={catChartData} barCategoryGap="35%">
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill:'#8b8d9a', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,100]} tick={{ fill:'#8b8d9a', fontSize:10 }} axisLine={false} tickLine={false} width={28} tickFormatter={v => v+'%'} />
                  <Tooltip content={<TT />} cursor={{ fill:'rgba(255,255,255,.04)' }} />
                  <Bar dataKey="slaRate" name="SLA %" radius={[4,4,0,0]}>
                    {catChartData.map((c,i) => <Cell key={i} fill={c.slaRate >= 95 ? '#34d399' : c.slaRate >= 80 ? '#fbbf24' : '#f87171'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={s.card}>
              <p className={s.cardTitle}>SLA rate by assignee</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={assChartData} barCategoryGap="35%">
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill:'#8b8d9a', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,100]} tick={{ fill:'#8b8d9a', fontSize:10 }} axisLine={false} tickLine={false} width={28} tickFormatter={v => v+'%'} />
                  <Tooltip content={<TT />} cursor={{ fill:'rgba(255,255,255,.04)' }} />
                  <Bar dataKey="slaRate" name="SLA %" radius={[4,4,0,0]}>
                    {assChartData.map((a,i) => <Cell key={i} fill={a.slaRate >= 95 ? '#34d399' : a.slaRate >= 80 ? '#fbbf24' : '#f87171'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breach / at-risk table */}
          <div className={s.card}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <p className={s.cardTitle}>
                  {view === 'at_risk' ? 'At-risk tickets' : 'SLA breached tickets'}
                </p>
                <p className={s.cardSub}>
                  {view === 'at_risk'
                    ? `${atRisk.length} open tickets at ≥80% of SLA target`
                    : `${slaBreached.length} tickets that missed SLA`}
                </p>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button className={`${s.chip} ${view==='breached'?s.chipActive:''}`} onClick={() => setView('breached')}>
                  Breached ({slaBreached.length})
                </button>
                <button className={`${s.chip} ${view==='at_risk'?s.chipActive:''}`} onClick={() => setView('at_risk')}>
                  At risk ({atRisk.length})
                </button>
              </div>
            </div>

            <table className={s.table}>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Category</th>
                  {view === 'at_risk' ? <><th>Hours open</th><th>SLA target</th><th>Risk %</th></> : <><th>Res. time</th><th>SLA target</th><th>Overdue by</th></>}
                </tr>
              </thead>
              <tbody>
                {tableTickets.slice(0,30).map(t => {
                  const ho  = hoursOpen(t)
                  const rp  = riskPct(t)
                  const ovr = t.resolution_time_hrs && t.sla_target_hrs ? +(t.resolution_time_hrs - t.sla_target_hrs).toFixed(1) : null
                  const PRIORITY_COLORS = { P1:'#f87171', P2:'#fbbf24', P3:'#6c8fff', P4:'#34d399' }
                  return (
                    <tr key={t.ticket_id}>
                      <td className={s.mono} style={{ fontSize:11 }}>{t.ticket_id}</td>
                      <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={t.title}>{t.title}</td>
                      <td><span className={s.badge} style={{ background:`${PRIORITY_COLORS[t.priority]}18`, color:PRIORITY_COLORS[t.priority] }}>{t.priority}</span></td>
                      <td className={s.muted}>{t.assignee_name || '—'}</td>
                      <td><span className={`${s.badge} ${s.badgeBlue}`}>{t.category}</span></td>
                      {view === 'at_risk' ? (
                        <>
                          <td className={s.mono}>{ho != null ? `${ho}h` : '—'}</td>
                          <td className={s.mono}>{t.sla_target_hrs ? `${t.sla_target_hrs}h` : '—'}</td>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <div style={{ width:50, height:5, background:'rgba(255,255,255,.06)', borderRadius:3, overflow:'hidden' }}>
                                <div style={{ height:5, borderRadius:3, width:`${rp}%`, background: rp >= 100 ? 'var(--red)' : 'var(--amber)' }} />
                              </div>
                              <span style={{ fontFamily:'var(--mono)', fontSize:11, color: rp >= 100 ? 'var(--red)' : 'var(--amber)', fontWeight:600 }}>{rp}%</span>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={s.mono}>{t.resolution_time_hrs ? `${t.resolution_time_hrs}h` : '—'}</td>
                          <td className={s.mono}>{t.sla_target_hrs ? `${t.sla_target_hrs}h` : '—'}</td>
                          <td className={s.mono} style={{ color:'var(--red)', fontWeight:600 }}>{ovr != null ? `+${ovr}h` : '—'}</td>
                        </>
                      )}
                    </tr>
                  )
                })}
                {!tableTickets.length && <tr><td colSpan={8} className={s.empty}>{view === 'at_risk' ? 'No at-risk tickets' : 'No SLA breaches'} — great work!</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

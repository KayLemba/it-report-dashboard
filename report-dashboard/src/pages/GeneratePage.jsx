import React, { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { calcKPIs, calcByCategory, calcByAssignee } from '../lib/kpi'
import { generatePDF } from '../lib/pdfGenerator'
import s from './shared.module.css'

function monthTag(offset = 0) {
  const d = new Date(); d.setMonth(d.getMonth() - offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const REPORT_SECTIONS = [
  { id:'cover',     label:'Cover page',            desc:'Title, period, date',     required:true },
  { id:'kpi',       label:'Executive KPI summary', desc:'8 top-line metrics',      required:true },
  { id:'category',  label:'Category breakdown',    desc:'Per category stats' },
  { id:'priority',  label:'Priority breakdown',    desc:'P1–P4 distribution' },
  { id:'assignee',  label:'Assignee performance',  desc:'Per-technician table' },
  { id:'ticketlog', label:'Full ticket log',        desc:'Every ticket listed' },
]

export default function GeneratePage() {
  const [periodTag,   setPeriodTag]   = useState(monthTag(0))
  const [sections,    setSections]    = useState({ cover:true, kpi:true, category:true, priority:true, assignee:true, ticketlog:true })
  const [generatedBy, setGeneratedBy] = useState('')
  const [generating,  setGenerating]  = useState(false)
  const [genError,    setGenError]    = useState(null)
  const [lastGen,     setLastGen]     = useState(null)

  const { tasks, kpis, byCategory, byAssignee, loading } = useTasks({ periodTag })

  async function handleGenerate() {
    if (!tasks.length) {
      setGenError('No tickets for this period. Add tickets on the Tickets page first.')
      return
    }
    setGenerating(true)
    setGenError(null)
    try {
      const periodLabel = new Date(periodTag + '-01').toLocaleDateString('en-GB', { month:'long', year:'numeric' })
      await generatePDF({ tasks, periodLabel, generatedBy: generatedBy || 'IT Report Dashboard' })
      setLastGen({ time: new Date().toLocaleTimeString(), period: periodTag, count: tasks.length })
    } catch(err) {
      console.error('[PDF]', err)
      setGenError(`Failed: ${err.message || String(err)}`)
    } finally {
      setGenerating(false)
    }
  }

  const periodLabel = new Date(periodTag + '-01').toLocaleDateString('en-GB', { month:'long', year:'numeric' })

  return (
    <div className={s.page}>
      <div className={s.topBar}>
        <div>
          <h1 className={s.title}>Generate PDF Report</h1>
          <p className={s.sub}>Configure and export a full IT department report</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:16, alignItems:'start' }}>

        {/* Left: config */}
        <div>
          <div className={s.card}>
            <p className={s.cardTitle}>Report period</p>
            <p className={s.cardSub}>Which month to include</p>
            <select className={s.select} style={{ width:'100%' }} value={periodTag} onChange={e => setPeriodTag(e.target.value)}>
              {[0,1,2,3].map(i => {
                const tag = monthTag(i)
                const lbl = new Date(tag+'-01').toLocaleDateString('en-GB',{month:'long',year:'numeric'})
                return <option key={tag} value={tag}>{lbl}</option>
              })}
            </select>
          </div>

          <div className={s.card}>
            <p className={s.cardTitle}>Report sections</p>
            <p className={s.cardSub}>{Object.values(sections).filter(Boolean).length} of {REPORT_SECTIONS.length} selected</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {REPORT_SECTIONS.map((sec, i) => (
                <div key={sec.id}
                  onClick={() => !sec.required && setSections(p => ({ ...p, [sec.id]: !p[sec.id] }))}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:8,
                    border:`1px solid ${sections[sec.id] ? 'rgba(108,143,255,.3)' : 'var(--border)'}`,
                    background: sections[sec.id] ? 'rgba(108,143,255,.06)' : 'var(--bg3)',
                    cursor: sec.required ? 'default' : 'pointer', transition:'all .15s' }}>
                  <div style={{ width:20, height:20, borderRadius:5, flexShrink:0,
                    background: sections[sec.id] ? 'var(--accent2)' : 'rgba(255,255,255,.06)',
                    border:`1px solid ${sections[sec.id] ? 'var(--accent2)' : 'var(--border2)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff' }}>
                    {sections[sec.id] && '✓'}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:500 }}>
                      {i+1}. {sec.label}
                      {sec.required && <span style={{ fontSize:10, color:'var(--text3)', marginLeft:6 }}>required</span>}
                    </p>
                    <p style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{sec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={s.card}>
            <p className={s.cardTitle}>Generated by</p>
            <input
              style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)', padding:'8px 12px', borderRadius:8, fontSize:13, fontFamily:'var(--font)', outline:'none' }}
              placeholder="e.g. IT Manager, John Smith…"
              value={generatedBy}
              onChange={e => setGeneratedBy(e.target.value)}
            />
          </div>
        </div>

        {/* Right: preview + generate */}
        <div>
          <div className={s.card}>
            <p className={s.cardTitle}>Data preview — {periodLabel}</p>
            <p className={s.cardSub}>{loading ? 'Loading…' : `${tasks.length} tickets loaded`}</p>

            {loading
              ? <div style={{ textAlign:'center', padding:20 }}><span className={s.spinner}/></div>
              : tasks.length === 0
              ? (
                <div className={s.empty}>
                  <i className="ti ti-inbox" style={{ fontSize:32, display:'block', marginBottom:8 }}/>
                  No tickets for {periodLabel}.<br/>
                  Go to the <strong>Tickets page</strong> and add tickets first.
                </div>
              )
              : (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                    {[
                      { label:'Total tickets',   val:kpis.total,               color:'var(--accent)' },
                      { label:'Completed',        val:kpis.completed,           color:'var(--green)' },
                      { label:'Completion rate',  val:`${kpis.completionRate}%`, color:'var(--accent)' },
                      { label:'SLA compliance',   val:`${kpis.slaRate}%`,       color:kpis.slaRate>=95?'var(--green)':'var(--red)' },
                      { label:'Avg resolution',   val:kpis.avgResTime?`${kpis.avgResTime}h`:'—', color:'var(--purple)' },
                      { label:'P1 incidents',     val:kpis.p1Count,             color:kpis.p1Count>5?'var(--red)':'var(--text2)' },
                    ].map(m => (
                      <div key={m.label} style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 12px' }}>
                        <p style={{ fontSize:11, color:'var(--text2)', marginBottom:3 }}>{m.label}</p>
                        <p style={{ fontSize:18, fontWeight:600, fontFamily:'var(--mono)', color:m.color }}>{m.val}</p>
                      </div>
                    ))}
                  </div>

                  {byCategory.length > 0 && (
                    <div style={{ marginBottom:12 }}>
                      <p style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.6, fontWeight:600, marginBottom:8 }}>Categories</p>
                      {byCategory.map(c => (
                        <div key={c.name} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, fontSize:12 }}>
                          <span style={{ flex:1 }}>{c.name}</span>
                          <span style={{ color:'var(--text2)', fontFamily:'var(--mono)' }}>{c.total} tasks</span>
                          <span style={{ fontFamily:'var(--mono)', fontWeight:600, color:c.slaRate>=95?'var(--green)':c.slaRate>=80?'var(--amber)':'var(--red)' }}>{c.slaRate}% SLA</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {byAssignee.length > 0 && (
                    <div>
                      <p style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.6, fontWeight:600, marginBottom:8 }}>Assignees</p>
                      {byAssignee.slice(0,5).map(a => (
                        <div key={a.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, fontSize:12 }}>
                          <span style={{ flex:1 }}>{a.name}</span>
                          <span style={{ color:'var(--text2)', fontFamily:'var(--mono)' }}>{a.tasks} tasks</span>
                          <span style={{ fontFamily:'var(--mono)', fontWeight:600, color:a.slaRate>=95?'var(--green)':'var(--amber)' }}>{a.slaRate}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            }
          </div>

          {genError && (
            <div className={s.error} style={{ marginBottom:12 }}>
              <i className="ti ti-alert-circle"/> {genError}
            </div>
          )}

          {lastGen && (
            <div style={{ background:'rgba(52,211,153,.08)', border:'1px solid rgba(52,211,153,.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--green)', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
              <i className="ti ti-circle-check"/> Report downloaded at {lastGen.time} · {lastGen.count} tickets · {lastGen.period}
            </div>
          )}

          <button
            className={s.btnPrimary}
            style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:14 }}
            onClick={handleGenerate}
            disabled={generating || loading || !tasks.length}
          >
            {generating
              ? <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .8s linear infinite', display:'inline-block', marginRight:8 }}/> Generating…</>
              : <><i className="ti ti-file-description"/> Generate PDF — {periodLabel}</>
            }
          </button>

          {!tasks.length && !loading && (
            <p style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:8 }}>
              Add tickets on the Tickets page for {periodLabel} first
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { getAssignees, deleteAssignee } from '../lib/dataService'
import { useTasks } from '../hooks/useTasks'
import { calcByAssignee } from '../lib/kpi'
import AssigneeModal from '../components/forms/AssigneeModal'
import ConfirmDelete from '../components/forms/ConfirmDelete'
import s from './shared.module.css'

const AVATAR_COLORS = ['#6c8fff','#34d399','#fbbf24','#a78bfa','#2dd4bf','#f87171','#fb923c']

function monthTag(offset=0) {
  const d = new Date(); d.setMonth(d.getMonth()-offset)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}

function initials(name) {
  return (name || '').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
}

export default function AssigneesPage() {
  const [assignees,    setAssignees]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [showModal,    setShowModal]    = useState(false)
  const [editItem,     setEditItem]     = useState(null)
  const [delItem,      setDelItem]      = useState(null)
  const [selectedId,   setSelectedId]   = useState(null)
  const [periodTag,    setPeriodTag]    = useState(monthTag(0))
  const [search,       setSearch]       = useState('')

  const { tasks } = useTasks({ periodTag })
  const perfData  = calcByAssignee(tasks)

  function load() {
    setLoading(true)
    getAssignees()
      .then(data => { setAssignees(data); setLoading(false) })
      .catch(err  => { setError(err.message); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function handleDelete() {
    if (!delItem) return
    try {
      await deleteAssignee(delItem.id)
      if (selectedId === delItem.id) setSelectedId(null)
      setDelItem(null)
      load()
    } catch (err) {
      console.error(err)
      setDelItem(null)
    }
  }

  function openEdit(a, e) {
    e && e.stopPropagation()
    setEditItem(a)
    setShowModal(true)
  }

  function openNew() {
    setEditItem(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditItem(null)
  }

  function toggleSelect(id) {
    setSelectedId(prev => prev === id ? null : id)
  }

  const filtered = assignees.filter(a =>
    !search ||
    (a.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.team  || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.role  || '').toLowerCase().includes(search.toLowerCase())
  )

  const enriched = filtered.map((a, i) => {
    const perf  = perfData.find(p => p.name === a.full_name) || {}
    const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
    return { ...a, ...perf, color }
  })

  // Safe lookup — never crashes even if selectedId doesn't match
  const sel      = selectedId ? (enriched.find(a => a.id === selectedId) || null) : null
  const selTasks = sel ? tasks.filter(t => t.assignee_name === sel.full_name) : []

  return (
    <div className={s.page}>
      <div className={s.topBar}>
        <div>
          <h1 className={s.title}>Assignees</h1>
          <p className={s.sub}>{assignees.length} technicians registered</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <select className={s.select} value={periodTag} onChange={e => setPeriodTag(e.target.value)}>
            {[0,1,2].map(i => {
              const tag = monthTag(i)
              return (
                <option key={tag} value={tag}>
                  {new Date(tag+'-01').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}
                </option>
              )
            })}
          </select>
          <button className={s.btnPrimary} onClick={openNew}>
            <i className="ti ti-plus"/> Add technician
          </button>
        </div>
      </div>

      {loading && <div style={{ padding:40, textAlign:'center' }}><span className={s.spinner}/></div>}
      {error   && <div className={s.error}><i className="ti ti-alert-circle"/> {error}</div>}

      {!loading && !error && (
        <div style={{ display:'grid', gridTemplateColumns: sel ? '1fr 360px' : '1fr', gap:14, alignItems:'start' }}>

          {/* ── Left: list ── */}
          <div>
            <div className={s.card} style={{ marginBottom:14 }}>
              <div className={s.searchWrap}>
                <i className="ti ti-search"/>
                <input
                  className={s.search}
                  style={{ width:'100%' }}
                  placeholder="Search name, team, role…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className={s.card}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Technician</th>
                    <th>Team</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Tasks</th>
                    <th>SLA %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enriched.map(a => {
                    const isSel    = selectedId === a.id
                    const slaColor = (a.slaRate||0)>=95 ? 'var(--green)' : (a.slaRate||0)>=80 ? 'var(--amber)' : a.slaRate!=null ? 'var(--red)' : 'var(--text3)'
                    return (
                      <tr
                        key={a.id}
                        onClick={() => toggleSelect(a.id)}
                        style={{ cursor:'pointer', background: isSel ? 'rgba(108,143,255,.08)' : '' }}
                      >
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div className={s.avatar} style={{ background:`${a.color}22`, color:a.color }}>
                              {initials(a.full_name)}
                            </div>
                            <span style={{ fontWeight: isSel ? 600 : 400 }}>{a.full_name}</span>
                          </div>
                        </td>
                        <td className={s.muted}>{a.team  || '—'}</td>
                        <td className={s.muted} style={{ fontSize:12 }}>{a.role  || '—'}</td>
                        <td className={s.muted} style={{ fontSize:12 }}>{a.email || '—'}</td>
                        <td className={s.mono}>{a.tasks ?? '—'}</td>
                        <td>
                          {a.slaRate != null
                            ? <span style={{ fontFamily:'var(--mono)', fontSize:12, color:slaColor, fontWeight:600 }}>{a.slaRate}%</span>
                            : <span style={{ color:'var(--text3)', fontSize:12 }}>No data</span>
                          }
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display:'flex', gap:4 }}>
                            <button
                              onClick={e => openEdit(a, e)}
                              title="Edit"
                              style={{ background:'rgba(108,143,255,.1)', border:'none', color:'var(--accent)', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <i className="ti ti-edit"/>
                            </button>
                            <button
                              onClick={() => setDelItem(a)}
                              title="Delete"
                              style={{ background:'rgba(248,113,113,.1)', border:'none', color:'var(--red)', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <i className="ti ti-trash"/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!enriched.length && (
                    <tr>
                      <td colSpan={7} className={s.empty}>
                        {assignees.length === 0
                          ? 'No technicians yet — click "Add technician" to get started'
                          : 'No technicians match your search'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Right: detail panel (only when sel is non-null) ── */}
          {sel && (
            <div>
              <div className={s.card}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div className={s.avatar} style={{ width:44, height:44, fontSize:16, background:`${sel.color}22`, color:sel.color }}>
                      {initials(sel.full_name)}
                    </div>
                    <div>
                      <p style={{ fontWeight:600, fontSize:15 }}>{sel.full_name}</p>
                      <p style={{ fontSize:12, color:'var(--text2)' }}>{sel.role || 'Technician'} · {sel.team || '—'}</p>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button
                      onClick={() => openEdit(sel)}
                      style={{ background:'rgba(108,143,255,.1)', border:'none', color:'var(--accent)', padding:'5px 10px', borderRadius:7, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                      <i className="ti ti-edit"/> Edit
                    </button>
                    <button
                      onClick={() => setSelectedId(null)}
                      style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text2)', width:28, height:28, borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <i className="ti ti-x"/>
                    </button>
                  </div>
                </div>

                {/* Email */}
                {sel.email && (
                  <div style={{ background:'var(--bg3)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--text2)', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                    <i className="ti ti-mail" style={{ color:'var(--accent)' }}/> {sel.email}
                  </div>
                )}

                {/* Performance stats */}
                <p style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.6, fontWeight:600, marginBottom:8 }}>
                  Performance — {new Date(periodTag+'-01').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                  {[
                    { label:'Assigned',    val: sel.tasks ?? '—' },
                    { label:'Completed',   val: sel.done  ?? '—' },
                    { label:'Completion',  val: sel.completionRate != null ? `${sel.completionRate}%` : '—' },
                    { label:'Avg time',    val: sel.avgTime != null ? `${sel.avgTime}h` : '—' },
                    { label:'SLA rate',    val: sel.slaRate != null ? `${sel.slaRate}%` : '—',
                      color: (sel.slaRate||0)>=95 ? 'var(--green)' : (sel.slaRate||0)>=80 ? 'var(--amber)' : 'var(--red)' },
                    { label:'P1 handled',  val: sel.p1 ?? '—',
                      color: (sel.p1||0) > 0 ? 'var(--red)' : 'var(--text)' },
                  ].map(m => (
                    <div key={m.label} style={{ background:'var(--bg3)', borderRadius:8, padding:'8px 10px' }}>
                      <p style={{ fontSize:10, color:'var(--text2)', marginBottom:3 }}>{m.label}</p>
                      <p style={{ fontSize:16, fontWeight:600, fontFamily:'var(--mono)', color:m.color||'var(--text)' }}>{m.val}</p>
                    </div>
                  ))}
                </div>

                {/* Their tickets */}
                <p style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.6, fontWeight:600, marginBottom:8 }}>
                  Recent tickets ({selTasks.length})
                </p>
                <div style={{ maxHeight:260, overflowY:'auto' }}>
                  <table className={s.table}>
                    <thead>
                      <tr><th>ID</th><th>Title</th><th>Pri</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {selTasks.slice(0, 20).map(t => {
                        const PC = { P1:'#f87171', P2:'#fbbf24', P3:'#6c8fff', P4:'#34d399' }
                        return (
                          <tr key={`${t.ticket_id}-${t.period_tag}`}>
                            <td className={s.mono} style={{ fontSize:11 }}>{t.ticket_id}</td>
                            <td style={{ fontSize:12, maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={t.title}>{t.title}</td>
                            <td>
                              <span className={s.badge} style={{ background:`${PC[t.priority]||'#6c8fff'}22`, color:PC[t.priority]||'#6c8fff', fontSize:10 }}>
                                {t.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`${s.badge} ${t.status==='done'?s.badgeGreen:t.status==='in_progress'?s.badgeBlue:s.badgeAmber}`} style={{ fontSize:10 }}>
                                {t.status==='done'?'Done':t.status==='in_progress'?'In Prog':'Open'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      {!selTasks.length && (
                        <tr><td colSpan={4} className={s.empty} style={{ padding:'14px 0' }}>No tickets this period</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <AssigneeModal
          assignee={editItem}
          onClose={closeModal}
          onSaved={() => { load(); closeModal() }}
        />
      )}

      {delItem !== null && (
        <ConfirmDelete
          title="Remove technician?"
          message={`This will remove "${delItem.full_name}" from the system. Their existing tickets will not be deleted.`}
          onConfirm={handleDelete}
          onClose={() => setDelItem(null)}
        />
      )}
    </div>
  )
}

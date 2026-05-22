import React, { useState, useMemo, useEffect } from 'react'
import { useTasks } from '../hooks/useTasks'
import { deleteTicket, getAssignees } from '../lib/dataService'
import TicketModal   from '../components/forms/TicketModal'
import ConfirmDelete from '../components/forms/ConfirmDelete'
import s from './shared.module.css'

const PRIORITY_COLORS = { P1:'#f87171', P2:'#fbbf24', P3:'#6c8fff', P4:'#34d399' }
const STATUS_LABELS   = { done:'Done', open:'Open', in_progress:'In Progress' }
const STATUS_CLS      = { done:'badgeGreen', open:'badgeAmber', in_progress:'badgeBlue' }
const CATEGORIES      = ['Helpdesk','Network','Security','Hardware','Software']
const PRIORITIES      = ['P1','P2','P3','P4']
const STATUSES        = ['open','in_progress','done']

function monthTag(offset=0) {
  const d = new Date(); d.setMonth(d.getMonth()-offset)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}

export default function TicketsPage() {
  const [search,     setSearch]     = useState('')
  const [category,   setCategory]   = useState('')
  const [priority,   setPriority]   = useState('')
  const [status,     setStatus]     = useState('')
  const [periodTag,  setPeriodTag]  = useState(monthTag(0))
  const [sortCol,    setSortCol]    = useState('created_at')
  const [sortDir,    setSortDir]    = useState('desc')
  const [page,       setPage]       = useState(1)
  const [showModal,  setShowModal]  = useState(false)
  const [editTicket, setEditTicket] = useState(null)
  const [delTicket,  setDelTicket]  = useState(null)
  const [assignees,  setAssignees]  = useState([])
  const [deleting,   setDeleting]   = useState(false)
  const PER_PAGE = 20

  const { tasks, loading, error, refetch } = useTasks({
    periodTag,
    category: category || undefined,
    priority: priority || undefined,
    status:   status   || undefined,
  })

  useEffect(() => {
    getAssignees().then(setAssignees).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    let t = tasks
    if (search) {
      const q = search.toLowerCase()
      t = t.filter(x =>
        x.ticket_id?.toLowerCase().includes(q) ||
        x.title?.toLowerCase().includes(q) ||
        x.assignee_name?.toLowerCase().includes(q) ||
        x.category?.toLowerCase().includes(q)
      )
    }
    return [...t].sort((a, b) => {
      const av = a[sortCol] ?? ''
      const bv = b[sortCol] ?? ''
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
  }, [tasks, search, sortCol, sortDir])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const visible    = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function sort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setPage(1)
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <i className="ti ti-selector" style={{ opacity:.3, marginLeft:4 }}/>
    return <i className={`ti ti-chevron-${sortDir==='asc'?'up':'down'}`} style={{ marginLeft:4, color:'var(--accent)' }}/>
  }

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
  }

  async function handleDelete() {
    if (!delTicket) return
    setDeleting(true)
    try {
      await deleteTicket(delTicket.ticket_id, delTicket.period_tag)
      setDelTicket(null)
      refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  function openEdit(ticket) { setEditTicket(ticket); setShowModal(true) }
  function openNew()        { setEditTicket(null);   setShowModal(true) }
  function closeModal()     { setShowModal(false);   setEditTicket(null) }

  const total  = tasks.length
  const open   = tasks.filter(t => t.status === 'open').length
  const inProg = tasks.filter(t => t.status === 'in_progress').length
  const done   = tasks.filter(t => t.status === 'done').length

  return (
    <div className={s.page}>
      <div className={s.topBar}>
        <div>
          <h1 className={s.title}>All Tickets</h1>
          <p className={s.sub}>{total} tickets · {open} open · {inProg} in progress · {done} done</p>
        </div>
        <button className={s.btnPrimary} onClick={openNew}>
          <i className="ti ti-plus" /> New ticket
        </button>
      </div>

      {/* Quick stats */}
      <div className={s.kpiGrid} style={{ marginBottom:16 }}>
        {[
          { label:'Total tickets', val:total,  color:'#6c8fff', icon:'ti-ticket' },
          { label:'Open',          val:open,   color:'#fbbf24', icon:'ti-clock' },
          { label:'In progress',   val:inProg, color:'#a78bfa', icon:'ti-loader' },
          { label:'Completed',     val:done,   color:'#34d399', icon:'ti-circle-check' },
        ].map(k => (
          <div key={k.label} className={s.kpiCard}>
            <div className={s.kpiTop}>
              <div className={s.kpiIcon} style={{ background:`${k.color}22`, color:k.color }}>
                <i className={`ti ${k.icon}`}/>
              </div>
            </div>
            <div className={s.kpiVal} style={{ color:k.color }}>{k.val}</div>
            <div className={s.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={s.card} style={{ marginBottom:14 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div className={s.searchWrap}>
            <i className="ti ti-search"/>
            <input
              className={s.search}
              placeholder="Search ID, title, assignee…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select className={s.select} value={periodTag} onChange={e => { setPeriodTag(e.target.value); setPage(1) }}>
            {[0,1,2,3].map(i => {
              const tag = monthTag(i)
              return <option key={tag} value={tag}>{new Date(tag+'-01').toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</option>
            })}
          </select>
          <select className={s.select} value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={s.select} value={priority} onChange={e => { setPriority(e.target.value); setPage(1) }}>
            <option value="">All priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className={s.select} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All statuses</option>
            {STATUSES.map(st => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
          </select>
          {(search || category || priority || status) && (
            <button className={s.btnGhost} onClick={() => { setSearch(''); setCategory(''); setPriority(''); setStatus(''); setPage(1) }}>
              <i className="ti ti-x"/> Clear
            </button>
          )}
        </div>
      </div>

      {loading && <div style={{ padding:40, textAlign:'center' }}><span className={s.spinner}/></div>}
      {error   && <div className={s.error}><i className="ti ti-alert-circle"/> {error}</div>}

      {!loading && !error && (
        <div className={s.card}>
          <div style={{ overflowX:'auto' }}>
            <table className={s.table}>
              <thead>
                <tr>
                  {[
                    ['ticket_id','ID'],['title','Title'],['category','Category'],
                    ['priority','Priority'],['status','Status'],['assignee_name','Assignee'],
                    ['created_at','Opened'],['resolution_time_hrs','Res. Time'],['sla_met','SLA'],
                  ].map(([col,lbl]) => (
                    <th key={col} style={{ cursor:'pointer' }} onClick={() => sort(col)}>
                      {lbl}<SortIcon col={col}/>
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(t => (
                  <tr key={`${t.ticket_id}-${t.period_tag}`}>
                    <td><span className={s.mono} style={{ fontSize:11 }}>{t.ticket_id}</span></td>
                    <td>
                      <span style={{ display:'block', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={t.title}>
                        {t.title}
                      </span>
                    </td>
                    <td><span className={`${s.badge} ${s.badgeBlue}`}>{t.category}</span></td>
                    <td>
                      <span className={s.badge} style={{ background:`${PRIORITY_COLORS[t.priority] || '#6c8fff'}22`, color:PRIORITY_COLORS[t.priority] || '#6c8fff' }}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`${s.badge} ${s[STATUS_CLS[t.status] || 'badgeAmber']}`}>
                        {STATUS_LABELS[t.status] || t.status}
                      </span>
                    </td>
                    <td className={s.muted}>{t.assignee_name || '—'}</td>
                    <td className={s.mono} style={{ fontSize:11 }}>{fmtDate(t.created_at)}</td>
                    <td className={s.mono}>{t.resolution_time_hrs != null ? `${t.resolution_time_hrs}h` : '—'}</td>
                    <td style={{ textAlign:'center', fontWeight:600,
                      color: t.sla_met === true ? 'var(--green)' : t.sla_met === false ? 'var(--red)' : 'var(--text3)' }}>
                      {t.sla_met === true ? '✓' : t.sla_met === false ? '✗' : '—'}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button
                          onClick={() => openEdit(t)}
                          title="Edit ticket"
                          style={{ background:'rgba(108,143,255,.1)', border:'none', color:'var(--accent)', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <i className="ti ti-edit"/>
                        </button>
                        <button
                          onClick={() => setDelTicket(t)}
                          title="Delete ticket"
                          style={{ background:'rgba(248,113,113,.1)', border:'none', color:'var(--red)', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <i className="ti ti-trash"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td colSpan={10} className={s.empty}>
                      {tasks.length === 0
                        ? 'No tickets yet — click "New ticket" to add your first one'
                        : 'No tickets match your filters'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:14, borderTop:'1px solid var(--border)', marginTop:8 }}>
              <span style={{ fontSize:12, color:'var(--text2)' }}>Page {page} of {totalPages} · {filtered.length} tickets</span>
              <div style={{ display:'flex', gap:6 }}>
                <button className={s.btnGhost} style={{ padding:'5px 10px' }} disabled={page===1} onClick={() => setPage(p => p-1)}>
                  <i className="ti ti-chevron-left"/>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page-2, totalPages-4)) + i
                  return (
                    <button key={p}
                      className={`${s.btnGhost} ${p===page ? s.chipActive : ''}`}
                      style={{ padding:'5px 10px', minWidth:32 }}
                      onClick={() => setPage(p)}>
                      {p}
                    </button>
                  )
                })}
                <button className={s.btnGhost} style={{ padding:'5px 10px' }} disabled={page===totalPages} onClick={() => setPage(p => p+1)}>
                  <i className="ti ti-chevron-right"/>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals — only render when needed */}
      {showModal && (
        <TicketModal
          ticket={editTicket}
          assignees={assignees}
          onClose={closeModal}
          onSaved={() => { refetch(); closeModal() }}
        />
      )}

      {delTicket !== null && (
        <ConfirmDelete
          title="Delete this ticket?"
          message={`Permanently delete "${delTicket.title}" (${delTicket.ticket_id})? This cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDelTicket(null)}
        />
      )}
    </div>
  )
}

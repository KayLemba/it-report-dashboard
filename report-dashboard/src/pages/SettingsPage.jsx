import React, { useState, useEffect } from 'react'
import { getDepartments, deleteDepartment } from '../lib/dataService'
import DepartmentModal from '../components/forms/DepartmentModal'
import ConfirmDelete   from '../components/forms/ConfirmDelete'
import s from './shared.module.css'

export default function SettingsPage() {
  const [departments,   setDepartments]   = useState([])
  const [loadingDepts,  setLoadingDepts]  = useState(true)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [editDept,      setEditDept]      = useState(null)
  const [delDept,       setDelDept]       = useState(null)
  const [slaTargets,    setSlaTargets]    = useState({ P1:4, P2:8, P3:24, P4:72 })
  const [orgName,       setOrgName]       = useState('IT Department')
  const [saved,         setSaved]         = useState(false)

  useEffect(() => {
    try {
      const sl = localStorage.getItem('it_sla_targets')
      if (sl) setSlaTargets(JSON.parse(sl))
      const on = localStorage.getItem('it_org_name')
      if (on) setOrgName(on)
    } catch {}
    loadDepts()
  }, [])

  function loadDepts() {
    setLoadingDepts(true)
    getDepartments()
      .then(data => { setDepartments(data); setLoadingDepts(false) })
      .catch(() => setLoadingDepts(false))
  }

  async function handleDeleteDept() {
    await deleteDepartment(delDept.id)
    setDelDept(null)
    loadDepts()
  }

  function saveSettings() {
    localStorage.setItem('it_sla_targets', JSON.stringify(slaTargets))
    localStorage.setItem('it_org_name', orgName)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const PC = { P1:'#f87171', P2:'#fbbf24', P3:'#6c8fff', P4:'#34d399' }
  const PL = { P1:'Critical', P2:'High', P3:'Medium', P4:'Low' }

  return (
    <div className={s.page}>
      <div className={s.topBar}>
        <div>
          <h1 className={s.title}>Settings</h1>
          <p className={s.sub}>Configure preferences and manage departments</p>
        </div>
        <button className={s.btnPrimary} onClick={saveSettings}>
          {saved ? <><i className="ti ti-check"/> Saved!</> : <><i className="ti ti-device-floppy"/> Save settings</>}
        </button>
      </div>

      {saved && (
        <div style={{ background:'rgba(52,211,153,.08)', border:'1px solid rgba(52,211,153,.2)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'var(--green)', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
          <i className="ti ti-circle-check"/> Settings saved successfully
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

        <div className={s.card}>
          <p className={s.cardTitle}>Organisation</p>
          <p className={s.cardSub}>Appears on generated PDF reports</p>
          <label style={{ fontSize:11, color:'var(--text2)', fontWeight:600, textTransform:'uppercase', letterSpacing:.5, display:'block', marginBottom:5 }}>Organisation name</label>
          <input style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)', padding:'8px 12px', borderRadius:8, fontSize:13, fontFamily:'var(--font)', outline:'none' }} value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="e.g. IT Department"/>
        </div>

        <div className={s.card}>
          <p className={s.cardTitle}>SLA targets (hours)</p>
          <p className={s.cardSub}>Max resolution time before breach per priority</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {Object.entries(slaTargets).map(([p,hrs]) => (
              <div key={p} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ width:24, fontFamily:'var(--mono)', fontSize:12, fontWeight:700, color:PC[p] }}>{p}</span>
                <span style={{ flex:1, fontSize:13 }}>{PL[p]}</span>
                <input type="number" min={1} max={720}
                  style={{ width:72, background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--text)', padding:'6px 10px', borderRadius:7, fontSize:13, fontFamily:'var(--mono)', outline:'none', textAlign:'right' }}
                  value={hrs} onChange={e=>setSlaTargets(prev=>({...prev,[p]:Number(e.target.value)}))}/>
                <span style={{ fontSize:12, color:'var(--text2)', width:36 }}>{hrs<24?`${hrs}h`:`${(hrs/24).toFixed(hrs%24===0?0:1)}d`}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={s.card} style={{ gridColumn:'1/-1' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <p className={s.cardTitle}>Departments</p>
              <p className={s.cardSub}>Departments served by the IT team · {departments.length} registered</p>
            </div>
            <button className={s.btnPrimary} onClick={() => { setEditDept(null); setShowDeptModal(true) }}>
              <i className="ti ti-plus"/> Add department
            </button>
          </div>
          {loadingDepts
            ? <div style={{ padding:24, textAlign:'center' }}><span className={s.spinner}/></div>
            : (
              <table className={s.table}>
                <thead><tr><th>Department</th><th>Head</th><th>Email</th><th>Notes</th><th>Actions</th></tr></thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id}>
                      <td><span className={`${s.badge} ${s.badgeBlue}`}>{d.name}</span></td>
                      <td className={s.muted}>{d.head||'—'}</td>
                      <td className={s.muted} style={{ fontSize:12 }}>{d.email||'—'}</td>
                      <td className={s.muted} style={{ fontSize:12, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.notes||'—'}</td>
                      <td>
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={()=>{setEditDept(d);setShowDeptModal(true)}} style={{ background:'rgba(108,143,255,.1)', border:'none', color:'var(--accent)', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}><i className="ti ti-edit"/></button>
                          <button onClick={()=>setDelDept(d)} style={{ background:'rgba(248,113,113,.1)', border:'none', color:'var(--red)', width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}><i className="ti ti-trash"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!departments.length && <tr><td colSpan={5} className={s.empty}>No departments yet — click "Add department"</td></tr>}
                </tbody>
              </table>
            )
          }
        </div>

        <div className={s.card}>
          <p className={s.cardTitle}>Database connection</p>
          <p className={s.cardSub}>Your Supabase project</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'URL',    val: process.env.REACT_APP_SUPABASE_URL || 'Not configured' },
              { label:'Status', val: process.env.REACT_APP_SUPABASE_URL ? '● Connected' : '● Not configured' },
              { label:'Mode',   val: !process.env.REACT_APP_SUPABASE_URL ? 'Demo (mock data)' : 'Live (Supabase)' },
            ].map(r=>(
              <div key={r.label}>
                <p style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:.5, fontWeight:600, marginBottom:4 }}>{r.label}</p>
                <p style={{ fontFamily:'var(--mono)', fontSize:12, background:'var(--bg3)', padding:'6px 10px', borderRadius:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  color: r.label==='Status'?(r.val.includes('Connected')?'var(--green)':'var(--red)'):r.label==='Mode'?(r.val.includes('Demo')?'var(--amber)':'var(--green)'):'var(--text)' }}>
                  {r.val}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={s.card}>
          <p className={s.cardTitle}>About</p>
          <p className={s.cardSub}>IT Report Dashboard v1.0.0</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[['Stack','React + Vite + Supabase'],['Charts','Recharts'],['PDF','pdfmake'],['CSV','PapaParse']].map(([l,v])=>(
              <div key={l} style={{ display:'flex', gap:12, paddingBottom:8, borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                <span style={{ color:'var(--text2)', width:80, fontSize:12 }}>{l}</span>
                <span style={{ fontFamily:'var(--mono)', fontSize:12 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDeptModal && <DepartmentModal department={editDept} onClose={()=>{setShowDeptModal(false);setEditDept(null)}} onSaved={loadDepts}/>}
      {delDept && <ConfirmDelete title="Delete department?" message={`This will remove "${delDept.name}" permanently.`} onConfirm={handleDeleteDept} onClose={()=>setDelDept(null)}/>}
    </div>
  )
}

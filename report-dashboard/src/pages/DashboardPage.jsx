import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTasks } from '../hooks/useTasks'
import KPICard        from '../components/dashboard/KPICard'
import CategoryChart  from '../components/dashboard/CategoryChart'
import PriorityChart  from '../components/dashboard/PriorityChart'
import TrendChart     from '../components/dashboard/TrendChart'
import AssigneeTable  from '../components/dashboard/AssigneeTable'
import TicketLog      from '../components/dashboard/TicketLog'
import { generatePDF } from '../lib/pdfGenerator'
import styles from './DashboardPage.module.css'

const PERIOD_OPTIONS = [
  { label: 'This month', tag: currentMonthTag() },
  { label: 'Last month', tag: lastMonthTag() },
]

function currentMonthTag() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function lastMonthTag() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const CATEGORIES = ['Helpdesk', 'Network', 'Security', 'Hardware', 'Software']
const GRANULARITIES = [
  { value: 'day',   label: 'Daily' },
  { value: 'week',  label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const [periodTag,    setPeriodTag]    = useState(currentMonthTag())
  const [category,     setCategory]     = useState('')
  const [granularity,  setGranularity]  = useState('day')
  const [generating,   setGenerating]   = useState(false)
  const [genError,     setGenError]     = useState(null)

  const filters = { periodTag, category: category || undefined, granularity }
  const { tasks, kpis, byCategory, byPriority, byAssignee, timeSeries, loading, error, isMock } = useTasks(filters)

  async function handleGeneratePDF() {
    if (!tasks.length) return
    setGenerating(true)
    setGenError(null)
    try {
      const periodLabel = new Date(periodTag + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      const blob = await generatePDF({ tasks, periodLabel, generatedBy: 'IT Report Dashboard' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `IT_Report_${periodTag}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setGenError('PDF generation failed: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  const kpiCards = [
    { label: 'Tasks completed',  value: kpis.completed,        delta: `${kpis.completionRate}% rate`, deltaUp: kpis.completionRate >= 70, icon: 'check',  color: '#6c8fff' },
    { label: 'Avg resolution',   value: `${kpis.avgResTime}h`, delta: kpis.avgResTime < 5 ? 'Good' : 'High', deltaUp: kpis.avgResTime < 5, icon: 'clock',  color: '#34d399' },
    { label: 'Open incidents',   value: kpis.open + kpis.inProg, delta: kpis.p1Count > 0 ? `${kpis.p1Count} P1` : 'No P1s', deltaUp: kpis.p1Count === 0, icon: 'alert',  color: '#f87171' },
    { label: 'SLA compliance',   value: `${kpis.slaRate}%`,    delta: kpis.slaRate >= 95 ? 'On target' : `↓ ${95 - kpis.slaRate}% gap`, deltaUp: kpis.slaRate >= 95, icon: 'shield', color: '#fbbf24' },
  ]

  return (
    <div className={styles.page}>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>IT Department Dashboard</h1>
          <p className={styles.sub}>
            {isMock && <span className={styles.mockBadge}>DEMO DATA</span>}
            {tasks.length} tickets · {periodTag}
          </p>
        </div>
        <div className={styles.actions}>
          {/* Period picker */}
          <select className={styles.select} value={periodTag} onChange={e => setPeriodTag(e.target.value)}>
            {PERIOD_OPTIONS.map(o => (
              <option key={o.tag} value={o.tag}>{o.label} ({o.tag})</option>
            ))}
          </select>

          {/* Granularity */}
          <select className={styles.select} value={granularity} onChange={e => setGranularity(e.target.value)}>
            {GRANULARITIES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>

          {/* Upload */}
          <button className={styles.btnGhost} onClick={() => navigate('/upload')}>
            <i className="ti ti-upload" /> Upload CSV
          </button>

          {/* Generate PDF */}
          <button
            className={styles.btnPrimary}
            onClick={handleGeneratePDF}
            disabled={generating || !tasks.length}
          >
            {generating
              ? <><span className={styles.spinnerSm} /> Generating…</>
              : <><i className="ti ti-file-description" /> Generate PDF</>
            }
          </button>
        </div>
      </div>

      {genError && <div className={styles.error}><i className="ti ti-alert-circle" /> {genError}</div>}

      {/* Category filters */}
      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>Filter:</span>
        <button
          className={`${styles.chip} ${!category ? styles.chipActive : ''}`}
          onClick={() => setCategory('')}
        >All categories</button>
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`${styles.chip} ${category === c ? styles.chipActive : ''}`}
            onClick={() => setCategory(c === category ? '' : c)}
          >{c}</button>
        ))}
      </div>

      {/* Loading / error state */}
      {loading && (
        <div className={styles.loadingRow}>
          <span className={styles.spinner} />
          <span>Loading task data…</span>
        </div>
      )}

      {error && !loading && (
        <div className={styles.error}>
          <i className="ti ti-alert-circle" /> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* KPI row */}
          <div className={styles.kpiGrid}>
            {kpiCards.map(k => (
              <KPICard key={k.label} label={k.label} value={k.value} delta={k.delta} deltaUp={k.deltaUp} icon={k.icon} accentColor={k.color} />
            ))}
          </div>

          {/* Charts row */}
          <div className={styles.chartsRow}>
            <CategoryChart data={byCategory} />
            <PriorityChart priorities={byPriority} slaRate={kpis.slaRate} />
          </div>

          {/* Trend chart full width */}
          <div className={styles.trendRow}>
            <TrendChart data={timeSeries} granularity={granularity} />
          </div>

          {/* Bottom row */}
          <div className={styles.bottomRow}>
            <AssigneeTable assignees={byAssignee} />
            <TicketLog tickets={tasks} />
          </div>
        </>
      )}
    </div>
  )
}

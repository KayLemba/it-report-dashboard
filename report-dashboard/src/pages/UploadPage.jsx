import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUpload } from '../hooks/useUpload'
import { SCHEMA_FIELDS, FIELD_ALIASES } from '../lib/csvParser'
import styles from './UploadPage.module.css'

const FIELD_LABELS = {
  ticket_id:           'Ticket ID *',
  title:               'Title / Subject *',
  category:            'Category',
  priority:            'Priority',
  status:              'Status',
  assignee_name:       'Assignee Name',
  created_at:          'Date Created *',
  resolved_at:         'Date Resolved',
  resolution_time_hrs: 'Resolution Time (hrs)',
  sla_target_hrs:      'SLA Target (hrs)',
  sla_met:             'SLA Met?',
  notes:               'Notes',
}

const REQUIRED_FIELDS = ['ticket_id', 'title', 'created_at']

export default function UploadPage() {
  const navigate = useNavigate()
  const fileRef  = useRef()
  const [file, setFile]           = useState(null)
  const [periodTag, setPeriodTag] = useState(currentPeriodTag())
  const [dragOver, setDragOver]   = useState(false)

  const { stage, headers, mapping, setMapping, progress, error, batchInfo, handleFile, confirmUpload, reset } = useUpload()

  function currentPeriodTag() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) pickFile(f)
  }

  function pickFile(f) {
    if (!f.name.match(/\.(csv|xlsx|xls)$/i)) return alert('Please upload a .csv file.')
    setFile(f)
    handleFile(f, periodTag)
  }

  function updateMapping(field, csvCol) {
    setMapping(prev => ({ ...prev, [field]: csvCol || null }))
  }

  function canConfirm() {
    return REQUIRED_FIELDS.every(f => mapping[f])
  }

  async function submit() {
    try {
      await confirmUpload(mapping, periodTag)
    } catch (_) {}
  }

  // ── Render stages ─────────────────────────────────────────────────────────

  if (stage === 'done') return (
    <div className={styles.page}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}><i className="ti ti-circle-check" /></div>
        <h2>Upload complete</h2>
        <p>{batchInfo?.count} tickets imported for period <strong>{batchInfo?.periodTag}</strong></p>
        <p className={styles.batchId}>Batch ID: {batchInfo?.batchId}</p>
        <div className={styles.successActions}>
          <button className={styles.btnPrimary} onClick={() => navigate('/')}>View dashboard</button>
          <button className={styles.btnGhost} onClick={reset}>Upload another</button>
        </div>
      </div>
    </div>
  )

  if (stage === 'uploading') return (
    <div className={styles.page}>
      <div className={styles.uploadingCard}>
        <div className={styles.spinner} />
        <p className={styles.uploadingLabel}>Uploading {progress}%…</p>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )

  if (stage === 'mapping') return (
    <div className={styles.page}>
      <div className={styles.mapCard}>
        <div className={styles.mapHeader}>
          <div>
            <h2 className={styles.pageTitle}>Map your columns</h2>
            <p className={styles.pageSub}>
              Match your CSV headers to the report schema. Fields marked * are required.
              Auto-matched {Object.values(mapping).filter(Boolean).length} of {SCHEMA_FIELDS.length} fields.
            </p>
          </div>
          <div className={styles.periodWrap}>
            <label>Report period</label>
            <input
              type="month"
              className={styles.monthInput}
              value={periodTag}
              onChange={e => setPeriodTag(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.mapGrid}>
          {SCHEMA_FIELDS.map(field => {
            const matched = !!mapping[field]
            const required = REQUIRED_FIELDS.includes(field)
            return (
              <div key={field} className={`${styles.mapRow} ${matched ? styles.mapRowMatched : ''}`}>
                <div className={styles.schemaField}>
                  <span className={styles.fieldName}>{FIELD_LABELS[field]}</span>
                  {matched
                    ? <span className={styles.matchBadge}>✓ matched</span>
                    : required
                    ? <span className={styles.requiredBadge}>required</span>
                    : <span className={styles.optBadge}>optional</span>
                  }
                </div>
                <div className={styles.arrow}>→</div>
                <select
                  className={styles.mapSelect}
                  value={mapping[field] || ''}
                  onChange={e => updateMapping(field, e.target.value)}
                >
                  <option value="">— not mapped —</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>

        {error && <div className={styles.error}><i className="ti ti-alert-circle" /> {error}</div>}

        <div className={styles.mapActions}>
          <button className={styles.btnGhost} onClick={reset}>← Back</button>
          <button
            className={styles.btnPrimary}
            onClick={submit}
            disabled={!canConfirm()}
            title={!canConfirm() ? 'Map all required fields first' : ''}
          >
            Confirm & import {file?.name ? `"${file.name}"` : ''}
          </button>
        </div>
      </div>
    </div>
  )

  // Default: idle / parsing
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Upload CSV</h1>
          <p className={styles.pageSub}>Import IT task data from a CSV or Excel file</p>
        </div>
        <div className={styles.periodWrap}>
          <label>Report period</label>
          <input
            type="month"
            className={styles.monthInput}
            value={periodTag}
            onChange={e => setPeriodTag(e.target.value)}
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''} ${stage === 'parsing' ? styles.parsing : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file"
        onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className={styles.hiddenInput}
          onChange={e => e.target.files[0] && pickFile(e.target.files[0])}
        />
        {stage === 'parsing' ? (
          <>
            <div className={styles.spinner} />
            <p>Parsing file…</p>
          </>
        ) : (
          <>
            <div className={styles.dropIcon}><i className="ti ti-file-upload" /></div>
            <p className={styles.dropTitle}>Drop your CSV here, or click to browse</p>
            <p className={styles.dropSub}>Supports .csv · Max 50 MB · Headers required</p>
          </>
        )}
      </div>

      {/* Schema reference */}
      <div className={styles.schemaRef}>
        <p className={styles.schemaTitle}>Expected columns (all auto-detected)</p>
        <div className={styles.schemaCols}>
          {SCHEMA_FIELDS.map(f => (
            <span key={f} className={`${styles.schemaChip} ${REQUIRED_FIELDS.includes(f) ? styles.required : ''}`}>
              {FIELD_LABELS[f]}
            </span>
          ))}
        </div>
        <p className={styles.schemaHint}>
          Column names are auto-matched. You'll confirm the mapping before any data is imported.
        </p>
      </div>

      {error && <div className={styles.error}><i className="ti ti-alert-circle" /> {error}</div>}
    </div>
  )
}

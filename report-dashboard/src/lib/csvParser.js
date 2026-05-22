import Papa from 'papaparse'

// Known aliases for each schema field.
// Add more as you encounter different spreadsheet formats.
const FIELD_ALIASES = {
  ticket_id:           ['ticket_id','ticket id','id','ticket #','ticket no','ref','reference'],
  title:               ['title','subject','description','task','summary','issue'],
  category:            ['category','type','department','dept','area'],
  priority:            ['priority','sev','severity','urgency'],
  status:              ['status','state','resolution'],
  assignee_name:       ['assignee','assigned to','assignee_name','technician','engineer','owner','handled by'],
  created_at:          ['created_at','created','date created','open date','opened','date opened','start date'],
  resolved_at:         ['resolved_at','resolved','date resolved','close date','closed','date closed','end date'],
  resolution_time_hrs: ['resolution_time_hrs','resolution time','time taken','hours','duration','time to resolve'],
  sla_target_hrs:      ['sla_target_hrs','sla target','sla hours','target hours','sla'],
  sla_met:             ['sla_met','sla met','within sla','met sla','sla compliance'],
  notes:               ['notes','comments','remarks','description'],
}

const SCHEMA_FIELDS = Object.keys(FIELD_ALIASES)

/**
 * Parse CSV file → { headers, rows, suggestedMapping }
 * suggestedMapping: { schemaField → csvColumn | null }
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: ({ data, meta, errors }) => {
        if (errors.length && !data.length) {
          return reject(new Error('CSV parse failed: ' + errors[0].message))
        }
        const headers = meta.fields || []
        const suggested = autoMap(headers)
        resolve({ headers, rows: data, suggestedMapping: suggested })
      },
      error: err => reject(new Error(err.message)),
    })
  })
}

/** Auto-map CSV headers to schema fields using alias matching */
function autoMap(headers) {
  const mapping = {}
  const lowerHeaders = headers.map(h => h.toLowerCase().trim())

  SCHEMA_FIELDS.forEach(field => {
    const aliases = FIELD_ALIASES[field]
    const match = aliases.find(alias => lowerHeaders.includes(alias))
    mapping[field] = match ? headers[lowerHeaders.indexOf(match)] : null
  })
  return mapping
}

/**
 * Apply column mapping to raw rows → normalised task objects.
 * periodTag: string like '2026-05'
 * batchId:   uuid string
 */
export function applyMapping(rows, mapping, periodTag, batchId) {
  const now = new Date().toISOString()

  return rows.map((row, i) => {
    const get = field => {
      const col = mapping[field]
      return col ? (row[col] ?? '').toString().trim() : ''
    }

    // Normalise status
    const rawStatus = get('status').toLowerCase()
    let status = 'open'
    if (['done','closed','resolved','complete','completed'].includes(rawStatus)) status = 'done'
    else if (['in progress','in_progress','wip','assigned','pending'].includes(rawStatus)) status = 'in_progress'

    // Normalise priority (accept P1/1/critical etc.)
    const rawPriority = get('priority').toUpperCase()
    let priority = 'P3'
    if (rawPriority.includes('1') || rawPriority.includes('CRITICAL')) priority = 'P1'
    else if (rawPriority.includes('2') || rawPriority.includes('HIGH'))   priority = 'P2'
    else if (rawPriority.includes('4') || rawPriority.includes('LOW'))    priority = 'P4'

    // Normalise sla_met
    const rawSlaMet = get('sla_met').toLowerCase()
    let slaMet = null
    if (['yes','true','1','met','pass'].includes(rawSlaMet))   slaMet = true
    if (['no','false','0','missed','fail'].includes(rawSlaMet)) slaMet = false

    const resTimeRaw = parseFloat(get('resolution_time_hrs'))
    const slaTargRaw = parseFloat(get('sla_target_hrs'))

    // Auto-calculate resolution time from dates if not provided
    let resolutionTimeHrs = isNaN(resTimeRaw) ? null : resTimeRaw
    const createdAt  = parseDate(get('created_at'))  || now
    const resolvedAt = parseDate(get('resolved_at')) || null
    if (!resolutionTimeHrs && resolvedAt && createdAt) {
      resolutionTimeHrs = +((new Date(resolvedAt) - new Date(createdAt)) / 3600000).toFixed(1)
    }

    // Auto-calculate sla_met if not provided but we have resolutionTimeHrs + target
    if (slaMet === null && resolutionTimeHrs != null && !isNaN(slaTargRaw)) {
      slaMet = resolutionTimeHrs <= slaTargRaw
    }

    return {
      ticket_id:           get('ticket_id') || `IMPORT-${batchId.slice(0,4)}-${i + 1}`,
      title:               get('title')     || '(no title)',
      category:            get('category')  || 'Uncategorised',
      priority,
      status,
      assignee_id:         null,
      assignee_name:       get('assignee_name') || 'Unassigned',
      created_at:          createdAt,
      resolved_at:         resolvedAt,
      resolution_time_hrs: resolutionTimeHrs,
      sla_target_hrs:      isNaN(slaTargRaw) ? null : slaTargRaw,
      sla_met:             slaMet,
      period_tag:          periodTag,
      upload_batch_id:     batchId,
      notes:               get('notes'),
    }
  })
}

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export { SCHEMA_FIELDS, FIELD_ALIASES }

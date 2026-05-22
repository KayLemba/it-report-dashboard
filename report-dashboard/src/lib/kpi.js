/**
 * All KPI calculations operate on a flat array of task objects.
 * Pure functions — safe to unit-test independently.
 */

export function calcKPIs(tasks) {
  if (!tasks.length) return emptyKPIs()

  const total     = tasks.length
  const completed = tasks.filter(t => t.status === 'done').length
  const open      = tasks.filter(t => t.status === 'open').length
  const inProg    = tasks.filter(t => t.status === 'in_progress').length

  const resolved  = tasks.filter(t => t.status === 'done' && t.resolution_time_hrs != null)
  const avgResTime = resolved.length
    ? +(resolved.reduce((s, t) => s + t.resolution_time_hrs, 0) / resolved.length).toFixed(1)
    : 0

  const slaEligible = tasks.filter(t => t.sla_met !== null)
  const slaMet      = slaEligible.filter(t => t.sla_met).length
  const slaRate     = slaEligible.length
    ? Math.round((slaMet / slaEligible.length) * 100)
    : 0

  const p1Count = tasks.filter(t => t.priority === 'P1').length

  return { total, completed, open, inProg, avgResTime, slaRate, p1Count, completionRate: Math.round((completed / total) * 100) }
}

export function calcByCategory(tasks) {
  const cats = {}
  tasks.forEach(t => {
    if (!cats[t.category]) cats[t.category] = { name: t.category, done: 0, open: 0, inProg: 0, resolutionTimes: [], slaMet: 0, slaTotal: 0 }
    const c = cats[t.category]
    if (t.status === 'done')        c.done++
    else if (t.status === 'open')   c.open++
    else                            c.inProg++
    if (t.resolution_time_hrs)      c.resolutionTimes.push(t.resolution_time_hrs)
    if (t.sla_met !== null) { c.slaTotal++; if (t.sla_met) c.slaMet++ }
  })
  return Object.values(cats).map(c => ({
    ...c,
    avgTime: c.resolutionTimes.length ? +(c.resolutionTimes.reduce((s,v)=>s+v,0)/c.resolutionTimes.length).toFixed(1) : 0,
    slaRate: c.slaTotal ? Math.round((c.slaMet / c.slaTotal) * 100) : 0,
    total:   c.done + c.open + c.inProg,
  }))
}

export function calcByPriority(tasks) {
  const order  = ['P1','P2','P3','P4']
  const colors = { P1:'#f87171', P2:'#fbbf24', P3:'#6c8fff', P4:'#34d399' }
  const labels = { P1:'Critical', P2:'High', P3:'Medium', P4:'Low' }
  return order.map(p => ({
    priority: p,
    label:    labels[p],
    color:    colors[p],
    count:    tasks.filter(t => t.priority === p).length,
  }))
}

export function calcByAssignee(tasks) {
  const map = {}
  tasks.forEach(t => {
    const key = t.assignee_id || t.assignee_name || 'Unknown'
    if (!map[key]) map[key] = { id: key, name: t.assignee_name || key, tasks: 0, done: 0, resolutionTimes: [], slaMet: 0, slaTotal: 0, p1: 0 }
    const a = map[key]
    a.tasks++
    if (t.status === 'done') a.done++
    if (t.resolution_time_hrs) a.resolutionTimes.push(t.resolution_time_hrs)
    if (t.sla_met !== null) { a.slaTotal++; if (t.sla_met) a.slaMet++ }
    if (t.priority === 'P1') a.p1++
  })
  return Object.values(map).map(a => ({
    ...a,
    avgTime:        a.resolutionTimes.length ? +(a.resolutionTimes.reduce((s,v)=>s+v,0)/a.resolutionTimes.length).toFixed(1) : 0,
    slaRate:        a.slaTotal ? Math.round((a.slaMet / a.slaTotal) * 100) : 0,
    completionRate: Math.round((a.done / a.tasks) * 100),
    initials:       a.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),
  })).sort((a,b) => b.slaRate - a.slaRate)
}

export function calcTimeSeries(tasks, granularity = 'day') {
  const map = {}
  tasks.forEach(t => {
    const d = new Date(t.created_at)
    let key
    if (granularity === 'day')   key = d.toISOString().slice(0,10)
    else if (granularity === 'week') {
      const wk = new Date(d); wk.setDate(d.getDate() - d.getDay())
      key = wk.toISOString().slice(0,10)
    } else key = d.toISOString().slice(0,7)

    if (!map[key]) map[key] = { period: key, opened: 0, closed: 0 }
    map[key].opened++
    if (t.status === 'done') map[key].closed++
  })
  return Object.values(map).sort((a,b) => a.period.localeCompare(b.period))
}

function emptyKPIs() {
  return { total:0, completed:0, open:0, inProg:0, avgResTime:0, slaRate:0, p1Count:0, completionRate:0 }
}

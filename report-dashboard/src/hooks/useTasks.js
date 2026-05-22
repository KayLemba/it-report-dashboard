import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { MOCK_TASKS, isMockMode } from '../lib/mockData'
import { calcKPIs, calcByCategory, calcByPriority, calcByAssignee, calcTimeSeries } from '../lib/kpi'

export function useTasks(filters = {}) {
  const [tasks,     setTasks]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [isMock,    setIsMock]    = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (isMockMode()) {
      setIsMock(true)
      await new Promise(r => setTimeout(r, 400)) // simulate latency
      setTasks(applyClientFilters(MOCK_TASKS, filters))
      setLoading(false)
      return
    }

    try {
      let query = supabase.from('tasks').select(`
        ticket_id, title, category, priority, status,
        assignee_id, assignee_name, created_at, resolved_at,
        resolution_time_hrs, sla_target_hrs, sla_met, period_tag, notes
      `)

      if (filters.periodTag)  query = query.eq('period_tag', filters.periodTag)
      if (filters.category)   query = query.eq('category',   filters.category)
      if (filters.priority)   query = query.eq('priority',   filters.priority)
      if (filters.status)     query = query.eq('status',     filters.status)
      if (filters.assigneeId) query = query.eq('assignee_id', filters.assigneeId)
      if (filters.dateFrom)   query = query.gte('created_at', filters.dateFrom)
      if (filters.dateTo)     query = query.lte('created_at', filters.dateTo)

      query = query.order('created_at', { ascending: false })

      const { data, error: sbErr } = await query
      if (sbErr) throw sbErr
      setTasks(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Derived KPIs — recomputed when tasks change
  const kpis       = calcKPIs(tasks)
  const byCategory = calcByCategory(tasks)
  const byPriority = calcByPriority(tasks)
  const byAssignee = calcByAssignee(tasks)
  const timeSeries = calcTimeSeries(tasks, filters.granularity || 'day')

  return { tasks, kpis, byCategory, byPriority, byAssignee, timeSeries, loading, error, isMock, refetch: fetchTasks }
}

function applyClientFilters(tasks, filters) {
  return tasks.filter(t => {
    if (filters.category   && t.category    !== filters.category)   return false
    if (filters.priority   && t.priority    !== filters.priority)   return false
    if (filters.status     && t.status      !== filters.status)     return false
    if (filters.assigneeId && t.assignee_id !== filters.assigneeId) return false
    return true
  })
}

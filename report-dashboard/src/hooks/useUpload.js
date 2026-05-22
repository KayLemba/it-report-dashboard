import { useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { supabase } from '../lib/supabase'
import { parseCSV, applyMapping } from '../lib/csvParser'
import { isMockMode } from '../lib/mockData'

export function useUpload() {
  const [stage,    setStage]    = useState('idle')     // idle | parsing | mapping | uploading | done | error
  const [headers,  setHeaders]  = useState([])
  const [rawRows,  setRawRows]  = useState([])
  const [mapping,  setMapping]  = useState({})
  const [progress, setProgress] = useState(0)
  const [error,    setError]    = useState(null)
  const [batchInfo,setBatchInfo]= useState(null)

  const handleFile = useCallback(async (file, periodTag) => {
    setStage('parsing')
    setError(null)
    try {
      const { headers: h, rows, suggestedMapping } = await parseCSV(file)
      setHeaders(h)
      setRawRows(rows)
      setMapping(suggestedMapping)
      setStage('mapping')
    } catch (err) {
      setError(err.message)
      setStage('error')
    }
  }, [])

  const confirmUpload = useCallback(async (finalMapping, periodTag) => {
    setStage('uploading')
    setProgress(0)
    setError(null)

    const batchId = uuid()
    const tasks   = applyMapping(rawRows, finalMapping, periodTag, batchId)

    if (isMockMode()) {
      // Simulate upload in mock mode
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(r => setTimeout(r, 120))
        setProgress(i)
      }
      setBatchInfo({ batchId, count: tasks.length, periodTag })
      setStage('done')
      return { batchId, count: tasks.length }
    }

    try {
      const CHUNK = 200
      for (let i = 0; i < tasks.length; i += CHUNK) {
        const chunk = tasks.slice(i, i + CHUNK)
        const { error: sbErr } = await supabase
          .from('tasks')
          .upsert(chunk, { onConflict: 'ticket_id,period_tag', ignoreDuplicates: false })
        if (sbErr) throw sbErr
        setProgress(Math.round(((i + chunk.length) / tasks.length) * 100))
      }

      // Log the upload batch
      await supabase.from('upload_batches').insert({
        id:         batchId,
        period_tag: periodTag,
        file_name:  'upload',
        row_count:  tasks.length,
      })

      setBatchInfo({ batchId, count: tasks.length, periodTag })
      setStage('done')
      return { batchId, count: tasks.length }
    } catch (err) {
      setError(err.message)
      setStage('error')
      throw err
    }
  }, [rawRows])

  const reset = useCallback(() => {
    setStage('idle'); setHeaders([]); setRawRows([])
    setMapping({}); setProgress(0); setError(null); setBatchInfo(null)
  }, [])

  return { stage, headers, mapping, setMapping, progress, error, batchInfo, handleFile, confirmUpload, reset }
}

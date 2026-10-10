'use client'
// Runs /api/extract in the background as soon as the resume is in, so the interests step can
// suggest focus areas from it and the analysis can start the moment the person is done choosing.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWingspan } from '@/context/WingspanContext'
import { readJson } from '@/lib/safe-json'
import type { ExtractedCareerData } from '@/types/wingspan'

export type ExtractionStatus = 'idle' | 'reading' | 'done' | 'error'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export function extractionSummary(data: Partial<ExtractedCareerData>): string {
  return [
    plural(data.timeline?.length ?? 0, 'role'),
    plural(data.projects?.length ?? 0, 'project'),
    plural(data.skills?.length ?? 0, 'skill'),
  ].join(', ')
}

function sourceKey(files: File[], urls: Record<string, string>): string {
  const f = files.map((x) => `${x.name}:${x.size}:${x.lastModified}`).join('|')
  const u = Object.entries(urls).filter(([, v]) => v.trim()).sort().map(([k, v]) => `${k}=${v.trim()}`).join('|')
  return `${f}#${u}`
}

export function useResumeExtraction() {
  const { dispatch } = useWingspan()
  const [status, setStatus] = useState<ExtractionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [data, setData] = useState<ExtractedCareerData | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)

  const statusRef = useRef<ExtractionStatus>('idle')
  const keyRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastInput = useRef<{ files: File[]; urls: Record<string, string> } | null>(null)

  const setBoth = (s: ExtractionStatus) => { statusRef.current = s; setStatus(s) }

  const start = useCallback((files: File[], urls: Record<string, string>, force = false) => {
    const key = sourceKey(files, urls)
    // Same resume already being read or read: keep that result instead of starting again.
    if (!force && keyRef.current === key && (statusRef.current === 'reading' || statusRef.current === 'done')) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    keyRef.current = key
    lastInput.current = { files, urls }

    statusRef.current = 'reading'
    setStatus('reading')
    setError(null)
    setErrorCode(null)
    setData(null)
    setStartedAt(Date.now())
    dispatch({ type: 'CLEAR_ERROR' })
    dispatch({ type: 'RESET_ACTIVITY' })
    dispatch({
      type: 'ADD_ACTIVITY',
      event: { source: 'extract', status: 'start', label: 'Reading your resume', detail: files[0]?.name },
    })

    void (async () => {
      try {
        const formData = new FormData()
        for (const file of files) formData.append('files', file)
        formData.append('urls', JSON.stringify(urls))
        const res = await fetch('/api/extract', { method: 'POST', body: formData, signal: controller.signal })
        const body = await readJson(res)
        if (res.status === 413) { setErrorCode('TOO_LARGE'); throw new Error('That file is too large to upload. Export your resume again as a smaller PDF (under 4 MB) and try again.') }
        if (!res.ok) { setErrorCode(typeof body?.code === 'string' ? body.code : null); throw new Error(body?.error || 'We could not read that file.') }
        if (controller.signal.aborted) return
        const extracted = body as ExtractedCareerData
        dispatch({ type: 'SET_EXTRACTED_DATA', data: extracted })
        dispatch({
          type: 'ADD_ACTIVITY',
          event: { source: 'extract', status: 'done', label: 'Resume read', detail: extractionSummary(extracted) },
        })
        setData(extracted)
        setBoth('done')
      } catch (err) {
        if (controller.signal.aborted) return
        const message = err instanceof TypeError ? 'We lost the connection while uploading. Check your internet and try again.' : err instanceof Error ? err.message : String(err)
        dispatch({
          type: 'ADD_ACTIVITY',
          event: { source: 'extract', status: 'error', label: 'Could not read the resume', detail: message },
        })
        setError(message)
        setBoth('error')
      }
    })()
  }, [dispatch])

  const retry = useCallback(() => {
    if (lastInput.current) start(lastInput.current.files, lastInput.current.urls, true)
  }, [start])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    keyRef.current = null
    lastInput.current = null
    statusRef.current = 'idle'
    setStatus('idle'); setError(null); setErrorCode(null); setData(null); setStartedAt(null)
  }, [])

  // Leaving the flow mid-read: stop the request so a late response can't overwrite newer state.
  useEffect(() => () => abortRef.current?.abort(), [])

  return { status, error, errorCode, data, startedAt, start, retry, cancel }
}

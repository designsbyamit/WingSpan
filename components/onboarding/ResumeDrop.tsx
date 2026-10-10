'use client'
import { useId, useRef, useState } from 'react'
import { AlertCircle, FileText, Upload } from 'lucide-react'
import { MAX_RESUME_BYTES, RESUME_ACCEPT, checkFileBasics, formatBytes } from '@/lib/upload-rules'
import { cx, linkButton } from './ui'

const ACCEPT = RESUME_ACCEPT

const formatSize = formatBytes

interface ResumeDropProps {
  file: File | undefined
  onFile: (file: File) => void
  onRemove: () => void
}

/** Single-resume picker: drop zone when empty, a file row with Replace / Remove when filled. */
export function ResumeDrop({ file, onFile, onRemove }: ResumeDropProps) {
  const [dragOver, setDragOver] = useState(false)
  const inputId = useId()
  const hintId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const [problem, setProblem] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  // Check the file here first so nothing is uploaded just to be refused. A rejected file never replaces a good one.
  const pick = (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    const bad = checkFileBasics(f.name, f.size)
    if (bad) { setProblem(bad.message); setNote(null); return }
    setProblem(null)
    setNote(files && files.length > 1 ? `We only read one resume at a time, so we used ${f.name}.` : null)
    onFile(f)
  }

  const feedback = (
    <>
      {problem && (
        <p role="alert" className="mt-3 flex gap-2 rounded-[10px] border border-red-400/25 bg-red-400/[0.06] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-300" aria-hidden />
          <span>{problem}</span>
        </p>
      )}
      {note && !problem && <p className="mt-3 text-xs text-[var(--text-muted)]" role="status">{note}</p>}
    </>
  )

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={ACCEPT}
      aria-describedby={hintId}
      aria-label={file ? 'Replace resume' : 'Choose your resume'}
      tabIndex={file ? -1 : undefined}
      className="sr-only"
      onChange={(e) => { pick(e.target.files); e.target.value = '' }}
    />
  )

  if (file) {
    return (
      <div>
      <div
        className="flex items-center gap-3 rounded-[12px] border border-[var(--border-ws)] bg-[var(--surface)] px-4 py-3.5"
        onDragOver={(e) => { e.preventDefault() }}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files) }}
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] border border-[var(--neon-border)] bg-[var(--neon-surface)]">
          <FileText size={16} className="text-[var(--neon)]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{file.name}</p>
          <p id={hintId} className="text-xs text-[var(--text-muted)]">{formatSize(file.size)}</p>
        </div>
        {input}
        <div className="flex flex-shrink-0 items-center gap-3">
          <button type="button" onClick={() => inputRef.current?.click()} className={linkButton}>
            Replace
          </button>
          <button type="button" onClick={onRemove} className={linkButton} aria-label={`Remove ${file.name}`}>
            Remove
          </button>
        </div>
      </div>
      {feedback}
      </div>
    )
  }

  return (
    <div>
    <label
      htmlFor={inputId}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); pick(e.dataTransfer.files) }}
      className={cx(
        'group flex cursor-pointer flex-col items-center gap-3 rounded-[14px] border border-dashed px-6 py-10 text-center transition-colors sm:py-12',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--neon)]',
        dragOver
          ? 'border-[var(--neon)] bg-[var(--neon-surface)]'
          : 'border-[var(--border-ws)] bg-[var(--surface-dim)] hover:border-[var(--text-dim)]',
      )}
    >
      {input}
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-ws)] bg-[var(--surface)]">
        <Upload size={18} className="text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)]" aria-hidden />
      </span>
      <span className="text-sm font-semibold text-[var(--text-primary)]">
        Choose your resume <span className="font-normal text-[var(--text-muted)]">or drop it here</span>
      </span>
      <span id={hintId} className="text-xs text-[var(--text-muted)]">PDF or Word (.docx), up to {formatBytes(MAX_RESUME_BYTES)}</span>
    </label>
    {feedback}
    </div>
  )
}

'use client'
import { useState } from 'react'
import { Dialog } from '@/components/blueprint/shell/Dialog'
import { cx, quietButton, primaryButton } from './ui'

/** "Cancel" with a confirmation. `onConfirm` should stop any work in flight and return to the start. */
export function CancelFlowButton({ onConfirm, label = 'Cancel', className, title = 'Start over?', body }: {
  onConfirm: () => void
  label?: string
  className?: string
  title?: string
  body?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cx(quietButton, className)}>{label}</button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={body ?? 'This stops the analysis and takes you back to the start, where you can upload a different resume. Your current progress will be discarded.'}
        footer={
          <div className="flex w-full justify-end gap-3">
            <button type="button" data-autofocus onClick={() => setOpen(false)} className={quietButton}>Keep going</button>
            <button type="button" onClick={() => { setOpen(false); onConfirm() }} className={primaryButton}>Go back to the start</button>
          </div>
        }
      >
        <span className="sr-only">Confirm cancelling</span>
      </Dialog>
    </>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'

export default function ActivatePathButton({ pathId }: { pathId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function activate() {
    setLoading(true)
    await fetch(`/api/paths/${pathId}/activate`, { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={activate}
      disabled={loading}
      className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 mt-1"
    >
      <Play size={14} />
      {loading ? 'Activating…' : 'Activate this path'}
    </button>
  )
}

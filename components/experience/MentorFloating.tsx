'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, Loader2 } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

interface MentorFloatingProps {
  sessionId: string
  experienceId: string
}

export function MentorFloating({ sessionId, experienceId }: MentorFloatingProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "I'm here when you need a nudge. Start the challenge — then come back and I'll ask you questions that go deeper." }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    if (!input.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId, experienceId, messages: newMessages }),
      })
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantText }
          return updated
        })
      }
    } finally {
      setStreaming(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#B6FF2E] text-[#23262F] px-4 py-3 text-sm font-semibold shadow-xl hover:bg-[#9EE020] transition-colors"
        style={{ fontFamily: 'var(--font-sora)' }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <Sparkles size={15} />
        {open ? 'Close mentor' : 'Ask mentor'}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-20 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] rounded-2xl border border-[#353B45] bg-[#2D3139] shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '60vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#353B45]">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#B6FF2E]" />
                <span className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-sora)' }}>
                  AI Mentor
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/70 transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#B6FF2E] text-[#23262F] font-medium rounded-br-sm'
                      : 'bg-[#23262F] text-white/75 rounded-bl-sm'
                  }`}>
                    {msg.content || (streaming && i === messages.length - 1
                      ? (
                        <span className="inline-flex gap-1 items-center">
                          <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      )
                      : null
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-[#353B45] flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask or share a thought..."
                className="flex-1 rounded-xl bg-[#23262F] border border-[#353B45] px-3 py-2 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[#B6FF2E]/40 transition-colors"
              />
              <button
                onClick={send}
                disabled={!input.trim() || streaming}
                className="rounded-xl bg-[#B6FF2E] text-[#23262F] p-2 hover:bg-[#9EE020] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {streaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

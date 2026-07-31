// components/experience/AIMentorPanel.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ChevronRight, BotMessageSquare } from 'lucide-react'
import type { MentorMessage } from '@/types/design-evolution'

const OPENING_MESSAGE: MentorMessage = {
  role: 'assistant',
  content:
    "I'm here to help you think through this experience. What's your first observation about the scenario?",
}

interface AIMentorPanelProps {
  sessionId: string
  experienceId: string
}

export function AIMentorPanel({ sessionId, experienceId }: AIMentorPanelProps) {
  const [messages, setMessages] = useState<MentorMessage[]>([OPENING_MESSAGE])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    const userMessage: MentorMessage = { role: 'user', content: trimmed }
    const newMessages: MentorMessage[] = [...messages, userMessage]

    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)

    // Append empty assistant message to fill via streaming
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, experienceId, messages: newMessages }),
      })

      if (!res.ok || !res.body) throw new Error('Mentor request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            }
          }
          return updated
        })
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last?.role === 'assistant' && last.content === '') {
          updated[updated.length - 1] = {
            ...last,
            content: 'Something went wrong. Please try again.',
          }
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }, [input, isStreaming, messages, sessionId, experienceId])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#23262F] border-l border-[#353B45]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#353B45] shrink-0">
        <div className="flex items-center gap-2">
          <BotMessageSquare size={16} className="text-[#B6FF2E]" />
          <span
            className="text-sm font-semibold text-white"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            AI Mentor
          </span>
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-white/30 hover:text-white transition-colors"
          aria-label={collapsed ? 'Expand mentor panel' : 'Collapse mentor panel'}
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={16} />
          </motion.div>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="panel-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className="text-[10px] font-medium text-white/25 uppercase tracking-wider px-1">
                    {msg.role === 'user' ? 'You' : 'Mentor'}
                  </span>
                  <div
                    className={`max-w-[90%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#B6FF2E]/15 text-white border border-[#B6FF2E]/20'
                        : 'bg-[#353B45] text-white/80 border border-white/5'
                    }`}
                  >
                    {msg.content}
                    {isStreaming &&
                      i === messages.length - 1 &&
                      msg.role === 'assistant' && (
                        <motion.span
                          className="inline-block w-0.5 h-3.5 bg-[#B6FF2E] ml-0.5 align-middle"
                          animate={{ opacity: [1, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            repeatType: 'reverse',
                          }}
                        />
                      )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-[#353B45] shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  className="flex-1 resize-none rounded-xl border border-[#353B45] bg-[#2D3139] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#B6FF2E]/40 focus:outline-none transition-colors leading-relaxed max-h-32"
                  rows={1}
                  placeholder="Ask your mentor…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                  className="shrink-0 flex items-center justify-center rounded-xl bg-[#B6FF2E] p-2.5 text-white transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

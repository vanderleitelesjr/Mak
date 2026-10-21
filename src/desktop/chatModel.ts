import { useEffect, useState } from 'react'
import { api } from './client'
import type { ChatSession } from './types'
import { hasConversationView } from './chatView'

import type { ModelUsageStats } from './types'

// The model and usage a chat last used, read from its transcript. It
// refreshes after each turn and every 15 s, which also catches a /model change.
export function useChatStats(session: ChatSession | undefined) {
  const [read, setRead] = useState<{ id: string; model: string | null; usage: ModelUsageStats | null } | null>(null)
  const id = session && hasConversationView(session) && session.hasConversation ? session.id : null
  useEffect(() => {
    if (!id) return
    let alive = true
    const load = () => api<{ model?: string | null; usage?: ModelUsageStats | null }>(`/sessions/${id}/stats`).then(value => {
      if (alive) setRead({ id, model: value.model || null, usage: value.usage || null })
    }).catch(() => {})
    void load()
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load() }, 15000)
    return () => { alive = false; clearInterval(timer) }
  }, [id, session?.completionVersion])
  return id && read?.id === id ? { model: read.model, usage: read.usage } : { model: null, usage: null }
}

export function useChatModel(session: ChatSession | undefined) {
  return useChatStats(session).model
}

// "claude-opus-5-5-20261001" reads as "opus-5-5"; other names are kept.
export const modelLabel = (model: string) => model.replace(/^claude-/, '').replace(/-\d{8}(?=$|\[)/, '')

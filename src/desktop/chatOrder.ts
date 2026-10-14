import type { ChatSession } from './types'

export function orderedChats(sessions: ChatSession[]) {
  return sessions.filter(item => item.open).sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.tabOrder || 0) - (b.tabOrder || 0))
}

export const tabColors = [
  { name: 'Rose', value: '#dba3bb' }, { name: 'Peach', value: '#dfa48b' },
  { name: 'Gold', value: '#d7bd80' }, { name: 'Sage', value: '#a5bd91' },
  { name: 'Mint', value: '#8cc8b4' }, { name: 'Sky', value: '#91b6da' },
  { name: 'Lilac', value: '#b8a2d4' }, { name: 'Slate', value: '#a6afbc' },
]

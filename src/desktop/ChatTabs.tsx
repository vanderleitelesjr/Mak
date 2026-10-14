import { useEffect, useRef, useState } from 'react'
import type { AgentInfo, ChatSession } from './types'
import { api, reportError } from './client'
import { chatActivityLabel } from './chatActivity'
import { Icon } from './Icons'
import SessionLogo from './SessionLogo'

type Drag = { id: string; pinned: boolean; startX: number; startY: number; moving: boolean }
type Drop = { id: string; position: 'before' | 'after' }

export default function ChatTabs({ items, selectedId, agents, choose, close }: {
  items: ChatSession[]; selectedId?: string; agents: AgentInfo[]; choose: (id: string) => void; close: (id: string) => void
}) {
  const gesture = useRef<Drag | null>(null)
  const drop = useRef<Drop | null>(null)
  const suppressClick = useRef(false)
  const [dragging, setDragging] = useState<{ id: string; x: number; y: number } | null>(null)
  const [target, setTarget] = useState<Drop | null>(null)
  const clear = () => { gesture.current = null; drop.current = null; setDragging(null); setTarget(null) }
  const clearRef = useRef(clear)
  useEffect(() => { clearRef.current = clear })
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => { if (event.key === 'Escape') clearRef.current() }
    window.addEventListener('keydown', cancel)
    return () => window.removeEventListener('keydown', cancel)
  }, [])
  function begin(event: React.PointerEvent<HTMLButtonElement>, item: ChatSession) {
    if (event.button !== 0) return
    suppressClick.current = false
    gesture.current = { id: item.id, pinned: item.pinned, startX: event.clientX, startY: event.clientY, moving: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event: React.PointerEvent<HTMLButtonElement>) {
    const current = gesture.current
    if (!current) return
    if (!current.moving && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 6) return
    current.moving = true; suppressClick.current = true
    setDragging({ id: current.id, x: event.clientX, y: event.clientY })
    const element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-chat-tab]')
    const item = items.find(item => item.id === element?.dataset.chatTab)
    let next: Drop | null = null
    if (element && item && item.id !== current.id && item.pinned === current.pinned) {
      const rect = element.getBoundingClientRect()
      next = { id: item.id, position: event.clientX >= rect.left + rect.width / 2 ? 'after' : 'before' }
    }
    drop.current = next; setTarget(next)
  }
  function finish() {
    const current = gesture.current, destination = drop.current
    clear()
    if (current?.moving && destination) api(`/sessions/${current.id}/reorder`, { targetId: destination.id, position: destination.position }).catch(reportError)
  }
  const dragged = items.find(item => item.id === dragging?.id)
  return <div className={`chat-tabs ${dragging ? 'is-reordering' : ''}`} role="tablist" aria-label="Agent chats">
    {items.map(item => <div key={item.id} data-chat-tab={item.id} className={`chat-tab ${selectedId === item.id ? 'selected' : ''} ${item.tabColor ? 'has-color' : ''} ${dragging?.id === item.id ? 'dragging' : ''} ${target?.id === item.id ? `drop-${target.position}` : ''}`} style={{ '--tab-accent': item.tabColor || '#dfa3b8' } as React.CSSProperties}>
      <button role="tab" aria-selected={selectedId === item.id} onClick={event => { if (!suppressClick.current || event.detail === 0) choose(item.id) }} onPointerDown={event => begin(event, item)} onPointerMove={move} onPointerUp={finish} onPointerCancel={clear} onLostPointerCapture={clear}
        className="chat-tab-select" aria-label={`${item.name} · ${chatActivityLabel(item)}`} title={`${agents.find(a => a.id === item.agent)?.label} · ${item.name}\n${chatActivityLabel(item)}\nDrag to reorder ${item.pinned ? 'pinned' : 'unpinned'} tabs\n${item.cwd}`}>
        <span style={{ color: agents.find(a => a.id === item.agent)?.color }}><SessionLogo session={item} /></span><span className="chat-tab-name">{item.name}</span>{item.pinned && <span className="tab-pinned" title="Pinned in History"><Icon name="pin" size={11} /></span>}
      </button>
      <button className="chat-tab-close" onClick={() => close(item.id)} aria-label={`Close ${item.name}`} title="Close tab · keep in History"><Icon name="close" size={12} /></button>
    </div>)}
    {dragging && dragged && <div className="chat-tab-ghost" style={{ left: dragging.x + 13, top: dragging.y + 13, color: dragged.tabColor || '#d8c9da' }} aria-hidden="true"><SessionLogo session={dragged} /><span>{dragged.name}</span>{dragged.pinned && <Icon name="pin" size={12} />}</div>}
  </div>
}

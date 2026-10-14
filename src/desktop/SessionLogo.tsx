import { AgentLogo } from './Icons'
import { chatActivityLabel } from './chatActivity'
import type { ChatSession } from './types'

export default function SessionLogo({ session, size = 17 }: { session: ChatSession; size?: number }) {
  const working = session.status === 'running' && session.activity === 'working'
  return <span className={`session-logo ${working ? 'is-working' : ''}`} style={{ width: size, height: size }} title={chatActivityLabel(session)} aria-hidden="true">
    <AgentLogo agent={session.agent} size={size} />
    {session.unread && <i className="session-unread" />}
    {!session.unread && session.activity === 'waiting' && <i className="session-waiting">!</i>}
  </span>
}

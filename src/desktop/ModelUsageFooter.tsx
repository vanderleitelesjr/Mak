import { useState } from 'react'
import type { ModelRateLimitEntry, ModelUsageStats } from './types'

function formatTokens(num: number): string {
  if (!num || num <= 0) return '0'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1_000) return Math.round(num / 1_000) + 'k'
  return String(num)
}

function formatResetTime(resetsAt: number): string {
  if (!resetsAt || resetsAt <= 0) return 'resets soon'
  const diffMs = resetsAt * 1000 - Date.now()
  if (diffMs <= 0) return 'resets soon'
  const totalMinutes = Math.floor(diffMs / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const days = Math.floor(hours / 24)
  const rel = days > 0 ? `${days}d ${hours % 24}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  const localTime = new Date(resetsAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `in ${rel} (${localTime})`
}

function formatShortCountdown(resetsAt: number): string | null {
  if (!resetsAt || resetsAt <= 0) return null
  const diffMs = resetsAt * 1000 - Date.now()
  if (diffMs <= 0) return 'now'
  const totalMinutes = Math.floor(diffMs / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function calcPercent(usedPercent: number, direction: 'used' | 'remaining'): number {
  if (direction === 'remaining') return Math.max(0, 100 - usedPercent)
  return usedPercent
}

function getTone(usedPercent: number): 'normal' | 'warning' | 'alert' {
  if (usedPercent >= 90) return 'alert'
  if (usedPercent >= 75) return 'warning'
  return 'normal'
}

function MiniBar({ value, tone }: { value: number; tone: 'normal' | 'warning' | 'alert' }) {
  return (
    <span className="usage-mini-bar" aria-hidden="true">
      <span
        className={`usage-mini-fill tone-${tone}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </span>
  )
}

function agentTitle(agent: string): string {
  if (agent === 'claude') return 'Claude Code'
  if (agent === 'codex') return 'OpenAI Codex'
  if (agent === 'antigravity') return 'Google Antigravity'
  return agent
}

export default function ModelUsageFooter({
  usage,
  model,
  mode = 'all',
  direction = 'used'
}: {
  usage: ModelUsageStats | null | undefined
  model: string | null
  mode?: 'all' | 'general'
  direction?: 'used' | 'remaining'
}) {
  const [open, setOpen] = useState(false)
  if (!usage || !usage.tokens) return null

  const list = usage.rateLimitsList || (usage.rateLimits ? [usage.rateLimits] : [])
  const generalLimit: ModelRateLimitEntry | null = list.find(r => !r.isExclusive) || usage.rateLimits || list[0] || null
  const exclusiveLimits: ModelRateLimitEntry[] = list.filter(r => r.isExclusive)
  const showExclusive = mode === 'all' && exclusiveLimits.length > 0

  const primary = generalLimit?.primary
  const secondary = generalLimit?.secondary
  const contextPct = usage.tokens.contextPercent ?? 0

  // Calculate worst-case tone across visible quotas
  const allUsedPcts = [contextPct]
  if (primary && primary.usedPercent !== undefined) allUsedPcts.push(primary.usedPercent)
  if (secondary && secondary.usedPercent !== undefined) allUsedPcts.push(secondary.usedPercent)
  if (showExclusive) {
    exclusiveLimits.forEach(ex => {
      if (ex.primary && ex.primary.usedPercent !== undefined) allUsedPcts.push(ex.primary.usedPercent)
      if (ex.secondary && ex.secondary.usedPercent !== undefined) allUsedPcts.push(ex.secondary.usedPercent)
    })
  }
  const maxUsed = Math.max(...allUsedPcts)
  const overallTone = getTone(maxUsed)

  const primaryPct = primary ? calcPercent(primary.usedPercent, direction) : null
  const secondaryPct = secondary ? calcPercent(secondary.usedPercent, direction) : null
  const primaryCd = primary?.resetsAt ? formatShortCountdown(primary.resetsAt) : null

  return (
    <div
      className={`chat-status-usage tone-${overallTone}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      tabIndex={0}
      role="button"
      aria-label="Model usage and limits"
      onClick={() => setOpen(value => !value)}
    >
      <i className={`usage-dot tone-${overallTone}`} />

      <div className="usage-chip-items">
        {primary && primaryPct !== null && (
          <span className="usage-chip-block" title={`${primary.windowMinutes ? `${Math.round(primary.windowMinutes / 60)}-hour` : '5-hour'} window: ${primary.usedPercent}% used`}>
            <span className="usage-chip-label">{primary.windowMinutes === 300 ? '5h' : primary.windowMinutes ? (primary.windowMinutes >= 60 ? `${Math.round(primary.windowMinutes / 60)}h` : `${primary.windowMinutes}m`) : '5h'}</span>
            <MiniBar value={direction === 'remaining' ? primaryPct : primary.usedPercent} tone={getTone(primary.usedPercent)} />
            <span className="usage-chip-num">{primaryPct}%</span>
            {primaryCd && <span className="usage-chip-cd">⏳{primaryCd}</span>}
          </span>
        )}

        {secondary && secondaryPct !== null && (
          <span className="usage-chip-block" title={`7-day window: ${secondary.usedPercent}% used`}>
            <span className="usage-chip-label">7d</span>
            <MiniBar value={direction === 'remaining' ? secondaryPct : secondary.usedPercent} tone={getTone(secondary.usedPercent)} />
            <span className="usage-chip-num">{secondaryPct}%</span>
          </span>
        )}

        {showExclusive && exclusiveLimits.map(ex => {
          const exUsed = ex.primary?.usedPercent ?? 0
          const exDisplay = calcPercent(exUsed, direction)
          const exCd = ex.primary?.resetsAt ? formatShortCountdown(ex.primary.resetsAt) : null
          const label = ex.limitName || ex.limitId
          return (
            <span key={ex.limitId} className="usage-chip-block usage-exclusive-chip" title={`Exclusive limit (${label}): ${exUsed}% used`}>
              <span className="usage-chip-label">{label}</span>
              <MiniBar value={direction === 'remaining' ? exDisplay : exUsed} tone={getTone(exUsed)} />
              <span className="usage-chip-num">{exDisplay}%</span>
              {exCd && <span className="usage-chip-cd">⏳{exCd}</span>}
            </span>
          )
        })}

        {usage.tokens.contextWindow ? (
          <span className="usage-chip-block" title={`Context window: ${usage.tokens.current.toLocaleString()} / ${usage.tokens.contextWindow.toLocaleString()} tokens`}>
            <MiniBar value={contextPct} tone={getTone(contextPct)} />
            <span className="usage-chip-num">{formatTokens(usage.tokens.current)}/{formatTokens(usage.tokens.contextWindow)} ctx</span>
          </span>
        ) : null}

        {usage.costUSD !== null && usage.costUSD !== undefined && (
          <span className="usage-chip-cost" title="Session cost">${usage.costUSD.toFixed(2)}</span>
        )}
      </div>

      {open && (
        <div className="chat-usage-tooltip" role="tooltip" onClick={event => event.stopPropagation()}>
          <header className="usage-tooltip-header">
            <div>
              <strong>{agentTitle(usage.agent)}</strong>
              {generalLimit?.planType && <span className="usage-plan-badge">{generalLimit.planType}</span>}
            </div>
            <small>{model || usage.agent}</small>
          </header>

          <div className="usage-tooltip-direction-hint">
            <span>Mode: <strong>{direction === 'remaining' ? 'Remaining Allowance (100% → 0%)' : 'Consumed Usage (0% → 100%)'}</strong></span>
            {usage.fetchedAt && <small>Cached from CLI account</small>}
          </div>

          {generalLimit && (primary || secondary) && (
            <div className="usage-tooltip-section">
              <div className="usage-section-title">General Quotas</div>
              {primary && (
                <div className="usage-limit-block">
                  <div className="usage-row-heading">
                    <span>5-Hour Rolling Quota</span>
                    <strong>{primaryPct}% {direction === 'remaining' ? 'left' : 'used'}</strong>
                  </div>
                  <div className="usage-bar-track">
                    <div
                      className={`usage-bar-fill tone-${getTone(primary.usedPercent)}`}
                      style={{ width: `${Math.min(100, direction === 'remaining' ? (primaryPct ?? 0) : primary.usedPercent)}%` }}
                    />
                  </div>
                  <p className="usage-row-sub">Resets {formatResetTime(primary.resetsAt)}</p>
                </div>
              )}

              {secondary && (
                <div className="usage-limit-block">
                  <div className="usage-row-heading">
                    <span>7-Day Weekly Quota</span>
                    <strong>{secondaryPct}% {direction === 'remaining' ? 'left' : 'used'}</strong>
                  </div>
                  <div className="usage-bar-track">
                    <div
                      className={`usage-bar-fill tone-${getTone(secondary.usedPercent)}`}
                      style={{ width: `${Math.min(100, direction === 'remaining' ? (secondaryPct ?? 0) : secondary.usedPercent)}%` }}
                    />
                  </div>
                  <p className="usage-row-sub">Resets {formatResetTime(secondary.resetsAt)}</p>
                </div>
              )}
            </div>
          )}

          {exclusiveLimits.length > 0 && (
            <div className="usage-tooltip-section">
              <div className="usage-section-title">
                Exclusive Model Limits
                {mode === 'general' && <small className="usage-exclusive-hint"> (Hidden from footer chip)</small>}
              </div>
              {exclusiveLimits.map(ex => {
                const exUsed = ex.primary?.usedPercent ?? 0
                const exDisplay = calcPercent(exUsed, direction)
                const label = ex.limitName || ex.limitId
                return (
                  <div key={ex.limitId} className="usage-limit-block">
                    <div className="usage-row-heading">
                      <span>{label}</span>
                      <strong>{exDisplay}% {direction === 'remaining' ? 'left' : 'used'}</strong>
                    </div>
                    <div className="usage-bar-track">
                      <div
                        className={`usage-bar-fill tone-${getTone(exUsed)}`}
                        style={{ width: `${Math.min(100, direction === 'remaining' ? exDisplay : exUsed)}%` }}
                      />
                    </div>
                    {ex.primary?.resetsAt ? (
                      <p className="usage-row-sub">Resets {formatResetTime(ex.primary.resetsAt)}</p>
                    ) : (
                      <p className="usage-row-sub">Exclusive allocation for {label}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="usage-tooltip-section">
            <div className="usage-section-title">Context Window</div>
            <div className="usage-row-heading">
              <span>Tokens consumed</span>
              <strong>{contextPct}%</strong>
            </div>
            <div className="usage-bar-track">
              <div
                className={`usage-bar-fill tone-${getTone(contextPct)}`}
                style={{ width: `${Math.min(100, contextPct)}%` }}
              />
            </div>
            <p className="usage-row-detail">
              {usage.tokens.current.toLocaleString()} / {usage.tokens.contextWindow.toLocaleString()} tokens
            </p>
            <p className="usage-row-sub">
              Input: {usage.tokens.input.toLocaleString()}
              {usage.tokens.cached ? ` · Cached: ${usage.tokens.cached.toLocaleString()}` : ''}
              {usage.tokens.output ? ` · Output: ${usage.tokens.output.toLocaleString()}` : ''}
              {usage.tokens.reasoning ? ` · Reasoning: ${usage.tokens.reasoning.toLocaleString()}` : ''}
            </p>
          </div>

          {usage.costUSD !== null && usage.costUSD !== undefined && (
            <div className="usage-tooltip-section usage-cost-row">
              <span>Session cost</span>
              <strong>${usage.costUSD.toFixed(3)} USD</strong>
            </div>
          )}

          <div className="usage-tooltip-footer">
            <span>Provider: {agentTitle(usage.agent)}</span>
            <small>{mode === 'all' ? 'Showing general & exclusive limits' : 'General quota only'}</small>
          </div>
        </div>
      )}
    </div>
  )
}

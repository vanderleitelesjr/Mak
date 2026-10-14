import { useState } from 'react'
import { setWorkspaceTheme, useWorkspaceTheme, type WorkspaceTheme } from '../lib/workspace-theme'

export default function ThemePicker() {
  const { preference } = useWorkspaceTheme()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const change = async (value: WorkspaceTheme) => {
    setBusy(true); setError('')
    try { await setWorkspaceTheme(value) }
    catch (error) { setError(error instanceof Error ? error.message : String(error)) }
    finally { setBusy(false) }
  }
  return <div className="workspace-theme-picker">
    <label>Workspace theme<select aria-label="Workspace theme" value={preference} disabled={busy} onChange={event => void change(event.target.value as WorkspaceTheme)}>
      <option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option>
    </select></label>
    <p>Light uses dark text on a white background. System follows your device. Applies to Workspace and standard reports.</p>
    {error && <p role="alert">{error}</p>}
  </div>
}

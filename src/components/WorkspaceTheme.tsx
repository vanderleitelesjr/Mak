import { useLayoutEffect } from 'react'
import { surface } from '../desktop/client'
import { useWorkspaceTheme } from '../lib/workspace-theme'

export default function WorkspaceTheme() {
  const { resolved } = useWorkspaceTheme()
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.themeSwitching = ''
    root.dataset.workspaceTheme = surface === 'workspace' ? resolved : 'dark'
    let second = 0
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => { delete root.dataset.themeSwitching }) })
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); delete root.dataset.themeSwitching }
  }, [resolved])
  return null
}

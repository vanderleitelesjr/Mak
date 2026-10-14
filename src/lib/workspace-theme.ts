import { useSyncExternalStore } from 'react'
import { api, isDesktop, useDesktop } from '../desktop/client'

export type WorkspaceTheme = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'
const storageKey = 'mrmak.workspaceTheme'
const changed = 'mrmak-workspace-theme'
const system = window.matchMedia('(prefers-color-scheme: dark)')
const valid = (value: unknown): WorkspaceTheme => value === 'light' || value === 'system' ? value : 'dark'
const readPreference = () => { try { return valid(localStorage.getItem(storageKey)) } catch { return 'dark' as const } }
const subscribe = (listener: () => void) => {
  window.addEventListener('storage', listener)
  window.addEventListener(changed, listener)
  system.addEventListener('change', listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(changed, listener)
    system.removeEventListener('change', listener)
  }
}
const snapshot = () => `${readPreference()}:${system.matches}`

export function useWorkspaceTheme() {
  const { settings } = useDesktop()
  useSyncExternalStore(subscribe, snapshot)
  const preference = isDesktop ? valid(settings.workspaceTheme) : readPreference()
  const resolved: ResolvedTheme = preference === 'system' ? system.matches ? 'dark' : 'light' : preference
  return { preference, resolved }
}

export async function setWorkspaceTheme(preference: WorkspaceTheme) {
  if (isDesktop) await api('/settings', { workspaceTheme: preference })
  else {
    localStorage.setItem(storageKey, preference)
    window.dispatchEvent(new Event(changed))
  }
}

// OSC 52 is output from an untrusted program, not a browser copy gesture.
// Allow one write after the owner selects text or presses Copy in this terminal.
export function terminalClipboardGate(now = () => performance.now()) {
  let until = 0
  return {
    arm(trusted: boolean) { if (trusted) until = now() + 2000 },
    clear() { until = 0 },
    read(data: string, ready: boolean, foreground: boolean): string | null {
      if (!ready || !foreground || !until || now() > until) return null
      const separator = data.indexOf(';'), target = data.slice(0, separator), payload = data.slice(separator + 1)
      if (separator < 0 || !['', 'c'].includes(target) || !payload || payload.length > 4 * 1024 * 1024 || payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload)) return null
      try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(payload), char => char.charCodeAt(0)))
        until = 0
        return text
      } catch { return null }
    },
  }
}

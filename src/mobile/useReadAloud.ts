import { useCallback, useEffect, useRef, useState } from 'react'
import { readingVoiceChanged, savedReadingVoice } from './readingVoices'

export function spokenText(element: HTMLElement | null) {
  if (!element) return ''
  const copy = element.cloneNode(true) as HTMLElement
  copy.querySelectorAll('pre, code, table, img').forEach(node => node.remove())
  copy.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote, br').forEach(node => { node.append(document.createTextNode('\n')) })
  return (copy.textContent || '').replace(/\s+/g, ' ').trim()
}
function chunks(text: string) {
  const result: string[] = []
  while (text.length > 220) {
    const fragment = text.slice(0, 220)
    const sentence = Math.max(fragment.lastIndexOf('. '), fragment.lastIndexOf('? '), fragment.lastIndexOf('! '))
    const space = fragment.lastIndexOf(' ')
    const split = sentence > 60 ? sentence + 1 : space > 60 ? space : 220
    result.push(text.slice(0, split)); text = text.slice(split).trimStart()
  }
  if (text) result.push(text)
  return result
}
export function useReadAloud(sessionId: string) {
  const supported = typeof window.AudioContext !== 'undefined'
  const [activeId, setActiveId] = useState<string | null>(null), [paused, setPaused] = useState(false), [error, setError] = useState('')
  const generation = useRef(0), context = useRef<AudioContext | null>(null), pending = useRef<AbortController | null>(null)
  const stop = useCallback(() => {
    generation.current++; pending.current?.abort(); pending.current = null
    const audio = context.current; context.current = null; if (audio) void audio.close().catch(() => {})
    setActiveId(null); setPaused(false)
  }, [])
  useEffect(() => {
    const run = generation, request = pending, playback = context
    window.addEventListener(readingVoiceChanged, stop)
    return () => { run.current++; request.current?.abort(); if (playback.current) void playback.current.close().catch(() => {}); window.removeEventListener(readingVoiceChanged, stop) }
  }, [stop])
  function read(id: string, text: string) {
    if (!supported) { setError('Audio playback is unavailable in this browser.'); return }
    stop(); setError('')
    if (!text.trim()) { setError('This reply has no text to read aloud.'); return }
    const audio = new AudioContext(); context.current = audio
    const unlocked = audio.resume(), run = generation.current, queue = chunks(text), voice = savedReadingVoice()
    setActiveId(id)
    const next = async () => {
      if (generation.current !== run) return
      const part = queue.shift(); if (!part) { stop(); return }
      const controller = new AbortController(); pending.current = controller
      try {
        await unlocked
        const response = await fetch(`/mobile/api/sessions/${sessionId}/read-aloud`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voice, text: part }), signal: controller.signal })
        if (!response.ok) { const result = await response.json(); throw new Error(result.error || 'Speech generation failed.') }
        const data = await response.arrayBuffer()
        if (generation.current !== run) return
        const buffer = await audio.decodeAudioData(data)
        if (generation.current !== run) return
        const source = audio.createBufferSource(); source.buffer = buffer; source.connect(audio.destination)
        source.onended = () => { if (generation.current === run) void next() }; source.start()
      } catch (cause) { if (generation.current !== run) return; stop(); setError(cause instanceof Error ? cause.message : 'Read aloud could not start.') }
    }
    void next()
  }
  function togglePause() {
    const audio = context.current; if (!audio) return
    void (paused ? audio.resume() : audio.suspend()).catch(() => { stop(); setError('Audio playback could not continue.') }); setPaused(!paused)
  }
  return { supported, activeId, paused, error, read, stop, togglePause }
}

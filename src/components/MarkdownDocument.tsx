import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../desktop/client'
import type { Preview } from '../desktop/types'
import './documents.css'
import { ZoomImage } from './ImagePreview'

const drafts = new Map<string, string>()
function restoreDraft(key: string, fallback: string) {
  if (drafts.has(key)) return drafts.get(key)!
  try { return sessionStorage.getItem(key) ?? fallback } catch { return fallback }
}

export function MarkdownView({ text, baseUrl }: { text: string; baseUrl?: string }) {
  // Browser preview supplies /workspace/...; URL's base must be absolute.
  const base = baseUrl ? new URL(baseUrl, window.location.href).href : undefined
  return <article className="mak-markdown"><Markdown remarkPlugins={[remarkGfm]} components={{
    a: ({ href, children }) => <a href={href?.startsWith('#') ? href : href && base ? new URL(href, base).href : href} target={href?.startsWith('#') ? undefined : '_blank'} rel="noreferrer">{children}</a>,
    img: ({ src, alt }) => <ZoomImage src={typeof src === 'string' ? base ? new URL(src, base).href : src : undefined} alt={alt} />,
  }}>{text}</Markdown></article>
}

export default function MarkdownDocument({ file }: { file: Preview }) {
  const draftKey = `mrmak.md-draft.${file.path}`
  const [saved, setSaved] = useState(file.text || '')
  const [draft, setDraft] = useState(() => restoreDraft(draftKey, file.text || ''))
  const [revision, setRevision] = useState(file.revision)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const dirty = draft !== saved
  useEffect(() => {
    if (dirty) drafts.set(draftKey, draft); else drafts.delete(draftKey)
    try { if (dirty) sessionStorage.setItem(draftKey, draft); else sessionStorage.removeItem(draftKey) } catch { /* In-memory drafts still survive file switching when browser storage is full. */ }
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, draft, draftKey])
  const save = async () => {
    if (busy || !dirty) return
    setBusy(true); setStatus('Saving…')
    try {
      const result = await api<Preview>('/files/markdown', { path: file.path, text: draft, revision })
      setSaved(result.text || ''); setDraft(result.text || ''); setRevision(result.revision); setStatus('Saved')
    } catch (error) { setStatus(error instanceof Error ? error.message : String(error)) }
    finally { setBusy(false) }
  }
  return <section className="markdown-document">
    <div className="document-toolbar"><div className="document-modes" aria-label="Markdown mode"><button aria-pressed={!editing} onClick={() => setEditing(false)}>Preview</button><button aria-pressed={editing} onClick={() => setEditing(true)}>Edit</button></div>
      <span className="document-status" role="status">{status || (dirty ? 'Unsaved draft' : 'Markdown')}</span>
      {dirty && <button disabled={busy} onClick={() => { setDraft(saved); setStatus('Draft discarded') }}>Discard</button>}
      <button className="document-save" disabled={!dirty || busy} onClick={() => void save()}>Save</button>
    </div>
    {editing ? <textarea className="markdown-editor" aria-label={`Edit ${file.name}`} spellCheck={false} value={draft} onChange={event => { setDraft(event.target.value); setStatus('') }} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void save() } }} /> : <div className="markdown-reader"><MarkdownView text={draft} baseUrl={file.url} /></div>}
  </section>
}

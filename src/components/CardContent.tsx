import { cardSourceUrl, type CardDocument } from '../../desktop/service/card-schema.mjs'
import { MarkdownView } from './MarkdownDocument'
import { ZoomImage } from './ImagePreview'
import { statusLabels } from '../lib/card-labels'
import '../styles/editable-cards.css'

export default function CardContent({ document, baseUrl }: { document: CardDocument; baseUrl: string }) {
  const base = new URL(baseUrl, window.location.href).href
  return <article className={`card-content card-template-${document.template}`}>
    <header className="card-document-heading">
      <div className="card-kicker"><span>{document.template === 'gallery' ? 'Gallery' : 'Research'}</span><span>{document.items.length} {document.items.length === 1 ? 'entry' : 'entries'}</span></div>
      <h1>{document.title}</h1>
      {document.summary && <div className="card-prose card-introduction"><MarkdownView text={document.summary} baseUrl={base} /></div>}
    </header>
    <div className="card-entries">
      {document.items.map((item, index) => <section className="card-entry" key={item.id} data-entry-id={item.id}>
        {item.image && <div className="card-entry-image"><ZoomImage src={new URL(item.image, base).href} alt={item.alt || item.title} /></div>}
        <div className="card-entry-copy">
          <div className="card-entry-meta"><span className="card-entry-number">{String(index + 1).padStart(2, '0')}</span>{item.status && <span className={`card-entry-status status-${item.status}`}>{statusLabels[item.status]}</span>}</div>
          <h2>{item.title}</h2>
          {item.body && <div className="card-prose"><MarkdownView text={item.body} baseUrl={base} /></div>}
          {cardSourceUrl(item.url) && <a className="card-source" href={cardSourceUrl(item.url)} target="_blank" rel="noopener noreferrer">{item.linkLabel || 'Source'} <span aria-hidden="true">↗</span></a>}
          {item.prompt && <details className="card-prompt"><summary>Prompt</summary><pre>{item.prompt}</pre></details>}
        </div>
      </section>)}
    </div>
    {!document.items.length && <p className="card-empty">No entries yet.</p>}
  </article>
}

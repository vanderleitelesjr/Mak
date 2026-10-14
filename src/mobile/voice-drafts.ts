export interface VoiceDraft { id: string; audio: Blob; seconds: number; createdAt: number }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mrmak-mobile-voice', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('recordings')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Could not save the recording on this phone.'))
  })
}
async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('recordings', mode), request = action(tx.objectStore('recordings'))
    tx.oncomplete = () => { db.close(); resolve(request.result) }
    tx.onerror = tx.onabort = () => { db.close(); reject(new Error('Could not save the recording on this phone.')) }
  })
}
// Recordings are stored as bytes, not Blobs: Safari's Private Browsing (and
// Playwright's WebKit) cannot keep Blobs in IndexedDB but can keep ArrayBuffers.
type StoredDraft = Omit<VoiceDraft, 'audio'> & { audio?: Blob; bytes?: ArrayBuffer; type?: string }
export async function readVoiceDraft(chat: string): Promise<VoiceDraft | undefined> {
  const stored = await transaction<StoredDraft | undefined>('readonly', store => store.get(chat))
  if (!stored) return undefined
  const { bytes, type, audio, ...rest } = stored
  return { ...rest, audio: audio ?? new Blob(bytes ? [bytes] : [], { type: type || '' }) }
}
export async function saveVoiceDraft(chat: string, draft: VoiceDraft) {
  const { audio, ...rest } = draft
  const stored: StoredDraft = { ...rest, bytes: await audio.arrayBuffer(), type: audio.type }
  return transaction('readwrite', store => store.put(stored, chat))
}
export const deleteVoiceDraft = (chat: string) => transaction('readwrite', store => store.delete(chat))
export const clearVoiceDrafts = () => transaction('readwrite', store => store.clear())
